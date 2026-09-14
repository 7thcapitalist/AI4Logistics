/**
 * The only sanctioned way to reach the database. See ADR 0002.
 *
 * What this enforces:
 *   - select  : org_id filter injected, always, ANDed with any caller predicate
 *   - insert  : org_id stamped, OVERWRITING any caller-supplied value
 *   - update  : org_id filter injected, and an explicit `where` is required
 *   - delete  : same
 *
 * What it deliberately does not do: give you an escape hatch. There is no
 * `.raw` here on purpose.
 */
import { and, eq, type SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { unsafeDb } from "./unsafe";

/** A table that carries org_id. The isolation test proves the set is complete. */
export type TenantTable = SQLiteTable & { orgId: SQLiteTable["_"]["columns"][string] };

export class MissingPredicateError extends Error {
  constructor(op: string) {
    super(
      `${op} without an explicit where clause is refused. An unbounded ${op} inside ` +
        `one organisation is still almost never what you meant. Pass a predicate.`,
    );
    this.name = "MissingPredicateError";
  }
}

export function forOrg(orgId: number) {
  if (!Number.isInteger(orgId) || orgId <= 0) {
    throw new Error(`forOrg received an invalid orgId: ${String(orgId)}`);
  }

  const scope = (table: TenantTable, where?: SQL): SQL => {
    const base = eq(table.orgId, orgId);
    return where ? (and(base, where) as SQL) : base;
  };

  return {
    orgId,

    /** SELECT * FROM table WHERE org_id = ? AND <where> */
    findMany<T extends TenantTable>(table: T, where?: SQL) {
      return unsafeDb().select().from(table as SQLiteTable).where(scope(table, where));
    },

    async findOne<T extends TenantTable>(table: T, where: SQL) {
      const rows = await unsafeDb()
        .select()
        .from(table as SQLiteTable)
        .where(scope(table, where))
        .limit(1);
      return rows[0] ?? null;
    },

    /** org_id is stamped here and overwrites anything the caller passed. */
    insert<T extends TenantTable>(table: T, values: Record<string, unknown>) {
      return unsafeDb()
        .insert(table as SQLiteTable)
        .values({ ...values, orgId } as never)
        .returning();
    },

    insertMany<T extends TenantTable>(table: T, rows: Record<string, unknown>[]) {
      if (rows.length === 0) return Promise.resolve([]);
      return unsafeDb()
        .insert(table as SQLiteTable)
        .values(rows.map((r) => ({ ...r, orgId })) as never)
        .returning();
    },

    update<T extends TenantTable>(table: T, where: SQL, set: Record<string, unknown>) {
      if (!where) throw new MissingPredicateError("update");
      // org_id is never updatable: moving a row between carriers is not an operation.
      const { orgId: _ignored, ...rest } = set as { orgId?: unknown };
      return unsafeDb()
        .update(table as SQLiteTable)
        .set(rest as never)
        .where(scope(table, where))
        .returning();
    },

    delete<T extends TenantTable>(table: T, where: SQL) {
      if (!where) throw new MissingPredicateError("delete");
      return unsafeDb().delete(table as SQLiteTable).where(scope(table, where)).returning();
    },
  };
}

export type OrgDb = ReturnType<typeof forOrg>;
