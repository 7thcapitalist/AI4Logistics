// ============================================================================
// Prazos e limiares fiscais.
//
// REGRA: nada aqui é constante global "porque é assim no Brasil". Prazo fiscal
// varia por UF e por norma, e cada valor carrega a sua fonte e o seu nível de
// confiança. Um valor sem fonte não entra neste arquivo.
// ============================================================================

import type { Fonte, UF } from "./tipos";

export type Parametro = { valor: number; fonte: Fonte };

// --------------------------------------------------- Cancelamento de CT-e
/**
 * Janela de cancelamento do CT-e, em horas, POR UF.
 *
 * Partial de propósito: só entra UF cuja legislação foi efetivamente lida.
 * O resto cai no fallback nacional, e a UI diz ao usuário que o prazo daquela
 * UF não foi verificado. Preencher uma UF com 168 "porque provavelmente é"
 * seria inventar regra fiscal.
 */
export const JANELA_CANCELAMENTO_CTE_HORAS: Partial<Record<UF, Parametro>> = {
  SP: {
    valor: 744, // 31 dias
    fonte: {
      descricao: "Portaria CAT 55/09, art. 21, § 2º (SEFAZ-SP)",
      url: "https://portal.fazenda.sp.gov.br/servicos/cte/Paginas/Cancelamento-Extempor%C3%A2neo-de-CT-e.aspx",
      confianca: "oficial",
    },
  },
  SC: {
    valor: 168,
    fonte: {
      descricao: "RICMS/SC-01, Anexo 11, art. 47",
      url: "https://legislacao.sef.sc.gov.br/html/expo_mo/2025/dec_25_0942_em_25_0031.pdf",
      confianca: "oficial",
    },
  },
  // GO e MG ficam FORA até alguém ler o RCTE-GO e o RICMS/MG.
  // Ver docs/domain/fluxos-documentais.md, seção 8, item 6.
};

export const FALLBACK_CANCELAMENTO_CTE: Parametro = {
  valor: 168,
  fonte: {
    descricao:
      "Regra nacional (168h), FAQ do Portal Nacional CT-e. Prazo da UF do emitente não verificado.",
    url: "https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx?tipoConteudo=HC%2Fiuy94%2FRk%3D",
    confianca: "verificar",
  },
};

export function janelaCancelamentoCte(uf: UF): Parametro {
  return JANELA_CANCELAMENTO_CTE_HORAS[uf] ?? FALLBACK_CANCELAMENTO_CTE;
}

// --------------------------------------------------- Cancelamento de MDF-e
export const JANELA_CANCELAMENTO_MDFE: Parametro = {
  valor: 24, // horas
  fonte: {
    descricao:
      "Portaria CAT 102/2013, art. 12, reproduzindo o Ajuste SINIEF 21/2010, cl. 13ª. Só vale se o transporte não iniciou.",
    url: "https://legislacao.fazenda.sp.gov.br/Paginas/pcat1022013.aspx",
    confianca: "oficial",
  },
};

// --------------------------------------------------- Bloqueio do CNPJ (686)
/**
 * VERIFICADO EM 16/09/2026 (docs/domain/verificacao-2026-09.md).
 *
 * Não existe UMA regra de bloqueio de MDF-e. Existem QUATRO, com chaves
 * diferentes, todas no Anexo I do MOC MDF-e 3.00b, seção 2.2. O produto
 * precisa de quatro contadores, não de um.
 *
 * A expressão "em datas distintas", que circula em material de fornecedor,
 * NÃO está em nenhuma delas: ela vem da rejeição 610, que não consta do MOC
 * 3.00b vigente. Não a reintroduza.
 */
export const FONTE_MOC_ANEXO_I: Fonte = {
  descricao: "MOC MDF-e 3.00b, Anexo I, seção 2.2 (tabela de regras de validação)",
  url: "https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=%2FvyTwObecyA%3D",
  confianca: "oficial",
};

/** F85 / cStat 611. Imediato. Chave: CNPJ base + placa + tpEmit + UF de DESCARREGAMENTO.
 *  Atenção: a UF de carregamento NÃO entra nesta regra. */
export const BLOQUEIO_F85 = { cStat: "611", dias: 0, fonte: FONTE_MOC_ANEXO_I };

/** F87 / cStat 462. CINCO DIAS. Chave: CNPJ base + placa, para rota com no máximo
 *  2 UF de percurso. Atinge justamente a viagem curta e regional, que é o perfil
 *  do cliente de Goiás: provavelmente é este, e não o de 30 dias, o alarme que
 *  mais dispara na base real. */
export const BLOQUEIO_ROTA_CURTA_DIAS: Parametro = { valor: 5, fonte: FONTE_MOC_ANEXO_I };
export const MAX_UF_PERCURSO_ROTA_CURTA = 2;

/** F88 / cStat 662. Imediato, no SENTIDO OPOSTO: bloqueia o manifesto da volta.
 *  Operacionalmente a mais perversa: o motorista chega, não encerra, e a empresa
 *  não emite o MDF-e de retorno. */
export const BLOQUEIO_F88 = { cStat: "662", dias: 0, fonte: FONTE_MOC_ANEXO_I };

/**
 * F86 / cStat 686. TRINTA DIAS. Chave: só o CNPJ do emitente. Trava tudo.
 *
 * CONFIRMADO NACIONAL em 16/09/2026: a regra está no Anexo I do MOC 3.00b com
 * aplicação "Obrig." e sem restrição de UF. A Norma Técnica 01/2015 da SEFAZ-MS
 * só divulgava a regra nacional. O selo subiu de 'verificar' para 'oficial'.
 *
 * Continua sendo Parametro, não constante: o limiar é da norma, e norma muda.
 */
export const LIMIAR_BLOQUEIO_CNPJ_DIAS: Parametro = {
  valor: 30,
  fonte: {
    descricao:
      "MOC MDF-e 3.00b, Anexo I, regra F86, cStat 686: bloqueio do CNPJ para emitir MDF-e com manifesto não encerrado há mais de 30 dias. Regra nacional.",
    url: "https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=%2FvyTwObecyA%3D",
    confianca: "oficial",
  },
};

/** A partir de quantos dias antes de cada limiar o produto começa a avisar. */
export const ANTECEDENCIA_AVISO_BLOQUEIO_DIAS = 10;
export const ANTECEDENCIA_AVISO_ROTA_CURTA_DIAS = 3;

// --------------------------------------------------- Contingência
/**
 * MDF-e em contingência: transmitir em até 168h CONTADAS DA EMISSÃO, não da
 * resolução do problema.
 *
 * Para CT-e NÃO existe prazo nacional quantificado (remete à legislação
 * estadual). Por isso este parâmetro é só do MDF-e, e a UI não mostra relógio
 * de contingência para CT-e. Ver docs/domain 2.8.
 */
export const CONTINGENCIA_MDFE_HORAS: Parametro = {
  valor: 168,
  fonte: {
    descricao: "MOC MDF-e, seção 4.1, e Portaria CAT 102/2013, art. 15",
    url: "https://portal.fazenda.sp.gov.br/servicos/mdfe/Downloads/Manual_MDFe_v3.00.pdf",
    confianca: "oficial",
  },
};

// --------------------------------------------------- Certificado A1
export const AVISOS_CERTIFICADO_A1_DIAS = [30, 15, 7] as const;

// --------------------------------------------------- CIOT no MDF-e
/**
 * A data de 23/11/2026 circula em material de fornecedor (NT MDF-e 2026.001) e
 * NÃO foi confirmada no portal SVRS. Por isso `data` é null: enquanto for null,
 * o produto avisa que falta CIOT mas NÃO mostra contagem regressiva.
 * Ver docs/domain/fluxos-documentais.md, seção 8, item 1.
 */
export const OBRIGATORIEDADE_CIOT_MDFE: {
  data: number | null;
  homologacao: number;
  fonte: Fonte;
} = {
  // 2026-11-23T00:00:00Z. CONFIRMADO no texto da NT em 16/09/2026.
  data: Date.UTC(2026, 10, 23),
  homologacao: Date.UTC(2026, 8, 21),
  fonte: {
    descricao:
      "NT MDF-e 2026.001 v1.00: com modal=1 e tpEmit 1 ou 3, ou tpEmit 2 com tpTransp informada, o grupo infCIOT passa a obrigatório. Rejeição 684. Homologação 21/09/2026, produção 23/11/2026.",
    url: "https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=F9WDPRCi0Bs%3D",
    confianca: "oficial",
  },
};

/**
 * Serviço que torna o painel de conformidade barato: uma chamada por CNPJ
 * devolve a lista inteira de manifestos não encerrados, com chave e protocolo.
 * Não é preciso consultar chave por chave.
 */
export const SERVICO_CONSULTA_NAO_ENCERRADOS: Fonte = {
  descricao:
    "MDFeConsNaoEnc, MOC MDF-e 3.00b Visão Geral seção 4.4: serviço síncrono de consulta de MDF-e não encerrados por CNPJ.",
  url: "https://dfe-portal.svrs.rs.gov.br/MDFE/Servicos",
  confianca: "oficial",
};

export const DIA_MS = 86_400_000;
export const HORA_MS = 3_600_000;
