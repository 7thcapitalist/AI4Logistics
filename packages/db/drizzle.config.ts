import type { Config } from "drizzle-kit";

/**
 * NOTE on dialect vs driver: on drizzle-kit 0.24.x the dialect is "sqlite" and
 * Turso is selected via `driver: "turso"`. Passing dialect: "turso" (valid only
 * on newer drizzle-kit) makes the CLI exit silently with no error message, which
 * is a genuinely painful thing to debug. If you upgrade drizzle-kit, revisit this.
 *
 * `generate` and `check` do not contact the database, so the URL falls back to a
 * local file. That keeps CI able to verify schema/migration drift without secrets.
 * `migrate` and `push` do need the real TURSO_DATABASE_URL.
 */
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
