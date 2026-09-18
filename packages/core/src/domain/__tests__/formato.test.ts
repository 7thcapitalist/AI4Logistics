// ============================================================================
// Formatação de dado fiscal.
//
// Dinheiro é inteiro em centavos e nunca vira float no caminho até a tela.
// Chave de acesso nunca aparece inteira numa tabela. Tempo relativo é a única
// coisa que o usuário lê para decidir se corre ou não.
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  agruparChave,
  formatarDataHora,
  formatarRelativo,
  truncarChave,
} from "../formato";
// `formatarCentavos` foi removido no merge com o repositório principal: dinheiro
// se formata com `formatBRL`, que já inclui o "R$ ". Os casos abaixo são os
// mesmos, com o prefixo agora dentro da função.
import { formatBRL } from "../../money";
import { AGORA, CHAVE_44 } from "./fabrica";

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

// ============================================================================
describe("formatBRL", () => {
  it("zero", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("menos de um real mantém o zero das unidades e os dois decimais", () => {
    expect(formatBRL(1)).toBe("R$ 0,01");
    expect(formatBRL(5)).toBe("R$ 0,05");
    expect(formatBRL(50)).toBe("R$ 0,50");
    expect(formatBRL(99)).toBe("R$ 0,99");
  });

  it("exatamente um real", () => {
    expect(formatBRL(100)).toBe("R$ 1,00");
  });

  it("negativo leva o sinal antes de tudo, inclusive do símbolo", () => {
    expect(formatBRL(-1)).toBe("-R$ 0,01");
    expect(formatBRL(-100)).toBe("-R$ 1,00");
    expect(formatBRL(-123456)).toBe("-R$ 1.234,56");
  });

  it("milhão usa ponto como separador de milhar, pt-BR", () => {
    expect(formatBRL(100_000_000)).toBe("R$ 1.000.000,00");
    expect(formatBRL(123_456_789)).toBe("R$ 1.234.567,89");
  });

  it("valor de frete típico", () => {
    expect(formatBRL(842_000)).toBe("R$ 8.420,00");
  });

  it("nunca perde centavo: o resultado sempre tem duas casas", () => {
    for (const c of [0, 1, 9, 10, 99, 100, 101, 999, 1000, 100_000_000, -7]) {
      expect(formatBRL(c), `centavos=${c}`).toMatch(/,\d{2}$/);
    }
  });

  it("simétrico no sinal", () => {
    for (const c of [1, 50, 100, 123456, 100_000_000]) {
      expect(formatBRL(-c)).toBe(`-${formatBRL(c)}`);
    }
  });

  it('o prefixo vem da própria função: quem renderiza não acrescenta "R$ "', () => {
    expect(formatBRL(842_000).startsWith("R$ ")).toBe(true);
  });
});

// ============================================================================
describe("truncarChave", () => {
  it("chave de 44 dígitos vira 6 + reticência + 6", () => {
    expect(CHAVE_44).toHaveLength(44);
    expect(truncarChave(CHAVE_44)).toBe("352609…010012");
  });

  it("nunca devolve a chave inteira quando ela é longa", () => {
    const t = truncarChave(CHAVE_44);
    expect(t).not.toBe(CHAVE_44);
    expect(t.length).toBeLessThan(CHAVE_44.length);
    expect(t).toContain("…");
  });

  it("string curta passa intacta, sem reticência enganosa", () => {
    expect(truncarChave("")).toBe("");
    expect(truncarChave("123")).toBe("123");
    expect(truncarChave("12345678901234")).toBe("12345678901234"); // 14, o limite
    expect(truncarChave("12345678901234")).not.toContain("…");
  });

  it("um caractere acima do limite já trunca", () => {
    expect(truncarChave("123456789012345")).toBe("123456…012345");
  });
});

describe("agruparChave", () => {
  it("agrupa 44 dígitos em 11 blocos de 4", () => {
    const g = agruparChave(CHAVE_44);
    const blocos = g.split(" ");
    expect(blocos).toHaveLength(11);
    expect(blocos.every((b) => b.length === 4)).toBe(true);
    expect(g.replace(/ /g, "")).toBe(CHAVE_44);
  });

  it("string vazia não vira espaço solto", () => {
    expect(agruparChave("")).toBe("");
  });
});

// ============================================================================
describe("formatarDataHora", () => {
  it("formata em America/Sao_Paulo, dd/mm/aaaa hh:mm, independente do TZ da máquina", () => {
    const s = formatarDataHora(AGORA);
    expect(s).toMatch(/^\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}$/);
  });

  it("dois instantes distintos não colapsam na mesma string", () => {
    expect(formatarDataHora(AGORA)).not.toBe(formatarDataHora(AGORA + H));
  });
});

// ============================================================================
describe("formatarRelativo — as viradas", () => {
  const rel = (deltaMs: number) => formatarRelativo(AGORA - deltaMs, AGORA);

  it('virada de "agora" para minutos', () => {
    expect(rel(0)).toBe("agora");
    expect(rel(20_000)).toBe("agora");
    expect(rel(1 * MIN)).toBe("há 1 min");
    expect(rel(2 * MIN)).toBe("há 2 min");
  });

  it("virada de minutos para horas", () => {
    expect(rel(59 * MIN)).toBe("há 59 min");
    expect(rel(60 * MIN)).toBe("há 1h");
    expect(rel(90 * MIN)).toBe("há 2h"); // arredonda, não trunca
  });

  it("virada de horas para dias", () => {
    expect(rel(23 * H)).toBe("há 23h");
    expect(rel(24 * H)).toBe("há 1 dia");
    expect(rel(48 * H)).toBe("há 2 dias");
  });

  it("singular e plural de dia", () => {
    expect(rel(1 * D)).toContain(" dia");
    expect(rel(1 * D)).not.toContain("dias");
    expect(rel(2 * D)).toContain("dias");
  });

  it("virada de dias para meses", () => {
    expect(rel(29 * D)).toBe("há 29 dias");
    expect(rel(30 * D)).toBe("há 1 mês");
    expect(rel(60 * D)).toBe("há 2 meses");
  });

  it("singular e plural de mês", () => {
    expect(rel(30 * D)).toBe("há 1 mês");
    expect(rel(90 * D)).toBe("há 3 meses");
  });

  it("é monótono: quanto mais antigo, nunca volta para uma unidade menor", () => {
    const ordem = ["agora", "min", "h", "dia", "mês"];
    const unidade = (s: string) => {
      if (s === "agora") return 0;
      if (s.includes(" min")) return 1;
      if (/há \d+h$/.test(s)) return 2;
      if (s.includes("dia")) return 3;
      return 4;
    };
    const deltas = [0, MIN, 30 * MIN, H, 5 * H, D, 10 * D, 30 * D, 365 * D];
    let anterior = -1;
    for (const d of deltas) {
      const u = unidade(rel(d));
      expect(u, `${d}ms -> ${rel(d)} (${ordem[u]})`).toBeGreaterThanOrEqual(anterior);
      anterior = u;
    }
  });

  it("não usa o relógio real: o mesmo par de instantes dá sempre a mesma string", () => {
    expect(formatarRelativo(AGORA - 3 * H, AGORA)).toBe("há 3h");
    expect(formatarRelativo(0, 3 * H)).toBe("há 3h");
  });
});
