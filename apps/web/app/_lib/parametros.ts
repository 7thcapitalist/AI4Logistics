// ============================================================================
// Leitura e escrita dos parâmetros de URL.
//
// TODO estado de filtro, aba e ordenação vive na URL. Nada de estado de
// cliente: a página tem que ser colável num WhatsApp e o botão voltar tem que
// funcionar.
// ============================================================================

import type { RiscoSeveridade, ViagemStatus } from "@ai4l/core";

export type ParamsBrutos = Record<string, string | string[] | undefined>;

export const ABAS = [
  "todas",
  "abertas",
  "risco",
  "entregues_nao_encerradas",
  "encerradas",
] as const;
export type Aba = (typeof ABAS)[number];

export const CAMPOS_ORDEM = ["status", "numero", "valor", "atualizada"] as const;
export type CampoOrdem = (typeof CAMPOS_ORDEM)[number];

export type Direcao = "asc" | "desc";

export const SEVERIDADES: readonly RiscoSeveridade[] = [
  "bloqueante",
  "critico",
  "alto",
  "medio",
] as const;

export const STATUS_VIAGEM: readonly ViagemStatus[] = [
  "rascunho",
  "documentos_pendentes",
  "em_emissao",
  "pronta",
  "em_transito",
  "entregue",
  "encerrada",
  "acertada",
  "cancelada",
] as const;

export const ABAS_VIAGEM = ["resumo", "documentos", "linha", "carga", "acerto"] as const;
export type AbaViagem = (typeof ABAS_VIAGEM)[number];

/** Nomes dos parâmetros. Um lugar só, para não haver typo espalhado. */
export const P = {
  org: "org",
  aba: "aba",
  severidade: "severidade",
  status: "status",
  veiculo: "veiculo",
  tomador: "tomador",
  busca: "busca",
  ordenar: "ordenar",
  dir: "dir",
} as const;

function um(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === undefined) return undefined;
  const limpo = s.trim();
  return limpo === "" ? undefined : limpo;
}

function umDe<T extends string>(
  v: string | string[] | undefined,
  permitidos: readonly T[],
): T | undefined {
  const s = um(v);
  if (s === undefined) return undefined;
  return (permitidos as readonly string[]).includes(s) ? (s as T) : undefined;
}

/**
 * Os campos opcionais são `?: T | undefined`, não `?: T`.
 *
 * O tsconfig da raiz liga `exactOptionalPropertyTypes`, sob o qual "chave
 * ausente" e "chave presente valendo undefined" são tipos diferentes. Para um
 * saco de parâmetros de URL os dois são a mesma coisa — o filtro não foi
 * informado — e o parser devolve `undefined` naturalmente. Onde a diferença
 * importa de verdade (o modelo de domínio em @ai4l/core) a chave é omitida.
 */
export type ConsultaViagens = {
  org?: string | undefined;
  aba: Aba;
  severidade?: RiscoSeveridade | undefined;
  status?: ViagemStatus | undefined;
  veiculo?: string | undefined;
  tomador?: string | undefined;
  busca?: string | undefined;
  ordenar: CampoOrdem;
  dir: Direcao;
};

export function lerConsultaViagens(sp: ParamsBrutos): ConsultaViagens {
  return {
    org: um(sp[P.org]),
    aba: umDe(sp[P.aba], ABAS) ?? "todas",
    severidade: umDe(sp[P.severidade], SEVERIDADES),
    status: umDe(sp[P.status], STATUS_VIAGEM),
    veiculo: um(sp[P.veiculo]),
    tomador: um(sp[P.tomador]),
    busca: um(sp[P.busca]),
    ordenar: umDe(sp[P.ordenar], CAMPOS_ORDEM) ?? "atualizada",
    dir: umDe<Direcao>(sp[P.dir], ["asc", "desc"]) ?? "desc",
  };
}

export function lerAbaViagem(sp: ParamsBrutos): AbaViagem {
  return umDe(sp[P.aba], ABAS_VIAGEM) ?? "resumo";
}

export function lerOrg(sp: ParamsBrutos): string | undefined {
  return um(sp[P.org]);
}

/** Monta uma URL descartando parâmetro vazio, nulo ou igual ao padrão. */
export function url(
  base: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const qs = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue;
    qs.set(chave, String(valor));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** URL da lista de viagens a partir de uma consulta, com trocas pontuais. */
export function urlViagens(
  consulta: ConsultaViagens,
  trocas: Partial<ConsultaViagens> = {},
): string {
  const c = { ...consulta, ...trocas };
  return url("/viagens", {
    [P.org]: c.org,
    [P.aba]: c.aba === "todas" ? undefined : c.aba,
    [P.severidade]: c.severidade,
    [P.status]: c.status,
    [P.veiculo]: c.veiculo,
    [P.tomador]: c.tomador,
    [P.busca]: c.busca,
    [P.ordenar]: c.ordenar === "atualizada" ? undefined : c.ordenar,
    [P.dir]: c.dir === "desc" ? undefined : c.dir,
  });
}

export const CONSULTA_VAZIA: ConsultaViagens = {
  aba: "todas",
  ordenar: "atualizada",
  dir: "desc",
};

export function temFiltroAtivo(c: ConsultaViagens): boolean {
  return Boolean(c.severidade || c.status || c.veiculo || c.tomador || c.busca);
}
