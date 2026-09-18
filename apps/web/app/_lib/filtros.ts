// ============================================================================
// Abas, filtros e ordenação da lista de viagens.
//
// Nada aqui decide transição de estado nem calcula risco: isso é do core. Aqui
// só se escolhe o que entra na lista e em que ordem.
// ============================================================================

import type { Risco, RiscoSeveridade, Viagem } from "@ai4l/core";
import { entregueNaoEncerrada } from "@ai4l/core";

import {
  STATUS_VIAGEM,
  type Aba,
  type CampoOrdem,
  type ConsultaViagens,
  type Direcao,
} from "./parametros";

const ORDEM_SEVERIDADE: Record<RiscoSeveridade, number> = {
  bloqueante: 0,
  critico: 1,
  alto: 2,
  medio: 3,
};

/** Status que já saíram do ciclo ativo. Usado só para a aba "Encerradas". */
const STATUS_FINALIZADOS = new Set<string>(["encerrada", "acertada", "cancelada"]);

export function riscoMaisGrave(riscos: Risco[] | undefined): Risco | undefined {
  if (!riscos || riscos.length === 0) return undefined;
  return [...riscos].sort(
    (a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade],
  )[0];
}

export function temSeveridade(
  riscos: Risco[] | undefined,
  nivel: RiscoSeveridade,
): boolean {
  return (riscos ?? []).some((r) => r.severidade === nivel);
}

// ------------------------------------------------------------------- abas

export function passaNaAba(v: Viagem, aba: Aba, riscos: Risco[] | undefined): boolean {
  switch (aba) {
    case "todas":
      return true;
    case "abertas":
      return !STATUS_FINALIZADOS.has(v.status);
    case "risco":
      return (riscos ?? []).length > 0;
    case "entregues_nao_encerradas":
      return entregueNaoEncerrada(v);
    case "encerradas":
      return v.status === "encerrada" || v.status === "acertada";
  }
}

export function contarNaAba(
  viagens: Viagem[],
  aba: Aba,
  mapa: Map<string, Risco[]>,
): number {
  return viagens.filter((v) => passaNaAba(v, aba, mapa.get(v.id))).length;
}

// ------------------------------------------------------------------ busca

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function textoBuscavel(v: Viagem): string {
  return normalizar(
    [
      v.numero,
      v.tomador.nome,
      v.remetente.nome,
      v.destinatario.nome,
      v.veiculo.placa,
      v.motorista.nome,
      v.origem.municipio,
      v.origem.uf,
      v.destino.municipio,
      v.destino.uf,
      v.carga.produtoPredominante,
    ].join(" "),
  );
}

// ---------------------------------------------------------------- filtros

export function filtrarViagens(
  viagens: Viagem[],
  consulta: ConsultaViagens,
  mapa: Map<string, Risco[]>,
): Viagem[] {
  const alvo = consulta.busca ? normalizar(consulta.busca) : undefined;

  return viagens.filter((v) => {
    const riscos = mapa.get(v.id);
    if (!passaNaAba(v, consulta.aba, riscos)) return false;
    if (consulta.severidade && !temSeveridade(riscos, consulta.severidade)) return false;
    if (consulta.status && v.status !== consulta.status) return false;
    if (consulta.veiculo && v.veiculo.placa !== consulta.veiculo) return false;
    if (consulta.tomador && v.tomador.nome !== consulta.tomador) return false;
    if (alvo && !textoBuscavel(v).includes(alvo)) return false;
    return true;
  });
}

// -------------------------------------------------------------- ordenação

const POSICAO_STATUS = new Map<string, number>(
  STATUS_VIAGEM.map((s, i) => [s, i] as const),
);

function comparar(a: Viagem, b: Viagem, campo: CampoOrdem): number {
  switch (campo) {
    case "status":
      return (POSICAO_STATUS.get(a.status) ?? 0) - (POSICAO_STATUS.get(b.status) ?? 0);
    case "numero":
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    case "valor":
      return a.valorFreteCentavos - b.valorFreteCentavos;
    case "atualizada":
      return a.atualizadaEm - b.atualizadaEm;
  }
}

export function ordenarViagens(
  viagens: Viagem[],
  campo: CampoOrdem,
  dir: Direcao,
): Viagem[] {
  const sinal = dir === "asc" ? 1 : -1;
  return [...viagens].sort((a, b) => comparar(a, b, campo) * sinal);
}

// ----------------------------------------------------- opções dos filtros

export function opcoesDeFiltro(viagens: Viagem[]): {
  veiculos: string[];
  tomadores: string[];
  status: string[];
} {
  const veiculos = new Set<string>();
  const tomadores = new Set<string>();
  const status = new Set<string>();
  for (const v of viagens) {
    veiculos.add(v.veiculo.placa);
    tomadores.add(v.tomador.nome);
    status.add(v.status);
  }
  const ordenar = (a: string, b: string) => a.localeCompare(b, "pt-BR");
  return {
    veiculos: [...veiculos].sort(ordenar),
    tomadores: [...tomadores].sort(ordenar),
    status: STATUS_VIAGEM.filter((s) => status.has(s)),
  };
}
