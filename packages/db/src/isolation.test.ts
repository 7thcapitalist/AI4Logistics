/**
 * The guardrail that makes ADR 0002 safe to live with.
 *
 * A new table cannot merge without org_id unless someone deliberately adds it to
 * GLOBAL_TABLES below, which is a visible, reviewable act rather than an omission.
 *
 * Adding a table to that list to make this test pass is a red flag in review.
 */
import { describe, expect, it } from "vitest";
import { is } from "drizzle-orm";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/** Genuinely not carrier-scoped. Adding to this list requires a reason in the PR. */
const GLOBAL_TABLES = new Set(["organizations", "fiscal_provider_outages"]);

/**
 * Detect tables with drizzle's own `is()`. A hand-rolled structural check
 * (for example `"_" in v`) silently matches NOTHING, because drizzle keeps its
 * internals on symbol keys. That failure mode is nasty here: every per-table
 * assertion below would simply not run, and this file would report success
 * while checking nothing at all. The "found the schema" test exists to catch
 * exactly that, and it is the reason this bug was caught rather than shipped.
 */
const tables = (Object.values(schema) as unknown[]).filter(
  (v): v is SQLiteTable => is(v, SQLiteTable),
);

describe("tenant isolation", () => {
  it("found the schema", () => {
    expect(tables.length).toBeGreaterThan(5);
  });

  for (const table of tables) {
    const config = getTableConfig(table);
    const isGlobal = GLOBAL_TABLES.has(config.name);

    if (isGlobal) continue;

    describe(config.name, () => {
      const orgCol = config.columns.find((c) => c.name === "org_id");

      it("has an org_id column", () => {
        expect(
          orgCol,
          `Table "${config.name}" has no org_id. Add it, or add the table to ` +
            `GLOBAL_TABLES and justify that in the PR. See ADR 0002.`,
        ).toBeDefined();
      });

      it("has org_id NOT NULL", () => {
        expect(
          orgCol?.notNull,
          `"${config.name}".org_id must be NOT NULL. A nullable tenant key is a ` +
            `row that belongs to nobody and is visible to everybody.`,
        ).toBe(true);
      });

      it("has at least one index leading with org_id", () => {
        const leads = config.indexes.some(
          (i) => i.config.columns[0] && "name" in i.config.columns[0] &&
            (i.config.columns[0] as { name: string }).name === "org_id",
        );
        expect(
          leads,
          `"${config.name}" has no index leading with org_id. Every tenant query ` +
            `filters on it first, so every index should start there.`,
        ).toBe(true);
      });
    });
  }
});
