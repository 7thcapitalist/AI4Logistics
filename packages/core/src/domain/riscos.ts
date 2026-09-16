// ============================================================================
// Motor de risco.
//
// Todo Risco produzido aqui carrega Fonte. Nenhum risco afirma prazo que não
// esteja parametrizado em prazos.ts com a sua própria fonte.
// ============================================================================

import type { Org, Risco, Viagem } from "./tipos";
import {
  ANTECEDENCIA_AVISO_BLOQUEIO_DIAS,
  ANTECEDENCIA_AVISO_ROTA_CURTA_DIAS,
  FONTE_MOC_ANEXO_I,
  AVISOS_CERTIFICADO_A1_DIAS,
  CONTINGENCIA_MDFE_HORAS,
  DIA_MS,
  HORA_MS,
  LIMIAR_BLOQUEIO_CNPJ_DIAS,
  OBRIGATORIEDADE_CIOT_MDFE,
  janelaCancelamentoCte,
} from "./prazos";
import { BLOQUEIO_ROTA_CURTA_DIAS, MAX_UF_PERCURSO_ROTA_CURTA } from "./prazos";
import { bloqueiosDeEmissaoMdfe } from "./guardas";

const FONTE_SEGUROS = {
  descricao:
    "Resolução ANTT 6.068/2025 e Portaria SUROC 27/2025: verificação eletrônica dos seguros em produção desde 01/07/2026. RNTRC suspenso até regularizar.",
  url: "https://www.gov.br/antt/pt-br/assuntos/ultimas-noticias/antt-inicia-integracao-nacional-para-verificacao-automatica-dos-seguros-obrigatorios-do-transporte-de-cargas",
  confianca: "oficial" as const,
};

const FONTE_A1 = {
  descricao:
    "Certificado ICP-Brasil é exigido para assinar e transmitir (Ajuste SINIEF 9/07, cl. 5ª). Vencido, nenhum documento é emitido.",
  confianca: "oficial" as const,
};

const dias = (ms: number) => Math.floor(ms / DIA_MS);

/**
 * Contagem regressiva presente ou AUSENTE.
 *
 * `contagemRegressiva` é opcional em `Risco`, e o tsconfig da raiz liga
 * `exactOptionalPropertyTypes`: com ele, `{ contagemRegressiva: undefined }` não
 * é o mesmo que omitir o campo. Isso importa aqui e não é detalhe de tipagem —
 * "já bloqueado" e "faltam N dias" são estados diferentes na UI, e um risco que
 * carrega a chave com `undefined` renderiza um contador vazio em vez de nenhum.
 * Então a chave sai do objeto de verdade quando não há nada a contar.
 */
function contagem(c: Risco["contagemRegressiva"] | false | null): {
  contagemRegressiva?: NonNullable<Risco["contagemRegressiva"]>;
} {
  return c ? { contagemRegressiva: c } : {};
}

function mdfeAbertos(v: Viagem) {
  return v.documentos.filter((d) => d.tipo === "mdfe" && d.status === "autorizado");
}

// ---------------------------------------------------------------------------

export function riscosDaViagem(
  v: Viagem,
  agora: number,
  contexto?: { viagens?: Viagem[] },
): Risco[] {
  const out: Risco[] = [];
  const outras = (contexto?.viagens ?? []).filter((o) => o.id !== v.id);

  for (const doc of mdfeAbertos(v)) {
    const abertoHa = doc.autorizadoEm ? dias(agora - doc.autorizadoEm) : 0;
    const percursoCurto = (v.ufsPercurso ?? []).length <= MAX_UF_PERCURSO_ROTA_CURTA;

    // 1. Bloqueio imediato do veículo (F85, e F88 no sentido de volta).
    if (doc.parUf) {
      const bloqueios = bloqueiosDeEmissaoMdfe(
        outras,
        {
          placa: v.veiculo.placa,
          tpEmit: doc.tpEmit ?? 1,
          carregamento: doc.parUf.carregamento,
          descarregamento: doc.parUf.descarregamento,
          ufsPercurso: v.ufsPercurso,
        },
        agora,
      );
      const barradas = bloqueios.length;
      out.push({
        id: `${v.id}:${doc.id}:mdfe-bloqueio`,
        tipo: "mdfe_aberto_bloqueando_veiculo",
        severidade: v.status === "entregue" ? "bloqueante" : "alto",
        titulo: `Manifesto aberto trava a placa ${v.veiculo.placa}`,
        explicacao:
          `Enquanto este manifesto não for encerrado, a placa ${v.veiculo.placa} não emite outro com ` +
          `descarga em ${doc.parUf.descarregamento}, nem o manifesto da volta ` +
          `(${doc.parUf.descarregamento} → ${doc.parUf.carregamento}).` +
          (barradas > 0 ? " Já existe outra viagem barrada por isso." : ""),
        acao: {
          label: "Encerrar manifesto",
          href: `/viagens/${v.id}?aba=documentos#doc-${doc.id}`,
        },
        viagemId: v.id,
        documentoId: doc.id,
        veiculoPlaca: v.veiculo.placa,
        fonte: FONTE_MOC_ANEXO_I,
      });
    }

    // 2. Rota curta: bloqueio da placa em 5 dias (F87 / 462).
    // Esta regra morde MUITO antes da de 30 dias e atinge exatamente o perfil
    // regional de Goiás. Ela não existia no desenho original do produto.
    if (percursoCurto) {
      const restanteCurto = BLOQUEIO_ROTA_CURTA_DIAS.valor - abertoHa;
      if (restanteCurto <= ANTECEDENCIA_AVISO_ROTA_CURTA_DIAS) {
        const jaBarrado = restanteCurto <= 0;
        out.push({
          id: `${v.id}:${doc.id}:mdfe-rota-curta`,
          tipo: "mdfe_aberto_bloqueio_placa",
          severidade: jaBarrado ? "bloqueante" : "critico",
          titulo: jaBarrado
            ? `Placa ${v.veiculo.placa} bloqueada para novos manifestos`
            : `Placa ${v.veiculo.placa} bloqueia em ${restanteCurto} dia${restanteCurto === 1 ? "" : "s"}`,
          explicacao: jaBarrado
            ? `Rota curta com manifesto aberto há ${abertoHa} dias. Acima de ${BLOQUEIO_ROTA_CURTA_DIAS.valor} dias a SEFAZ recusa nova emissão para esta placa.`
            : `Rota curta com manifesto aberto há ${abertoHa} dias. Ao chegar em ${BLOQUEIO_ROTA_CURTA_DIAS.valor} dias esta placa para de emitir manifesto.`,
          acao: {
            label: "Encerrar manifesto",
            href: `/viagens/${v.id}?aba=documentos#doc-${doc.id}`,
          },
          viagemId: v.id,
          documentoId: doc.id,
          veiculoPlaca: v.veiculo.placa,
          ...contagem(
            !jaBarrado && {
              tipo: "dias",
              restante: restanteCurto,
              ate: "bloqueio da placa",
            },
          ),
          fonte: BLOQUEIO_ROTA_CURTA_DIAS.fonte,
        });
      }
    }

    // 3. Aproximação do bloqueio do CNPJ inteiro (F86 / 686), 30 dias.
    const restante = LIMIAR_BLOQUEIO_CNPJ_DIAS.valor - abertoHa;
    if (restante <= ANTECEDENCIA_AVISO_BLOQUEIO_DIAS) {
      const jaBloqueado = restante <= 0;
      out.push({
        id: `${v.id}:${doc.id}:mdfe-limiar`,
        tipo: "mdfe_aberto_limiar_bloqueio",
        severidade: jaBloqueado ? "bloqueante" : "critico",
        titulo: jaBloqueado
          ? "CNPJ bloqueado para emitir manifestos"
          : `Bloqueio do CNPJ em ${restante} dia${restante === 1 ? "" : "s"}`,
        explicacao: jaBloqueado
          ? `Este manifesto está aberto há ${abertoHa} dias. Acima de ${LIMIAR_BLOQUEIO_CNPJ_DIAS.valor} dias a SEFAZ recusa qualquer novo MDF-e do CNPJ, em qualquer veículo. Encerre para desbloquear.`
          : `Aberto há ${abertoHa} dias. Ao chegar em ${LIMIAR_BLOQUEIO_CNPJ_DIAS.valor} dias a SEFAZ bloqueia o CNPJ inteiro para emitir manifestos, em qualquer veículo.`,
        acao: {
          label: "Encerrar manifesto",
          href: `/viagens/${v.id}?aba=documentos#doc-${doc.id}`,
        },
        viagemId: v.id,
        documentoId: doc.id,
        veiculoPlaca: v.veiculo.placa,
        ...contagem(!jaBloqueado && { tipo: "dias", restante, ate: "bloqueio do CNPJ" }),
        fonte: LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte,
      });
    }

    // 4. MDF-e sem CIOT.
    if (doc.temCiot === false) {
      const data = OBRIGATORIEDADE_CIOT_MDFE.data;
      const restanteCiot = data === null ? null : dias(data - agora);
      out.push({
        id: `${v.id}:${doc.id}:mdfe-sem-ciot`,
        tipo: "mdfe_sem_ciot",
        severidade: "critico",
        titulo: "Manifesto sem CIOT",
        explicacao:
          "Este manifesto foi emitido sem o CIOT. A ANTT já pune a falta de registro da operação, e a SEFAZ passa a rejeitar o manifesto sem CIOT quando a validação entrar em produção.",
        viagemId: v.id,
        documentoId: doc.id,
        ...contagem(
          restanteCiot !== null &&
            restanteCiot > 0 && {
              tipo: "dias",
              restante: restanteCiot,
              ate: "rejeição automática do manifesto",
            },
        ),
        fonte: OBRIGATORIEDADE_CIOT_MDFE.fonte,
      });
    }
  }

  // 4. Contingência. SÓ MDF-e tem prazo nacional quantificado.
  for (const doc of v.documentos) {
    if (doc.status !== "contingencia" || !doc.contingenciaDesde) continue;
    if (doc.tipo !== "mdfe") continue;
    const horas = Math.floor((agora - doc.contingenciaDesde) / HORA_MS);
    const restante = CONTINGENCIA_MDFE_HORAS.valor - horas;
    out.push({
      id: `${v.id}:${doc.id}:contingencia`,
      tipo: "contingencia_aberta",
      severidade: restante <= 24 ? "critico" : "alto",
      titulo:
        restante > 0
          ? `Contingência: ${restante}h para transmitir`
          : "Contingência fora do prazo de transmissão",
      explicacao:
        `O manifesto foi emitido em contingência há ${horas}h. O prazo de transmissão é de ` +
        `${CONTINGENCIA_MDFE_HORAS.valor}h contadas da emissão, não da solução do problema técnico.`,
      viagemId: v.id,
      documentoId: doc.id,
      ...contagem(
        restante > 0 && { tipo: "horas", restante, ate: "fim do prazo de transmissão" },
      ),
      fonte: CONTINGENCIA_MDFE_HORAS.fonte,
    });
  }

  // 5. Rejeição sem tratamento.
  for (const doc of v.documentos) {
    if (doc.status !== "rejeitado" && doc.status !== "denegado") continue;
    out.push({
      id: `${v.id}:${doc.id}:rejeitado`,
      tipo: "cte_rejeitado_sem_tratamento",
      severidade: doc.status === "denegado" ? "critico" : "alto",
      titulo:
        doc.status === "denegado"
          ? `${doc.tipo.toUpperCase()} denegado (${doc.codigoRejeicao ?? "sem código"})`
          : `${doc.tipo.toUpperCase()} rejeitado (${doc.codigoRejeicao ?? "sem código"})`,
      explicacao:
        doc.explicacao ?? doc.mensagemRejeicao ?? "Documento não autorizado pela SEFAZ.",
      acao: { label: "Ver documento", href: `/viagens/${v.id}#doc-${doc.id}` },
      viagemId: v.id,
      documentoId: doc.id,
      fonte: {
        descricao: `Retorno da SEFAZ: ${doc.mensagemRejeicao ?? "sem mensagem"}`,
        confianca: "oficial",
      },
    });
  }

  // 6. Janela de cancelamento do CT-e correndo, por UF.
  for (const doc of v.documentos) {
    if (doc.tipo !== "cte" || doc.status !== "autorizado" || !doc.autorizadoEm) continue;
    if (v.iniciadaEm !== undefined) continue; // fato gerador ocorreu, janela irrelevante
    const janela = janelaCancelamentoCte(v.origem.uf);
    const horas = Math.floor((agora - doc.autorizadoEm) / HORA_MS);
    const restante = janela.valor - horas;
    if (restante > 0 && restante <= 48) {
      // A janela desta UF foi lida na legislação, ou é o fallback nacional?
      // Se for o fallback, o produto NÃO pode afirmar um relógio: seria vender
      // como certo um prazo que ninguém verificou para aquele estado.
      const verificada = janela.fonte.confianca === "oficial";
      out.push({
        id: `${v.id}:${doc.id}:janela-cte`,
        tipo: "janela_cancelamento_cte",
        severidade: "medio",
        titulo: verificada
          ? `Janela de cancelamento do CT-e: ${restante}h`
          : "Janela de cancelamento do CT-e se aproximando",
        explicacao: verificada
          ? `Se houver erro neste CT-e, restam ${restante}h para cancelar em ${v.origem.uf}. ` +
            "Depois disso, ou emitido o manifesto, ou registrada a entrega, o caminho passa a ser substituição."
          : `Pela regra nacional restariam cerca de ${restante}h para cancelar este CT-e, mas o prazo de ` +
            `${v.origem.uf} não foi verificado na legislação estadual e pode ser diferente. Confirme antes de contar com ele.`,
        viagemId: v.id,
        documentoId: doc.id,
        ...contagem(
          verificada && { tipo: "horas", restante, ate: "fim da janela de cancelamento" },
        ),
        fonte: janela.fonte,
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------

export function riscosDaOrg(org: Org, viagens: Viagem[], agora: number): Risco[] {
  const out: Risco[] = [];

  const diasA1 = dias(org.certificadoA1.validoAte - agora);
  const maiorAviso = AVISOS_CERTIFICADO_A1_DIAS[0];
  if (diasA1 <= maiorAviso) {
    out.push({
      id: `${org.id}:certificado`,
      tipo: "certificado_a1_vencendo",
      severidade: diasA1 <= 7 ? "critico" : "alto",
      titulo:
        diasA1 <= 0
          ? "Certificado digital vencido"
          : `Certificado digital vence em ${diasA1} dia${diasA1 === 1 ? "" : "s"}`,
      explicacao:
        diasA1 <= 0
          ? "Sem certificado válido nenhum documento é assinado nem transmitido. A emissão para por completo."
          : "Quando o certificado vence, a emissão para por completo: nenhum CT-e e nenhum MDF-e é assinado. Renove antes.",
      ...contagem(
        diasA1 > 0 && {
          tipo: "dias",
          restante: diasA1,
          ate: "vencimento do certificado",
        },
      ),
      fonte: FONTE_A1,
    });
  }

  if (org.rntrcStatus === "suspenso" || org.segurosVerificadosEm === undefined) {
    out.push({
      id: `${org.id}:rntrc`,
      tipo: "rntrc_seguro_pendente",
      severidade: org.rntrcStatus === "suspenso" ? "bloqueante" : "alto",
      titulo:
        org.rntrcStatus === "suspenso"
          ? "RNTRC suspenso"
          : "Seguros ainda não verificados pela ANTT",
      explicacao:
        org.rntrcStatus === "suspenso"
          ? "Com o RNTRC suspenso não se gera CIOT, e sem CIOT o manifesto fica exposto. Regularize os seguros para reativar."
          : "A ANTT passou a conferir os seguros obrigatórios direto com as seguradoras. Enquanto a transmissão não chega, o RNTRC fica sujeito a suspensão, e RNTRC suspenso derruba o CIOT.",
      fonte: FONTE_SEGUROS,
    });
  }

  for (const v of viagens) {
    out.push(...riscosDaViagem(v, agora, { viagens }));
  }
  return out;
}

const ORDEM = { bloqueante: 0, critico: 1, alto: 2, medio: 3 } as const;

export function ordenarRiscos(riscos: Risco[]): Risco[] {
  return [...riscos].sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
}

export function contarPorSeveridade(riscos: Risco[]) {
  return {
    bloqueante: riscos.filter((r) => r.severidade === "bloqueante").length,
    critico: riscos.filter((r) => r.severidade === "critico").length,
    alto: riscos.filter((r) => r.severidade === "alto").length,
    medio: riscos.filter((r) => r.severidade === "medio").length,
  };
}
