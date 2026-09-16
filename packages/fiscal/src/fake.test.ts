/**
 * These are the original FakeProvider cases from the scaffold, re-pointed at
 * FakeFiscalProvider. The interface underneath them changed on purpose: the old
 * one was written before reading any provider's API docs, the new one after
 * reading Focus NFe's and Webmania's (ADR 0003). Where a case no longer means
 * what it used to, the comment above it says what changed and why. Nothing was
 * deleted.
 */
import { describe, expect, it } from "vitest";
import type { Org, Viagem } from "@ai4l/core";
import { FakeFiscalProvider } from "./fake";
import {
  chaveIdempotencia,
  type EmitirMdfeEntrada,
  type IdempotencyKey,
} from "./provider";

const org: Org = {
  id: "1",
  nome: "Transportadora Teste Ltda",
  cnpj: "12345678000190",
  uf: "GO",
  regimeTributario: "simples_nacional",
  crt: 1,
  rntrc: "12345678",
  rntrcStatus: "ativo",
  certificadoA1: { validoAte: 4_102_444_800_000 },
};

const viagem: Viagem = {
  id: "42",
  orgId: "1",
  numero: "V-0042",
  status: "pronta",
  origem: { municipio: "Goiânia", uf: "GO" },
  destino: { municipio: "São Paulo", uf: "SP" },
  ufsPercurso: ["MG"],
  tomador: {
    nome: "Tomador SA",
    cnpjCpf: "22345678000190",
    local: { municipio: "São Paulo", uf: "SP" },
  },
  remetente: {
    nome: "Remetente SA",
    cnpjCpf: "32345678000190",
    local: { municipio: "Goiânia", uf: "GO" },
  },
  destinatario: {
    nome: "Destino SA",
    cnpjCpf: "42345678000190",
    local: { municipio: "São Paulo", uf: "SP" },
  },
  veiculo: { placa: "ABC1D23" },
  motorista: { nome: "João Motorista", cpf: "12345678909" },
  carga: { produtoPredominante: "Carga geral", pesoKg: 12000, valorCentavos: 5_000_000 },
  valorFreteCentavos: 842_000,
  documentos: [],
  eventos: [],
  criadaEm: 1_768_000_000_000,
  atualizadaEm: 1_768_000_000_000,
};

const chave = (over: Partial<IdempotencyKey> = {}): IdempotencyKey => ({
  orgId: "1",
  viagemId: "42",
  tipo: "mdfe",
  tentativa: 1,
  ...over,
});

/** MDF-e because it is the document this product exists for. Seguro is required. */
const req = (over: Partial<EmitirMdfeEntrada> = {}): EmitirMdfeEntrada => ({
  chave: chave(),
  org,
  viagem,
  ambiente: "homologacao",
  chavesDocumentos: ["35260912345678000190570010000010011000010012"],
  parUf: { carregamento: "GO", descarregamento: "SP" },
  seguros: [
    {
      responsavel: "emitente",
      cnpjSeguradora: "52345678000190",
      nomeSeguradora: "Seguradora SA",
      apolice: "AP-1",
      averbacoes: ["AV-1"],
    },
  ],
  ...over,
});

describe("FakeFiscalProvider", () => {
  /**
   * WAS: "authorizes by default". It cannot be, any more, and that is the point.
   * Focus NFe pre-validates synchronously and queues to SEFAZ, so no emission
   * call can promise authorisation in its own return value. A provider that
   * returned "authorized" here would have taught the whole product a lie. The
   * emission is ACCEPTED and pending; `consultar` is what reconciles it.
   */
  it("accepts by default, asynchronously, and reconciles to authorised", async () => {
    const p = new FakeFiscalProvider();
    const r = await p.emitirMdfe(req());
    if (!r.ok) throw new Error(`expected acceptance, got ${r.erro.tipo}`);
    expect(r.valor.status).toBe("enviando");
    expect(r.valor.pendente).toBe(true);

    const c = await p.consultar({ orgId: "1", chave: chave() });
    if (!c.ok) throw new Error("expected the document to be found");
    expect(c.valor.status).toBe("autorizado");
  });

  /**
   * WAS: "never emits twice for the same idempotency key", which returned the
   * prior result as a success. The new model says so explicitly instead of
   * silently: `ja_emitido` carries the existing document, and the caller is told
   * to treat it as success. Same guarantee, now legible at the call site.
   */
  it("never emits twice for the same idempotency key", async () => {
    const p = new FakeFiscalProvider();
    const a = await p.emitirMdfe(req());
    if (!a.ok) throw new Error("first emission should be accepted");

    const b = await p.emitirMdfe(req());
    expect(b.ok).toBe(false);
    if (b.ok) throw new Error("unreachable");
    expect(b.erro.tipo).toBe("ja_emitido");
    if (b.erro.tipo !== "ja_emitido") throw new Error("unreachable");
    expect(b.erro.chave).toBe(chaveIdempotencia(chave()));
    expect(b.erro.documento.id).toBe(a.valor.documento.id);
  });

  it("treats a different attempt group as a new emission", async () => {
    const p = new FakeFiscalProvider();
    const a = await p.emitirMdfe(req());
    const b = await p.emitirMdfe(req({ chave: chave({ tentativa: 2 }) }));
    if (!a.ok || !b.ok) throw new Error("both attempt groups should be accepted");
    expect(a.valor.documento.chaveAcesso).not.toBe(b.valor.documento.chaveAcesso);
  });

  /**
   * The rule survived the interface change intact, and got stricter: the two
   * texts are no longer optional fields on a rejection, they are required by the
   * RejeicaoSefaz type. `mensagem` is the raw SEFAZ text for the accountant,
   * `explicacao` is for the owner who does not know what a CFOP is.
   */
  it("produces an owner-facing message that is not the raw SEFAZ text", async () => {
    const p = new FakeFiscalProvider({ "42": "698" });
    const r = await p.emitirMdfe(req());
    if (r.ok) throw new Error("expected a rejection");
    if (r.erro.tipo !== "rejeicao" && r.erro.tipo !== "denegacao") {
      throw new Error(`expected a SEFAZ refusal, got ${r.erro.tipo}`);
    }
    expect(r.erro.explicacao).not.toBe(r.erro.mensagem);
    expect(r.erro.mensagem).toMatch(/Rejeicao|Rejeição/i);
    expect(r.erro.explicacao.length).toBeGreaterThan(20);
    expect(r.erro.modelo).toBe(58);
  });

  /**
   * WAS: "is deterministic for a given seed". There is no seed any more, because
   * there is no randomness left to seed: the old fake rolled a PRNG to decide
   * rejections and called Date.now(), so determinism was a setting. The new one
   * derives everything from the input, so determinism is unconditional. The
   * assertion is therefore stronger than the one it replaces: two independent
   * providers produce the same bytes, not merely the same status.
   */
  it("is deterministic without needing a seed", async () => {
    const one = await new FakeFiscalProvider().emitirMdfe(req());
    const two = await new FakeFiscalProvider().emitirMdfe(req());
    expect(one).toEqual(two);
    if (!one.ok) throw new Error("expected acceptance");
    expect(one.valor.documento.chaveAcesso).toMatch(/^\d{44}$/);
  });

  /**
   * WAS: "refuses to close a document that is not authorized", where the guard
   * lived inside the provider and threw. The guard moved, on purpose, to
   * `podeEncerrarMdfe` in @ai4l/core: it is a domain rule, the UI has to be able
   * to ask it BEFORE offering the button, and a rule that only exists inside a
   * provider cannot be asked. So this case is now split in two:
   *
   *  - the provider refuses to file an event against a document it never issued;
   *  - the domain guard is what refuses closure of a not-yet-authorised one.
   *
   * KNOWN GAP, left as it is rather than patched here: the fake does not itself
   * re-check the document's status inside encerrarMdfe, so a caller that skips
   * podeEncerrarMdfe can file 110112 against a document still in `enviando`.
   * A real provider would be refused by SEFAZ. Worth closing in the adapter work
   * for ADR 0003; changing the fake's behaviour was out of scope for this merge.
   */
  it("refuses to file a closure against a document it never issued", async () => {
    const p = new FakeFiscalProvider();
    const r = await p.encerrarMdfe({
      orgId: "1",
      chaveAcesso: "35260912345678000190580010000010011000010019",
      encerradoEm: 1_768_500_000_000,
      ufEncerramento: "SP",
      municipioEncerramento: "São Paulo",
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.erro.tipo).toBe("rede");
  });

  it("refuses to close a document that is not authorized (domain guard)", async () => {
    const { podeEncerrarMdfe } = await import("@ai4l/core");
    const p = new FakeFiscalProvider();
    const r = await p.emitirMdfe(req());
    if (!r.ok) throw new Error("expected acceptance");
    const guarda = podeEncerrarMdfe(viagem, r.valor.documento);
    expect(guarda.permitido).toBe(false);
    if (guarda.permitido) throw new Error("unreachable");
    expect(guarda.motivo).toMatch(/autoriza/i);
  });

  /** The closure event itself, once the document really is authorised. */
  it("files evento 110112 and marks the manifest encerrado", async () => {
    const p = new FakeFiscalProvider();
    const r = await p.emitirMdfe(req());
    if (!r.ok) throw new Error("expected acceptance");
    const autorizado = await p.consultar({ orgId: "1", chave: chave() });
    if (!autorizado.ok) throw new Error("expected the document to be found");

    const chaveAcesso = autorizado.valor.chaveAcesso!;
    const ev = await p.encerrarMdfe({
      orgId: "1",
      chaveAcesso,
      encerradoEm: 1_768_500_000_000,
      ufEncerramento: "SP",
      municipioEncerramento: "São Paulo",
    });
    if (!ev.ok)
      throw new Error(`expected the closure to be accepted, got ${ev.erro.tipo}`);
    expect(ev.valor.evento.codigo).toBe("110112");

    const depois = await p.consultar({ orgId: "1", chaveAcesso });
    if (!depois.ok) throw new Error("expected the document to be found");
    expect(depois.valor.status).toBe("encerrado");
  });
});
