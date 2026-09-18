// ============================================================================
// Máquina de estados da viagem.
//
// PROPOSTA, pendente de revisão humana (ADR 0007). As três decisões que ela
// toma e que precisam ser confirmadas:
//
//  1. `encerrada` NÃO exige passar por `entregue`. Transbordo, redespacho e
//     retenção parcial encerram o MDF-e sem que tenha havido entrega. Por isso
//     `em_transito -> encerrada` é permitido.
//  2. Não há caminho de volta de `encerrada`. O evento 110112 é irreversível.
//  3. `cancelada` é alcançável de qualquer estado anterior ao trânsito, e
//     nunca depois: viagem iniciada não se cancela, se encerra.
// ============================================================================

import type { ViagemStatus } from "./tipos";

const MAPA: Record<ViagemStatus, ViagemStatus[]> = {
  rascunho: ["documentos_pendentes", "cancelada"],
  documentos_pendentes: ["em_emissao", "cancelada"],
  em_emissao: ["pronta", "documentos_pendentes", "cancelada"],
  pronta: ["em_transito", "documentos_pendentes", "cancelada"],
  // Sai do trânsito por entrega OU direto para encerrada (transbordo, retenção).
  em_transito: ["entregue", "encerrada"],
  entregue: ["encerrada"],
  encerrada: ["acertada"],
  acertada: [],
  cancelada: [],
};

export function transicoesPermitidas(status: ViagemStatus): ViagemStatus[] {
  return MAPA[status];
}

export function podeTransicionar(de: ViagemStatus, para: ViagemStatus): boolean {
  return MAPA[de].includes(para);
}

/** Estados em que a viagem já saiu e ainda não teve o manifesto encerrado. */
export const STATUS_ABERTOS: ViagemStatus[] = ["em_transito", "entregue"];

/**
 * A lacuna que o produto existe para fechar: entregue e ainda não encerrada.
 * Se em algum lugar do código estes dois virarem sinônimos, o produto perdeu
 * a razão de existir.
 */
export function entregueNaoEncerrada(v: {
  status: ViagemStatus;
  documentos: { tipo: string; status: string }[];
}): boolean {
  if (v.status !== "entregue") return false;
  return v.documentos.some((d) => d.tipo === "mdfe" && d.status === "autorizado");
}
