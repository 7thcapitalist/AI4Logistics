/**
 * Trip settlement. Pure, no I/O, integer centavos.
 *
 * This lives in packages/core and not in a component because settlement arithmetic
 * inside React is the single most likely place for a silent money bug in this
 * product. It is also the number a driver argues about, so it has to be right and
 * it has to be explainable line by line.
 */
import { assertCentavos, type Centavos } from "./money.js";

export type CostKind = "fuel" | "toll" | "advance" | "other";

export interface TripCost {
  kind: CostKind;
  /** Always positive. This function decides the sign. */
  amountCents: Centavos;
}

export interface SettlementInput {
  freightCents: Centavos;
  costs: TripCost[];
  /** Owner correction, applied last. Positive pays the driver more. */
  adjustmentCents?: Centavos;
}

export interface SettlementBreakdown {
  freightCents: Centavos;
  fuelCents: Centavos;
  tollCents: Centavos;
  advanceCents: Centavos;
  otherCents: Centavos;
  adjustmentCents: Centavos;
  /** freight - fuel - toll - advance - other + adjustment. Can be negative. */
  payoutCents: Centavos;
  /** True when advances and costs exceeded the freight. The driver owes money. */
  isNegative: boolean;
}

export function calculateSettlement(input: SettlementInput): SettlementBreakdown {
  assertCentavos(input.freightCents, "freightCents");

  const adjustmentCents = input.adjustmentCents ?? 0;
  assertCentavos(adjustmentCents, "adjustmentCents");

  const totals: Record<CostKind, Centavos> = { fuel: 0, toll: 0, advance: 0, other: 0 };

  for (const cost of input.costs) {
    assertCentavos(cost.amountCents, `cost.${cost.kind}`);
    if (cost.amountCents < 0) {
      throw new Error(
        `Cost of kind "${cost.kind}" is negative (${cost.amountCents}). Costs are ` +
          `recorded positive; use adjustmentCents for a correction that pays more.`,
      );
    }
    totals[cost.kind] += cost.amountCents;
  }

  const payoutCents =
    input.freightCents -
    totals.fuel -
    totals.toll -
    totals.advance -
    totals.other +
    adjustmentCents;

  return {
    freightCents: input.freightCents,
    fuelCents: totals.fuel,
    tollCents: totals.toll,
    advanceCents: totals.advance,
    otherCents: totals.other,
    adjustmentCents,
    payoutCents,
    isNegative: payoutCents < 0,
  };
}
