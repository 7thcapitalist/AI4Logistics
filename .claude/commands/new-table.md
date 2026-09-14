---
description: Add a table to the schema with tenant isolation wired in correctly
---

Add a new table to `packages/db/src/schema.ts`.

Non-negotiable, per ADR 0002:

1. `orgId: integer("org_id").notNull().references(() => organizations.id)` unless the
   table is genuinely global. If you believe it is global, stop and ask rather than
   adding it to the isolation test's exempt list yourself.
2. Every index leads with `org_id`.
3. Money columns are integer centavos. Never a float, never `real`.
4. Timestamps are `integer` epoch milliseconds. Never a text date.
5. Export the table from `packages/db/src/schema.ts`.
6. Confirm the isolation test passes without an exemption.
7. `pnpm db:generate`, then read the generated SQL and report anything that rebuilds
   a table rather than adding to it.

Then stop. The migration goes in its own PR with no feature code, per
`CONTRIBUTING.md`.
