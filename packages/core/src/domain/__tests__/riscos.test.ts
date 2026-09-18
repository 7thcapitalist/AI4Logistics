// ============================================================================
// Motor de risco.
//
// O que se prova aqui não é "a função retorna N riscos". É que o produto NÃO
// escreve no painel de um cliente uma afirmação fiscal que ninguém verificou.
//
// ATUALIZADO após a verificação normativa de 16/09/2026
// (docs/domain/verificacao-2026-09.md). Três fatos que estes testes fixavam
// mudaram, e os testes mudaram junto:
//
//  - a rejeição 686 é NACIONAL, então LIMIAR_BLOQUEIO_CNPJ_DIAS subiu para
//    'oficial' e deixou de ser a exceção tolerada do invariante;
//  - OBRIGATORIEDADE_CIOT_MDFE.data existe e é oficial, então o risco de CIOT
//    passa a ter contagem regressiva — sem citar data literal na explicação;
//  - não existe UMA regra de bloqueio, existem QUATRO, e a de rota curta
//    (F87, 5 dias) dispara muito antes da de 30 dias. Um manifesto aberto em
//    rota curta gera DOIS riscos de bloqueio, não um.
//
// E depois da rodada seguinte de correções: F86 e F87 deixaram de compartilhar
// `RiscoTipo` — a F87 tem o seu, `mdfe_aberto_bloqueio_placa` — e a
// antecedência do aviso de rota curta virou parâmetro exportado. Os dois
// remendos que estes testes carregavam por causa disso (um helper que filtrava
// por sufixo de id e uma sondagem que descobria a antecedência) saíram.
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  contarPorSeveridade,
  ordenarRiscos,
  riscosDaOrg,
  riscosDaViagem,
} from "../riscos";
import {
  ANTECEDENCIA_AVISO_BLOQUEIO_DIAS,
  ANTECEDENCIA_AVISO_ROTA_CURTA_DIAS,
  BLOQUEIO_ROTA_CURTA_DIAS,
  CONTINGENCIA_MDFE_HORAS,
  LIMIAR_BLOQUEIO_CNPJ_DIAS,
  MAX_UF_PERCURSO_ROTA_CURTA,
  OBRIGATORIEDADE_CIOT_MDFE,
  DIA_MS,
} from "../prazos";
import type { Risco, Viagem } from "../tipos";
import {
  AGORA,
  PERCURSO_CURTO,
  PERCURSO_LONGO,
  cte,
  diasAFrente,
  diasAtras,
  documento,
  horasAtras,
  mdfe,
  org,
  um,
  viagem,
  viagemEm,
  viagemRotaCurta,
  viagemRotaLonga,
} from "./fabrica";

const LIMIAR = LIMIAR_BLOQUEIO_CNPJ_DIAS.valor;
const AVISO = ANTECEDENCIA_AVISO_BLOQUEIO_DIAS;
const ROTA_CURTA = BLOQUEIO_ROTA_CURTA_DIAS.valor;

const doTipo = (riscos: Risco[], tipo: Risco["tipo"]) =>
  riscos.filter((r) => r.tipo === tipo);

/**
 * As duas regras de bloqueio por tempo, cada uma com o SEU tipo.
 *
 * Antes as duas compartilhavam `mdfe_aberto_limiar_bloqueio` e os testes
 * precisavam desempatar por sufixo de id. Agora o tipo separa, que é onde a
 * distinção pertence: a UI consegue filtrar "placa travada" de "CNPJ travado".
 */
const TIPO_PLACA = "mdfe_aberto_bloqueio_placa" as const;
const TIPO_CNPJ = "mdfe_aberto_limiar_bloqueio" as const;

/** Viagem de ROTA LONGA (fora da F87) com um MDF-e aberto há `d` dias. */
function longaComMdfeAbertoHa(d: number, over: Partial<Viagem> = {}): Viagem {
  return viagemRotaLonga({
    status: "em_transito",
    iniciadaEm: diasAtras(d),
    documentos: [mdfe(d)],
    ...over,
  });
}

/** Viagem de ROTA CURTA (dentro da F87) com um MDF-e aberto há `d` dias. */
function curtaComMdfeAbertoHa(d: number, over: Partial<Viagem> = {}): Viagem {
  return viagemRotaCurta({
    status: "em_transito",
    iniciadaEm: diasAtras(d),
    documentos: [mdfe(d)],
    ...over,
  });
}

/**
 * Antecedência do aviso de rota curta, agora parâmetro exportado — antes este
 * arquivo a descobria por sondagem, porque o número estava literal em
 * riscos.ts. Derivamos daqui o primeiro dia em que o aviso nasce, do mesmo
 * jeito que a F86 deriva de ANTECEDENCIA_AVISO_BLOQUEIO_DIAS.
 */
const AVISO_CURTA = ANTECEDENCIA_AVISO_ROTA_CURTA_DIAS;
const PRIMEIRO_DIA_AVISO_ROTA_CURTA = ROTA_CURTA - AVISO_CURTA;

// ============================================================================
describe("parâmetros após a verificação de 16/09/2026", () => {
  it("a rejeição 686 é nacional: o limiar do CNPJ virou fonte oficial", () => {
    expect(LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte.confianca).toBe("oficial");
    expect(LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte.descricao).toMatch(/F86|686/);
    expect(LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte.descricao).toMatch(/nacional/i);
  });

  it("continua sendo Parametro, não constante: norma muda, o valor tem que ter fonte", () => {
    expect(typeof LIMIAR_BLOQUEIO_CNPJ_DIAS.valor).toBe("number");
    expect(LIMIAR_BLOQUEIO_CNPJ_DIAS.fonte.descricao.trim()).not.toBe("");
    expect(typeof BLOQUEIO_ROTA_CURTA_DIAS.valor).toBe("number");
    expect(BLOQUEIO_ROTA_CURTA_DIAS.fonte.confianca).toBe("oficial");
  });

  it("a regra de rota curta morde antes da de CNPJ — é ela que vai gritar na base real", () => {
    expect(ROTA_CURTA).toBeLessThan(LIMIAR);
  });

  it("as duas antecedências de aviso são parâmetros, e cabem dentro do seu prazo", () => {
    // A da rota curta era literal dentro de riscos.ts e este arquivo tinha de
    // descobri-la por sondagem. Agora as duas são exportadas e testáveis.
    expect(AVISO_CURTA).toBeGreaterThan(0);
    expect(AVISO_CURTA).toBeLessThan(ROTA_CURTA);
    expect(AVISO).toBeGreaterThan(0);
    expect(AVISO).toBeLessThan(LIMIAR);
  });

  it("cada regra tem o seu RiscoTipo: F87 na placa, F86 no CNPJ", () => {
    // Enquanto compartilhavam tipo, a UI não conseguia dizer ao usuário se o
    // que travou foi o caminhão ou a empresa inteira.
    expect(TIPO_PLACA).not.toBe(TIPO_CNPJ);
    const curta = um(
      doTipo(riscosDaViagem(curtaComMdfeAbertoHa(ROTA_CURTA), AGORA), TIPO_PLACA),
    );
    const cnpj = um(
      doTipo(riscosDaViagem(longaComMdfeAbertoHa(LIMIAR), AGORA), TIPO_CNPJ),
    );
    expect(curta.titulo).toMatch(/placa/i);
    expect(cnpj.titulo).toMatch(/CNPJ/);
  });

  it('a expressão "em datas distintas" não sobreviveu à verificação e não voltou', () => {
    const textos = universoDeRiscos().flatMap((r) => [
      r.titulo,
      r.explicacao,
      r.fonte.descricao,
    ]);
    for (const t of textos)
      expect(t).not.toMatch(/datas? distintas?|data de emissão diferente/i);
  });
});

// ============================================================================
describe("F86 / 686 — bloqueio do CNPJ em 30 dias, isolado em ROTA LONGA", () => {
  // Rota longa de propósito: em rota curta a F87 dispara antes e contamina a
  // contagem de riscos. Quem quiser testar o limiar do CNPJ tem que sair da F87.
  it("a rota longa usada aqui está mesmo fora da F87", () => {
    expect(PERCURSO_LONGO.length).toBeGreaterThan(MAX_UF_PERCURSO_ROTA_CURTA);
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(ROTA_CURTA + 1), AGORA);
    expect(doTipo(riscos, TIPO_PLACA)).toHaveLength(0);
  });

  it(`aberto há ${LIMIAR - AVISO - 1} dias (um dia antes da faixa) — sem risco de limiar`, () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR - AVISO - 1), AGORA);
    expect(doTipo(riscos, TIPO_CNPJ)).toHaveLength(0);
    expect(doTipo(riscos, TIPO_PLACA)).toHaveLength(0);
  });

  it(`aberto há ${LIMIAR - AVISO} dias — critico, contagem de ${AVISO} dias`, () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR - AVISO), AGORA);
    const r = um(doTipo(riscos, TIPO_CNPJ));
    expect(r).toBeDefined();
    expect(r.severidade).toBe("critico");
    expect(r.contagemRegressiva).toEqual({
      tipo: "dias",
      restante: AVISO,
      ate: "bloqueio do CNPJ",
    });
    expect(r.titulo).toContain(String(AVISO));
    // Em rota longa ele é o único: a F87 não alcança.
    expect(doTipo(riscos, TIPO_CNPJ)).toHaveLength(1);
    expect(doTipo(riscos, TIPO_PLACA)).toHaveLength(0);
  });

  it(`aberto há ${LIMIAR} dias — bloqueante`, () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR), AGORA);
    const r = um(doTipo(riscos, TIPO_CNPJ));
    expect(r.severidade).toBe("bloqueante");
    expect(r.titulo).toMatch(/CNPJ bloqueado/i);
  });

  it(`aberto há ${LIMIAR + 3} dias — bloqueante e SEM contagem regressiva`, () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR + 3), AGORA);
    const r = um(doTipo(riscos, TIPO_CNPJ));
    expect(r.severidade).toBe("bloqueante");
    expect(r.contagemRegressiva).toBeUndefined();
    expect(r.explicacao).toContain(String(LIMIAR));
  });

  it("a contagem decresce dia a dia dentro da faixa de aviso", () => {
    for (let restanteEsperado = AVISO; restanteEsperado >= 1; restanteEsperado--) {
      const riscos = riscosDaViagem(
        longaComMdfeAbertoHa(LIMIAR - restanteEsperado),
        AGORA,
      );
      const r = um(doTipo(riscos, TIPO_CNPJ));
      expect(r.contagemRegressiva?.restante).toBe(restanteEsperado);
    }
  });

  it("a explicação nunca cita um número de dias que não venha do parâmetro", () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR - 2), AGORA);
    const r = um(doTipo(riscos, TIPO_CNPJ));
    const numeros = (r.explicacao.match(/\d+/g) ?? []).map(Number);
    for (const n of numeros) expect([LIMIAR, LIMIAR - 2]).toContain(n);
  });

  it("a explicação diz que o bloqueio é do CNPJ inteiro, em qualquer veículo", () => {
    const riscos = riscosDaViagem(longaComMdfeAbertoHa(LIMIAR), AGORA);
    const r = um(doTipo(riscos, TIPO_CNPJ));
    expect(r.explicacao).toMatch(/qualquer ve[íi]culo/i);
    // Depois da verificação o texto afirma; não diz mais "consta que".
    expect(r.explicacao).not.toMatch(/consta que/i);
  });
});

// ============================================================================
describe("F87 / 462 — bloqueio da placa em rota curta, a regra que ninguém sabia que existia", () => {
  it("a rota curta usada aqui está dentro do limite do MOC", () => {
    expect(PERCURSO_CURTO.length).toBeLessThanOrEqual(MAX_UF_PERCURSO_ROTA_CURTA);
  });

  it(`o aviso nasce ${AVISO_CURTA} dias antes do bloqueio, e não antes disso`, () => {
    const antes = riscosDaViagem(
      curtaComMdfeAbertoHa(PRIMEIRO_DIA_AVISO_ROTA_CURTA - 1),
      AGORA,
    );
    expect(doTipo(antes, TIPO_PLACA)).toHaveLength(0);

    const dentro = riscosDaViagem(
      curtaComMdfeAbertoHa(PRIMEIRO_DIA_AVISO_ROTA_CURTA),
      AGORA,
    );
    const r = um(doTipo(dentro, TIPO_PLACA));
    expect(r).toBeDefined();
    expect(r.severidade).toBe("critico");
    expect(r.contagemRegressiva).toEqual({
      tipo: "dias",
      restante: AVISO_CURTA,
      ate: "bloqueio da placa",
    });
  });

  it(`aberto há ${ROTA_CURTA - 1} dias — ainda avisa, ainda não bloqueia`, () => {
    const r = um(
      doTipo(riscosDaViagem(curtaComMdfeAbertoHa(ROTA_CURTA - 1), AGORA), TIPO_PLACA),
    );
    expect(r.severidade).toBe("critico");
    expect(r.contagemRegressiva?.restante).toBe(1);
  });

  it(`aberto há ${ROTA_CURTA} dias — bloqueante, sem contagem`, () => {
    const r = um(
      doTipo(riscosDaViagem(curtaComMdfeAbertoHa(ROTA_CURTA), AGORA), TIPO_PLACA),
    );
    expect(r.severidade).toBe("bloqueante");
    expect(r.contagemRegressiva).toBeUndefined();
    expect(r.titulo).toMatch(/bloqueada para novos manifestos/i);
  });

  it("o risco é da PLACA, não do CNPJ: título e explicação falam de placa", () => {
    const v = curtaComMdfeAbertoHa(ROTA_CURTA);
    const r = um(doTipo(riscosDaViagem(v, AGORA), TIPO_PLACA));
    expect(r.titulo).toContain(v.veiculo.placa);
    expect(r.veiculoPlaca).toBe(v.veiculo.placa);
    expect(r.explicacao).toMatch(/esta placa/i);
    expect(r.explicacao).not.toMatch(/CNPJ/);
  });

  it("rota longa NÃO gera risco de rota curta, em idade nenhuma", () => {
    for (const d of [0, 1, ROTA_CURTA, ROTA_CURTA + 1, LIMIAR, LIMIAR * 2]) {
      const riscos = riscosDaViagem(longaComMdfeAbertoHa(d), AGORA);
      expect(doTipo(riscos, TIPO_PLACA), `${d} dias`).toHaveLength(0);
    }
  });

  it("o limite é inclusivo: exatamente MAX_UF_PERCURSO_ROTA_CURTA UF ainda é rota curta", () => {
    const noLimite = viagem({
      ufsPercurso: PERCURSO_LONGO.slice(0, MAX_UF_PERCURSO_ROTA_CURTA),
      documentos: [mdfe(ROTA_CURTA)],
    });
    expect(doTipo(riscosDaViagem(noLimite, AGORA), TIPO_PLACA)).toHaveLength(1);

    const umAcima = viagem({
      ufsPercurso: PERCURSO_LONGO.slice(0, MAX_UF_PERCURSO_ROTA_CURTA + 1),
      documentos: [mdfe(ROTA_CURTA)],
    });
    expect(doTipo(riscosDaViagem(umAcima, AGORA), TIPO_PLACA)).toHaveLength(0);
  });

  it("viagem sem ufsPercurso conta como rota curta (lista vazia está sob o limite)", () => {
    const v = viagem({ ufsPercurso: [], documentos: [mdfe(ROTA_CURTA)] });
    expect(doTipo(riscosDaViagem(v, AGORA), TIPO_PLACA)).toHaveLength(1);
  });
});

// ============================================================================
describe("F87 e F86 convivem — rota curta antiga gera DOIS riscos, de tipos diferentes", () => {
  it(`em rota curta com ${LIMIAR - AVISO} dias saem os dois: placa bloqueada e CNPJ contando`, () => {
    const riscos = riscosDaViagem(curtaComMdfeAbertoHa(LIMIAR - AVISO), AGORA);
    const curta = um(doTipo(riscos, TIPO_PLACA));
    const cnpj = um(doTipo(riscos, TIPO_CNPJ));
    expect(curta).toBeDefined();
    expect(cnpj).toBeDefined();
    expect(curta.severidade).toBe("bloqueante"); // já passou dos 5 dias
    expect(curta.contagemRegressiva).toBeUndefined();
    expect(cnpj.severidade).toBe("critico");
    expect(cnpj.contagemRegressiva?.restante).toBe(AVISO);
  });

  it("cada regra tem o SEU tipo: a UI separa placa travada de CNPJ travado sem olhar id", () => {
    const riscos = riscosDaViagem(curtaComMdfeAbertoHa(LIMIAR - AVISO), AGORA);
    expect(doTipo(riscos, TIPO_PLACA)).toHaveLength(1);
    expect(doTipo(riscos, TIPO_CNPJ)).toHaveLength(1);
    expect(TIPO_PLACA).not.toBe(TIPO_CNPJ);
  });

  it("os dois riscos têm ids diferentes e apontam para o mesmo documento", () => {
    const v = curtaComMdfeAbertoHa(LIMIAR - AVISO);
    const riscos = [
      ...doTipo(riscosDaViagem(v, AGORA), TIPO_PLACA),
      ...doTipo(riscosDaViagem(v, AGORA), TIPO_CNPJ),
    ];
    expect(riscos).toHaveLength(2);
    expect(new Set(riscos.map((r) => r.id)).size).toBe(2);
    expect(new Set(riscos.map((r) => r.documentoId)).size).toBe(1);
  });

  it("entre 5 e 20 dias, rota curta tem SÓ o risco de placa", () => {
    const riscos = riscosDaViagem(curtaComMdfeAbertoHa(LIMIAR - AVISO - 1), AGORA);
    expect(doTipo(riscos, TIPO_PLACA)).toHaveLength(1);
    expect(doTipo(riscos, TIPO_CNPJ)).toHaveLength(0);
  });

  it("cada regra aponta o seu próprio horizonte: placa e CNPJ não se confundem", () => {
    const riscos = riscosDaViagem(
      curtaComMdfeAbertoHa(PRIMEIRO_DIA_AVISO_ROTA_CURTA),
      AGORA,
    );
    const curta = um(doTipo(riscos, TIPO_PLACA));
    expect(curta.contagemRegressiva?.ate).toBe("bloqueio da placa");
    // Aos 2 dias o CNPJ ainda nem entrou na faixa de aviso.
    expect(doTipo(riscos, TIPO_CNPJ)).toHaveLength(0);
  });
});

// ============================================================================
describe("mdfe_sem_ciot — data confirmada, contagem existe, texto continua sem data literal", () => {
  const comMdfeSemCiot = () =>
    viagemRotaLonga({
      status: "em_transito",
      iniciadaEm: diasAtras(1),
      documentos: [mdfe(1, { temCiot: false })],
    });

  const restanteEsperado = Math.floor(
    (Number(OBRIGATORIEDADE_CIOT_MDFE.data) - AGORA) / DIA_MS,
  );

  it("a data foi confirmada na NT e o selo subiu para oficial", () => {
    expect(OBRIGATORIEDADE_CIOT_MDFE.data).not.toBeNull();
    expect(OBRIGATORIEDADE_CIOT_MDFE.fonte.confianca).toBe("oficial");
    expect(OBRIGATORIEDADE_CIOT_MDFE.homologacao).toBeLessThan(
      Number(OBRIGATORIEDADE_CIOT_MDFE.data),
    );
  });

  it("MDF-e com temCiot false gera o risco", () => {
    const r = um(doTipo(riscosDaViagem(comMdfeSemCiot(), AGORA), "mdfe_sem_ciot"));
    expect(r).toBeDefined();
    expect(r.severidade).toBe("critico");
  });

  it("MDF-e com CIOT, ou sem a informação, não gera o risco", () => {
    const comCiot = viagem({ documentos: [mdfe(1, { temCiot: true })] });
    const semInfo = viagem({ documentos: [mdfe(1, { temCiot: undefined })] });
    expect(doTipo(riscosDaViagem(comCiot, AGORA), "mdfe_sem_ciot")).toHaveLength(0);
    expect(doTipo(riscosDaViagem(semInfo, AGORA), "mdfe_sem_ciot")).toHaveLength(0);
  });

  it("AGORA a contagem regressiva existe, derivada do parâmetro, não de literal", () => {
    const r = um(doTipo(riscosDaViagem(comMdfeSemCiot(), AGORA), "mdfe_sem_ciot"));
    expect(r.contagemRegressiva).toEqual({
      tipo: "dias",
      restante: restanteEsperado,
      ate: "rejeição automática do manifesto",
    });
    expect(restanteEsperado).toBeGreaterThan(0);
  });

  it("a explicação CONTINUA sem citar data literal — o número vive na contagem, não no texto", () => {
    // A data existe e é oficial, mas escrever "23/11/2026" no corpo do texto
    // congela no painel um literal que nenhum parâmetro controla. A contagem
    // regressiva é derivada; a frase, não seria.
    const r = um(doTipo(riscosDaViagem(comMdfeSemCiot(), AGORA), "mdfe_sem_ciot"));
    expect(r.explicacao).not.toContain("23/11");
    expect(r.explicacao).not.toContain("2026");
    expect(r.explicacao).not.toMatch(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/);
    expect(r.explicacao).not.toMatch(/\b(19|20)\d{2}\b/);
  });

  it("passada a data de produção, não sobra contagem regressiva para contar", () => {
    const depois = Number(OBRIGATORIEDADE_CIOT_MDFE.data) + 10 * DIA_MS;
    const v = viagemRotaLonga({ documentos: [mdfe(1, { temCiot: false })] });
    const r = um(doTipo(riscosDaViagem(v, depois), "mdfe_sem_ciot"));
    expect(r).toBeDefined();
    expect(r.contagemRegressiva).toBeUndefined();
  });
});

// ============================================================================
describe("contingência — o relógio de 168h existe só para MDF-e", () => {
  it("MDF-e em contingência gera risco com contagem em horas", () => {
    const doc = documento({
      tipo: "mdfe",
      status: "contingencia",
      contingenciaDesde: horasAtras(150),
    });
    const r = um(
      doTipo(riscosDaViagem(viagem({ documentos: [doc] }), AGORA), "contingencia_aberta"),
    );
    expect(r).toBeDefined();
    expect(r.contagemRegressiva).toEqual({
      tipo: "horas",
      restante: CONTINGENCIA_MDFE_HORAS.valor - 150,
      ate: "fim do prazo de transmissão",
    });
    expect(r.fonte.confianca).toBe("oficial");
  });

  it("CT-e em contingência NÃO gera risco: não existe prazo nacional quantificado para CT-e", () => {
    const doc = documento({
      tipo: "cte",
      status: "contingencia",
      contingenciaDesde: horasAtras(150),
    });
    const riscos = riscosDaViagem(viagem({ documentos: [doc] }), AGORA);
    expect(doTipo(riscos, "contingencia_aberta")).toHaveLength(0);
  });

  it("CT-e em contingência há muito tempo continua sem relógio", () => {
    for (const h of [1, 168, 169, 1000]) {
      const doc = documento({
        tipo: "cte",
        status: "contingencia",
        contingenciaDesde: horasAtras(h),
      });
      const riscos = riscosDaViagem(viagem({ documentos: [doc] }), AGORA);
      expect(doTipo(riscos, "contingencia_aberta")).toHaveLength(0);
    }
  });

  it("MDF-e fora do prazo de contingência: sem contagem, título muda", () => {
    const doc = documento({
      tipo: "mdfe",
      status: "contingencia",
      contingenciaDesde: horasAtras(CONTINGENCIA_MDFE_HORAS.valor + 5),
    });
    const r = um(
      doTipo(riscosDaViagem(viagem({ documentos: [doc] }), AGORA), "contingencia_aberta"),
    );
    expect(r.contagemRegressiva).toBeUndefined();
    expect(r.titulo).toMatch(/fora do prazo/i);
  });

  it("contingência sem contingenciaDesde não inventa relógio", () => {
    const doc = documento({
      tipo: "mdfe",
      status: "contingencia",
      contingenciaDesde: undefined,
    });
    expect(
      doTipo(riscosDaViagem(viagem({ documentos: [doc] }), AGORA), "contingencia_aberta"),
    ).toHaveLength(0);
  });
});

// ============================================================================
// Conjunto variado de viagens, usado pelos invariantes globais.
// Cobre deliberadamente todos os ramos do motor de risco, nos dois mundos de
// rota (curta e longa), porque o comprimento da rota agora decide regra.
function universoDeViagens(): Viagem[] {
  return [
    longaComMdfeAbertoHa(1),
    longaComMdfeAbertoHa(LIMIAR - AVISO),
    viagemRotaLonga({
      status: "entregue",
      iniciadaEm: diasAtras(LIMIAR + 5),
      entregueEm: diasAtras(1),
      documentos: [mdfe(LIMIAR + 5)],
    }),
    // Rota curta: dispara a F87 sozinha, e depois as duas juntas.
    curtaComMdfeAbertoHa(ROTA_CURTA),
    curtaComMdfeAbertoHa(LIMIAR + 1),
    // MDF-e sem CIOT
    viagemRotaLonga({ status: "em_transito", documentos: [mdfe(2, { temCiot: false })] }),
    // MDF-e em contingência dentro do prazo
    viagem({
      documentos: [
        documento({
          tipo: "mdfe",
          status: "contingencia",
          contingenciaDesde: horasAtras(100),
        }),
      ],
    }),
    // CT-e em contingência (não deve gerar nada)
    viagem({
      documentos: [
        documento({
          tipo: "cte",
          status: "contingencia",
          contingenciaDesde: horasAtras(100),
        }),
      ],
    }),
    // CT-e rejeitado e CT-e denegado
    viagem({
      documentos: [
        documento({
          tipo: "cte",
          status: "rejeitado",
          codigoRejeicao: "539",
          mensagemRejeicao: "Duplicidade de CT-e",
          explicacao: "Já existe um CT-e com esta chave.",
        }),
        documento({ tipo: "cte", status: "denegado", codigoRejeicao: "301" }),
      ],
    }),
    // Janela de cancelamento de CT-e em SP (UF verificada) e em GO (não verificada)
    viagemEm("SP", { documentos: [cte(744 - 12)] }),
    viagemEm("GO", { documentos: [cte(168 - 12)] }),
    // Duas placas iguais, para o ramo de conflito entre viagens
    viagem({ veiculo: { placa: "AAA1A11" }, documentos: [mdfe(3)] }),
    viagem({ veiculo: { placa: "AAA1A11" }, documentos: [mdfe(4)] }),
  ];
}

function universoDeRiscos(): Risco[] {
  const viagens = universoDeViagens();
  const orgs = [
    org(),
    org({ rntrcStatus: "suspenso" }),
    org({ segurosVerificadosEm: undefined }),
    org({ certificadoA1: { validoAte: diasAFrente(5) } }),
    org({ certificadoA1: { validoAte: diasAtras(3) } }),
  ];
  return orgs.flatMap((o) => riscosDaOrg(o, viagens, AGORA));
}

describe("invariante anti-alucinação — todo risco é rastreável", () => {
  it("o universo de teste é grande o bastante para valer alguma coisa", () => {
    const riscos = universoDeRiscos();
    expect(riscos.length).toBeGreaterThan(30);
    const tipos = [...new Set(riscos.map((r) => r.tipo))];
    expect(tipos).toContain("mdfe_aberto_bloqueando_veiculo");
    expect(tipos).toContain(TIPO_PLACA);
    expect(tipos).toContain(TIPO_CNPJ);
    expect(tipos).toContain("mdfe_sem_ciot");
    expect(tipos).toContain("contingencia_aberta");
    expect(tipos).toContain("cte_rejeitado_sem_tratamento");
    expect(tipos).toContain("janela_cancelamento_cte");
    expect(tipos).toContain("certificado_a1_vencendo");
    expect(tipos).toContain("rntrc_seguro_pendente");
  });

  it("as duas regras de bloqueio por tempo aparecem no universo, não só uma", () => {
    const riscos = universoDeRiscos();
    expect(doTipo(riscos, TIPO_PLACA).length).toBeGreaterThan(0);
    expect(doTipo(riscos, TIPO_CNPJ).length).toBeGreaterThan(0);
  });

  it("TODO risco tem fonte.descricao não vazia", () => {
    for (const r of universoDeRiscos()) {
      expect(r.fonte, `risco ${r.id} (${r.tipo}) sem fonte`).toBeDefined();
      expect(r.fonte.descricao.trim(), `risco ${r.id} (${r.tipo})`).not.toBe("");
      expect(r.fonte.confianca === "oficial" || r.fonte.confianca === "verificar").toBe(
        true,
      );
    }
  });

  it("TODO risco tem título e explicação não vazios", () => {
    for (const r of universoDeRiscos()) {
      expect(r.titulo.trim(), `risco ${r.id}`).not.toBe("");
      expect(r.explicacao.trim(), `risco ${r.id}`).not.toBe("");
    }
  });

  it("nenhuma contagemRegressiva é negativa ou NaN", () => {
    for (const r of universoDeRiscos()) {
      if (!r.contagemRegressiva) continue;
      expect(Number.isFinite(r.contagemRegressiva.restante), `risco ${r.id}`).toBe(true);
      expect(r.contagemRegressiva.restante, `risco ${r.id}`).toBeGreaterThan(0);
      expect(r.contagemRegressiva.ate.trim(), `risco ${r.id}`).not.toBe("");
    }
  });

  // O INVARIANTE. Era `it.fails` enquanto a janela de CT-e em UF não verificada
  // publicava relógio; virou afirmação positiva quando riscos.ts passou a
  // checar `janela.fonte.confianca`. E agora a lista de exceções é VAZIA: o
  // limiar do CNPJ, única exceção tolerada antes, deixou de ser exceção porque
  // a verificação de 16/09/2026 promoveu a fonte dele a 'oficial'.
  it("NENHUM risco de fonte `verificar` exibe contagem regressiva — zero exceções", () => {
    const infratores = universoDeRiscos()
      .filter((r) => r.fonte.confianca === "verificar")
      .filter((r) => r.contagemRegressiva !== undefined);

    expect(
      infratores.map((r) => `${r.tipo}: ${r.titulo} (${r.fonte.descricao})`),
      "risco com fonte não verificada exibindo contagem regressiva",
    ).toEqual([]);
  });

  it("e existe de fato risco de fonte `verificar` no universo — o invariante não passa por vacuidade", () => {
    const naoVerificados = universoDeRiscos().filter(
      (r) => r.fonte.confianca === "verificar",
    );
    expect(naoVerificados.length).toBeGreaterThan(0);
    for (const r of naoVerificados) expect(r.contagemRegressiva).toBeUndefined();
  });

  it("todo risco com contagem regressiva tem fonte oficial", () => {
    for (const r of universoDeRiscos()) {
      if (!r.contagemRegressiva) continue;
      expect(r.fonte.confianca, `${r.tipo}: ${r.titulo}`).toBe("oficial");
    }
  });
});

describe("invariante — MDF-e aberto nunca conta HORAS", () => {
  // Contar horas até "encerrar o MDF-e" implicaria um prazo regulamentar de
  // encerramento. Esse prazo não existe: as quatro regras do Anexo I contam
  // DIAS desde a autorização, e duas delas são imediatas. Se esta asserção
  // quebrar, o produto passou a inventar uma norma.
  const TIPOS_SEM_HORAS: Risco["tipo"][] = [
    "mdfe_aberto_bloqueando_veiculo",
    TIPO_PLACA,
    TIPO_CNPJ,
  ];

  it("nenhum risco de MDF-e aberto tem contagemRegressiva com tipo `horas`", () => {
    const infratores = universoDeRiscos()
      .filter((r) => TIPOS_SEM_HORAS.includes(r.tipo))
      .filter((r) => r.contagemRegressiva?.tipo === "horas");
    expect(infratores.map((r) => `${r.tipo}: ${r.titulo}`)).toEqual([]);
  });

  it("nem em idades extremas, nem em rota curta, nem em rota longa", () => {
    for (const d of [0, 1, ROTA_CURTA, LIMIAR - 1, LIMIAR, LIMIAR * 10, 400]) {
      for (const v of [curtaComMdfeAbertoHa(d), longaComMdfeAbertoHa(d)]) {
        for (const r of riscosDaViagem(v, AGORA).filter((x) =>
          TIPOS_SEM_HORAS.includes(x.tipo),
        )) {
          expect(r.contagemRegressiva?.tipo, `${d} dias / ${r.id}`).not.toBe("horas");
        }
      }
    }
  });

  it("o risco de bloqueio de veículo não tem contagem regressiva nenhuma", () => {
    const r = um(
      doTipo(
        riscosDaViagem(longaComMdfeAbertoHa(5), AGORA),
        "mdfe_aberto_bloqueando_veiculo",
      ),
    );
    expect(r).toBeDefined();
    expect(r.contagemRegressiva).toBeUndefined();
  });
});

// ============================================================================
describe("identidade dos riscos — ids carregam o documento", () => {
  // Era `it.fails`: os ids usavam só `v.id` e dois manifestos na mesma viagem
  // colidiam. Corrigido em riscos.ts para `${v.id}:${doc.id}:<sufixo>`.
  it("dois MDF-e abertos na MESMA viagem geram riscos com ids distintos", () => {
    const v = viagemRotaCurta({
      status: "em_transito",
      documentos: [
        mdfe(LIMIAR - 2, {
          temCiot: false,
          parUf: { carregamento: "SP", descarregamento: "MG" },
        }),
        mdfe(LIMIAR - 2, {
          temCiot: false,
          parUf: { carregamento: "RJ", descarregamento: "BA" },
        }),
      ],
    });
    const ids = riscosDaViagem(v, AGORA).map((r) => r.id);
    expect(ids.length).toBeGreaterThan(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo id de risco de documento contém o id do documento", () => {
    const v = viagemRotaCurta({
      status: "em_transito",
      documentos: [
        mdfe(LIMIAR - 2, { temCiot: false }),
        documento({ tipo: "cte", status: "rejeitado", codigoRejeicao: "539" }),
      ],
    });
    for (const r of riscosDaViagem(v, AGORA)) {
      if (!r.documentoId) continue;
      expect(r.id, `${r.tipo}`).toContain(r.documentoId);
      expect(r.id).toContain(v.id);
    }
  });

  it("riscos de viagens diferentes não colidem de id", () => {
    const a = viagemRotaCurta({ documentos: [mdfe(LIMIAR - 2, { temCiot: false })] });
    const b = viagemRotaCurta({ documentos: [mdfe(LIMIAR - 2, { temCiot: false })] });
    const ids = [...riscosDaViagem(a, AGORA), ...riscosDaViagem(b, AGORA)].map(
      (r) => r.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("o universo inteiro de uma org não tem id repetido", () => {
    const viagens = universoDeViagens();
    const ids = riscosDaOrg(org(), viagens, AGORA).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================================
describe("risco de bloqueio de veículo (F85 + F88)", () => {
  it("severidade sobe para bloqueante quando a viagem já foi entregue", () => {
    const emTransito = riscosDaViagem(longaComMdfeAbertoHa(1), AGORA);
    const entregue = riscosDaViagem(
      viagemRotaLonga({ status: "entregue", documentos: [mdfe(1)] }),
      AGORA,
    );
    expect(um(doTipo(emTransito, "mdfe_aberto_bloqueando_veiculo")).severidade).toBe(
      "alto",
    );
    expect(um(doTipo(entregue, "mdfe_aberto_bloqueando_veiculo")).severidade).toBe(
      "bloqueante",
    );
  });

  it("a explicação cita a UF de descarga E o sentido da volta — as duas regras", () => {
    const v = viagemRotaLonga({
      documentos: [mdfe(1, { parUf: { carregamento: "SP", descarregamento: "MG" } })],
    });
    const r = um(doTipo(riscosDaViagem(v, AGORA), "mdfe_aberto_bloqueando_veiculo"));
    expect(r.explicacao).toContain("descarga em MG");
    expect(r.explicacao).toContain("MG → SP"); // o manifesto da volta
  });

  it("avisa que há outra viagem barrada quando existe conflito real", () => {
    const a = viagem({
      numero: "V-A",
      veiculo: { placa: "AAA1A11" },
      documentos: [mdfe(1)],
    });
    const b = viagem({
      numero: "V-B",
      veiculo: { placa: "AAA1A11" },
      documentos: [mdfe(2)],
    });
    const r = um(
      doTipo(
        riscosDaViagem(a, AGORA, { viagens: [a, b] }),
        "mdfe_aberto_bloqueando_veiculo",
      ),
    );
    expect(r.explicacao).toMatch(/outra viagem barrada/i);
  });

  it("sem conflito, não insinua que existe outra viagem barrada", () => {
    const a = viagem({ veiculo: { placa: "AAA1A11" }, documentos: [mdfe(1)] });
    const r = um(
      doTipo(
        riscosDaViagem(a, AGORA, { viagens: [a] }),
        "mdfe_aberto_bloqueando_veiculo",
      ),
    );
    expect(r.explicacao).not.toMatch(/outra viagem barrada/i);
  });

  it("MDF-e sem parUf não gera risco de bloqueio de veículo", () => {
    const v = viagem({ documentos: [mdfe(1, { parUf: undefined })] });
    expect(
      doTipo(riscosDaViagem(v, AGORA), "mdfe_aberto_bloqueando_veiculo"),
    ).toHaveLength(0);
  });
});

// ============================================================================
describe("riscos da org", () => {
  it("certificado A1 vencido: sem contagem regressiva", () => {
    const riscos = riscosDaOrg(
      org({ certificadoA1: { validoAte: diasAtras(2) } }),
      [],
      AGORA,
    );
    const r = um(doTipo(riscos, "certificado_a1_vencendo"));
    expect(r.severidade).toBe("critico");
    expect(r.contagemRegressiva).toBeUndefined();
    expect(r.titulo).toMatch(/vencido/i);
  });

  it("certificado A1 fora da faixa de aviso: nenhum risco", () => {
    const riscos = riscosDaOrg(
      org({ certificadoA1: { validoAte: diasAFrente(200) } }),
      [],
      AGORA,
    );
    expect(doTipo(riscos, "certificado_a1_vencendo")).toHaveLength(0);
  });

  it("RNTRC suspenso é bloqueante; seguros não verificados é alto", () => {
    const suspenso = um(
      doTipo(
        riscosDaOrg(org({ rntrcStatus: "suspenso" }), [], AGORA),
        "rntrc_seguro_pendente",
      ),
    );
    const semVerificacao = um(
      doTipo(
        riscosDaOrg(org({ segurosVerificadosEm: undefined }), [], AGORA),
        "rntrc_seguro_pendente",
      ),
    );
    expect(suspenso.severidade).toBe("bloqueante");
    expect(semVerificacao.severidade).toBe("alto");
  });

  it("org em dia não gera risco de org", () => {
    expect(riscosDaOrg(org(), [], AGORA)).toHaveLength(0);
  });
});

// ============================================================================
describe("ordenação e contagem", () => {
  it("ordena bloqueante > critico > alto > medio e não muta a entrada", () => {
    const riscos = universoDeRiscos();
    const original = [...riscos];
    const ordenados = ordenarRiscos(riscos);
    expect(riscos).toEqual(original);
    const peso = { bloqueante: 0, critico: 1, alto: 2, medio: 3 };
    for (let i = 1; i < ordenados.length; i++) {
      const atual = ordenados[i];
      const anterior = ordenados[i - 1];
      if (!atual || !anterior) throw new Error("índice fora da lista ordenada");
      expect(peso[atual.severidade]).toBeGreaterThanOrEqual(peso[anterior.severidade]);
    }
  });

  it("contarPorSeveridade soma o total", () => {
    const riscos = universoDeRiscos();
    const c = contarPorSeveridade(riscos);
    expect(c.bloqueante + c.critico + c.alto + c.medio).toBe(riscos.length);
  });
});

// ============================================================================
describe("janela de cancelamento do CT-e — afirma onde leu, qualifica onde não leu", () => {
  it("não avisa enquanto faltar mais de 48h", () => {
    const v = viagemEm("SP", { documentos: [cte(744 - 60)] });
    expect(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte")).toHaveLength(0);
  });

  it("SP (UF lida): afirma o relógio, conta em horas, fonte oficial", () => {
    const v = viagemEm("SP", { documentos: [cte(744 - 10)] });
    const r = um(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte"));
    expect(r.fonte.confianca).toBe("oficial");
    expect(r.contagemRegressiva).toEqual({
      tipo: "horas",
      restante: 10,
      ate: "fim da janela de cancelamento",
    });
    expect(r.titulo).toContain("10h");
    expect(r.explicacao).toMatch(/restam 10h para cancelar em SP/i);
  });

  it("GO (UF NÃO lida): NÃO afirma relógio nenhum — era o bug 1, agora é garantia", () => {
    const v = viagemEm("GO", { documentos: [cte(168 - 12)] });
    const r = um(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte"));
    expect(r).toBeDefined();
    expect(r.fonte.confianca).toBe("verificar");
    expect(r.contagemRegressiva).toBeUndefined();
    expect(r.titulo).toBe("Janela de cancelamento do CT-e se aproximando");
    expect(r.titulo).not.toMatch(/\d+\s*h/);
  });

  it("GO: a explicação diz que o prazo daquela UF não foi verificado e pode ser outro", () => {
    const v = viagemEm("GO", { documentos: [cte(168 - 12)] });
    const r = um(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte"));
    expect(r.explicacao).toMatch(/regra nacional/i);
    expect(r.explicacao).toMatch(/não foi verificad/i);
    expect(r.explicacao).toMatch(/pode ser diferente/i);
    expect(r.explicacao).toContain("GO");
    // O número nacional pode aparecer no texto, desde que qualificado por
    // "cerca de" e sem virar contagem regressiva no painel.
    expect(r.explicacao).toMatch(/cerca de/i);
  });

  it("SC também foi lida: se comporta como SP, não como GO", () => {
    const v = viagemEm("SC", { documentos: [cte(168 - 10)] });
    const r = um(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte"));
    expect(r.fonte.confianca).toBe("oficial");
    expect(r.contagemRegressiva?.tipo).toBe("horas");
  });

  it("a diferença entre UF lida e não lida está SÓ na afirmação, não na existência do aviso", () => {
    const sp = doTipo(
      riscosDaViagem(viagemEm("SP", { documentos: [cte(744 - 12)] }), AGORA),
      "janela_cancelamento_cte",
    );
    const go = doTipo(
      riscosDaViagem(viagemEm("GO", { documentos: [cte(168 - 12)] }), AGORA),
      "janela_cancelamento_cte",
    );
    expect(sp).toHaveLength(1);
    expect(go).toHaveLength(1); // o usuário é avisado nos dois casos
    expect(um(sp).contagemRegressiva).toBeDefined();
    expect(um(go).contagemRegressiva).toBeUndefined();
  });

  it("viagem já iniciada não mostra janela: o fato gerador ocorreu", () => {
    const v = viagemEm("SP", { documentos: [cte(744 - 10)], iniciadaEm: horasAtras(5) });
    expect(doTipo(riscosDaViagem(v, AGORA), "janela_cancelamento_cte")).toHaveLength(0);
  });
});
