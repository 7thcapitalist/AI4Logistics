// Formatação. Fica no core porque é regra de apresentação de dado fiscal,
// não decisão de layout.

/**
 * Dinheiro NÃO se formata aqui. Use `formatBRL` de ../money.
 *
 * Existia aqui um `formatarCentavos` que devolvia "8.420,00" sem prefixo, e o
 * componente Dinheiro colava o "R$ " por fora. Duas metades da mesma regra em
 * dois pacotes diferentes é como se produz "R$ R$ 8.420,00". `formatBRL` já
 * devolve "R$ 8.420,00" inteiro e é a única forma de renderizar centavos.
 */

/** Chave de acesso de 44 dígitos -> "352609…843390". Nunca inteira em tabela. */
export function truncarChave(chave: string): string {
  if (chave.length <= 14) return chave;
  return `${chave.slice(0, 6)}…${chave.slice(-6)}`;
}

/** Agrupa a chave em blocos de 4 para leitura no detalhe. */
export function agruparChave(chave: string): string {
  return (chave.match(/.{1,4}/g) ?? []).join(" ");
}

const FMT_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatarDataHora(epochMs: number): string {
  return FMT_DATA.format(new Date(epochMs));
}

export function formatarRelativo(epochMs: number, agora: number): string {
  const d = agora - epochMs;
  const min = Math.round(d / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.round(h / 24);
  if (dias < 30) return `há ${dias} dia${dias === 1 ? "" : "s"}`;
  const meses = Math.round(dias / 30);
  return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
}
