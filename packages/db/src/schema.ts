/**
 * Schema rules, enforced by the isolation test and by review. See ADR 0002.
 *
 *   1. Every tenant-scoped table has `org_id` NOT NULL.
 *   2. Every index leads with `org_id`.
 *   3. Money is integer centavos. Never a float, never `real`.
 *   4. Timestamps are integer epoch milliseconds, UTC. Never a text date.
 *   5. Fiscal XML and photos live in blob storage. Only the key is stored here.
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;

/** GLOBAL. The tenant root itself: its `id` is what `org_id` points at. */
export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  antNumber: text("antt_number"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  cnpjIdx: uniqueIndex("organizations_cnpj_idx").on(t.cnpj),
}));

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  // Phone-first, not email-first. That is the real identifier in this market.
  // See the ADR 0005 placeholder note in CLAUDE.md: auth is not decided yet.
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["owner", "staff", "driver"] }).notNull(),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  orgPhoneIdx: uniqueIndex("users_org_phone_idx").on(t.orgId, t.phone),
}));

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  plate: text("plate").notNull(),
  renavam: text("renavam"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  orgPlateIdx: uniqueIndex("vehicles_org_plate_idx").on(t.orgId, t.plate),
}));

export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  cpf: text("cpf").notNull(),
  phone: text("phone").notNull(),
  /** A TAC (autonomous, owns the truck) triggers the CIOT requirement. */
  isAutonomous: integer("is_autonomous", { mode: "boolean" }).notNull().default(false),
  rntrc: text("rntrc"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  orgCpfIdx: uniqueIndex("drivers_org_cpf_idx").on(t.orgId, t.cpf),
}));

export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  status: text("status", {
    enum: ["draft", "documents_issued", "in_transit", "delivered", "settled", "cancelled"],
  }).notNull().default("draft"),
  originCity: text("origin_city").notNull(),
  originUf: text("origin_uf").notNull(),
  destCity: text("dest_city").notNull(),
  destUf: text("dest_uf").notNull(),
  cargoDescription: text("cargo_description").notNull(),
  cargoWeightKg: integer("cargo_weight_kg"),
  /** Integer centavos. 1999 is R$ 19,99. */
  freightCents: integer("freight_cents").notNull(),
  /** Epoch ms. Feeds the MDF-e closure alert window. */
  departedAt: integer("departed_at"),
  deliveredAt: integer("delivered_at"),
  createdAt: integer("created_at").notNull().default(now),
  updatedAt: integer("updated_at").notNull().default(now),
}, (t) => ({
  orgStatusIdx: index("trips_org_status_idx").on(t.orgId, t.status),
  orgCreatedIdx: index("trips_org_created_idx").on(t.orgId, t.createdAt),
}));

export const tripCosts = sqliteTable("trip_costs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  kind: text("kind", { enum: ["fuel", "toll", "advance", "other"] }).notNull(),
  /** Integer centavos, always positive. The settlement decides the sign. */
  amountCents: integer("amount_cents").notNull(),
  note: text("note"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  orgTripIdx: index("trip_costs_org_trip_idx").on(t.orgId, t.tripId),
}));

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  kind: text("kind", { enum: ["cte", "mdfe", "ciot", "vale_pedagio"] }).notNull(),
  status: text("status", {
    enum: ["pending", "authorized", "rejected", "cancelled", "closed"],
  }).notNull().default("pending"),
  /** Provider-side identifier. Nullable until the provider accepts it. */
  externalId: text("external_id"),
  accessKey: text("access_key"),
  protocolNumber: text("protocol_number"),
  /**
   * Owner-facing message. Already translated from the SEFAZ code.
   * P0 requirement 5: never surface the raw provider or SEFAZ text.
   */
  rejectionReason: text("rejection_reason"),
  rejectionCode: text("rejection_code"),
  /** Blob storage key. The XML itself never goes in Turso. Five-year retention. */
  xmlBlobKey: text("xml_blob_key"),
  /**
   * Derived from (org_id, trip_id, kind, attempt_group).
   * A duplicate CT-e is a real fiscal problem for the carrier.
   */
  idempotencyKey: text("idempotency_key").notNull(),
  attemptGroup: integer("attempt_group").notNull().default(1),
  authorizedAt: integer("authorized_at"),
  /** MDF-e only. Null on an authorized MDF-e is what the alert job looks for. */
  closedAt: integer("closed_at"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  idempotencyIdx: uniqueIndex("documents_idempotency_idx").on(t.idempotencyKey),
  orgTripIdx: index("documents_org_trip_idx").on(t.orgId, t.tripId),
  /**
   * The alert query: open MDF-e past its window, across all carriers.
   * This index is the reason ADR 0002 chose one shared database.
   */
  openMdfeIdx: index("documents_open_mdfe_idx").on(t.kind, t.status, t.closedAt),
}));

/**
 * APPEND-ONLY. Never update, never delete.
 * This is the evidence handed to a carrier disputing a fine. To correct
 * something, append a correcting event.
 */
export const documentEvents = sqliteTable("document_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  documentId: integer("document_id").notNull().references(() => documents.id),
  event: text("event", {
    enum: ["submitted", "authorized", "rejected", "cancelled", "closed", "alert_sent", "note"],
  }).notNull(),
  /** Raw provider payload, for forensics. Never rendered to the owner. */
  payload: text("payload", { mode: "json" }),
  occurredAt: integer("occurred_at").notNull().default(now),
}, (t) => ({
  orgDocIdx: index("document_events_org_doc_idx").on(t.orgId, t.documentId, t.occurredAt),
}));

export const pods = sqliteTable("pods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  photoBlobKey: text("photo_blob_key").notNull(),
  signatureBlobKey: text("signature_blob_key"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  capturedAt: integer("captured_at").notNull(),
  /** Set when an offline capture reaches the server. Differs from capturedAt. */
  syncedAt: integer("synced_at").notNull().default(now),
}, (t) => ({
  orgTripIdx: index("pods_org_trip_idx").on(t.orgId, t.tripId),
}));

export const settlements = sqliteTable("settlements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  freightCents: integer("freight_cents").notNull(),
  fuelCents: integer("fuel_cents").notNull().default(0),
  tollCents: integer("toll_cents").notNull().default(0),
  advanceCents: integer("advance_cents").notNull().default(0),
  otherCents: integer("other_cents").notNull().default(0),
  /** Computed by packages/core. May be negative if advances exceeded freight. */
  payoutCents: integer("payout_cents").notNull(),
  /** The owner can edit before finalising, per P0 requirement 3. */
  adjustmentCents: integer("adjustment_cents").notNull().default(0),
  adjustmentNote: text("adjustment_note"),
  finalizedAt: integer("finalized_at"),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  orgTripIdx: uniqueIndex("settlements_org_trip_idx").on(t.orgId, t.tripId),
}));

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  kind: text("kind", { enum: ["mdfe_closure_alert", "document_poll", "settlement_notice"] }).notNull(),
  status: text("status", { enum: ["pending", "running", "done", "failed"] }).notNull().default("pending"),
  runAfter: integer("run_after").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  payload: text("payload", { mode: "json" }),
  createdAt: integer("created_at").notNull().default(now),
}, (t) => ({
  dueIdx: index("jobs_due_idx").on(t.status, t.runAfter),
  orgIdx: index("jobs_org_idx").on(t.orgId, t.kind),
}));

/** GLOBAL. Provider health is not carrier-specific. */
export const fiscalProviderOutages = sqliteTable("fiscal_provider_outages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  note: text("note"),
});
