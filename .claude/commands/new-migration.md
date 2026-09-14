---
description: Generate a migration and prepare a migration-only PR
---

1. Confirm the only uncommitted changes are in `packages/db/src/schema.ts`. If there
   is feature code in the working tree, stop: migrations ship alone.
2. `pnpm db:generate`
3. Print the generated SQL in full for human review. Call out explicitly if Drizzle
   planned a table rebuild rather than a simple `ALTER TABLE`, because SQLite's
   `ALTER TABLE` is limited and a rebuild on a large table is the kind of thing that
   should not be discovered in production.
4. Confirm the migration is additive and forward-only. Flag any drop or any narrowing
   type change.
5. Branch `<initials>/chore/migration-<name>`, commit schema plus migration only.
6. Remind the human: this merges and deploys BEFORE the code that uses it, and is
   never edited after merge.
