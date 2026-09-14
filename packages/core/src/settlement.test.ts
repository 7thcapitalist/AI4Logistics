import { describe, expect, it } from "vitest";
import { calculateSettlement } from "./settlement.js";
import { formatBRL } from "./money.js";

describe("calculateSettlement", () => {
  it("subtracts every cost kind from the freight", () => {
    const r = calculateSettlement({
      freightCents: 850000,
      costs: [
        { kind: "fuel", amountCents: 180000 },
        { kind: "toll", amountCents: 24500 },
        { kind: "advance", amountCents: 100000 },
      ],
    });
    // 850000 - 180000 - 24500 - 100000
    expect(r.payoutCents).toBe(545500);
    expect(formatBRL(r.payoutCents)).toBe("R$ 5.455,00");
    expect(r.isNegative).toBe(false);
  });

  it("sums multiple costs of the same kind", () => {
    const r = calculateSettlement({
      freightCents: 100000,
      costs: [
        { kind: "toll", amountCents: 1150 },
        { kind: "toll", amountCents: 2075 },
      ],
    });
    expect(r.tollCents).toBe(3225);
    expect(r.payoutCents).toBe(96775);
  });

  it("goes negative when advances exceed the freight, rather than clamping", () => {
    const r = calculateSettlement({
      freightCents: 50000,
      costs: [{ kind: "advance", amountCents: 80000 }],
    });
    expect(r.payoutCents).toBe(-30000);
    expect(r.isNegative).toBe(true);
    expect(formatBRL(r.payoutCents)).toBe("-R$ 300,00");
  });

  it("applies the owner adjustment last", () => {
    const r = calculateSettlement({
      freightCents: 100000,
      costs: [{ kind: "fuel", amountCents: 20000 }],
      adjustmentCents: 5000,
    });
    expect(r.payoutCents).toBe(85000);
  });

  it("refuses a float, because that is a silent money bug", () => {
    expect(() =>
      calculateSettlement({ freightCents: 19.99, costs: [] }),
    ).toThrow(/integer centavos/);
  });

  it("refuses a negative cost", () => {
    expect(() =>
      calculateSettlement({
        freightCents: 1000,
        costs: [{ kind: "fuel", amountCents: -500 }],
      }),
    ).toThrow(/negative/);
  });

  it("handles a trip with no costs", () => {
    const r = calculateSettlement({ freightCents: 123456, costs: [] });
    expect(r.payoutCents).toBe(123456);
  });
});
