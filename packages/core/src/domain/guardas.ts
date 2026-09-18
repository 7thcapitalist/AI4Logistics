// ============================================================================
// Guardas: "posso fazer X?" e, quando não posso, POR QUE não.
//
// O valor deste produto está em explicar por que não dá. Por isso uma guarda
// negada SEMPRE carrega motivo em português de negócio E fonte. A UI mostra a
// ação desabilitada com esse motivo; ela nunca esconde o botão.
// ============================================================================

import type { Documento, Fonte, Guarda, UF, Viagem } from "./tipos";
import {
  BLOQUEIO_F85,
  DIA_MS,
  BLOQUEIO_F88,
  BLOQUEIO_ROTA_CURTA_DIAS,
  HORA_MS,
  JANELA_CANCELAMENTO_MDFE,
  LIMIAR_BLOQUEIO_CNPJ_DIAS,
  MAX_UF_PERCURSO_ROTA_CURTA,
  janelaCancelamentoCte,
} from "./prazos";

const F = {
  mdfeVinculado: {
    descricao:
      "SEFAZ-SP, Cancelamento Extemporâneo de CT-e: CT-e vinculado a MDF-e autorizado ou encerrado não pode ser cancelado.",
    url: "https://portal.fazenda.sp.gov.br/servicos/cte/Paginas/Cancelamento-Extempor%C3%A2neo-de-CT-e.aspx",
    confianca: "oficial" as const,
  },
  comprovanteEntrega: {
    descricao:
      "Rejeição 862: vedado o cancelamento quando houver evento de Comprovante de Entrega associado.",
    confianca: "verificar" as const,
  },
  cartaCorrecao: {
    descricao:
      "FAQ do Portal Nacional CT-e: CT-e com Carta de Correção emitida não pode ser cancelado.",
    url: "https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx?tipoConteudo=HC%2Fiuy94%2FRk%3D",
    confianca: "oficial" as const,
  },
  fatoGerador: {
    descricao:
      "FAQ do Portal Nacional CT-e: só se cancela CT-e antes de ocorrido o fato gerador, ou seja, antes de iniciada a prestação.",
    url: "https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx?tipoConteudo=HC%2Fiuy94%2FRk%3D",
    confianca: "oficial" as const,
  },
  denegado: {
    descricao:
      "Documento denegado por irregularidade fiscal: consta que a numeração não se cancela, corrige nem inutiliza. Ver docs/domain 2.4.",
    confianca: "verificar" as const,
  },
  encerramento: {
    descricao:
      "Ajuste SINIEF 21/2010, cláusula 14ª: o encerramento cabe ao fim do percurso, transbordo, redespacho, subcontratação, troca de veículo ou contêiner, retenção parcial, ou inclusão de mercadoria para a mesma UF. Sem condição de tempo.",
    confianca: "verificar" as const,
  },
};

const ESTADO_FINAL = new Set(["cancelado", "denegado", "encerrado"]);

function horasDesde(de: number | undefined, agora: number): number | null {
  if (de === undefined) return null;
  return (agora - de) / HORA_MS;
}

/** Existe MDF-e autorizado ou encerrado na viagem? Trava o cancelamento do CT-e. */
function temMdfeVinculado(v: Viagem): boolean {
  return v.documentos.some(
    (d) => d.tipo === "mdfe" && (d.status === "autorizado" || d.status === "encerrado"),
  );
}

function temEvento(v: Viagem, modelo: 57 | 58, codigo: string): boolean {
  return v.eventos.some((e) => e.modelo === modelo && e.codigo === codigo);
}

// ---------------------------------------------------------------------------

export function podeCancelarCte(v: Viagem, doc: Documento, agora: number): Guarda {
  if (doc.tipo !== "cte") {
    return {
      permitido: false,
      motivo: "Este documento não é um CT-e.",
      fonte: { descricao: "Regra interna do produto.", confianca: "oficial" },
    };
  }
  if (doc.status === "denegado") {
    return {
      permitido: false,
      motivo:
        "CT-e denegado não pode ser cancelado, corrigido nem inutilizado. A numeração fica bloqueada.",
      fonte: F.denegado,
    };
  }
  if (ESTADO_FINAL.has(doc.status)) {
    return {
      permitido: false,
      motivo: `Documento já está ${doc.status}.`,
      fonte: { descricao: "Estado atual do documento.", confianca: "oficial" },
    };
  }
  if (doc.status !== "autorizado") {
    return {
      permitido: false,
      motivo: "Só se cancela CT-e que já foi autorizado pela SEFAZ.",
      fonte: F.fatoGerador,
    };
  }
  if (temEvento(v, 57, "110180")) {
    return {
      permitido: false,
      motivo:
        "A entrega já foi registrada neste CT-e (comprovante de entrega eletrônico). Com o comprovante registrado, o cancelamento é recusado.",
      fonte: F.comprovanteEntrega,
    };
  }
  if (temEvento(v, 57, "110110")) {
    return {
      permitido: false,
      motivo:
        "Este CT-e já recebeu Carta de Correção. Depois da carta, o documento não pode mais ser cancelado.",
      fonte: F.cartaCorrecao,
    };
  }
  if (temMdfeVinculado(v)) {
    return {
      permitido: false,
      motivo:
        "Existe MDF-e autorizado vinculado a este CT-e. Enquanto o manifesto existir, a SEFAZ recusa o cancelamento do conhecimento.",
      fonte: F.mdfeVinculado,
    };
  }
  if (v.iniciadaEm !== undefined && v.iniciadaEm <= agora) {
    return {
      permitido: false,
      motivo:
        "A viagem já começou. O fato gerador ocorreu, e a partir daí o CT-e não se cancela: o caminho é substituição.",
      fonte: F.fatoGerador,
    };
  }

  const janela = janelaCancelamentoCte(v.origem.uf);
  const h = horasDesde(doc.autorizadoEm, agora);
  if (h !== null && h > janela.valor) {
    const dias = Math.floor(janela.valor / 24);
    return {
      permitido: false,
      motivo:
        `Passaram-se ${Math.floor(h)}h da autorização e a janela de cancelamento em ${v.origem.uf} é de ` +
        `${janela.valor}h (${dias} dia${dias === 1 ? "" : "s"}). Fora da janela, só por processo administrativo na SEFAZ.`,
      fonte: janela.fonte,
    };
  }
  return { permitido: true };
}

// ---------------------------------------------------------------------------

export function podeCancelarMdfe(_v: Viagem, doc: Documento, agora: number): Guarda {
  if (doc.tipo !== "mdfe") {
    return {
      permitido: false,
      motivo: "Este documento não é um MDF-e.",
      fonte: { descricao: "Regra interna do produto.", confianca: "oficial" },
    };
  }
  if (doc.status === "encerrado") {
    return {
      permitido: false,
      motivo:
        "Este manifesto já foi encerrado. Encerrar e cancelar são coisas diferentes, e depois do encerramento não há o que cancelar.",
      fonte: JANELA_CANCELAMENTO_MDFE.fonte,
    };
  }
  if (ESTADO_FINAL.has(doc.status)) {
    return {
      permitido: false,
      motivo: `Documento já está ${doc.status}.`,
      fonte: { descricao: "Estado atual do documento.", confianca: "oficial" },
    };
  }
  if (doc.status !== "autorizado") {
    return {
      permitido: false,
      motivo: "Só se cancela MDF-e que já foi autorizado pela SEFAZ.",
      fonte: JANELA_CANCELAMENTO_MDFE.fonte,
    };
  }
  if (_v.iniciadaEm !== undefined && _v.iniciadaEm <= agora) {
    return {
      permitido: false,
      motivo:
        "O transporte já iniciou. Manifesto de viagem iniciada não se cancela: o caminho é o encerramento.",
      fonte: JANELA_CANCELAMENTO_MDFE.fonte,
    };
  }
  const h = horasDesde(doc.autorizadoEm, agora);
  if (h !== null && h > JANELA_CANCELAMENTO_MDFE.valor) {
    return {
      permitido: false,
      motivo:
        `Passaram-se ${Math.floor(h)}h da autorização e o prazo de cancelamento do MDF-e é de 24h. ` +
        "Fora do prazo, é preciso pedir Liberação de Prazo de Cancelamento à SEFAZ.",
      fonte: JANELA_CANCELAMENTO_MDFE.fonte,
    };
  }
  return { permitido: true };
}

// ---------------------------------------------------------------------------

/**
 * Encerramento do MDF-e.
 *
 * NÃO existe condição de tempo aqui, e não pode existir. A norma vincula o
 * encerramento a eventos, não a um relógio. Qualquer guarda que negue o
 * encerramento "porque ainda não deu o prazo" está inventando regra fiscal.
 */
export function podeEncerrarMdfe(v: Viagem, doc: Documento): Guarda {
  if (doc.tipo !== "mdfe") {
    return {
      permitido: false,
      motivo: "Só MDF-e é encerrado. CT-e não tem encerramento.",
      fonte: { descricao: "Regra interna do produto.", confianca: "oficial" },
    };
  }
  if (doc.status === "encerrado") {
    return {
      permitido: false,
      motivo: "Este manifesto já está encerrado.",
      fonte: { descricao: "Estado atual do documento.", confianca: "oficial" },
    };
  }
  if (doc.status !== "autorizado") {
    return {
      permitido: false,
      motivo:
        "Só se encerra manifesto autorizado. Este ainda não recebeu autorização de uso.",
      fonte: F.encerramento,
    };
  }
  if (v.status === "cancelada") {
    return {
      permitido: false,
      motivo: "A viagem foi cancelada.",
      fonte: { descricao: "Estado atual da viagem.", confianca: "oficial" },
    };
  }
  return { permitido: true };
}

/**
 * Regras de bloqueio de emissão de MDF-e.
 *
 * VERIFICADO 16/09/2026: são QUATRO regras no Anexo I do MOC MDF-e 3.00b,
 * com chaves diferentes. Implementar só uma delas, como o desenho original
 * fazia, deixa três buracos por onde o cliente é bloqueado sem aviso.
 *
 * A expressão "em datas distintas" NÃO existe na norma: vem da rejeição 610,
 * que não consta do MOC vigente. Não reintroduzir.
 */
export type RegraBloqueio = "F85" | "F87" | "F88" | "F86";

export type Bloqueio = {
  regra: RegraBloqueio;
  cStat: string;
  viagemBloqueadora: string;
  motivo: string;
  fonte: Fonte;
};

/**
 * CNPJ base: as 8 primeiras posições. Filiais COMPARTILHAM o bloqueio, porque
 * as regras do Anexo I são chaveadas pela raiz, não pelo estabelecimento.
 * Usado pelo chamador para escopar as viagens antes de chamar
 * `bloqueiosDeEmissaoMdfe`. Ver a pré-condição documentada lá.
 */
export function cnpjBase(cnpj: string): string {
  return cnpj.replace(/\D/g, "").slice(0, 8);
}

type Candidato = { viagem: Viagem; doc: Documento; abertoHaDias: number };

function manifestosAbertos(viagens: Viagem[], agora: number): Candidato[] {
  const out: Candidato[] = [];
  for (const v of viagens) {
    for (const d of v.documentos) {
      if (d.tipo !== "mdfe" || d.status !== "autorizado") continue;
      out.push({
        viagem: v,
        doc: d,
        abertoHaDias: d.autorizadoEm ? Math.floor((agora - d.autorizadoEm) / DIA_MS) : 0,
      });
    }
  }
  return out;
}

/**
 * Todos os bloqueios que impedem a emissão pretendida. Devolve lista, não
 * booleano, porque mais de uma regra pode morder ao mesmo tempo e o usuário
 * precisa saber qual manifesto encerrar para destravar cada uma.
 *
 * PRÉ-CONDIÇÃO DO CHAMADOR: `viagens` já vem escopada a um único CNPJ base
 * emitente. As quatro regras do Anexo I são chaveadas por CNPJ base, e hoje o
 * modelo de dados não carrega o CNPJ do emitente na Viagem nem no Documento,
 * só o `orgId`. Enquanto uma organização corresponder a um CNPJ base, o
 * escopo por tenant (ADR 0002) já satisfaz a chave.
 *
 * Esta função NÃO confere o CNPJ, e não finge conferir. No dia em que uma
 * organização tiver matriz e filial com raízes diferentes, ou que o chamador
 * puder misturar tenants, é preciso levar o CNPJ do emitente para o
 * `Documento` e filtrar por `cnpjBase` aqui. Registrado como dívida aberta.
 */
export function bloqueiosDeEmissaoMdfe(
  viagens: Viagem[],
  pretendida: {
    placa: string;
    tpEmit: 1 | 2 | 3;
    carregamento: UF;
    descarregamento: UF;
    ufsPercurso?: UF[];
  },
  agora: number,
): Bloqueio[] {
  const out: Bloqueio[] = [];
  const abertos = manifestosAbertos(viagens, agora);

  for (const { viagem, doc, abertoHaDias } of abertos) {
    const mesmaPlaca = viagem.veiculo.placa === pretendida.placa;
    const mesmoTpEmit = (doc.tpEmit ?? 1) === pretendida.tpEmit;
    const par = doc.parUf;

    // F85 / 611: imediato. CNPJ base + placa + tpEmit + UF de DESCARREGAMENTO.
    // A UF de carregamento NÃO entra.
    if (
      mesmaPlaca &&
      mesmoTpEmit &&
      par?.descarregamento === pretendida.descarregamento
    ) {
      out.push({
        regra: "F85",
        cStat: BLOQUEIO_F85.cStat,
        viagemBloqueadora: viagem.numero,
        motivo:
          `A placa ${pretendida.placa} tem manifesto aberto com descarga em ${pretendida.descarregamento} ` +
          `(viagem ${viagem.numero}). Enquanto não for encerrado, a SEFAZ não autoriza outro manifesto ` +
          "para essa placa com essa UF de descarregamento.",
        fonte: BLOQUEIO_F85.fonte,
      });
    }

    // F88 / 662: imediato, no sentido oposto. Bloqueia a viagem de volta.
    // Em rota intraestadual (GO→GO) o par invertido é igual ao par direto, e a
    // F88 morderia o mesmo manifesto que a F85, produzindo duas linhas para um
    // problema só, a segunda dizendo "manifesto da volta GO → GO". Suprimimos.
    if (
      mesmaPlaca &&
      mesmoTpEmit &&
      pretendida.carregamento !== pretendida.descarregamento &&
      par?.carregamento === pretendida.descarregamento &&
      par?.descarregamento === pretendida.carregamento
    ) {
      out.push({
        regra: "F88",
        cStat: BLOQUEIO_F88.cStat,
        viagemBloqueadora: viagem.numero,
        motivo:
          `Existe manifesto aberto no sentido ${par.carregamento} → ${par.descarregamento} para a placa ` +
          `${pretendida.placa} (viagem ${viagem.numero}). O manifesto da volta fica travado até esse ser encerrado.`,
        fonte: BLOQUEIO_F88.fonte,
      });
    }

    // F87 / 462: cinco dias, rota com no máximo 2 UF de percurso.
    const percurso = viagem.ufsPercurso ?? [];
    if (
      mesmaPlaca &&
      percurso.length <= MAX_UF_PERCURSO_ROTA_CURTA &&
      abertoHaDias >= BLOQUEIO_ROTA_CURTA_DIAS.valor
    ) {
      out.push({
        regra: "F87",
        cStat: "462",
        viagemBloqueadora: viagem.numero,
        motivo:
          `A placa ${pretendida.placa} tem manifesto de rota curta aberto há ${abertoHaDias} dias ` +
          `(viagem ${viagem.numero}). Acima de ${BLOQUEIO_ROTA_CURTA_DIAS.valor} dias a SEFAZ recusa nova emissão para essa placa.`,
        fonte: BLOQUEIO_ROTA_CURTA_DIAS.fonte,
      });
    }

    // F86 / 686: trinta dias, só o CNPJ. Trava tudo, qualquer placa, qualquer rota.
    if (abertoHaDias >= LIMIAR_BLOQUEIO_CNPJ_DIAS.valor) {
      out.push({
        regra: "F86",
        cStat: "686",
        viagemBloqueadora: viagem.numero,
        motivo:
          `Existe manifesto aberto há ${abertoHaDias} dias (viagem ${viagem.numero}). ` +
          "Acima desse prazo a SEFAZ bloqueia o CNPJ inteiro para emitir qualquer MDF-e, em qualquer veículo e qualquer rota.",
        fonte: LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte,
      });
    }
  }
  return out;
}

/** Conveniência para a UI: guarda derivada do primeiro bloqueio encontrado. */
export function podeEmitirMdfe(
  viagens: Viagem[],
  pretendida: Parameters<typeof bloqueiosDeEmissaoMdfe>[1],
  agora: number,
): Guarda {
  const bs = bloqueiosDeEmissaoMdfe(viagens, pretendida, agora);
  if (bs.length === 0) return { permitido: true };
  const b = bs[0]!;
  return { permitido: false, motivo: b.motivo, fonte: b.fonte };
}
