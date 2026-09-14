import { describe, expect, it } from "vitest";
import { FakeProvider } from "./fake";
import type { EmissionRequest } from "./provider";

const req = (over: Partial<EmissionRequest> = {}): EmissionRequest => ({
  kind: "cte",
  idempotencyKey: "1:42:cte:1",
  orgId: 1,
  tripId: 42,
  payload: {},
  ...over,
});

describe("FakeProvider", () => {
  it("authorizes by default", async () => {
    const r = await new FakeProvider().issue(req());
    expect(r.status).toBe("authorized");
  });

  it("never emits twice for the same idempotency key", async () => {
    const p = new FakeProvider();
    const a = await p.issue(req());
    const b = await p.issue(req());
    expect(b).toEqual(a);
  });

  it("treats a different attempt group as a new emission", async () => {
    const p = new FakeProvider();
    const a = await p.issue(req());
    const b = await p.issue(req({ idempotencyKey: "1:42:cte:2" }));
    expect(a.externalId).not.toBe(b.externalId);
  });

  it("produces an owner-facing message that is not the raw SEFAZ text", async () => {
    const p = new FakeProvider({ rejectionRate: 1 });
    const r = await p.issue(req());
    if (r.status !== "rejected") throw new Error("expected a rejection");
    expect(r.ownerMessage).not.toBe(r.rawMessage);
    expect(r.ownerMessage).toMatch(/[a-z]/);
    expect(r.rawMessage).toMatch(/Rejeicao|RNTRC|Rota/);
  });

  it("is deterministic for a given seed", async () => {
    const one = await new FakeProvider({ rejectionRate: 0.5, seed: 7 }).issue(req());
    const two = await new FakeProvider({ rejectionRate: 0.5, seed: 7 }).issue(req());
    expect(one.status).toBe(two.status);
  });

  it("refuses to close a document that is not authorized", async () => {
    const p = new FakeProvider({ rejectionRate: 1 });
    const r = await p.issue(req({ kind: "mdfe" }));
    await expect(p.close(r.externalId!, Date.now())).rejects.toThrow(/not authorized/);
  });
});
