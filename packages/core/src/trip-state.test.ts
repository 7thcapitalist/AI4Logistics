import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, idempotencyKey } from "./trip-state";

/**
 * These cases are the originals, re-stated on the nine-state model that replaced
 * the six-state one (see ./trip-state.ts). Nothing was relaxed: every "refuses to"
 * below still refuses, and the happy path got longer rather than shorter, because
 * `entregue -> acertada` is no longer a move — closing the MDF-e sits between them.
 */
describe("trip state machine", () => {
  it("walks the happy path", () => {
    expect(canTransition("rascunho", "documentos_pendentes")).toBe(true);
    expect(canTransition("documentos_pendentes", "em_emissao")).toBe(true);
    expect(canTransition("em_emissao", "pronta")).toBe(true);
    expect(canTransition("pronta", "em_transito")).toBe(true);
    expect(canTransition("em_transito", "entregue")).toBe(true);
    expect(canTransition("entregue", "encerrada")).toBe(true);
    expect(canTransition("encerrada", "acertada")).toBe(true);
  });

  it("does not let a delivered trip be settled without the MDF-e closure", () => {
    // The old model's `delivered -> settled` edge. It is gone on purpose: the
    // fiscal closure event (110112) is not the delivery.
    expect(canTransition("entregue", "acertada")).toBe(false);
    expect(() => assertTransition("entregue", "acertada")).toThrow(/cannot move/);
  });

  it("treats acertada as terminal", () => {
    expect(canTransition("acertada", "em_transito")).toBe(false);
    expect(canTransition("acertada", "cancelada")).toBe(false);
  });

  it("never comes back from encerrada: evento 110112 is irreversible", () => {
    expect(canTransition("encerrada", "em_transito")).toBe(false);
    expect(canTransition("encerrada", "entregue")).toBe(false);
    expect(canTransition("encerrada", "cancelada")).toBe(false);
  });

  it("refuses to cancel a delivered trip", () => {
    expect(canTransition("entregue", "cancelada")).toBe(false);
  });

  it("refuses to skip issuance", () => {
    expect(() => assertTransition("rascunho", "em_transito")).toThrow(/cannot move/);
  });
});

describe("idempotencyKey", () => {
  it("is stable for the same emission", () => {
    expect(idempotencyKey(1, 42, "cte")).toBe("1:42:cte:1");
    expect(idempotencyKey(1, 42, "cte")).toBe(idempotencyKey(1, 42, "cte"));
  });

  it("separates carriers, trips, kinds and deliberate re-issues", () => {
    expect(idempotencyKey(2, 42, "cte")).not.toBe(idempotencyKey(1, 42, "cte"));
    expect(idempotencyKey(1, 43, "cte")).not.toBe(idempotencyKey(1, 42, "cte"));
    expect(idempotencyKey(1, 42, "mdfe")).not.toBe(idempotencyKey(1, 42, "cte"));
    expect(idempotencyKey(1, 42, "cte", 2)).not.toBe(idempotencyKey(1, 42, "cte", 1));
  });
});
