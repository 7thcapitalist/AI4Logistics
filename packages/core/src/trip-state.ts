/**
 * Trip lifecycle.
 *
 * WHY THE SIX-STATE MODEL IS GONE
 *
 * This file used to own a `TripStatus` of six states, in which `delivered` went
 * straight to `settled`. That model had no state between the two, and the gap it
 * left is the entire thesis of this product: delivering the cargo and closing the
 * MDF-e are two different events, done by two different people, in two different
 * places. The driver ends the delivery on the road; the office files the closure
 * (evento 110112) with SEFAZ. Until that event is filed, the vehicle stays blocked
 * for the same UF pair and, after enough days, the whole CNPJ stops issuing.
 * A model that cannot express "delivered but not closed" cannot express the bug we
 * sell the fix for. See docs/domain/fluxos-documentais.md, sections 0.1 and 3.5.
 *
 * The authority is now `ViagemStatus` and `podeTransicionar` in ./domain/transicoes,
 * which has nine states and puts `encerrada` between `entregue` and `acertada`.
 * What follows is the English-named surface the rest of the repo already imports,
 * re-expressed on top of it. `idempotencyKey` is unchanged: packages/fiscal
 * depends on it.
 */
import type { ViagemStatus } from "./domain/tipos";
import { podeTransicionar } from "./domain/transicoes";

/** Alias of the nine-state {@link ViagemStatus}. Prefer ViagemStatus in new code. */
export type TripStatus = ViagemStatus;

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return podeTransicionar(from, to);
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
 * What can be emitted under one idempotency key. `cte_os` and `cte_simplificado`
 * are separate SEFAZ documents (tpCTe 2 and 5), not variants of a CT-e, so they
 * get their own slot rather than collapsing onto "cte".
 */
export type EmissionKind =
  "cte" | "cte_os" | "cte_simplificado" | "mdfe" | "ciot" | "vale_pedagio";

/**
 * Idempotency key for a fiscal emission.
 * A duplicate CT-e is a real fiscal problem for the carrier, not a duplicate row.
 * attemptGroup increments only for a deliberate re-issue after a rejection.
 *
 * This is THE serialization. packages/db has a unique index on the resulting
 * string (documents_idempotency_idx) and packages/fiscal builds its provider-side
 * `ref` from it, so a second spelling of the same key would be a silent duplicate
 * document. Ids are string | number because the domain model keys orgs and trips
 * by string while the Drizzle schema uses integers; the rendered key is the same.
 */
export function idempotencyKey(
  orgId: number | string,
  tripId: number | string,
  kind: EmissionKind,
  attemptGroup = 1,
): string {
  return `${orgId}:${tripId}:${kind}:${attemptGroup}`;
}
