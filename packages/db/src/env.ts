/**
 * Loads .env.local from the monorepo root.
 *
 * Next.js does this automatically for apps/web, but `migrate.ts` and `seed.ts`
 * run under plain `tsx`, which loads nothing. Without this they fail with
 * "TURSO_DATABASE_URL is not set" no matter how correct your .env.local is.
 *
 * Import this FIRST, before anything that reads process.env.
 *
 * Real environment variables win: dotenv does not overwrite what is already set,
 * so CI and the production migration workflow are unaffected by a stray file.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/** Walk up until we find the workspace root, so this works from any package. */
function findRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const root = findRoot(dirname(fileURLToPath(import.meta.url)));

for (const file of [".env.local", ".env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path });
}
