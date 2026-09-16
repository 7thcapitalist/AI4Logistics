// ============================================================================
// Máquina de estados da viagem.
//
// As três decisões do ADR 0007 estão fixadas aqui. Se alguém mudar o MAPA sem
// mudar o ADR, quebra neste arquivo e a conversa acontece antes do merge.
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  STATUS_ABERTOS,
  entregueNaoEncerrada,
  podeTransicionar,
  transicoesPermitidas,
} from "../transicoes";
import type { ViagemStatus } from "../tipos";
import { documento, mdfe, viagem } from "./fabrica";

const TODOS: ViagemStatus[] = [
  "rascunho",
  "documentos_pendentes",
  "em_emissao",
  "pronta",
  "em_transito",
  "entregue",
  "encerrada",
  "acertada",
  "cancelada",
];

// ============================================================================
describe("decisão 1 — encerrada NÃO exige passar por entregue", () => {
  it("em_transito -> encerrada é permitido (transbordo, redespacho, retenção)", () => {
    expect(podeTransicionar("em_transito", "encerrada")).toBe(true);
  });

  it("em_transito -> entregue continua sendo o caminho normal", () => {
    expect(podeTransicionar("em_transito", "entregue")).toBe(true);
  });

  it("entregue -> encerrada é permitido", () => {
    expect(podeTransicionar("entregue", "encerrada")).toBe(true);
  });
});

describe("decisão 2 — não há volta de encerrada", () => {
  it("encerrada só avança para acertada", () => {
    expect(transicoesPermitidas("encerrada")).toEqual(["acertada"]);
  });

  it("encerrada não volta para nenhum estado anterior", () => {
    const anteriores: ViagemStatus[] = [
      "rascunho",
      "documentos_pendentes",
      "em_emissao",
      "pronta",
      "em_transito",
      "entregue",
    ];
    for (const destino of anteriores) {
      expect(podeTransicionar("encerrada", destino), `encerrada -> ${destino}`).toBe(
        false,
      );
    }
  });

  it("encerrada não pode ser cancelada: o evento 110112 é irreversível", () => {
    expect(podeTransicionar("encerrada", "cancelada")).toBe(false);
  });
});

describe("decisão 3 — viagem iniciada não se cancela, se encerra", () => {
  it("em_transito -> cancelada é NEGADO", () => {
    expect(podeTransicionar("em_transito", "cancelada")).toBe(false);
    expect(transicoesPermitidas("em_transito")).not.toContain("cancelada");
  });

  it("entregue -> cancelada é negado", () => {
    expect(podeTransicionar("entregue", "cancelada")).toBe(false);
  });

  it("cancelada é alcançável de todos os estados anteriores ao trânsito", () => {
    const antesDoTransito: ViagemStatus[] = [
      "rascunho",
      "documentos_pendentes",
      "em_emissao",
      "pronta",
    ];
    for (const de of antesDoTransito) {
      expect(podeTransicionar(de, "cancelada"), `${de} -> cancelada`).toBe(true);
    }
  });

  it("cancelada NÃO é alcançável de nenhum estado a partir do trânsito", () => {
    const doTransitoEmDiante: ViagemStatus[] = [
      "em_transito",
      "entregue",
      "encerrada",
      "acertada",
    ];
    for (const de of doTransitoEmDiante) {
      expect(podeTransicionar(de, "cancelada"), `${de} -> cancelada`).toBe(false);
    }
  });
});

describe("estados terminais", () => {
  it("cancelada é terminal", () => {
    expect(transicoesPermitidas("cancelada")).toEqual([]);
    for (const destino of TODOS) {
      expect(podeTransicionar("cancelada", destino), `cancelada -> ${destino}`).toBe(
        false,
      );
    }
  });

  it("acertada é terminal", () => {
    expect(transicoesPermitidas("acertada")).toEqual([]);
    for (const destino of TODOS) {
      expect(podeTransicionar("acertada", destino), `acertada -> ${destino}`).toBe(false);
    }
  });

  it("nenhum estado transiciona para si mesmo", () => {
    for (const s of TODOS) {
      expect(podeTransicionar(s, s), `${s} -> ${s}`).toBe(false);
    }
  });

  it("todo status tem entrada no mapa e todo destino é um status válido", () => {
    for (const s of TODOS) {
      const destinos = transicoesPermitidas(s);
      expect(Array.isArray(destinos), `${s} sem entrada no mapa`).toBe(true);
      for (const d of destinos) expect(TODOS).toContain(d);
    }
  });

  it("STATUS_ABERTOS é exatamente o intervalo entre sair e encerrar", () => {
    expect(STATUS_ABERTOS).toEqual(["em_transito", "entregue"]);
    expect(STATUS_ABERTOS).not.toContain("encerrada");
  });
});

// ============================================================================
describe("entregueNaoEncerrada — a lacuna que o produto existe para fechar", () => {
  it("verdadeiro só com status entregue E MDF-e autorizado", () => {
    const v = viagem({
      status: "entregue",
      documentos: [mdfe(1, { status: "autorizado" })],
    });
    expect(entregueNaoEncerrada(v)).toBe(true);
  });

  it("falso quando o MDF-e já foi encerrado", () => {
    const v = viagem({
      status: "entregue",
      documentos: [mdfe(1, { status: "encerrado" })],
    });
    expect(entregueNaoEncerrada(v)).toBe(false);
  });

  it("falso quando não há MDF-e nenhum", () => {
    expect(entregueNaoEncerrada(viagem({ status: "entregue", documentos: [] }))).toBe(
      false,
    );
  });

  it("falso quando o único documento autorizado é um CT-e", () => {
    const v = viagem({
      status: "entregue",
      documentos: [documento({ tipo: "cte", status: "autorizado" })],
    });
    expect(entregueNaoEncerrada(v)).toBe(false);
  });

  it("falso em qualquer status que não seja entregue, mesmo com MDF-e autorizado", () => {
    for (const s of TODOS.filter((x) => x !== "entregue")) {
      const v = viagem({ status: s, documentos: [mdfe(1, { status: "autorizado" })] });
      expect(entregueNaoEncerrada(v), `status ${s}`).toBe(false);
    }
  });

  it("verdadeiro se houver ao menos um MDF-e autorizado entre vários documentos", () => {
    const v = viagem({
      status: "entregue",
      documentos: [
        documento({ tipo: "cte", status: "autorizado" }),
        mdfe(1, { status: "encerrado" }),
        mdfe(2, { status: "autorizado" }),
      ],
    });
    expect(entregueNaoEncerrada(v)).toBe(true);
  });

  it("entregue e encerrada NÃO são sinônimos: o produto perde a razão de existir se virarem", () => {
    const entregueAberta = viagem({ status: "entregue", documentos: [mdfe(1)] });
    const encerrada = viagem({
      status: "encerrada",
      documentos: [mdfe(1, { status: "encerrado" })],
    });
    expect(entregueNaoEncerrada(entregueAberta)).toBe(true);
    expect(entregueNaoEncerrada(encerrada)).toBe(false);
  });
});
