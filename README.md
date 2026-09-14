# AI4Logistics

Compliance and operations platform for small Brazilian transportadoras (5-50 trucks).

One flow issues CT-e, MDF-e, CIOT and vale-pedagio for a trip, alerts before an MDF-e
goes overdue, and settles the driver automatically. The alert is the product: a missed
MDF-e closure is an ANTT fine, and that is what the subscription prevents.

## Start here

| File | What it is |
|---|---|
| `SETUP.md` | Day 1 to day 6, in order. Do this first. |
| `CLAUDE.md` | Stack, layout and invariants. Humans and agents read this every task. |
| `CONTRIBUTING.md` | Branching, PRs, migrations. Read once, together. |
| `docs/adr/` | Why the expensive decisions were made the way they were. |
| `docs/domain/glossary.md` | Fiscal vocabulary. **Unverified draft, do not code against it.** |

## Layout

```
apps/web/                Next.js: owner dashboard + driver PWA + API + cron
packages/db/             Drizzle schema, migrations, tenant-scoped client
packages/core/           Pure domain logic: settlement maths, trip state machine
packages/fiscal/         Provider-agnostic CT-e / MDF-e / CIOT interface
packages/notifications/  WhatsApp, push
packages/ui/             Shared components
docs/adr/                Decisions, numbered, append-only
docs/domain/             Fiscal glossary
.claude/                 Shared agent definitions and slash commands
```

## Quickstart

```bash
pnpm install
pnpm hooks:install             # blocks direct pushes to main; GitHub Free cannot
cp .env.example .env.local     # fill in Turso credentials
pnpm db:migrate
pnpm db:seed                   # seeds TWO organisations, on purpose
pnpm dev
```

The seed creates two carriers because a tenant leak should be visible on the first
page load, not in production.
