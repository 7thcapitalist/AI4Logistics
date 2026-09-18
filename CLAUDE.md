# CLAUDE.md

Instructions for any agent or human working in this repository. Read this before
every task. It is short on purpose, so that it actually gets read.

---

## What this product is

Compliance and operations software for small Brazilian transportadoras, 5 to 50
trucks. One flow issues the four trip documents (CT-e, MDF-e, CIOT, vale-pedagio),
one alert prevents the fine that pays for the subscription, one calculation settles
the driver.

**A bug here is a government fine for a customer.** That is the difference between
this codebase and a normal CRUD app, and it is why the rules below are not
negotiable style preferences.

## Stack

| Layer     | Choice                                    |
| --------- | ----------------------------------------- |
| Framework | Next.js App Router                        |
| Hosting   | Vercel                                    |
| Database  | Turso Cloud (libSQL) via `@libsql/client` |
| ORM       | Drizzle                                   |
| Blobs     | Vercel Blob                               |
| Jobs      | Vercel Cron plus a `jobs` table           |
| Emission  | Licensed provider behind an adapter       |
| Monorepo  | pnpm workspaces plus Turborepo            |

### Turso naming, because this causes repeated mistakes

**Turso Cloud** is the managed service we use. It runs on **libSQL**, a SQLite fork.
We talk to it with `@libsql/client` over HTTP.

**"Turso Database"** is a separate Rust rewrite, still in beta. We do not use it.

Do not "upgrade" or "migrate" us to it. Do not swap `@libsql/client` for
`better-sqlite3`. If a task seems to require either, stop and ask.

## Layout

```
apps/web/                Next.js: owner dashboard + driver PWA + API + cron
packages/db/             Drizzle schema, migrations, tenant-scoped client
packages/core/           Pure domain logic: settlement maths, trip state machine
packages/fiscal/         Provider-agnostic CT-e / MDF-e / CIOT interface
packages/notifications/  WhatsApp, push
packages/ui/             Shared components
```

Business rules live in `packages/core` as pure functions with no I/O. Settlement
arithmetic inside a React component is the single most likely place for a silent
money bug, so it does not go there.

---

## Invariants

These are not preferences. Breaking one is a defect even if tests pass.

### 1. Every query is scoped to an organisation

One shared database, `org_id` on every tenant-scoped row. SQLite has no row-level
security, so one forgotten `WHERE org_id = ?` leaks one carrier's tax documents to
another. That is company-ending, not a bug report.

- The only database surface is `forOrg(orgId)` from `@ai4l/db`.
- `packages/db/src/unsafe.ts` holds the raw client. ESLint blocks importing it
  anywhere else. Do not add an exception. Do not work around it.
- Every tenant-scoped table has `org_id NOT NULL` and every index leads with it.
- A new table must be covered by the isolation test, not added to its exempt list,
  unless it is genuinely global (for example `fiscal_provider_outages`).

Full reasoning in `docs/adr/0002-single-database-org-id.md`.

### 2. Money is integer centavos

Never a float. Never a `REAL` column. `1999` is R$ 19,99. Format at the edge, in the
component that renders it, never in the maths.

### 3. Timestamps are epoch milliseconds, integer, UTC

Never a local-time string. Brazil has multiple offsets and has abolished and
reinstated DST before. Convert for display only, at the edge.

### 4. Fiscal XML goes to blob storage

Only the blob key goes in the database. Retention is five years.

### 5. `document_events` is append-only

Never update, never delete a row. This table is the evidence handed to a customer
disputing a fine. If something is wrong, append a correcting event.

### 6. Every emission carries an idempotency key

Derived from `(org_id, trip_id, kind, attempt_group)`. A duplicate CT-e is a real
fiscal problem for the customer, not a duplicate row for us to clean up.

### 7. Never call SEFAZ or ANTT directly

All emission goes through `packages/fiscal`, behind the provider interfaces
(`FiscalProvider` and `CiotProvider`). No adapter for a real provider is written
yet. Build and test against `FakeFiscalProvider` and `FakeCiotProvider`.

### 8. Never invent a fiscal rule

Deadlines, fine values, CFOPs, validation rules: if you do not have a source, you do
not have the rule. `docs/domain/glossary.md` is an **unverified draft**. An entry
without a source link is a hint about what to look up, not a rule to code against.

The verified material is `docs/domain/fluxos-documentais.md`,
`docs/domain/verificacao-2026-09.md` and `docs/domain/obrigatoriedade-mdfe-por-uf.md`,
where every claim carries a 🟢/🟡/🔴 confidence mark. In code, the `Fonte` type in
`@ai4l/core` makes the same thing structural: `Risco` and `Guarda` require a source,
so an invented warning cannot reach the user without showing up in review.

Inventing a plausible number here is the most damaging thing an agent can do in this
repository, because it will look right in review and produce a fine in production.
Say "I do not know this, it needs sourcing" instead. That is a correct and useful
answer.

---

## Decisions you must respect

Read the ADR before proposing anything that contradicts it.

| ADR                                               | Decision                            | Status   |
| ------------------------------------------------- | ----------------------------------- | -------- |
| [0001](docs/adr/0001-monorepo.md)                 | One monorepo, pnpm plus Turborepo   | Accepted |
| [0002](docs/adr/0002-single-database-org-id.md)   | Single database, `org_id` per row   | Accepted |
| [0003](docs/adr/0003-fiscal-emission-provider.md) | Fiscal emission provider: Focus NFe | Proposed |
| [0004](docs/adr/0004-driver-surface.md)           | Driver surface: PWA over WhatsApp   | Proposed |
| [0006](docs/adr/0006-ciot-provider.md)            | CIOT and vale-pedagio: Extratta     | Proposed |

ADR 0003 is no longer open: it was decided after reading the public API docs of two
providers. It is Proposed rather than Accepted because no real emission has been
made yet; it needs a spike with credentials. ADR 0006 exists because no fiscal API
house issues a CIOT — that is a Bacen-licensed payment institution — so there are
two provider interfaces, not one.

If a task requires reversing an accepted ADR, stop and say so. Do not quietly
re-derive the architecture in a different direction, which is the standard failure
mode when an agent has no memory of the week the decision was made.

## Workflow

Full rules in `CONTRIBUTING.md`. The short version:

- Branch off `main` for everything, including one-line fixes. Note that we are on
  GitHub Free, so nothing on the server blocks a bad merge. Do not treat a green
  CI run or an absent error as permission.
- Tests ship in the same PR as the code they cover.
- Migration PRs contain no feature code.
- The PR template's "what I verified myself" section is mandatory and must be
  honest. If you are an agent, you cannot fill it in. Leave it for the human.

## Commands

Environments, the three databases, migration procedure and the cron constraints
are in `docs/ENVIRONMENTS.md`. Read it before touching an env var or a migration.

```bash
pnpm dev            # everything
pnpm test           # vitest across the workspace
pnpm typecheck
pnpm lint
pnpm db:generate    # generate a migration after a schema edit
pnpm db:migrate
pnpm db:seed        # seeds TWO organisations, deliberately
pnpm db:check       # fails if schema and migrations disagree
```

Local development always runs with two seeded organisations so that a tenant leak
shows up on the first page load instead of in production.
