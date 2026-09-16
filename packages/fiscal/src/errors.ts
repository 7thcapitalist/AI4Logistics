/**
 * Exceções da camada fiscal.
 *
 * O caminho esperado NÃO passa por aqui: rejeição e denegação da SEFAZ são
 * resultados normais de uma emissão e viajam como `Resultado<T>` tipado (ver
 * provider.ts). Exceção fica para o que é de fato excepcional — no momento,
 * só configuração errada de provedor.
 */
export class FiscalProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    // `override` is required: Error already declares `cause` in ES2022,
    // and tsconfig.base.json sets noImplicitOverride.
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FiscalProviderError";
  }
}

export class ProviderNotConfiguredError extends FiscalProviderError {
  constructor(provider: string) {
    super(
      `Fiscal provider "${provider}" is not implemented. ADR 0003 chose Focus NFe ` +
        `and ADR 0006 chose Extratta, but neither adapter is written yet, so ` +
        `FISCAL_PROVIDER and CIOT_PROVIDER should be "fake".`,
      provider,
    );
    this.name = "ProviderNotConfiguredError";
  }
}
