# AI4Logistics

Compliance and operations software for small Brazilian trucking companies (transportadoras with 5 to 50 trucks).

## Why

In Brazil, a trip needs several fiscal documents (CT-e, MDF-e, CIOT, vale-pedagio), and an MDF-e left open past its deadline is an ANTT fine. Small carriers handle this with spreadsheets and WhatsApp. The product is one flow that issues the documents for a trip, an alert before an MDF-e goes overdue (the alert is what the subscription pays for), and automatic settlement of what the driver is owed.

## Status

Early prototype. Nothing here is connected to a real fiscal provider or to real customers.

- Done: the pure domain layer (types, deadlines, guards, a nine-state trip state machine, a risk engine, settlement maths) with its tests; a fake fiscal and CIOT provider that reproduces real rejection cases; a CSS-token design system with two themes; the owner dashboard screens `/viagens` (trips) and `/viagens/[id]`, plus stub routes for the rest; the database schema, tenant-scoped client, migrations, seed and an isolation test.
- The web app currently runs on deterministic in-memory fixtures with a fixed clock. All company names, CNPJs and documents in them are made up.
- Not done: real CT-e / MDF-e / CIOT emission (the provider choice is still a proposed ADR pending a spike with credentials), the driver PWA, WhatsApp notifications, the closure-alert cron beyond its route skeleton, auth.
- The fiscal glossary in `docs/domain/` is an unverified draft, and some numbers (for example the 24-hour MDF-e alert threshold) are marked in the docs as guesses to be sourced.

## How it works

- One shared database with `org_id` on every tenant-scoped row. SQLite has no row-level security, so all queries go through a tenant-scoped client in `packages/db`, and the seed creates two carriers on purpose so a tenant leak shows up on the first page load.
- Business rules are pure functions in `packages/core` with no I/O, so money and state-machine logic never lives in a React component.
- `packages/fiscal` defines provider-agnostic `FiscalProvider` and `CiotProvider` interfaces; only a fake implementation exists.
- Decisions are recorded as numbered ADRs in `docs/adr/`.

```
apps/web/                Next.js: owner dashboard, API, cron routes
packages/db/             Drizzle schema, migrations, tenant-scoped client
packages/core/           Domain logic: settlement, trip state machine, risks
packages/fiscal/         CT-e / MDF-e / CIOT provider interfaces + fake
packages/notifications/  WhatsApp, push (placeholder)
packages/ui/             Design tokens and shared components
```

## Stack

Next.js (App Router), TypeScript, Turso Cloud (libSQL) with Drizzle, Vercel (hosting, Blob, Cron), pnpm workspaces and Turborepo, Vitest, GitHub Actions with gitleaks.

## Run it

```bash
pnpm install
pnpm hooks:install             # local pre-push hook that blocks direct pushes to main
cp .env.example .env.local     # add Turso dev credentials (only needed for the DB scripts)
pnpm db:migrate
pnpm db:seed
pnpm dev                       # http://localhost:3000/viagens
pnpm test && pnpm typecheck
```

Credentials are never committed; `.env.example` lists the variables. See `SETUP.md` for the full setup and `CONTRIBUTING.md` for branching and migration rules.

## What's next

1. Spike the fiscal and CIOT providers with real sandbox credentials, then accept or replace ADR 0003 and 0006.
2. Source and verify the fiscal glossary and the MDF-e deadline rules with primary references.
3. Replace fixtures with the database, add auth, and wire the MDF-e closure alert end to end.
4. Driver PWA and WhatsApp notifications, then a pilot with a small group of carriers.

## License

MIT, see [LICENSE](LICENSE).
