/**
 * Trip lifecycle. Pure. The database stores the state; this decides the moves.
 */
export type TripStatus =
  | "draft"
  | "documents_issued"
  | "in_transit"
  | "delivered"
  | "settled"
  | "cancelled";

const TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  draft: ["documents_issued", "cancelled"],
  documents_issued: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: ["settled"],
  /** Terminal. A settled trip is a financial record. */
  settled: [],
  cancelled: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: TripStatus, to: TripStatus) {
    super(`Trip cannot move from "${from}" to "${to}".`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

/**
 * Idempotency key for a fiscal emission.
 * A duplicate CT-e is a real fiscal problem for the carrier, not a duplicate row.
 * attemptGroup increments only for a deliberate re-issue after a rejection.
 */
export function idempotencyKey(
  orgId: number,
  tripId: number,
  kind: "cte" | "mdfe" | "ciot" | "vale_pedagio",
  attemptGroup = 1,
): string {
  return `${orgId}:${tripId}:${kind}:${attemptGroup}`;
}
