// ============================================================================
// FiscalProvider — contrato da camada fiscal (CT-e, MDF-e e eventos).
//
// Esta interface foi desenhada DEPOIS de ler a documentação pública de
// Focus NFe e Webmania BR (ver docs/adr/0003-fiscal-emission-provider.md),
// para não congelar as premissas de um fornecedor só. As três marcas disso:
//
//  1. `capacidades`: a Focus NÃO expõe comprovante de entrega (110180) para
//     CT-e; a Webmania expõe. A Webmania NÃO expõe inclusão de DF-e (110113);
//     a Focus expõe. Então o que é opcional é declarado, não descoberto em
//     produção com um 404.
//  2. Emissão é ASSÍNCRONA por padrão. A Focus faz pré-validação síncrona e
//     enfileira para a SEFAZ. Nenhuma assinatura aqui promete autorização no
//     retorno da chamada.
//  3. Idempotência é NOSSA, não do fornecedor. Ver IdempotencyKey abaixo.
//
// SEM I/O aqui. Este arquivo é contrato.
// ============================================================================

import { idempotencyKey } from "@ai4l/core";
import type {
  Documento,
  DocumentoStatus,
  EventoFiscal,
  ModeloFiscal,
  Org,
  UF,
  Viagem,
} from "@ai4l/core";

// ---------------------------------------------------------------- Idempotência

/**
 * Chave de idempotência de emissão.
 *
 * Um CT-e duplicado NÃO é linha duplicada no banco: é documento fiscal com
 * numeração queimada, que precisa de cancelamento dentro de uma janela legal e
 * aparece na apuração do cliente. Um retry de rede não pode causar isso.
 *
 * Derivada de (orgId, viagemId, tipo, tentativa). Determinística de propósito:
 * o mesmo retry produz a mesma chave, então a colisão é o comportamento
 * desejado, não um acidente.
 *
 * `tentativa` incrementa SOMENTE quando o operador decide reemitir depois de
 * uma rejeição tratada — nunca em retry automático de transporte. Retry de rede
 * reusa a mesma chave; reemissão após rejeição avança a tentativa.
 *
 * Nota de implementação (Focus NFe): a Focus não tem header de idempotência.
 * Ela tem `ref`, "Referência única da MDFe", e devolve `mdfe_em_processamento`
 * ou `mdfe_ja_autorizado` quando a ref se repete. O adapter serializa esta
 * chave para o `ref` e traduz essas duas respostas para `ja_emitido` — o que
 * transforma uma limitação do fornecedor na nossa garantia.
 * Ver docs/adr/0003 §4.2.
 *
 * A SERIALIZAÇÃO é de @ai4l/core (`idempotencyKey`), não daqui. packages/db tem
 * índice único sobre a string resultante; duas grafias da mesma chave seriam um
 * documento fiscal duplicado que o banco não pegaria.
 */
export type IdempotencyKey = {
  orgId: string;
  viagemId: string;
  tipo: "cte" | "cte_os" | "cte_simplificado" | "mdfe";
  /** Inteiro >= 1. Só avança em reemissão deliberada. */
  tentativa: number;
};

/**
 * Serialização canônica e estável. É o que vira `ref` no fornecedor.
 * Delega para @ai4l/core: existe UMA função que produz essa string.
 */
export function chaveIdempotencia(k: IdempotencyKey): string {
  return idempotencyKey(k.orgId, k.viagemId, k.tipo, k.tentativa);
}

// ------------------------------------------------------------------ Resultado

/**
 * Resultado de operação. Não usamos exceção para caminho esperado.
 *
 * Rejeição da SEFAZ e denegação são RESULTADOS NORMAIS de uma emissão fiscal —
 * acontecem todo dia. Exceção fica para o que é de fato excepcional.
 */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: FiscalErro };

// ----------------------------------------------------------------- Erros

/**
 * Erros tipados. As quatro famílias são distintas porque o produto reage a
 * cada uma de forma diferente:
 *
 *  - `rede`         -> retry automático, MESMA chave de idempotência.
 *  - `validacao`    -> nunca chega a sair daqui; conserta no formulário.
 *  - `rejeicao`     -> SEFAZ recusou; corrigível; nova tentativa.
 *  - `denegacao`    -> numeração queimada; NÃO se corrige nem se cancela.
 *  - `nao_suportado`-> o fornecedor não tem essa capacidade. Ver `capacidades`.
 *  - `ja_emitido`   -> colisão de idempotência. NÃO é falha.
 */
export type FiscalErro =
  | ErroRede
  | ErroValidacaoLocal
  | RejeicaoSefaz
  | DenegacaoSefaz
  | ErroNaoSuportado
  | JaEmitido;

/** Transporte. Nada chegou à SEFAZ, ou não sabemos se chegou. */
export type ErroRede = {
  tipo: "rede";
  /**
   * `false` quando a requisição pode ter sido processada (timeout depois do
   * envio). Nesse caso NÃO reemita às cegas: reenvie com a MESMA chave de
   * idempotência, ou consulte antes.
   */
  seguroRetentar: boolean;
  statusHttp?: number;
  detalhe: string;
  causa?: unknown;
};

/**
 * Validação nossa, antes de gastar uma chamada. É o erro mais barato do sistema
 * e o único que conseguimos mostrar em tempo de digitação.
 */
export type ErroValidacaoLocal = {
  tipo: "validacao";
  problemas: ProblemaValidacao[];
};

export type ProblemaValidacao = {
  /** Caminho no payload. Ex.: 'carga.ncm', 'tomador.cnpjCpf'. */
  campo: string;
  mensagem: string;
  /** Código de rejeição da SEFAZ que este problema evitaria, se conhecido. */
  rejeicaoAntecipada?: string;
};

/**
 * A SEFAZ recusou. Corrigível.
 *
 * Carrega SEMPRE os dois textos. `mensagem` é o texto cru, para o contador e
 * para busca. `explicacao` é para o dono da transportadora, que não sabe o que
 * é CFOP. Mostrar só o cru é o mesmo que não mostrar nada.
 * Espelha Documento.mensagemRejeicao / Documento.explicacao em @ai4l/core.
 */
export type RejeicaoSefaz = {
  tipo: "rejeicao";
  /** Ex.: '698'. String, nunca number: a SEFAZ usa zeros à esquerda. */
  codigo: string;
  /** Texto cru da SEFAZ, sem reescrita. */
  mensagem: string;
  /** Linguagem de dono de transportadora. Obrigatório. */
  explicacao: string;
  /** O MESMO código significa coisas diferentes em 57 e 58. */
  modelo: ModeloFiscal;
  /** Campo do payload que originou a rejeição, quando dá para inferir. */
  campo?: string;
  /** Falso quando só corrigir o payload não resolve (ex.: 686, MDF-e antigo). */
  corrigivel: boolean;
};

/**
 * Denegação. Categoria própria de propósito.
 *
 * Não é rejeição. A numeração queima, o documento não se corrige e não se
 * cancela. Ver docs/domain/fluxos-documentais.md 2.4 e DocumentoStatus.denegado.
 * Tratar denegação como rejeição faria a UI oferecer "corrigir e reenviar", que
 * é a orientação errada.
 */
export type DenegacaoSefaz = {
  tipo: "denegacao";
  codigo: string;
  mensagem: string;
  explicacao: string;
  modelo: ModeloFiscal;
  /** Chave de 44 dígitos: a numeração queimada, se a SEFAZ devolveu. */
  chaveAcesso?: string;
  /** Quem está irregular (ex.: o tomador, na 302). */
  parteIrregular?: "emitente" | "tomador" | "remetente" | "destinatario";
};

/** O fornecedor não expõe essa operação. Consulte `capacidades` antes. */
export type ErroNaoSuportado = {
  tipo: "nao_suportado";
  operacao: string;
  provedor: string;
  detalhe: string;
};

/**
 * A chave de idempotência já foi usada. NÃO é falha — é a proteção funcionando.
 * O chamador deve tratar como sucesso e seguir com `documento`.
 */
export type JaEmitido = {
  tipo: "ja_emitido";
  chave: string;
  documento: Documento;
};

// ------------------------------------------------------------- Capacidades

/**
 * O que ESTE fornecedor realmente expõe.
 *
 * Existe porque Focus e Webmania têm lacunas COMPLEMENTARES (ADR 0003 §2.3).
 * Sem isto, a diferença vira um 404 em produção. A UI lê isto para esconder
 * botão que não existe, em vez de oferecer e falhar.
 */
export type CapacidadesFiscais = {
  readonly provedor: string;
  readonly cteOs: boolean;
  readonly cteSimplificado: boolean;
  /** Evento 110110. */
  readonly cartaCorrecao: boolean;
  /** Evento 110180. Focus NFe: false. Webmania: true. */
  readonly comprovanteEntrega: boolean;
  /** Evento 110190. */
  readonly insucessoEntrega: boolean;
  /** Evento 110113 no MDF-e. Focus: true. Webmania: false. */
  readonly inclusaoDfe: boolean;
  /** Evento 110114. */
  readonly inclusaoCondutor: boolean;
  /** Evento 110112. Sem isto o fornecedor nem entra na avaliação (ADR 0003 §1b). */
  readonly encerramentoMdfe: boolean;
  readonly webhooks: boolean;
  /** POST /v2/empresas com pfx base64. É o critério de onboarding self-service. */
  readonly cadastroCertificadoPorApi: boolean;
  /** Focus: emissão enfileirada. Autorização chega por webhook ou consulta. */
  readonly emissaoAssincrona: boolean;
};

// --------------------------------------------------------------- Entradas

export type ContextoEmissao = {
  chave: IdempotencyKey;
  org: Org;
  viagem: Viagem;
  /** 'homologacao' nunca tem validade fiscal. */
  ambiente: "homologacao" | "producao";
};

export type EmitirCteEntrada = ContextoEmissao & {
  variante: "normal" | "os" | "simplificado";
  /** Chaves de 44 dígitos das NF-e transportadas. */
  chavesNfe?: string[];
  observacoes?: string;
};

export type EmitirMdfeEntrada = ContextoEmissao & {
  /** Chaves dos CT-e (e NF-e) que o MDF-e agrupa. */
  chavesDocumentos: string[];
  /** Par UF que o MDF-e ocupa. É a chave de bloqueio do próximo. */
  parUf: { carregamento: UF; descarregamento: UF };
  /** Número do CIOT vindo da camada CiotProvider, para o grupo infCIOT. */
  ciot?: { numero: string; cpfCnpjResponsavel: string };
  /** Apólices. A ausência causa rejeição 698. */
  seguros?: SeguroCarga[];
};

export type SeguroCarga = {
  responsavel: "emitente" | "contratante";
  cnpjSeguradora: string;
  nomeSeguradora: string;
  apolice: string;
  averbacoes?: string[];
};

export type EncerrarMdfeEntrada = {
  orgId: string;
  chaveAcesso: string;
  /** Focus: `data`, `sigla_uf`, `nome_municipio`. */
  encerradoEm: number;
  ufEncerramento: UF;
  municipioEncerramento: string;
  codigoIbgeMunicipio?: string;
};

export type CancelarEntrada = {
  orgId: string;
  chaveAcesso: string;
  modelo: ModeloFiscal;
  /** A SEFAZ exige 15 a 255 caracteres. */
  justificativa: string;
};

export type CartaCorrecaoEntrada = {
  orgId: string;
  chaveAcesso: string;
  correcoes: { grupo: string; campo: string; valor: string }[];
};

export type ComprovanteEntregaEntrada = {
  orgId: string;
  chaveAcesso: string;
  entregueEm: number;
  recebedor: { nome: string; documento: string };
  latitude?: number;
  longitude?: number;
  /** Chave no blob storage. NUNCA a imagem inline. */
  imagemKey?: string;
};

export type ConsultarEntrada = {
  orgId: string;
  /** Uma das duas. `chave` é a nossa; `chaveAcesso` é a da SEFAZ. */
  chave?: IdempotencyKey;
  chaveAcesso?: string;
};

// ----------------------------------------------------------------- Saídas

/**
 * Retorno de emissão.
 *
 * `status` pode legitimamente ser 'enviando': a emissão é assíncrona. Quem
 * chama NÃO deve assumir autorização aqui.
 */
export type EmissaoAceita = {
  chave: string;
  documento: Documento;
  status: DocumentoStatus;
  /** Verdade quando a autorização ainda vai chegar por webhook ou consulta. */
  pendente: boolean;
};

export type EventoAceito = {
  evento: EventoFiscal;
  protocolo?: string;
};

// ---------------------------------------------------------------- Webhook

/**
 * Notificação recebida do fornecedor.
 *
 * Webhook é OTIMIZAÇÃO DE LATÊNCIA, não fonte de verdade. A Focus tenta 5
 * vezes (1min, 30min, 1h, 3h, 24h) e depois desiste. Portanto a reconciliação
 * por `consultar()` é obrigatória e o produto tem que funcionar sem webhook
 * nenhum. Ver docs/adr/0003 §2.4.
 */
export type WebhookBruto = {
  /** Corpo cru, ainda não confiável. */
  corpo: unknown;
  cabecalhos: Record<string, string>;
  recebidoEm: number;
};

export type WebhookInterpretado = {
  chave?: string;
  chaveAcesso?: string;
  modelo: ModeloFiscal;
  status: DocumentoStatus;
  /** Presente quando o webhook comunica rejeição ou denegação. */
  erro?: RejeicaoSefaz | DenegacaoSefaz;
  evento?: EventoFiscal;
  /** Fornecedores reenviam. Trate o consumo como idempotente. */
  tentativaEntrega?: number;
};

// --------------------------------------------------------------- Interface

export interface FiscalProvider {
  readonly capacidades: CapacidadesFiscais;

  // ---- Onboarding -----------------------------------------------------
  /**
   * Cadastra o CNPJ e vincula o certificado A1 SEM painel do fornecedor.
   * É o que decide se o onboarding é self-service (ADR 0003 §1a).
   * Fornecedor sem isso deve devolver `nao_suportado`, nunca simular.
   *
   * O `.pfx` trafega e é descartado; NUNCA é persistido por nós.
   */
  cadastrarEmpresa(entrada: {
    org: Org;
    certificadoPfxBase64: string;
    senhaCertificado: string;
  }): Promise<Resultado<{ provedorEmpresaId: string; validoAte: number }>>;

  // ---- Emissão --------------------------------------------------------
  emitirCte(entrada: EmitirCteEntrada): Promise<Resultado<EmissaoAceita>>;
  emitirMdfe(entrada: EmitirMdfeEntrada): Promise<Resultado<EmissaoAceita>>;

  // ---- Consulta -------------------------------------------------------
  /** Fonte de verdade. Reconciliação depende disto, não do webhook. */
  consultar(entrada: ConsultarEntrada): Promise<Resultado<Documento>>;
  /** XML autorizado. Devolve a chave do blob, nunca o XML inteiro. */
  baixarXml(entrada: ConsultarEntrada): Promise<Resultado<{ xmlKey: string }>>;

  // ---- Eventos --------------------------------------------------------
  cancelar(entrada: CancelarEntrada): Promise<Resultado<EventoAceito>>;

  /**
   * Evento 110112. A operação mais importante do produto: é o que tira o
   * veículo do bloqueio do par UF. Ver RiscoTipo.mdfe_aberto_bloqueando_veiculo.
   */
  encerrarMdfe(entrada: EncerrarMdfeEntrada): Promise<Resultado<EventoAceito>>;

  /** Evento 110110. */
  cartaCorrecao(entrada: CartaCorrecaoEntrada): Promise<Resultado<EventoAceito>>;

  /**
   * Evento 110180. OPCIONAL: cheque `capacidades.comprovanteEntrega` antes.
   * A Focus NFe não expõe para CT-e e devolve `nao_suportado`.
   */
  comprovanteEntrega(
    entrada: ComprovanteEntregaEntrada,
  ): Promise<Resultado<EventoAceito>>;

  // ---- Webhook --------------------------------------------------------
  /**
   * Traduz a notificação crua. DEVE verificar autenticidade antes de confiar;
   * o corpo vem da internet aberta.
   * Retornar `ok: false` faz o handler HTTP responder fora de 2xx, o que
   * aciona a retentativa do fornecedor de propósito.
   */
  interpretarWebhook(bruto: WebhookBruto): Promise<Resultado<WebhookInterpretado>>;

  /** Reenvio sob demanda, quando a janela de retentativa já fechou. */
  solicitarReenvioWebhook(
    entrada: ConsultarEntrada,
  ): Promise<Resultado<{ solicitado: true }>>;
}
