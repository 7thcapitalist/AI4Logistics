/**
 * Where an environment variable becomes a provider instance.
 *
 * Two lookups, not one, because ADR 0003 and ADR 0006 pick two different
 * companies: a fiscal API house issues CT-e and MDF-e, and only a Bacen-licensed
 * payment institution can issue a CIOT. One registry returning one object would
 * hide that, and would make swapping one of them drag the other along.
 */
import { FakeCiotProvider, FakeFiscalProvider } from "./fake";
import { ProviderNotConfiguredError } from "./errors";
import type { FiscalProvider } from "./provider";
import type { CiotProvider } from "./ciot/provider";

export function getProvider(
  name = process.env.FISCAL_PROVIDER ?? "fake",
): FiscalProvider {
  switch (name) {
    case "fake":
      return new FakeFiscalProvider();
    // ADR 0003 decided Focus NFe. The adapter is not written yet; until it is,
    // asking for it has to fail loudly rather than fall back to the fake.
    // case "focus": return new FocusProvider(...);
    default:
      throw new ProviderNotConfiguredError(name);
  }
}

export function getCiotProvider(
  name = process.env.CIOT_PROVIDER ?? "fake",
): CiotProvider {
  switch (name) {
    case "fake":
      return new FakeCiotProvider();
    // ADR 0006 decided Extratta, with Target Tech as the second option and
    // "the IPEF the customer already uses" as a standing requirement.
    // case "extratta": return new ExtrattaProvider(...);
    default:
      throw new ProviderNotConfiguredError(name);
  }
}
