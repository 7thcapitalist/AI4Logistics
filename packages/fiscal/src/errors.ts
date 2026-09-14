export class FiscalProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FiscalProviderError";
  }
}

export class ProviderNotConfiguredError extends FiscalProviderError {
  constructor(provider: string) {
    super(
      `Fiscal provider "${provider}" is not implemented. ADR 0003 is still open, ` +
        `so FISCAL_PROVIDER should be "fake" until a provider is chosen.`,
      provider,
    );
    this.name = "ProviderNotConfiguredError";
  }
}
