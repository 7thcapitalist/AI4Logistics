// ============================================================================
// Guardas nos limites exatos.
//
// Cada limite é testado dos dois lados. Um teste que só bate no meio da faixa
// não prova nada: o bug de prazo fiscal mora sempre no `>` que devia ser `>=`.
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  podeCancelarCte,
  podeCancelarMdfe,
  bloqueiosDeEmissaoMdfe,
  podeEmitirMdfe,
  cnpjBase,
  podeEncerrarMdfe,
} from "../guardas";
import { BLOQUEIO_ROTA_CURTA_DIAS, LIMIAR_BLOQUEIO_CNPJ_DIAS } from "../prazos";
import {
  FALLBACK_CANCELAMENTO_CTE,
  JANELA_CANCELAMENTO_CTE_HORAS,
  JANELA_CANCELAMENTO_MDFE,
} from "../prazos";
import type { Guarda, UF } from "../tipos";
import {
  AGORA,
  cte,
  documento,
  eventoCartaCorrecao,
  eventoComprovanteEntrega,
  horasAtras,
  mdfe,
  viagem,
  viagemEm,
} from "./fabrica";

/** Estreita a Guarda negada para podermos ler `motivo` e `fonte`. */
function negada(g: Guarda) {
  expect(g.permitido).toBe(false);
  if (g.permitido) throw new Error("esperava guarda negada");
  return g;
}

// ============================================================================
describe("podeCancelarMdfe — limite de 24h", () => {
  it("o parâmetro de 24h é o que o teste usa; ninguém hardcoda 24 aqui", () => {
    expect(JANELA_CANCELAMENTO_MDFE.valor).toBe(24);
    expect(JANELA_CANCELAMENTO_MDFE.fonte.confianca).toBe("oficial");
  });

  it("autorizado há 23h59 — dentro da janela, permitido", () => {
    const doc = mdfe(0, { autorizadoEm: horasAtras(23 + 59 / 60) });
    const v = viagem({ documentos: [doc] });
    expect(podeCancelarMdfe(v, doc, AGORA)).toEqual({ permitido: true });
  });

  it("autorizado exatamente há 24h — ainda permitido (o corte é `>`)", () => {
    const doc = mdfe(0, { autorizadoEm: horasAtras(JANELA_CANCELAMENTO_MDFE.valor) });
    const v = viagem({ documentos: [doc] });
    expect(podeCancelarMdfe(v, doc, AGORA).permitido).toBe(true);
  });

  it("autorizado há 24h01 — negado, e o motivo cita as 24h", () => {
    const doc = mdfe(0, { autorizadoEm: horasAtras(24 + 1 / 60) });
    const v = viagem({ documentos: [doc] });
    const g = negada(podeCancelarMdfe(v, doc, AGORA));
    expect(g.motivo).toContain("24h");
    expect(g.motivo).toMatch(/Liberação de Prazo de Cancelamento/i);
    expect(g.fonte).toEqual(JANELA_CANCELAMENTO_MDFE.fonte);
  });

  it("MDF-e já encerrado — motivo próprio, não o genérico de estado final", () => {
    const doc = mdfe(0, { status: "encerrado" });
    const g = negada(podeCancelarMdfe(viagem({ documentos: [doc] }), doc, AGORA));
    expect(g.motivo).toMatch(/Encerrar e cancelar são coisas diferentes/i);
  });

  it("viagem já iniciada — negado por fato gerador, não por relógio", () => {
    const doc = mdfe(0, { autorizadoEm: horasAtras(2) });
    const v = viagem({
      documentos: [doc],
      iniciadaEm: horasAtras(1),
      status: "em_transito",
    });
    const g = negada(podeCancelarMdfe(v, doc, AGORA));
    expect(g.motivo).toMatch(/transporte já iniciou/i);
    expect(g.motivo).not.toContain("24h");
  });

  it("documento que não é MDF-e é recusado com motivo próprio", () => {
    const doc = cte(1);
    const g = negada(podeCancelarMdfe(viagem({ documentos: [doc] }), doc, AGORA));
    expect(g.motivo).toMatch(/não é um MDF-e/i);
  });
});

// ============================================================================
describe("podeCancelarCte — janela por UF", () => {
  const janelaSp = JANELA_CANCELAMENTO_CTE_HORAS.SP!;

  it("SP está na tabela com fonte oficial; GO deliberadamente não está", () => {
    expect(janelaSp.valor).toBe(744);
    expect(janelaSp.fonte.confianca).toBe("oficial");
    expect(JANELA_CANCELAMENTO_CTE_HORAS.GO).toBeUndefined();
  });

  it("SP, autorizado há 743h — dentro da janela de 744h, permitido", () => {
    const doc = cte(743);
    const v = viagemEm("SP", { documentos: [doc] });
    expect(podeCancelarCte(v, doc, AGORA)).toEqual({ permitido: true });
  });

  it("SP, autorizado há 745h — negado citando a janela de SP", () => {
    const doc = cte(745);
    const v = viagemEm("SP", { documentos: [doc] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toContain("SP");
    expect(g.motivo).toContain(`${janelaSp.valor}h`);
    expect(g.motivo).toContain("31 dias");
    expect(g.fonte).toEqual(janelaSp.fonte);
    expect(g.fonte.confianca).toBe("oficial");
  });

  it("GO não está na tabela: cai no fallback de 168h", () => {
    const doc = cte(167);
    const v = viagemEm("GO", { documentos: [doc] });
    expect(podeCancelarCte(v, doc, AGORA).permitido).toBe(true);

    const fora = cte(169);
    const v2 = viagemEm("GO", { documentos: [fora] });
    const g = negada(podeCancelarCte(v2, fora, AGORA));
    expect(g.motivo).toContain("168h");
    expect(g.motivo).toContain("GO");
  });

  it("GO: a fonte devolvida tem confianca `verificar` — o produto NÃO afirma prazo de UF não lida", () => {
    const doc = cte(400);
    const v = viagemEm("GO", { documentos: [doc] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.fonte).toEqual(FALLBACK_CANCELAMENTO_CTE.fonte);
    expect(g.fonte.confianca).toBe("verificar");
    expect(g.fonte.descricao).toMatch(/não verificad/i);
  });

  it("a mesma idade de documento decide diferente em SP e em GO", () => {
    // 300h: dentro dos 744h de SP, fora dos 168h do fallback de GO.
    const emSp = cte(300);
    const emGo = cte(300);
    expect(
      podeCancelarCte(viagemEm("SP", { documentos: [emSp] }), emSp, AGORA).permitido,
    ).toBe(true);
    expect(
      podeCancelarCte(viagemEm("GO", { documentos: [emGo] }), emGo, AGORA).permitido,
    ).toBe(false);
  });
});

// ============================================================================
describe("podeCancelarCte — cada bloqueio tem a sua mensagem, nunca uma genérica", () => {
  it("MDF-e autorizado vinculado", () => {
    const doc = cte(1);
    const v = viagem({ documentos: [doc, mdfe(0, { status: "autorizado" })] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toMatch(/MDF-e autorizado vinculado/i);
    expect(g.fonte.descricao).toMatch(/MDF-e/);
  });

  it("MDF-e já encerrado também trava o cancelamento do CT-e", () => {
    const doc = cte(1);
    const v = viagem({ documentos: [doc, mdfe(0, { status: "encerrado" })] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toMatch(/manifesto/i);
  });

  it("evento 110180 (comprovante de entrega)", () => {
    const doc = cte(1);
    const v = viagem({ documentos: [doc], eventos: [eventoComprovanteEntrega()] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toMatch(/comprovante de entrega/i);
    expect(g.motivo).not.toMatch(/carta de correção/i);
  });

  it("evento 110110 (carta de correção)", () => {
    const doc = cte(1);
    const v = viagem({ documentos: [doc], eventos: [eventoCartaCorrecao()] });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toMatch(/carta de correção/i);
    expect(g.motivo).not.toMatch(/comprovante de entrega/i);
  });

  it("um evento 110110 de MDF-e (modelo 58) NÃO conta como carta de correção do CT-e", () => {
    const doc = cte(1);
    const v = viagem({
      documentos: [doc],
      eventos: [eventoCartaCorrecao({ modelo: 58 })],
    });
    expect(podeCancelarCte(v, doc, AGORA).permitido).toBe(true);
  });

  it("viagem já iniciada", () => {
    const doc = cte(1);
    const v = viagem({
      documentos: [doc],
      iniciadaEm: horasAtras(2),
      status: "em_transito",
    });
    const g = negada(podeCancelarCte(v, doc, AGORA));
    expect(g.motivo).toMatch(/viagem já começou/i);
    expect(g.motivo).toMatch(/substituição/i);
  });

  it("viagem com início agendado para o futuro ainda permite cancelar", () => {
    const doc = cte(1);
    const v = viagem({ documentos: [doc], iniciadaEm: AGORA + 60_000 });
    expect(podeCancelarCte(v, doc, AGORA).permitido).toBe(true);
  });

  it("documento denegado", () => {
    const doc = documento({ tipo: "cte", status: "denegado" });
    const g = negada(podeCancelarCte(viagem({ documentos: [doc] }), doc, AGORA));
    expect(g.motivo).toMatch(/denegado/i);
    expect(g.motivo).toMatch(/numeração/i);
    expect(g.fonte.confianca).toBe("verificar");
  });

  it("as cinco negativas produzem cinco motivos distintos entre si", () => {
    const motivos = [
      // MDF-e vinculado
      (() => {
        const d = cte(1);
        return negada(podeCancelarCte(viagem({ documentos: [d, mdfe(0)] }), d, AGORA))
          .motivo;
      })(),
      // 110180
      (() => {
        const d = cte(1);
        const v = viagem({ documentos: [d], eventos: [eventoComprovanteEntrega()] });
        return negada(podeCancelarCte(v, d, AGORA)).motivo;
      })(),
      // 110110
      (() => {
        const d = cte(1);
        const v = viagem({ documentos: [d], eventos: [eventoCartaCorrecao()] });
        return negada(podeCancelarCte(v, d, AGORA)).motivo;
      })(),
      // viagem iniciada
      (() => {
        const d = cte(1);
        const v = viagem({ documentos: [d], iniciadaEm: horasAtras(1) });
        return negada(podeCancelarCte(v, d, AGORA)).motivo;
      })(),
      // denegado
      (() => {
        const d = documento({ tipo: "cte", status: "denegado" });
        return negada(podeCancelarCte(viagem({ documentos: [d] }), d, AGORA)).motivo;
      })(),
    ];
    expect(new Set(motivos).size).toBe(5);
    for (const m of motivos) expect(m.length).toBeGreaterThan(20);
  });

  it("CT-e sem autorizadoEm não é negado por prazo (não há relógio a correr)", () => {
    const doc = documento({ tipo: "cte", status: "autorizado", autorizadoEm: undefined });
    expect(
      podeCancelarCte(viagemEm("SP", { documentos: [doc] }), doc, AGORA).permitido,
    ).toBe(true);
  });
});

// ============================================================================
describe("podeEncerrarMdfe — NENHUMA negativa pode ser por tempo", () => {
  // Não existe prazo regulamentar para encerrar MDF-e. A norma vincula o
  // encerramento a eventos (fim do percurso, transbordo, retenção), nunca a um
  // relógio. Uma guarda que negue "porque ainda não deu o prazo" — ou porque
  // "passou do prazo" — estaria inventando regra fiscal no painel do cliente.
  const idades = [
    { rotulo: "1 hora", ms: 1 * 3_600_000 },
    { rotulo: "1 dia", ms: 1 * 86_400_000 },
    { rotulo: "30 dias", ms: 30 * 86_400_000 },
    { rotulo: "400 dias", ms: 400 * 86_400_000 },
  ];

  for (const { rotulo, ms } of idades) {
    it(`MDF-e aberto há ${rotulo} — permitido encerrar`, () => {
      const doc = mdfe(0, { autorizadoEm: AGORA - ms });
      const v = viagem({
        documentos: [doc],
        status: "em_transito",
        iniciadaEm: AGORA - ms,
      });
      expect(podeEncerrarMdfe(v, doc)).toEqual({ permitido: true });
    });
  }

  it("nenhuma das idades produz negativa, e nenhum motivo fala em prazo", () => {
    const resultados = idades.map(({ ms }) => {
      const doc = mdfe(0, { autorizadoEm: AGORA - ms });
      const v = viagem({
        documentos: [doc],
        status: "em_transito",
        iniciadaEm: AGORA - ms,
      });
      return podeEncerrarMdfe(v, doc);
    });
    expect(resultados.every((r) => r.permitido)).toBe(true);
    for (const r of resultados) {
      if (!r.permitido) {
        throw new Error(`encerramento negado por tempo: ${r.motivo}`);
      }
    }
  });

  it('as negativas que existem são todas de estado, e a fonte diz "sem condição de tempo"', () => {
    const naoAutorizado = mdfe(0, { status: "pendente" });
    const g1 = negada(
      podeEncerrarMdfe(viagem({ documentos: [naoAutorizado] }), naoAutorizado),
    );
    expect(g1.motivo).toMatch(/autorizado/i);
    expect(g1.fonte.descricao).toMatch(/Sem condição de tempo/i);

    const jaEncerrado = mdfe(0, { status: "encerrado" });
    const g2 = negada(
      podeEncerrarMdfe(viagem({ documentos: [jaEncerrado] }), jaEncerrado),
    );
    expect(g2.motivo).toMatch(/já está encerrado/i);

    const doc = mdfe(0);
    const g3 = negada(
      podeEncerrarMdfe(viagem({ documentos: [doc], status: "cancelada" }), doc),
    );
    expect(g3.motivo).toMatch(/cancelada/i);

    const umCte = cte(1);
    const g4 = negada(podeEncerrarMdfe(viagem({ documentos: [umCte] }), umCte));
    expect(g4.motivo).toMatch(/CT-e não tem encerramento/i);

    for (const g of [g1, g2, g3, g4]) {
      expect(g.motivo).not.toMatch(/\b\d+\s*(h|horas|dias)\b/i);
      expect(g.motivo).not.toMatch(/prazo/i);
    }
  });

  it("a assinatura de podeEncerrarMdfe não recebe `agora` — não há relógio para receber", () => {
    expect(podeEncerrarMdfe.length).toBe(2);
  });
});

// ============================================================================
describe("bloqueiosDeEmissaoMdfe: quatro regras, não uma", () => {
  // VERIFICADO 16/09/2026: o MOC MDF-e 3.00b Anexo I tem QUATRO regras de
  // bloqueio, com chaves diferentes. O desenho antigo implementava uma só
  // ("mesmo par de UFs + mesma placa") e deixava três buracos.
  const pretendida = (
    over: Partial<Parameters<typeof bloqueiosDeEmissaoMdfe>[1]> = {},
  ) => ({
    placa: "ABC1D23",
    tpEmit: 1 as const,
    carregamento: "SP" as UF,
    descarregamento: "MG" as UF,
    ufsPercurso: ["SP", "MG"] as UF[],
    ...over,
  });

  const abertoHa = (
    numero: string,
    placa: string,
    par: { carregamento: UF; descarregamento: UF },
    diasAberto: number,
    over: { tpEmit?: 1 | 2 | 3; ufsPercurso?: UF[] } = {},
  ) =>
    viagem({
      numero,
      veiculo: { placa },
      ufsPercurso: over.ufsPercurso ?? [par.carregamento, par.descarregamento],
      documentos: [mdfe(diasAberto, { parUf: par, tpEmit: over.tpEmit ?? 1 })],
    });

  it("sem manifesto aberto, nada bloqueia", () => {
    expect(bloqueiosDeEmissaoMdfe([], pretendida(), AGORA)).toEqual([]);
  });

  it("F85: mesma placa e mesma UF de DESCARREGAMENTO bloqueia, mesmo com carregamento diferente", () => {
    // Este é o buraco nº 1 do desenho antigo: a UF de carregamento não entra
    // na regra imediata, então "par diferente" não salva.
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "GO", descarregamento: "MG" },
      1,
    );
    const bs = bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA);
    expect(bs.map((b) => b.regra)).toContain("F85");
    expect(bs[0]!.cStat).toBe("611");
  });

  it("F85 não bloqueia quando o tpEmit é diferente", () => {
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "SP", descarregamento: "MG" },
      1,
      {
        tpEmit: 2,
      },
    );
    const bs = bloqueiosDeEmissaoMdfe([v], pretendida({ tpEmit: 1 }), AGORA);
    expect(bs.filter((b) => b.regra === "F85")).toEqual([]);
  });

  it("F85 não bloqueia placa diferente", () => {
    const v = abertoHa(
      "V-1",
      "XYZ9K88",
      { carregamento: "SP", descarregamento: "MG" },
      1,
    );
    expect(
      bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA).filter((b) => b.regra === "F85"),
    ).toEqual([]);
  });

  it("F88: manifesto no sentido oposto trava a viagem de volta", () => {
    // Buraco nº 2: o motorista chega, não encerra, e o manifesto do retorno
    // não sai. Operacionalmente a regra mais perversa das quatro.
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "MG", descarregamento: "SP" },
      1,
    );
    const bs = bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA);
    expect(bs.map((b) => b.regra)).toContain("F88");
    expect(bs.find((b) => b.regra === "F88")!.cStat).toBe("662");
  });

  it("F87: rota curta bloqueia a placa em 5 dias, muito antes dos 30", () => {
    // Buraco nº 3, e provavelmente o alarme que mais dispara numa
    // transportadora regional de Goiás.
    const antes = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "GO", descarregamento: "GO" },
      BLOQUEIO_ROTA_CURTA_DIAS.valor - 1,
      { ufsPercurso: ["GO"] },
    );
    expect(
      bloqueiosDeEmissaoMdfe([antes], pretendida(), AGORA).filter(
        (b) => b.regra === "F87",
      ),
    ).toEqual([]);

    const depois = abertoHa(
      "V-2",
      "ABC1D23",
      { carregamento: "GO", descarregamento: "GO" },
      BLOQUEIO_ROTA_CURTA_DIAS.valor,
      { ufsPercurso: ["GO"] },
    );
    const bs = bloqueiosDeEmissaoMdfe([depois], pretendida(), AGORA);
    expect(bs.map((b) => b.regra)).toContain("F87");
  });

  it("F87 não se aplica a rota longa", () => {
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "RS", descarregamento: "PA" },
      10,
      {
        ufsPercurso: ["RS", "SC", "PR", "SP", "MG", "GO", "TO", "PA"],
      },
    );
    expect(
      bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA).filter((b) => b.regra === "F87"),
    ).toEqual([]);
  });

  it("F86: aos 30 dias trava o CNPJ inteiro, em qualquer placa e qualquer rota", () => {
    const v = abertoHa(
      "V-1",
      "ZZZ0A00",
      { carregamento: "RS", descarregamento: "BA" },
      LIMIAR_BLOQUEIO_CNPJ_DIAS.valor,
      { ufsPercurso: ["RS", "SC", "PR", "SP", "MG", "BA"] },
    );
    const bs = bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA);
    expect(bs.map((b) => b.regra)).toEqual(["F86"]);
    expect(bs[0]!.cStat).toBe("686");
    expect(bs[0]!.fonte.confianca).toBe("oficial"); // subiu de 'verificar' após a verificação
  });

  it("mais de uma regra pode morder ao mesmo tempo, e todas são reportadas", () => {
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "GO", descarregamento: "MG" },
      LIMIAR_BLOQUEIO_CNPJ_DIAS.valor,
      { ufsPercurso: ["GO", "MG"] },
    );
    const bs = bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA);
    expect(bs.length).toBeGreaterThan(1);
    // A UI precisa saber QUAL manifesto encerrar para destravar cada regra.
    for (const b of bs) expect(b.viagemBloqueadora).toBe("V-1");
  });

  it("cnpjBase corta nas 8 primeiras posições: filial compartilha bloqueio", () => {
    expect(cnpjBase("12.345.678/0001-90")).toBe("12345678");
    expect(cnpjBase("12345678000271")).toBe("12345678");
  });

  it("podeEmitirMdfe devolve Guarda com motivo e fonte", () => {
    const v = abertoHa(
      "V-1",
      "ABC1D23",
      { carregamento: "SP", descarregamento: "MG" },
      1,
    );
    const g = negada(podeEmitirMdfe([v], pretendida(), AGORA));
    expect(g.motivo).toContain("ABC1D23");
    expect(g.fonte.descricao).toBeTruthy();
  });
});

// ============================================================================
// Cobertura adicional das três regras que a verificação de 16/09/2026 revelou.
// F88 é a mais fácil de regredir sem ninguém perceber: ela não tem relógio, o
// sintoma aparece só no dia em que o caminhão volta, e um `===` trocado por um
// `!==` no par invertido passa despercebido em code review.
// ============================================================================
describe("F88 / 662 — o manifesto da volta, em detalhe", () => {
  const pretendida = (
    over: Partial<Parameters<typeof bloqueiosDeEmissaoMdfe>[1]> = {},
  ) => ({
    placa: "ABC1D23",
    tpEmit: 1 as const,
    carregamento: "SP" as UF,
    descarregamento: "MG" as UF,
    ufsPercurso: ["SP", "MG"] as UF[],
    ...over,
  });

  /** Viagem de ROTA LONGA com manifesto aberto: isola F85/F88 da F87. */
  const aberto = (
    numero: string,
    placa: string,
    par: { carregamento: UF; descarregamento: UF },
    diasAberto: number,
    over: { tpEmit?: 1 | 2 | 3 } = {},
  ) =>
    viagem({
      numero,
      veiculo: { placa },
      ufsPercurso: ["RS", "SC", "PR", "SP", "MG"] as UF[],
      documentos: [mdfe(diasAberto, { parUf: par, tpEmit: over.tpEmit ?? 1 })],
    });

  const regras = (vs: ReturnType<typeof aberto>[], p = pretendida()) =>
    bloqueiosDeEmissaoMdfe(vs, p, AGORA).map((b) => b.regra);

  it("ida MG → SP aberta trava a volta SP → MG", () => {
    expect(
      regras([
        aberto("V-1", "ABC1D23", { carregamento: "MG", descarregamento: "SP" }, 1),
      ]),
    ).toContain("F88");
  });

  it("é imediato: trava com o manifesto aberto há zero dias", () => {
    expect(
      regras([
        aberto("V-1", "ABC1D23", { carregamento: "MG", descarregamento: "SP" }, 0),
      ]),
    ).toContain("F88");
  });

  it("o mesmo sentido NÃO dispara F88 — só F85", () => {
    const rs = regras([
      aberto("V-1", "ABC1D23", { carregamento: "SP", descarregamento: "MG" }, 1),
    ]);
    expect(rs).toContain("F85");
    expect(rs).not.toContain("F88");
  });

  it('uma terceira rota não é "a volta": MG → SP aberto não trava SP → RJ', () => {
    const rs = regras(
      [aberto("V-1", "ABC1D23", { carregamento: "MG", descarregamento: "SP" }, 1)],
      pretendida({ descarregamento: "RJ" as UF }),
    );
    expect(rs).not.toContain("F88");
    expect(rs).not.toContain("F85"); // descarga RJ ≠ SP
    expect(rs).toEqual([]);
  });

  it("F88 respeita a placa: outro caminhão faz a volta normalmente", () => {
    expect(
      regras([
        aberto("V-1", "XYZ9K88", { carregamento: "MG", descarregamento: "SP" }, 1),
      ]),
    ).toEqual([]);
  });

  it("F88 respeita o tpEmit, igual à F85", () => {
    const rs = regras(
      [
        aberto("V-1", "ABC1D23", { carregamento: "MG", descarregamento: "SP" }, 1, {
          tpEmit: 2,
        }),
      ],
      pretendida({ tpEmit: 1 }),
    );
    expect(rs).not.toContain("F88");
  });

  it("o motivo nomeia o sentido travado e a viagem a encerrar", () => {
    const bs = bloqueiosDeEmissaoMdfe(
      [aberto("V-IDA", "ABC1D23", { carregamento: "MG", descarregamento: "SP" }, 1)],
      pretendida(),
      AGORA,
    );
    const f88 = bs.find((b) => b.regra === "F88")!;
    expect(f88.motivo).toContain("MG → SP");
    expect(f88.motivo).toContain("V-IDA");
    expect(f88.motivo).toMatch(/volta/i);
    expect(f88.viagemBloqueadora).toBe("V-IDA");
    expect(f88.fonte.confianca).toBe("oficial");
  });

  it("manifesto já encerrado não trava a volta", () => {
    const v = viagem({
      numero: "V-1",
      veiculo: { placa: "ABC1D23" },
      ufsPercurso: ["RS", "SC", "PR", "SP", "MG"] as UF[],
      documentos: [
        mdfe(1, {
          status: "encerrado",
          parUf: { carregamento: "MG", descarregamento: "SP" },
        }),
      ],
    });
    expect(bloqueiosDeEmissaoMdfe([v], pretendida(), AGORA)).toEqual([]);
  });

  // Rota intraestadual: pela LETRA do Anexo I as duas regras casariam, porque
  // num par GO→GO o sentido invertido é idêntico ao direto. A supressão da F88
  // aqui é decisão nossa, não da norma: as duas morderiam o mesmo manifesto e a
  // UI mostraria duas linhas para um problema só, a segunda dizendo "manifesto
  // da volta GO → GO", frase sem sentido para quem não sai do estado. A F85 já
  // cobre o caso inteiro. Se alguém reverter a supressão, quebra aqui.
  const intraestadual = () =>
    viagem({
      numero: "V-GO",
      veiculo: { placa: "ABC1D23" },
      ufsPercurso: ["GO"] as UF[],
      documentos: [mdfe(0, { parUf: { carregamento: "GO", descarregamento: "GO" } })],
    });
  const dentroDeGo = pretendida({
    carregamento: "GO" as UF,
    descarregamento: "GO" as UF,
    ufsPercurso: ["GO"] as UF[],
  });

  it("rota intraestadual: sai F85 e NÃO sai F88", () => {
    const bs = bloqueiosDeEmissaoMdfe([intraestadual()], dentroDeGo, AGORA);
    expect(bs.map((b) => b.regra)).toEqual(["F85"]);
    expect(bs.map((b) => b.regra)).not.toContain("F88");
  });

  it("a supressão não deixa o usuário sem aviso: a F85 explica o bloqueio inteiro", () => {
    const bs = bloqueiosDeEmissaoMdfe([intraestadual()], dentroDeGo, AGORA);
    expect(bs).toHaveLength(1);
    expect(bs[0]!.motivo).toContain("GO");
    expect(bs[0]!.motivo).toContain("V-GO");
    expect(bs[0]!.motivo).not.toMatch(/volta/i);
  });

  it("a supressão olha a emissão PRETENDIDA, não o manifesto aberto", () => {
    // Manifesto aberto intraestadual GO→GO, emissão pretendida interestadual:
    // a F88 já não casaria de qualquer forma, e a supressão não muda nada.
    const bs = bloqueiosDeEmissaoMdfe(
      [intraestadual()],
      pretendida({ carregamento: "MG" as UF, descarregamento: "GO" as UF }),
      AGORA,
    );
    expect(bs.map((b) => b.regra)).toEqual(["F85"]); // descarga GO bate
  });

  it("a supressão NÃO vaza para rota interestadual: a volta de verdade continua travada", () => {
    const ida = aberto(
      "V-IDA",
      "ABC1D23",
      { carregamento: "MG", descarregamento: "SP" },
      1,
    );
    expect(regras([ida])).toContain("F88");
  });
});

// ============================================================================
describe("F87 / 462 — rota curta, detalhes que o relógio de 30 dias esconde", () => {
  const pretendida = {
    placa: "ABC1D23",
    tpEmit: 1 as const,
    carregamento: "GO" as UF,
    descarregamento: "GO" as UF,
    ufsPercurso: ["GO"] as UF[],
  };

  const curta = (diasAberto: number, over: { tpEmit?: 1 | 2 | 3; placa?: string } = {}) =>
    viagem({
      numero: "V-CURTA",
      veiculo: { placa: over.placa ?? "ABC1D23" },
      ufsPercurso: ["GO"] as UF[],
      documentos: [
        mdfe(diasAberto, {
          parUf: { carregamento: "GO", descarregamento: "MG" },
          tpEmit: over.tpEmit ?? 1,
        }),
      ],
    });

  const temF87 = (v: ReturnType<typeof curta>) =>
    bloqueiosDeEmissaoMdfe([v], pretendida, AGORA).some((b) => b.regra === "F87");

  it(`o corte é inclusivo: ${BLOQUEIO_ROTA_CURTA_DIAS.valor - 1} dias não, ${BLOQUEIO_ROTA_CURTA_DIAS.valor} dias sim`, () => {
    expect(temF87(curta(BLOQUEIO_ROTA_CURTA_DIAS.valor - 1))).toBe(false);
    expect(temF87(curta(BLOQUEIO_ROTA_CURTA_DIAS.valor))).toBe(true);
    expect(temF87(curta(BLOQUEIO_ROTA_CURTA_DIAS.valor + 1))).toBe(true);
  });

  it("a chave da F87 é CNPJ + placa, SEM tpEmit — ao contrário de F85 e F88", () => {
    // Diferença deliberada entre as regras do Anexo I. Se alguém "uniformizar"
    // as três acrescentando tpEmit aqui, este teste avisa.
    expect(temF87(curta(BLOQUEIO_ROTA_CURTA_DIAS.valor, { tpEmit: 2 }))).toBe(true);
  });

  it("placa diferente não dispara F87", () => {
    expect(temF87(curta(BLOQUEIO_ROTA_CURTA_DIAS.valor, { placa: "XYZ9K88" }))).toBe(
      false,
    );
  });

  it("quem manda é a rota do manifesto ABERTO, não a da emissão pretendida", () => {
    // Manifesto aberto em rota LONGA + emissão pretendida curta: sem F87.
    const longaAberta = viagem({
      numero: "V-LONGA",
      veiculo: { placa: "ABC1D23" },
      ufsPercurso: ["RS", "SC", "PR", "SP"] as UF[],
      documentos: [
        mdfe(BLOQUEIO_ROTA_CURTA_DIAS.valor + 10, {
          parUf: { carregamento: "RS", descarregamento: "SP" },
        }),
      ],
    });
    expect(
      bloqueiosDeEmissaoMdfe([longaAberta], pretendida, AGORA).some(
        (b) => b.regra === "F87",
      ),
    ).toBe(false);
  });

  it("manifesto sem autorizadoEm não acumula dias e não dispara F87 nem F86", () => {
    const v = viagem({
      numero: "V-SEM-DATA",
      veiculo: { placa: "ABC1D23" },
      ufsPercurso: ["GO"] as UF[],
      documentos: [
        mdfe(0, {
          autorizadoEm: undefined,
          parUf: { carregamento: "GO", descarregamento: "MG" },
        }),
      ],
    });
    const rs = bloqueiosDeEmissaoMdfe([v], pretendida, AGORA).map((b) => b.regra);
    expect(rs).not.toContain("F87");
    expect(rs).not.toContain("F86");
  });

  it("o motivo cita os dias abertos e o limite, ambos vindos do parâmetro", () => {
    const bs = bloqueiosDeEmissaoMdfe(
      [curta(BLOQUEIO_ROTA_CURTA_DIAS.valor + 2)],
      pretendida,
      AGORA,
    );
    const f87 = bs.find((b) => b.regra === "F87")!;
    expect(f87.cStat).toBe("462");
    expect(f87.motivo).toContain(String(BLOQUEIO_ROTA_CURTA_DIAS.valor + 2));
    expect(f87.motivo).toContain(String(BLOQUEIO_ROTA_CURTA_DIAS.valor));
    expect(f87.fonte.confianca).toBe("oficial");
  });
});

// ============================================================================
describe("F86 / 686 — trava tudo, e o limite é inclusivo", () => {
  const pretendida = {
    placa: "NOVA1A1",
    tpEmit: 1 as const,
    carregamento: "AM" as UF,
    descarregamento: "RR" as UF,
    ufsPercurso: ["AM", "RR", "PA", "MT"] as UF[],
  };

  const antigo = (diasAberto: number) =>
    viagem({
      numero: "V-VELHA",
      veiculo: { placa: "OUTRA99" },
      ufsPercurso: ["RS", "SC", "PR", "SP"] as UF[],
      documentos: [
        mdfe(diasAberto, { parUf: { carregamento: "RS", descarregamento: "SP" } }),
      ],
    });

  const regras = (d: number) =>
    bloqueiosDeEmissaoMdfe([antigo(d)], pretendida, AGORA).map((b) => b.regra);

  it(`${LIMIAR_BLOQUEIO_CNPJ_DIAS.valor - 1} dias ainda não trava`, () => {
    expect(regras(LIMIAR_BLOQUEIO_CNPJ_DIAS.valor - 1)).toEqual([]);
  });

  it(`exatamente ${LIMIAR_BLOQUEIO_CNPJ_DIAS.valor} dias já trava`, () => {
    expect(regras(LIMIAR_BLOQUEIO_CNPJ_DIAS.valor)).toEqual(["F86"]);
  });

  it("trava mesmo com placa, rota e sentido completamente diferentes", () => {
    const bs = bloqueiosDeEmissaoMdfe(
      [antigo(LIMIAR_BLOQUEIO_CNPJ_DIAS.valor + 100)],
      pretendida,
      AGORA,
    );
    expect(bs.map((b) => b.regra)).toEqual(["F86"]);
    expect(bs[0]!.motivo).toMatch(/qualquer ve[íi]culo e qualquer rota/i);
    expect(bs[0]!.viagemBloqueadora).toBe("V-VELHA");
  });

  it("o bloqueio some quando o manifesto é encerrado", () => {
    const v = viagem({
      numero: "V-VELHA",
      veiculo: { placa: "OUTRA99" },
      ufsPercurso: ["RS", "SC", "PR", "SP"] as UF[],
      documentos: [mdfe(LIMIAR_BLOQUEIO_CNPJ_DIAS.valor + 100, { status: "encerrado" })],
    });
    expect(bloqueiosDeEmissaoMdfe([v], pretendida, AGORA)).toEqual([]);
  });
});

// ============================================================================
describe("escopo por CNPJ: contrato explícito, não promessa silenciosa", () => {
  // HISTÓRICO. Antes esta função recebia `cnpjEmitente` e continha
  //
  //     const mesmoCnpj = cnpjBase(viagem.tomador.cnpjCpf) === base || true;
  //
  // O `|| true` tornava a condição constante: o parâmetro era inerte e a API
  // prometia um filtro por CNPJ que não existia. Pior, a comparação neutralizada
  // usava o CNPJ do TOMADOR, quem contrata o frete, não o do EMITENTE do
  // manifesto — e `Viagem` não carrega o CNPJ do emitente, só `orgId`.
  //
  // A correção tirou a promessa em vez de fingir cumpri-la: `cnpjEmitente` saiu
  // da assinatura, a pré-condição ("viagens já escopadas a um CNPJ base") está
  // no JSDoc, e `cnpjBase` ficou como ferramenta do CHAMADOR para fazer esse
  // escopo. O que se testa aqui é esse contrato novo.
  const pretendida = {
    placa: "NOVA1A1",
    tpEmit: 1 as const,
    carregamento: "AM" as UF,
    descarregamento: "RR" as UF,
    ufsPercurso: ["AM", "RR", "PA"] as UF[],
  };

  const MINHA_ORG = "org-minha";
  const OUTRA_ORG = "org-alheia";

  const manifestoVelho = (orgId: string, numero: string) =>
    viagem({
      orgId,
      numero,
      veiculo: { placa: "OUTRA99" },
      ufsPercurso: ["RS", "SC", "PR", "SP"] as UF[],
      documentos: [mdfe(LIMIAR_BLOQUEIO_CNPJ_DIAS.valor + 10)],
    });

  it("a assinatura não pede CNPJ: o resultado depende só das viagens entregues", () => {
    const minha = manifestoVelho(MINHA_ORG, "V-MINHA");
    const alheia = manifestoVelho(OUTRA_ORG, "V-ALHEIA");

    // Mesma emissão pretendida, listas diferentes, resultados diferentes.
    // Não há terceiro parâmetro de identidade capaz de mudar isso.
    expect(bloqueiosDeEmissaoMdfe([], pretendida, AGORA)).toEqual([]);
    expect(
      bloqueiosDeEmissaoMdfe([minha], pretendida, AGORA).map((b) => b.viagemBloqueadora),
    ).toEqual(["V-MINHA"]);
    expect(
      bloqueiosDeEmissaoMdfe([alheia], pretendida, AGORA).map((b) => b.viagemBloqueadora),
    ).toEqual(["V-ALHEIA"]);
  });

  it("cumprir a pré-condição é filtrar antes: o chamador escopa, a função obedece", () => {
    const todas = [
      manifestoVelho(MINHA_ORG, "V-MINHA"),
      manifestoVelho(OUTRA_ORG, "V-ALHEIA"),
    ];

    // Sem escopar, a função vê as duas — ela não tem como saber, e o JSDoc diz
    // exatamente isso. É responsabilidade do chamador, não um bug da função.
    expect(bloqueiosDeEmissaoMdfe(todas, pretendida, AGORA)).toHaveLength(2);

    // Escopado por tenant (ADR 0002), que é o que a pré-condição pede.
    const escopadas = todas.filter((v) => v.orgId === MINHA_ORG);
    const bs = bloqueiosDeEmissaoMdfe(escopadas, pretendida, AGORA);
    expect(bs).toHaveLength(1);
    expect(bs[0]!.viagemBloqueadora).toBe("V-MINHA");
  });

  it("cnpjBase faz o que diz: raiz de 8 dígitos, pontuação ignorada", () => {
    expect(cnpjBase("12.345.678/0001-90")).toBe("12345678");
    expect(cnpjBase("12345678000190")).toBe("12345678");
    expect(cnpjBase("12345678000271")).toBe("12345678");
  });

  it("matriz e filial caem na MESMA raiz — que é o ponto das regras do Anexo I", () => {
    const matriz = "12.345.678/0001-90";
    const filial = "12.345.678/0002-71";
    const concorrente = "99.999.999/0001-00";
    expect(cnpjBase(matriz)).toBe(cnpjBase(filial));
    expect(cnpjBase(matriz)).not.toBe(cnpjBase(concorrente));
  });

  it("cnpjBase serve para escopar de verdade uma lista mista", () => {
    // Demonstra o uso que o JSDoc recomenda, com o CNPJ vindo de fora da Viagem.
    const cnpjPorOrg: Record<string, string> = {
      [MINHA_ORG]: "12.345.678/0001-90",
      "org-filial": "12.345.678/0002-71",
      [OUTRA_ORG]: "99.999.999/0001-00",
    };
    const todas = [
      manifestoVelho(MINHA_ORG, "V-MATRIZ"),
      manifestoVelho("org-filial", "V-FILIAL"),
      manifestoVelho(OUTRA_ORG, "V-ALHEIA"),
    ];
    const raiz = cnpjBase(cnpjPorOrg[MINHA_ORG]!);
    const escopadas = todas.filter((v) => cnpjBase(cnpjPorOrg[v.orgId]!) === raiz);

    const bs = bloqueiosDeEmissaoMdfe(escopadas, pretendida, AGORA);
    // Matriz e filial compartilham o bloqueio; a concorrente fica de fora.
    expect(bs.map((b) => b.viagemBloqueadora).sort()).toEqual(["V-FILIAL", "V-MATRIZ"]);
  });

  it("a dívida registrada continua real: Viagem não carrega o CNPJ do emitente", () => {
    // Tripwire. No dia em que este campo existir, o filtro deve descer para
    // dentro de bloqueiosDeEmissaoMdfe e a pré-condição do JSDoc sai.
    const v = viagem();
    expect(v).toHaveProperty("orgId");
    expect(Object.keys(v)).not.toContain("cnpjEmitente");
    // `tomador.cnpjCpf` existe, mas é a parte ERRADA: quem contrata, não quem emite.
    expect(v.tomador.cnpjCpf).toBeTruthy();
  });
});
