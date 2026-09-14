import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, idempotencyKey } from "./trip-state.js";

describe("trip state machine", () => {
  it("walks the happy path", () => {
    expect(canTransition("draft", "documents_issued")).toBe(true);
    expect(canTransition("documents_issued", "in_transit")).toBe(true);
    expect(canTransition("in_transit", "delivered")).toBe(true);
    expect(canTransition("delivered", "settled")).toBe(true);
  });

  it("treats settled as terminal", () => {
    expect(canTransition("settled", "in_transit")).toBe(false);
    expect(canTransition("settled", "cancelled")).toBe(false);
  });

  it("refuses to cancel a delivered trip", () => {
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  it("refuses to skip issuance", () => {
    expect(() => assertTransition("draft", "in_transit")).toThrow(/cannot move/);
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
