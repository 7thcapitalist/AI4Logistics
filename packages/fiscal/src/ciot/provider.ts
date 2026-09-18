// ============================================================================
// CiotProvider — contrato da camada CIOT e vale-pedágio.
//
// SEPARADO de FiscalProvider de propósito, e não por gosto de arquitetura:
// nenhum provedor de API fiscal emite CIOT. CIOT é operação de instituição de
// pagamento autorizada pelo Banco Central (IPEF). São dois fornecedores, dois
// contratos, duas faturas. Ver docs/adr/0006-ciot-provider.md §1.1.
//
// A decisão de desenho que manda neste arquivo:
// FRETE ABAIXO DO PISO MÍNIMO NÃO É EXCEÇÃO. É resultado de negócio esperado.
// Desde 24/05/2026 a ANTT bloqueia a geração do CIOT nesse caso, e isso
// acontece todo dia numa transportadora pequena. A resposta certa do produto é
// "faltam R$ 340 para o piso", não um stack trace. Por isso
// `PisoMinimoNaoAtingido` é um erro tipado com o VALOR da diferença, e por isso
// `consultarPisoMinimo` existe como pré-checagem.
// ============================================================================

import type { Local, UF, Viagem } from "@ai4l/core";
import type { ErroRede, ErroValidacaoLocal } from "../provider";

// ------------------------------------------------------------------- Erros

export type CiotErro =
  | ErroRede
  | ErroValidacaoLocal
  | PisoMinimoNaoAtingido
  | RecusaInstituicao
  | ErroRegulatorio
  | CiotNaoSuportado
  | CiotJaGerado;

/**
 * Frete abaixo do piso mínimo da ANTT. O CIOT NÃO foi gerado.
 *
 * Citação oficial: "se o valor do frete estiver abaixo do piso mínimo, o
 * sistema bloqueia o registro, o CIOT não é gerado e a operação não existe"
 * — ANTT, Portaria SUROC nº 6/2026, vigente desde 24/05/2026.
 *
 * ESTE É O CAMINHO ESPERADO, não o excepcional. A UI mostra a diferença e
 * oferece ajustar o valor. Ver docs/adr/0006 §1.2.
 */
export type PisoMinimoNaoAtingido = {
  tipo: "piso_minimo";
  /** O que foi tentado. */
  valorInformadoCentavos: number;
  /**
   * O piso calculado pela ANTT. OPCIONAL de propósito: não está confirmado que
   * a Extratta devolva o valor, ou apenas a recusa. Item 3 do spike do ADR 0006.
   * `undefined` significa "sabemos que está abaixo, não sabemos de quanto".
   * A UI precisa tratar esse caso sem inventar número.
   */
  pisoMinimoCentavos?: number;
  /** Só quando `pisoMinimoCentavos` é conhecido. Nunca estimar. */
  diferencaCentavos?: number;
  /**
   * Texto cru da instituição. Referência capturada em documentação pública:
   * "O valor do frete informado é menor do que o valor mínimo de frete
   * estabelecido." NÃO confirmado que a Extratta use este texto.
   */
  mensagemBruta: string;
  /** Linguagem de dono de transportadora. Obrigatório. */
  explicacao: string;
  /** A Extratta expõe `Faults[].Code`; a tabela de códigos não é pública. */
  codigoBruto?: string;
};

/** A instituição recusou por motivo dela: cadastro, saldo, RNTRC, limite. */
export type RecusaInstituicao = {
  tipo: "recusa_instituicao";
  codigoBruto: string;
  mensagemBruta: string;
  explicacao: string;
  /** Falso quando depende de ação na instituição (ex.: saldo, contrato). */
  corrigivelPeloUsuario: boolean;
};

/** Impedimento regulatório que não é piso: RNTRC suspenso, dado ANTT inválido. */
export type ErroRegulatorio = {
  tipo: "regulatorio";
  codigoBruto?: string;
  mensagemBruta: string;
  explicacao: string;
  campo?: string;
};

export type CiotNaoSuportado = {
  tipo: "nao_suportado";
  operacao: string;
  provedor: string;
  detalhe: string;
};

/** Colisão de idempotência. NÃO é falha: já existe CIOT para esta viagem. */
export type CiotJaGerado = {
  tipo: "ja_gerado";
  chave: string;
  ciot: Ciot;
};

export type ResultadoCiot<T> = { ok: true; valor: T } | { ok: false; erro: CiotErro };

// ------------------------------------------------------------- Capacidades

export type CapacidadesCiot = {
  readonly provedor: string;
  readonly gerarCiot: boolean;
  readonly valePedagio: boolean;
  readonly pagamentoEletronicoFrete: boolean;
  readonly baixa: boolean;
  readonly baixaParcial: boolean;
  readonly cancelamento: boolean;
  /**
   * Consulta de piso ANTES de gerar. A Extratta NÃO tem endpoint dedicado
   * (ADR 0006 §2.3); a primeira implementação é nossa, sobre tabelas da ANTT,
   * e por isso sai marcada `confianca: 'verificar'` na UI.
   */
  readonly consultaPisoMinimo: boolean;
  readonly webhooks: boolean;
  /**
   * O cliente pode operar a IPEF que ele JÁ usa (Repom, Pamcard)?
   * Nenhum candidato documenta isso publicamente. Custo de venda real,
   * assumido conscientemente. Ver ADR 0006 §2.4.
   */
  readonly instituicaoDoCliente: boolean;
};

// ---------------------------------------------------------------- Entradas

/** Mesma disciplina do FiscalProvider: CIOT duplicado é problema regulatório. */
export type ChaveCiot = {
  orgId: string;
  viagemId: string;
  tentativa: number;
};

export function chaveCiot(k: ChaveCiot): string {
  return `${k.orgId}.${k.viagemId}.ciot.${k.tentativa}`;
}

export type TipoOperacaoTransporte =
  "tac_agregado" | "tac_independente" | "etc" | "ctc" | "frota_propria";

export type GerarCiotEntrada = {
  chave: ChaveCiot;
  viagem: Viagem;
  tipoOperacao: TipoOperacaoTransporte;
  /** O piso depende disto. */
  tipoCarga: string;
  distanciaKm: number;
  eixos: number;
  /** Parcelas do pagamento eletrônico de frete. */
  parcelas: ParcelaFrete[];
  /** Quando presente, o pedágio entra na mesma operação (Extratta: `Pedagio`). */
  valePedagio?: SolicitacaoValePedagio;
  ambiente: "homologacao" | "producao";
};

export type ParcelaFrete = {
  valorCentavos: number;
  vencimento: number;
  tipo: "adiantamento" | "saldo" | "quitacao" | "tarifa_antt";
};

export type SolicitacaoValePedagio = {
  origem: Local;
  destino: Local;
  ufsPercurso: UF[];
  eixos: number;
  /** Ausente = a instituição escolhe. */
  fornecedorPreferido?: string;
};

export type CancelarCiotEntrada = {
  orgId: string;
  /** Extratta: `CodigoViagem`. */
  referenciaOperacao: string;
  numeroCiot: string;
  motivo: string;
};

export type BaixaCiotEntrada = {
  orgId: string;
  referenciaOperacao: string;
  numeroCiot: string;
  /** Ausente = baixa total. Cheque `capacidades.baixaParcial` antes. */
  valorBaixadoCentavos?: number;
  ocorridoEm: number;
  observacao?: string;
};

export type ConsultarPisoEntrada = {
  tipoCarga: string;
  distanciaKm: number;
  eixos: number;
  origem: Local;
  destino: Local;
  tipoOperacao: TipoOperacaoTransporte;
  /** Piso é regra que muda; consulta é sempre datada. */
  referenciaEm: number;
};

// ------------------------------------------------------------------ Saídas

export type Ciot = {
  numero: string;
  /** Extratta devolve `Verificador` e `Senha` junto do número. */
  verificador?: string;
  senha?: string;
  referenciaOperacao: string;
  emitidoEm: number;
  valorFreteCentavos: number;
  status: "ativo" | "baixado" | "cancelado";
  /** Qual IPEF gerou. Vai para o grupo infCIOT do MDF-e. */
  instituicao: { nome: string; cnpj: string };
};

export type ValePedagio = {
  numeroComprovante: string;
  valorCentavos: number;
  fornecedor: string;
  pracas?: { nome: string; uf: UF; valorCentavos: number }[];
};

export type GerarCiotSaida = {
  chave: string;
  ciot: Ciot;
  valePedagio?: ValePedagio;
};

/**
 * Piso mínimo consultado.
 *
 * `fonte` NÃO é decorativo: enquanto for cálculo nosso sobre tabela da ANTT, a
 * confiança é 'verificar' e a UI sinaliza isso. Piso calculado errado vira ou
 * venda perdida ou autuação. Ver ADR 0006 §4.2.
 */
export type PisoMinimo = {
  valorCentavos: number;
  /** Ex.: 'Resolução ANTT 6.078/2026'. */
  tabelaVersao: string;
  calculadoEm: number;
  fonte: { descricao: string; url?: string; confianca: "oficial" | "verificar" };
  componentes?: { deslocamento: number; cargaDescarga: number };
};

// --------------------------------------------------------------- Interface

export interface CiotProvider {
  readonly capacidades: CapacidadesCiot;

  /**
   * Pré-checagem. Chamada ANTES de gerarCiot, na tela de conferência, para que
   * o usuário ajuste o valor sem queimar uma tentativa contra a instituição.
   * `nao_suportado` quando `capacidades.consultaPisoMinimo` é falso.
   */
  consultarPisoMinimo(entrada: ConsultarPisoEntrada): Promise<ResultadoCiot<PisoMinimo>>;

  /**
   * Gera o CIOT e, opcionalmente, compra o vale-pedágio na mesma operação
   * (Extratta: `Viagem/Integrar`).
   * Abaixo do piso devolve `PisoMinimoNaoAtingido` — resultado, não exceção.
   */
  gerarCiot(entrada: GerarCiotEntrada): Promise<ResultadoCiot<GerarCiotSaida>>;

  /** Compra avulsa, quando o pedágio não foi junto na geração. */
  comprarValePedagio(entrada: {
    orgId: string;
    referenciaOperacao?: string;
    solicitacao: SolicitacaoValePedagio;
  }): Promise<ResultadoCiot<ValePedagio>>;

  cancelarCiot(
    entrada: CancelarCiotEntrada,
  ): Promise<ResultadoCiot<{ canceladoEm: number }>>;

  /** Encerra a operação financeira. Distinta de cancelar. */
  darBaixa(
    entrada: BaixaCiotEntrada,
  ): Promise<ResultadoCiot<{ baixadoEm: number; saldoRestanteCentavos: number }>>;

  consultarCiot(entrada: {
    orgId: string;
    numeroCiot?: string;
    chave?: ChaveCiot;
  }): Promise<ResultadoCiot<Ciot>>;
}
