/**
 * Shared components. Keep business maths out of here: settlement arithmetic lives
 * in @ai4l/core, and formatBRL is display only.
 *
 * Names and props below are a contract: other code is already written against
 * this API. `./tokens.css` is exported from package.json and is imported once,
 * by apps/web/app/layout.tsx.
 */
export { formatBRL } from "@ai4l/core";

export {
  StatusViagem,
  StatusDocumento,
  TrilhaDocumentos,
  ChaveAcesso,
  Severidade,
  Dinheiro,
  Rota,
  Placa,
  Acao,
  SeloFonte,
  ROTULO_TIPO,
  ORDEM_TIPOS,
} from "./primitivos";

export { EstadoVazio, EstadoCarregando, EstadoErro, EstadoSemPermissao } from "./estados";
