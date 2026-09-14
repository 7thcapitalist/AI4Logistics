/**
 * THE UNFILTERED CLIENT. DO NOT IMPORT THIS OUTSIDE packages/db/src.
 *
 * ESLint `no-restricted-imports` blocks it elsewhere (see .eslintrc.cjs). That rule
 * is a tenant-isolation guardrail, not style. Disabling it, or re-exporting this
 * client under another name, is how one carrier's fiscal documents become visible
 * to another carrier.
 *
 * Use `forOrg(orgId)` from `@ai4l/db`. See ADR 0002.
 *
 * Connection is created lazily, on first query, NOT at import time. Importing this
 * module must never throw: `next build` imports the whole module graph while
 * collecting pages, and a module-scope throw on a missing env var turns a missing
 * local .env into a failed production build with a confusing stack trace.
 */
// `@libsql/client/web` rather than `@libsql/client`: the web entrypoint speaks
// HTTP only and pulls in no native bindings. The default entrypoint drags in the
// native `libsql` package, which webpack cannot bundle and which breaks
// `next build`. Talking to Turso Cloud over HTTP is the architecture anyway
// (ADR 0001 / the setup plan: no connection pooling problem in serverless), so
// this is the correct client, not a workaround.
//
// Trade-off: the web client cannot open `file:` URLs, so local development runs
// against a Turso Cloud dev database rather than a local SQLite file.
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

/** Raw, unscoped, dangerous. Call it; do not export the result. */
export function unsafeDb(): Db {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Copy .env.example to .env.local and fill in " +
        "your Turso Cloud credentials (see SETUP.md, day 1).",
    );
  }

  // authToken must be OMITTED rather than passed as undefined:
  // tsconfig sets exactOptionalPropertyTypes, and an explicit undefined is an error.
  const authToken = process.env.TURSO_AUTH_TOKEN;
  cached = drizzle(
    createClient(authToken ? { url, authToken } : { url }),
    { schema },
  );
  return cached;
}

export type UnsafeDb = Db;
