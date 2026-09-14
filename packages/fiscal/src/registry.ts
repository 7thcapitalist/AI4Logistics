import { FakeProvider } from "./fake";
import { ProviderNotConfiguredError } from "./errors";
import type { FiscalProvider } from "./provider";

export function getProvider(name = process.env.FISCAL_PROVIDER ?? "fake"): FiscalProvider {
  switch (name) {
    case "fake":
      return new FakeProvider();
    // ADR 0003. Add the chosen provider here once at least two have been compared.
    // case "focus": return new FocusProvider(...);
    // case "tecnospeed": return new TecnospeedProvider(...);
    default:
      throw new ProviderNotConfiguredError(name);
  }
}
