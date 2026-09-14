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
 * If you have a genuine need this file's absence blocks, raise it in the PR. There
 * is probably a scoped way to do it, and if there is not, that is a decision the
 * three of you should make together rather than one an agent makes silently.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is not set");

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/** Raw, unscoped, dangerous. */
export const unsafeDb = drizzle(client, { schema });

export type UnsafeDb = typeof unsafeDb;
