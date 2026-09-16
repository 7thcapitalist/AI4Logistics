// ============================================================================
// FakeCiotProvider — implementação determinística de CiotProvider.
//
// O caso que importa aqui é o PISO MÍNIMO. Desde 24/05/2026 a ANTT bloqueia a
// geração do CIOT quando o frete está abaixo do piso, e isso acontece todo dia.
// O fake trata como resultado de negócio, com o valor da diferença, para que o
// frontend possa construir a tela "faltam R$ 340" antes de existir contrato.
//
// Determinístico: sem Date.now(), sem Math.random().
//
// ⚠️ A tabela de piso abaixo é PLACEHOLDER de formato, não regra fiscal real.
// Os coeficientes são inventados para produzir números plausíveis em teste.
// `fonte.confianca` é 'verificar' de propósito, e a UI sinaliza isso ao
// usuário. Ver ADR 0006 §4.2 — piso calculado errado vira venda perdida ou
// autuação. NÃO promova isto a 'oficial' sem conferir a resolução da ANTT.
// ============================================================================

import type {
  CapacidadesCiot,
  Ciot,
  CancelarCiotEntrada,
  BaixaCiotEntrada,
  ChaveCiot,
  CiotProvider,
  ConsultarPisoEntrada,
  GerarCiotEntrada,
  GerarCiotSaida,
  PisoMinimo,
  ResultadoCiot,
  SolicitacaoValePedagio,
  ValePedagio,
} from "../ciot/provider";
import { formatBRL } from "@ai4l/core";
import { chaveCiot } from "../ciot/provider";
import { EPOCH_FAKE, hash32 } from "./fiscal";

/**
 * Texto cru de referência para frete abaixo do piso.
 * Capturado de documentação pública de um emissor; NÃO confirmado que a
 * Extratta devolva exatamente isto. Ver ADR 0006 §1.2 e item 1 do spike.
 */
export const MSG_PISO_MINIMO =
  "O valor do frete informado é menor do que o valor mínimo de frete estabelecido.";

/** Coeficientes PLACEHOLDER, em centavos. Não são a tabela da ANTT. */
const COEF_DESLOCAMENTO_POR_KM_EIXO = 21;
const COEF_CARGA_DESCARGA_POR_EIXO = 9_800;

export function calcularPisoFake(e: ConsultarPisoEntrada): PisoMinimo {
  const deslocamento = Math.round(
    e.distanciaKm * e.eixos * COEF_DESLOCAMENTO_POR_KM_EIXO,
  );
  const cargaDescarga = e.eixos * COEF_CARGA_DESCARGA_POR_EIXO;
  return {
    valorCentavos: deslocamento + cargaDescarga,
    tabelaVersao: "FAKE-placeholder",
    calculadoEm: EPOCH_FAKE,
    fonte: {
      descricao:
        "Cálculo PLACEHOLDER do FakeCiotProvider. NÃO é a tabela da ANTT. " +
        "Não use para decisão comercial.",
      confianca: "verificar",
    },
    componentes: { deslocamento, cargaDescarga },
  };
}

/** Cenários que a fixture pode forçar no fake. */
export type CenarioCiotFake = "rntrc_suspenso";
export type CenariosCiotFake = Readonly<Record<string, CenarioCiotFake>>;

export class FakeCiotProvider implements CiotProvider {
  readonly capacidades: CapacidadesCiot = {
    provedor: "fake",
    gerarCiot: true,
    valePedagio: true,
    pagamentoEletronicoFrete: true,
    baixa: true,
    baixaParcial: true,
    cancelamento: true,
    // O fake expõe `true` porque implementa o cálculo internamente. A Extratta
    // NÃO tem endpoint dedicado; o adapter real decide se usa tabela própria ou
    // devolve `nao_suportado`. Ver ADR 0006 §2.3.
    consultaPisoMinimo: true,
    webhooks: false,
    // Nenhum candidato documenta operar a IPEF que o cliente já usa.
    instituicaoDoCliente: false,
  };

  /**
   * Cenários determinísticos pedidos pela fixture: viagemId -> cenário.
   * Sem entrada aqui, o caminho é o normal (inclusive a checagem de piso).
   */
  constructor(private readonly cenarios: CenariosCiotFake = {}) {}

  private readonly gerados = new Map<string, Ciot>();
  private readonly porNumero = new Map<string, string>();
  private readonly baixado = new Map<string, number>();

  async consultarPisoMinimo(
    entrada: ConsultarPisoEntrada,
  ): Promise<ResultadoCiot<PisoMinimo>> {
    if (entrada.distanciaKm <= 0 || entrada.eixos <= 0) {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [
            {
              campo: "distanciaKm",
              mensagem: "Informe distância e número de eixos maiores que zero.",
            },
          ],
        },
      };
    }
    return { ok: true, valor: calcularPisoFake(entrada) };
  }

  async gerarCiot(entrada: GerarCiotEntrada): Promise<ResultadoCiot<GerarCiotSaida>> {
    const chave = chaveCiot(entrada.chave);

    // Idempotência primeiro. CIOT duplicado é problema regulatório.
    const existente = this.gerados.get(chave);
    if (existente) {
      return { ok: false, erro: { tipo: "ja_gerado", chave, ciot: existente } };
    }

    if (entrada.viagem.valorFreteCentavos <= 0) {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [
            {
              campo: "viagem.valorFreteCentavos",
              mensagem: "O valor do frete precisa ser maior que zero.",
            },
          ],
        },
      };
    }

    if (this.cenarios[entrada.chave.viagemId] === "rntrc_suspenso") {
      return {
        ok: false,
        erro: {
          tipo: "regulatorio",
          mensagemBruta: "RNTRC do transportador nao esta ativo.",
          explicacao:
            "O RNTRC da transportadora está suspenso na ANTT, e sem RNTRC " +
            "ativo não é possível gerar CIOT. Regularize no portal da ANTT; " +
            "a liberação costuma depender de comprovar os seguros obrigatórios.",
          campo: "org.rntrc",
        },
      };
    }

    // ---- Piso mínimo: o caminho esperado, não a exceção -----------------
    const piso = calcularPisoFake({
      tipoCarga: entrada.tipoCarga,
      distanciaKm: entrada.distanciaKm,
      eixos: entrada.eixos,
      origem: entrada.viagem.origem,
      destino: entrada.viagem.destino,
      tipoOperacao: entrada.tipoOperacao,
      referenciaEm: EPOCH_FAKE,
    });

    if (entrada.viagem.valorFreteCentavos < piso.valorCentavos) {
      const diferenca = piso.valorCentavos - entrada.viagem.valorFreteCentavos;
      return {
        ok: false,
        erro: {
          tipo: "piso_minimo",
          valorInformadoCentavos: entrada.viagem.valorFreteCentavos,
          pisoMinimoCentavos: piso.valorCentavos,
          diferencaCentavos: diferenca,
          mensagemBruta: MSG_PISO_MINIMO,
          explicacao:
            `O CIOT não foi gerado porque o frete está abaixo do piso mínimo ` +
            `da ANTT. Você informou ${formatBRL(entrada.viagem.valorFreteCentavos)} e o piso ` +
            `para este trajeto é ${formatBRL(piso.valorCentavos)} — faltam ` +
            `${formatBRL(diferenca)}. Desde maio de 2026 a ANTT bloqueia a ` +
            `emissão nesse caso, então não adianta tentar de novo com o mesmo ` +
            `valor: ou o frete sobe até o piso, ou a viagem não pode ser ` +
            `contratada assim. Se você acredita que o piso está errado, ` +
            `confira a distância e o número de eixos informados.`,
          // `codigoBruto` fica AUSENTE: o piso mínimo é barrado pela ANTT antes
          // de virar código de erro de fornecedor, então não há código cru.
        },
      };
    }

    // ---- Caminho feliz --------------------------------------------------
    const semente = hash32(chave);
    const numero = String(semente).padStart(12, "0").slice(0, 12);
    const ciot: Ciot = {
      numero,
      verificador: String(semente % 10),
      senha: String((semente >>> 8) % 10_000).padStart(4, "0"),
      referenciaOperacao: `fake-op-${semente}`,
      emitidoEm: EPOCH_FAKE,
      valorFreteCentavos: entrada.viagem.valorFreteCentavos,
      status: "ativo",
      instituicao: { nome: "Instituição Fake de Pagamento", cnpj: "00000000000191" },
    };
    this.gerados.set(chave, ciot);
    this.porNumero.set(numero, chave);

    const saida: GerarCiotSaida = { chave, ciot };
    if (entrada.valePedagio) {
      saida.valePedagio = this.montarValePedagio(entrada.valePedagio, semente);
    }
    return { ok: true, valor: saida };
  }

  async comprarValePedagio(entrada: {
    orgId: string;
    referenciaOperacao?: string;
    solicitacao: SolicitacaoValePedagio;
  }): Promise<ResultadoCiot<ValePedagio>> {
    const semente = hash32(`${entrada.orgId}${entrada.referenciaOperacao ?? ""}`);
    return { ok: true, valor: this.montarValePedagio(entrada.solicitacao, semente) };
  }

  private montarValePedagio(s: SolicitacaoValePedagio, semente: number): ValePedagio {
    const pracas = s.ufsPercurso.map((uf, i) => ({
      nome: `Praça ${uf} ${i + 1}`,
      uf,
      valorCentavos: 1_200 + (hash32(`${uf}${i}${semente}`) % 3_000),
    }));
    return {
      numeroComprovante: `VP${String(semente).slice(0, 10)}`,
      valorCentavos: pracas.reduce((t, p) => t + p.valorCentavos, 0) * s.eixos,
      fornecedor: s.fornecedorPreferido ?? "Fornecedor Fake",
      pracas,
    };
  }

  async cancelarCiot(
    entrada: CancelarCiotEntrada,
  ): Promise<ResultadoCiot<{ canceladoEm: number }>> {
    const chave = this.porNumero.get(entrada.numeroCiot);
    const ciot = chave ? this.gerados.get(chave) : undefined;
    if (!ciot) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "CIOT não encontrado.",
        },
      };
    }
    if (ciot.status === "baixado") {
      return {
        ok: false,
        erro: {
          tipo: "recusa_instituicao",
          codigoBruto: "FAKE-CANC-01",
          mensagemBruta: "Operacao ja baixada nao pode ser cancelada.",
          explicacao:
            "Esta operação já teve baixa, e operação baixada não se cancela — " +
            "o pagamento do frete já foi encerrado. Se houve erro, o acerto " +
            "precisa ser feito com a instituição de pagamento.",
          corrigivelPeloUsuario: false,
        },
      };
    }
    if (chave) this.gerados.set(chave, { ...ciot, status: "cancelado" });
    return { ok: true, valor: { canceladoEm: EPOCH_FAKE + 3_600_000 } };
  }

  async darBaixa(
    entrada: BaixaCiotEntrada,
  ): Promise<ResultadoCiot<{ baixadoEm: number; saldoRestanteCentavos: number }>> {
    const chave = this.porNumero.get(entrada.numeroCiot);
    const ciot = chave ? this.gerados.get(chave) : undefined;
    if (!ciot) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "CIOT não encontrado.",
        },
      };
    }
    if (ciot.status === "cancelado") {
      return {
        ok: false,
        erro: {
          tipo: "recusa_instituicao",
          codigoBruto: "FAKE-BAIXA-01",
          mensagemBruta: "Operacao cancelada nao aceita baixa.",
          explicacao:
            "Esta operação foi cancelada, então não há o que baixar. Se a " +
            "viagem aconteceu mesmo assim, será preciso gerar um novo CIOT.",
          corrigivelPeloUsuario: false,
        },
      };
    }

    const jaBaixado = this.baixado.get(entrada.numeroCiot) ?? 0;
    const valor = entrada.valorBaixadoCentavos ?? ciot.valorFreteCentavos - jaBaixado;
    const total = jaBaixado + valor;
    if (total > ciot.valorFreteCentavos) {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [
            {
              campo: "valorBaixadoCentavos",
              mensagem: `Baixa de ${formatBRL(valor)} excede o saldo de ${formatBRL(ciot.valorFreteCentavos - jaBaixado)}.`,
            },
          ],
        },
      };
    }

    this.baixado.set(entrada.numeroCiot, total);
    const saldo = ciot.valorFreteCentavos - total;
    if (saldo === 0 && chave) this.gerados.set(chave, { ...ciot, status: "baixado" });
    return {
      ok: true,
      valor: { baixadoEm: EPOCH_FAKE + 7_200_000, saldoRestanteCentavos: saldo },
    };
  }

  async consultarCiot(entrada: {
    orgId: string;
    numeroCiot?: string;
    chave?: ChaveCiot;
  }): Promise<ResultadoCiot<Ciot>> {
    const chave = entrada.chave
      ? chaveCiot(entrada.chave)
      : entrada.numeroCiot
        ? this.porNumero.get(entrada.numeroCiot)
        : undefined;
    const ciot = chave ? this.gerados.get(chave) : undefined;
    if (!ciot) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "CIOT não encontrado.",
        },
      };
    }
    return { ok: true, valor: ciot };
  }

  reset(): void {
    this.gerados.clear();
    this.porNumero.clear();
    this.baixado.clear();
  }
}
