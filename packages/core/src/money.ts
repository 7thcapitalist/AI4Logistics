/**
 * Money is integer centavos everywhere in this codebase. 1999 is R$ 19,99.
 * Formatting happens at the edge, in the component that renders it, never in maths.
 */
export type Centavos = number;

export function assertCentavos(value: number, label: string): asserts value is Centavos {
  if (!Number.isInteger(value)) {
    throw new Error(
      `${label} must be integer centavos, received ${value}. A float here is a ` +
        `silent money bug: use 1999 for R$ 19,99.`,
    );
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} is outside the safe integer range: ${value}`);
  }
}

/** Display only. Never feed the output of this back into a calculation. */
export function formatBRL(cents: Centavos): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100).toLocaleString("pt-BR");
  const rest = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${reais},${rest}`;
}
