// ============================================================================
// FakeFiscalProvider — implementação determinística de FiscalProvider.
//
// Existe para destravar frontend, testes e fixtures AGORA, sem esperar a
// decisão comercial nem credenciais de homologação. É a razão de os ADRs 0003 e
// 0006 poderem ficar em "Proposta" sem parar o resto do time.
//
// Determinístico de verdade: sem Date.now(), sem Math.random(), sem UUID. Tudo
// deriva da entrada. O mesmo caso de teste produz o mesmo byte, sempre — então
// snapshot de UI não pisca e teste não fica flaky.
//
// Cobre o caminho feliz e as seis rejeições das fixtures: 698, 301, 302, 524,
// 626, 686. Cada uma devolve OS DOIS TEXTOS (ver ./rejeicoes.ts).
// ============================================================================

import type { Documento, EventoFiscal, ModeloFiscal, Org } from "@ai4l/core";
import {
  chaveIdempotencia,
  type CancelarEntrada,
  type CapacidadesFiscais,
  type CartaCorrecaoEntrada,
  type ComprovanteEntregaEntrada,
  type ConsultarEntrada,
  type EmissaoAceita,
  type EmitirCteEntrada,
  type EmitirMdfeEntrada,
  type EncerrarMdfeEntrada,
  type EventoAceito,
  type FiscalProvider,
  type IdempotencyKey,
  type Resultado,
  type WebhookBruto,
  type WebhookInterpretado,
} from "../provider";
import { buscarRejeicao, comoErro, type CodigoFixture } from "./rejeicoes";

// ------------------------------------------------------------- Determinismo

/** FNV-1a 32 bits. Estável entre execuções e entre máquinas. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Dígito verificador módulo 11 da chave de acesso (43 dígitos + DV). */
function digitoVerificador(base43: string): string {
  let soma = 0;
  // Pesos 2..9, ciclicamente, da direita para a esquerda. Calculados em vez de
  // lidos de um array: `noUncheckedIndexedAccess` torna todo índice
  // `T | undefined`, e aqui não há índice que possa faltar.
  for (let i = base43.length - 1, p = 0; i >= 0; i--, p++) {
    soma += Number(base43[i]) * ((p % 8) + 2);
  }
  const resto = soma % 11;
  const dv = 11 - resto;
  return dv >= 10 ? "0" : String(dv);
}

/** Chave de acesso de 44 dígitos, válida no DV, derivada da entrada. */
export function chaveAcessoFake(chave: IdempotencyKey, modelo: ModeloFiscal): string {
  const semente = hash32(`${chaveIdempotencia(chave)}|${modelo}`);
  let base = "";
  let x = semente;
  while (base.length < 41) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    base += String(x % 10);
  }
  const base43 = `${String(modelo).padStart(2, "0")}${base}`.slice(0, 43);
  return base43 + digitoVerificador(base43);
}

/** Relógio fixo: 2026-01-15T12:00:00Z. Nunca Date.now(). */
export const EPOCH_FAKE = 1_768_478_400_000;

function instante(chave: IdempotencyKey, passo: number): number {
  return EPOCH_FAKE + (hash32(chaveIdempotencia(chave)) % 60_000) + passo * 1000;
}

// ------------------------------------------------------------------ Cenários

/**
 * Como a fixture pede uma rejeição.
 *
 * Duas formas, as duas determinísticas:
 *  1. `cenarios` no construtor: viagemId -> código. Explícito, para teste.
 *  2. Convenção no `Viagem.numero`: sufixo `-REJ-<codigo>`. Serve para o
 *     frontend criar o caso sem tocar na configuração do provider.
 *
 * Sem nenhum dos dois, é caminho feliz.
 */
export type CenariosFake = Readonly<Record<string, CodigoFixture>>;

const PADRAO_NUMERO = /-REJ-(\d{3})$/;

// ---------------------------------------------------------------- Provider

export class FakeFiscalProvider implements FiscalProvider {
  readonly capacidades: CapacidadesFiscais = {
    provedor: "fake",
    cteOs: true,
    cteSimplificado: true,
    cartaCorrecao: true,
    // Espelha a Focus NFe de propósito: false. Se o fake dissesse `true`, a UI
    // seria construída sobre uma capacidade que o provedor escolhido não tem,
    // e a lacuna só apareceria em produção. Ver ADR 0003 §2.3.
    comprovanteEntrega: false,
    insucessoEntrega: false,
    inclusaoDfe: true,
    inclusaoCondutor: true,
    encerramentoMdfe: true,
    webhooks: true,
    cadastroCertificadoPorApi: true,
    emissaoAssincrona: true,
  };

  /** Estado em memória. Idempotência de verdade, não simulada. */
  private readonly emitidos = new Map<string, Documento>();
  private readonly porChaveAcesso = new Map<string, string>();
  private readonly eventos = new Map<string, EventoFiscal[]>();

  constructor(private readonly cenarios: CenariosFake = {}) {}

  // ---- Onboarding -----------------------------------------------------

  async cadastrarEmpresa(entrada: {
    org: Org;
    certificadoPfxBase64: string;
    senhaCertificado: string;
  }): Promise<Resultado<{ provedorEmpresaId: string; validoAte: number }>> {
    if (!entrada.certificadoPfxBase64 || !entrada.senhaCertificado) {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [
            {
              campo: "certificadoPfxBase64",
              mensagem: "Envie o arquivo do certificado A1 (.pfx) e a senha dele.",
            },
          ],
        },
      };
    }
    return {
      ok: true,
      valor: {
        provedorEmpresaId: `fake-emp-${hash32(entrada.org.cnpj)}`,
        // Um ano do relógio fixo.
        validoAte: EPOCH_FAKE + 365 * 24 * 60 * 60 * 1000,
      },
    };
  }

  // ---- Emissão --------------------------------------------------------

  async emitirCte(entrada: EmitirCteEntrada): Promise<Resultado<EmissaoAceita>> {
    return this.emitir(entrada, 57);
  }

  async emitirMdfe(entrada: EmitirMdfeEntrada): Promise<Resultado<EmissaoAceita>> {
    return this.emitir(entrada, 58);
  }

  private async emitir(
    entrada: EmitirCteEntrada | EmitirMdfeEntrada,
    modelo: ModeloFiscal,
  ): Promise<Resultado<EmissaoAceita>> {
    const chave = chaveIdempotencia(entrada.chave);

    // 1. Idempotência primeiro, antes de qualquer outra coisa. Um retry de rede
    //    NUNCA pode produzir um segundo documento fiscal.
    const existente = this.emitidos.get(chave);
    if (existente) {
      return { ok: false, erro: { tipo: "ja_emitido", chave, documento: existente } };
    }

    // 2. Validação local: o erro mais barato do sistema.
    const problemas = this.validar(entrada, modelo);
    if (problemas.length > 0) {
      return { ok: false, erro: { tipo: "validacao", problemas } };
    }

    // 3. Cenário de rejeição pedido pela fixture.
    const codigo = this.cenarioPara(entrada);
    if (codigo) {
      const alvo =
        buscarRejeicao(modelo, codigo) ??
        buscarRejeicao(57, codigo) ??
        buscarRejeicao(58, codigo);
      if (alvo) {
        const chaveAcesso = chaveAcessoFake(entrada.chave, modelo);
        const erro = comoErro(alvo, chaveAcesso);

        // Denegação queima a numeração: registramos o documento como denegado,
        // porque ele EXISTE e não pode ser reemitido com o mesmo número.
        if (erro.tipo === "denegacao") {
          const doc: Documento = {
            id: `fake-doc-${hash32(chave)}`,
            tipo: modelo === 57 ? "cte" : "mdfe",
            status: "denegado",
            chaveAcesso,
            codigoRejeicao: erro.codigo,
            mensagemRejeicao: erro.mensagem,
            explicacao: erro.explicacao,
          };
          this.emitidos.set(chave, doc);
          this.porChaveAcesso.set(chaveAcesso, chave);
        }
        return { ok: false, erro };
      }
    }

    // 4. Caminho feliz. Emissão é ASSÍNCRONA: sai 'enviando', não 'autorizado'.
    const chaveAcesso = chaveAcessoFake(entrada.chave, modelo);
    const numero = String((hash32(chave) % 899_999) + 100_000);
    const documento: Documento = {
      id: `fake-doc-${hash32(chave)}`,
      tipo: modelo === 57 ? "cte" : "mdfe",
      status: "enviando",
      numero,
      serie: "1",
      chaveAcesso,
      ...(modelo === 58 && "parUf" in entrada ? { parUf: entrada.parUf } : {}),
      ...(modelo === 58 && "ciot" in entrada ? { temCiot: Boolean(entrada.ciot) } : {}),
    };
    this.emitidos.set(chave, documento);
    this.porChaveAcesso.set(chaveAcesso, chave);

    return {
      ok: true,
      valor: { chave, documento, status: "enviando", pendente: true },
    };
  }

  private cenarioPara(
    entrada: EmitirCteEntrada | EmitirMdfeEntrada,
  ): CodigoFixture | undefined {
    const explicito = this.cenarios[entrada.chave.viagemId];
    if (explicito) return explicito;
    const m = PADRAO_NUMERO.exec(entrada.viagem?.numero ?? "");
    return (m?.[1] as CodigoFixture | undefined) ?? undefined;
  }

  private validar(
    entrada: EmitirCteEntrada | EmitirMdfeEntrada,
    modelo: ModeloFiscal,
  ): { campo: string; mensagem: string; rejeicaoAntecipada?: string }[] {
    const p: { campo: string; mensagem: string; rejeicaoAntecipada?: string }[] = [];
    if (entrada.chave.tentativa < 1) {
      p.push({ campo: "chave.tentativa", mensagem: "tentativa deve ser >= 1." });
    }
    if (modelo === 57) {
      const e = entrada as EmitirCteEntrada;
      for (const k of e.chavesNfe ?? []) {
        if (!/^\d{44}$/.test(k)) {
          p.push({
            campo: "chavesNfe",
            mensagem: `Chave de NF-e deve ter 44 dígitos. Recebido: ${k.length}.`,
            rejeicaoAntecipada: "626",
          });
        }
      }
    }
    if (modelo === 58) {
      const e = entrada as EmitirMdfeEntrada;
      if (!e.seguros || e.seguros.length === 0) {
        p.push({
          campo: "seguros",
          mensagem: "Informe o seguro da carga antes de emitir o MDF-e.",
          rejeicaoAntecipada: "698",
        });
      }
    }
    return p;
  }

  // ---- Consulta -------------------------------------------------------

  async consultar(entrada: ConsultarEntrada): Promise<Resultado<Documento>> {
    const doc = this.localizar(entrada);
    if (!doc) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "Documento não encontrado no fake.",
        },
      };
    }
    // Reconciliação: o que saiu 'enviando' resolve para 'autorizado' na
    // primeira consulta. É o comportamento que o produto precisa exercitar.
    if (doc.status === "enviando") {
      const resolvido: Documento = {
        ...doc,
        status: "autorizado",
        protocolo: `135${hash32(doc.chaveAcesso ?? doc.id)}`.slice(0, 15),
        autorizadoEm: EPOCH_FAKE + 30_000,
      };
      const chave = this.porChaveAcesso.get(doc.chaveAcesso ?? "");
      if (chave) this.emitidos.set(chave, resolvido);
      return { ok: true, valor: resolvido };
    }
    return { ok: true, valor: doc };
  }

  async baixarXml(entrada: ConsultarEntrada): Promise<Resultado<{ xmlKey: string }>> {
    const doc = this.localizar(entrada);
    if (!doc?.chaveAcesso) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "Sem XML.",
        },
      };
    }
    return { ok: true, valor: { xmlKey: `fake/xml/${doc.chaveAcesso}.xml` } };
  }

  private localizar(entrada: ConsultarEntrada): Documento | undefined {
    if (entrada.chave) return this.emitidos.get(chaveIdempotencia(entrada.chave));
    if (entrada.chaveAcesso) {
      const k = this.porChaveAcesso.get(entrada.chaveAcesso);
      return k ? this.emitidos.get(k) : undefined;
    }
    return undefined;
  }

  // ---- Eventos --------------------------------------------------------

  async cancelar(entrada: CancelarEntrada): Promise<Resultado<EventoAceito>> {
    if (entrada.justificativa.trim().length < 15) {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [
            {
              campo: "justificativa",
              mensagem: "A justificativa precisa ter no mínimo 15 caracteres.",
            },
          ],
        },
      };
    }
    const doc = this.localizar({
      orgId: entrada.orgId,
      chaveAcesso: entrada.chaveAcesso,
    });
    if (doc?.status === "denegado") {
      const alvo = buscarRejeicao(57, "302");
      return {
        ok: false,
        erro: {
          tipo: "rejeicao",
          codigo: "304",
          mensagem: "Rejeicao: Documento denegado nao pode ser cancelado",
          explicacao:
            "Este documento foi denegado, e documento denegado não se cancela — " +
            "o número já está queimado no sistema da SEFAZ. Não há ação a tomar " +
            "aqui: siga para o próximo número. " +
            (alvo
              ? "O motivo original foi: " + alvo.explicacao.split(".")[1]?.trim()
              : ""),
          modelo: entrada.modelo,
          corrigivel: false,
        },
      };
    }
    return this.registrarEvento(
      entrada.orgId,
      entrada.chaveAcesso,
      entrada.modelo,
      "110111",
      "Cancelamento",
    );
  }

  async encerrarMdfe(entrada: EncerrarMdfeEntrada): Promise<Resultado<EventoAceito>> {
    return this.registrarEvento(
      entrada.orgId,
      entrada.chaveAcesso,
      58,
      "110112",
      "Encerramento",
      {
        uf: entrada.ufEncerramento,
        municipio: entrada.municipioEncerramento,
      },
    );
  }

  async cartaCorrecao(entrada: CartaCorrecaoEntrada): Promise<Resultado<EventoAceito>> {
    return this.registrarEvento(
      entrada.orgId,
      entrada.chaveAcesso,
      57,
      "110110",
      "Carta de Correcao",
    );
  }

  async comprovanteEntrega(
    _entrada: ComprovanteEntregaEntrada,
  ): Promise<Resultado<EventoAceito>> {
    // Espelha a lacuna real da Focus NFe. Ver ADR 0003 §2.3 e §4.2.
    return {
      ok: false,
      erro: {
        tipo: "nao_suportado",
        operacao: "comprovanteEntrega",
        provedor: "fake",
        detalhe:
          "Comprovante de entrega eletrônico (110180) não é exposto por este " +
          "provedor. Verifique capacidades.comprovanteEntrega antes de chamar.",
      },
    };
  }

  private async registrarEvento(
    _orgId: string,
    chaveAcesso: string,
    modelo: ModeloFiscal,
    codigo: string,
    nome: string,
    detalhe?: Record<string, string>,
  ): Promise<Resultado<EventoAceito>> {
    const chave = this.porChaveAcesso.get(chaveAcesso);
    const doc = chave ? this.emitidos.get(chave) : undefined;
    if (!doc) {
      return {
        ok: false,
        erro: {
          tipo: "rede",
          seguroRetentar: true,
          statusHttp: 404,
          detalhe: "Documento inexistente.",
        },
      };
    }

    const anteriores = this.eventos.get(chaveAcesso) ?? [];
    if (anteriores.some((e) => e.codigo === codigo)) {
      return {
        ok: false,
        erro: {
          tipo: "rejeicao",
          codigo: "573",
          mensagem: "Rejeicao: Duplicidade de evento",
          explicacao: `Este documento já tem o evento "${nome}" registrado. Não é preciso enviar de novo.`,
          modelo,
          corrigivel: false,
        },
      };
    }

    const evento: EventoFiscal = {
      id: `fake-ev-${hash32(`${chaveAcesso}${codigo}`)}`,
      documentoId: doc.id,
      modelo,
      codigo,
      nome,
      autor: "emitente",
      ocorridoEm: instante(
        { orgId: "", viagemId: chaveAcesso, tipo: "mdfe", tentativa: 1 },
        anteriores.length,
      ),
      protocolo: `135${hash32(`${chaveAcesso}${codigo}`)}`.slice(0, 15),
      // Chave OMITIDA quando não há detalhe: `exactOptionalPropertyTypes` do
      // tsconfig da raiz distingue ausente de presente-e-undefined.
      ...(detalhe ? { detalhe: JSON.stringify(detalhe) } : {}),
    };
    this.eventos.set(chaveAcesso, [...anteriores, evento]);

    if (chave) {
      const novo: Documento =
        codigo === "110112"
          ? { ...doc, status: "encerrado", encerradoEm: evento.ocorridoEm }
          : codigo === "110111"
            ? { ...doc, status: "cancelado" }
            : doc;
      this.emitidos.set(chave, novo);
    }

    return {
      ok: true,
      valor: { evento, ...(evento.protocolo ? { protocolo: evento.protocolo } : {}) },
    };
  }

  // ---- Webhook --------------------------------------------------------

  async interpretarWebhook(bruto: WebhookBruto): Promise<Resultado<WebhookInterpretado>> {
    const corpo = bruto.corpo as Record<string, unknown> | null;
    if (!corpo || typeof corpo !== "object") {
      return {
        ok: false,
        erro: {
          tipo: "validacao",
          problemas: [{ campo: "corpo", mensagem: "Corpo de webhook inválido." }],
        },
      };
    }
    const chaveAcesso = typeof corpo.chave === "string" ? corpo.chave : undefined;
    const modelo: ModeloFiscal = corpo.modelo === 58 ? 58 : 57;
    const doc = chaveAcesso ? this.localizar({ orgId: "", chaveAcesso }) : undefined;
    return {
      ok: true,
      valor: {
        ...(chaveAcesso ? { chaveAcesso } : {}),
        modelo,
        status: doc?.status ?? "enviando",
        tentativaEntrega: Number(bruto.cabecalhos["x-tentativa"] ?? "1"),
      },
    };
  }

  async solicitarReenvioWebhook(
    _entrada: ConsultarEntrada,
  ): Promise<Resultado<{ solicitado: true }>> {
    return { ok: true, valor: { solicitado: true } };
  }

  // ---- Utilidade de teste ---------------------------------------------

  /** Limpa o estado. Para `beforeEach`. */
  reset(): void {
    this.emitidos.clear();
    this.porChaveAcesso.clear();
    this.eventos.clear();
  }

  eventosDe(chaveAcesso: string): readonly EventoFiscal[] {
    return this.eventos.get(chaveAcesso) ?? [];
  }
}
