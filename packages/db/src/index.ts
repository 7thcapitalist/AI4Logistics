export * as schema from "./schema.js";
export { forOrg, MissingPredicateError, type OrgDb, type TenantTable } from "./tenant.js";

/**
 * Note the absence of a raw-client export. That is deliberate.
 * See packages/db/src/unsafe.ts and ADR 0002.
 */
