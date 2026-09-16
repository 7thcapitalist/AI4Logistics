// ============================================================================
// Modelo de domínio do AI4Logistics.
// Tipos puros. SEM I/O, SEM React. Este arquivo é o contrato do produto.
// ============================================================================

export type UF =
  | "AC"
  | "AL"
  | "AP"
  | "AM"
  | "BA"
  | "CE"
  | "DF"
  | "ES"
  | "GO"
  | "MA"
  | "MT"
  | "MS"
  | "MG"
  | "PA"
  | "PB"
  | "PR"
  | "PE"
  | "PI"
  | "RJ"
  | "RN"
  | "RS"
  | "RO"
  | "RR"
  | "SC"
  | "SP"
  | "SE"
  | "TO";

/**
 * Guardrail anti-alucinação.
 *
 * Toda afirmação de regra fiscal que o produto mostra ao usuário carrega uma
 * Fonte. Risco e Guarda exigem este campo, então não existe caminho para
 * adicionar um aviso fiscal inventado sem que ele apareça no code review.
 *
 * `confianca: 'oficial'`  -> marcado 🟢 em docs/domain/fluxos-documentais.md
 * `confianca: 'verificar'` -> marcado 🟡 ou 🔴; a UI sinaliza isso ao usuário.
 */
export type Fonte = {
  descricao: string;
  url?: string;
  confianca: "oficial" | "verificar";
};

export type Local = { municipio: string; uf: UF; codigoIbge?: string };
export type Parte = { nome: string; cnpjCpf: string; ie?: string; local: Local };
export type Veiculo = {
  placa: string;
  renavam?: string;
  modelo?: string;
  taraKg?: number;
};
export type Motorista = { nome: string; cpf: string; telefone?: string };
export type Carga = {
  produtoPredominante: string;
  ncm?: string;
  pesoKg: number;
  valorCentavos: number;
};

// ---------------------------------------------------------------- Organização
// Multi-tenant desde o dia 1 (ADR 0002: org_id em toda linha).

export type Org = {
  id: string;
  nome: string;
  cnpj: string;
  uf: UF;
  regimeTributario: "simples_nacional" | "lucro_presumido" | "lucro_real" | "mei";
  /**
   * Código de Regime Tributário. 1 Simples, 2 Simples com excesso de sublimite,
   * 3 Regime Normal, 4 MEI. Decide a ramificação de IBS/CBS no CT-e:
   * CRT 1 e 4 estão dispensados (docs/domain 2.9).
   */
  crt: 1 | 2 | 3 | 4;
  rntrc: string;
  rntrcStatus: "ativo" | "suspenso";
  certificadoA1: { validoAte: number };
  /** epoch ms. Ausente = ANTT ainda não confirmou os seguros eletronicamente. */
  segurosVerificadosEm?: number;
};

// --------------------------------------------------------------------- Viagem

export type ViagemStatus =
  | "rascunho"
  | "documentos_pendentes"
  | "em_emissao"
  | "pronta"
  | "em_transito"
  | "entregue"
  | "encerrada"
  | "acertada"
  | "cancelada";

export type Viagem = {
  id: string;
  orgId: string;
  numero: string;
  status: ViagemStatus;
  origem: Local;
  destino: Local;
  ufsPercurso: UF[];
  tomador: Parte;
  remetente: Parte;
  destinatario: Parte;
  veiculo: Veiculo;
  motorista: Motorista;
  carga: Carga;
  /** Centavos, inteiro. NUNCA float. */
  valorFreteCentavos: number;
  documentos: Documento[];
  eventos: EventoFiscal[];
  /** epoch ms. NUNCA hora local. */
  criadaEm: number;
  atualizadaEm: number;
  iniciadaEm?: number;
  entregueEm?: number;
  encerradaEm?: number;
};

// ------------------------------------------------------------------ Documento

export type DocumentoTipo = "cte" | "mdfe" | "ciot" | "vale_pedagio";

/** Modelo fiscal. Necessário porque o MESMO código de evento significa coisas
 *  diferentes em CT-e e MDF-e (110113 = EPEC no 57, Inclusão de DF-e no 58). */
export type ModeloFiscal = 57 | 58;

export type DocumentoStatus =
  | "nao_aplicavel"
  | "pendente"
  | "enviando"
  | "autorizado"
  | "rejeitado"
  /** 🟡 Irregularidade fiscal. Consta que a numeração queima e não se corrige
   *  nem cancela. Ver docs/domain/fluxos-documentais.md 2.4. */
  | "denegado"
  | "cancelado"
  /** Exclusivo do MDF-e. */
  | "encerrado"
  | "contingencia";

export type Documento = {
  id: string;
  tipo: DocumentoTipo;
  status: DocumentoStatus;
  numero?: string;
  serie?: string;
  /** 44 dígitos. CT-e e MDF-e. */
  chaveAcesso?: string;
  protocolo?: string;
  autorizadoEm?: number;
  encerradoEm?: number;
  /** MDF-e: par UF carregamento x UF descarregamento. */
  parUf?: { carregamento: UF; descarregamento: UF };
  /**
   * MDF-e: tipo de emitente. 1 prestador de serviço, 2 carga própria,
   * 3 CT-e globalizado. Faz parte da CHAVE de bloqueio das regras F85 e F88
   * (MOC MDF-e 3.00b, Anexo I): dois manifestos com mesma placa e mesma UF de
   * descarregamento mas tpEmit diferente NÃO se bloqueiam.
   */
  tpEmit?: 1 | 2 | 3;
  /** MDF-e: o grupo infCIOT foi preenchido? */
  temCiot?: boolean;
  codigoRejeicao?: string;
  /** Texto cru da SEFAZ. Para o contador. */
  mensagemRejeicao?: string;
  /** Tradução para linguagem de dono de transportadora. Nunca só a crua. */
  explicacao?: string;
  /** Contingência: quando entrou. O relógio de 168h do MDF-e corre daqui. */
  contingenciaDesde?: number;
  /** Chave no blob storage. NUNCA o XML inteiro no banco. */
  xmlKey?: string;
};

// --------------------------------------------------------------- Evento fiscal
// Append-only. É a prova entregue ao cliente que contesta uma multa.

export type EventoFiscal = {
  id: string;
  documentoId?: string;
  /** Indexado por modelo, nunca só pelo código. Ver ModeloFiscal. */
  modelo: ModeloFiscal;
  codigo: string;
  nome: string;
  autor: "emitente" | "tomador" | "fisco" | "sistema";
  ocorridoEm: number;
  protocolo?: string;
  detalhe?: string;
};

// ---------------------------------------------------------------------- Risco

export type RiscoSeveridade = "bloqueante" | "critico" | "alto" | "medio";

export type RiscoTipo =
  | "mdfe_aberto_bloqueando_veiculo"
  /** F87 / 462: a PLACA para de emitir. Rota curta, cinco dias. */
  | "mdfe_aberto_bloqueio_placa"
  /** F86 / 686: o CNPJ INTEIRO para de emitir. Trinta dias. */
  | "mdfe_aberto_limiar_bloqueio"
  | "mdfe_sem_ciot"
  | "certificado_a1_vencendo"
  | "rntrc_seguro_pendente"
  | "cte_rejeitado_sem_tratamento"
  | "janela_cancelamento_cte"
  | "contingencia_aberta";

export type Risco = {
  id: string;
  tipo: RiscoTipo;
  severidade: RiscoSeveridade;
  titulo: string;
  explicacao: string;
  acao?: { label: string; href: string };
  viagemId?: string;
  documentoId?: string;
  veiculoPlaca?: string;
  /**
   * NUNCA representa um prazo regulamentar de encerramento de MDF-e, que não
   * existe. Só conta o tempo até uma consequência confirmada.
   */
  contagemRegressiva?: { tipo: "dias" | "horas"; restante: number; ate: string };
  fonte: Fonte;
};

// --------------------------------------------------------------------- Guarda

export type Guarda =
  { permitido: true } | { permitido: false; motivo: string; fonte: Fonte };
