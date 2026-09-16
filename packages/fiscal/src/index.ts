// ============================================================================
// @ai4l/fiscal — camada de emissão fiscal e CIOT.
//
// Duas interfaces SEPARADAS, porque são dois fornecedores diferentes:
//   FiscalProvider  -> CT-e, MDF-e, eventos   (ADR 0003: Focus NFe)
//   CiotProvider    -> CIOT, vale-pedágio     (ADR 0006: Extratta)
//
// Nenhum provedor de API fiscal emite CIOT: CIOT é serviço de instituição de
// pagamento autorizada pelo Banco Central. Unir as duas atrás de uma interface
// só esconderia esse fato e travaria a troca independente de cada camada.
// ============================================================================

export * from "./provider";
export * from "./ciot/provider";
export * from "./fake";
export * from "./errors";
export { getProvider, getCiotProvider } from "./registry";
