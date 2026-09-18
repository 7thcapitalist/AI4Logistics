// ============================================================================
// Ponto de entrada das fixtures.
//
// A UI NUNCA importa viagens-org1 nem viagens-org2 direto. Ela passa por
// `viagensDaOrg`, que é o único lugar onde o filtro de orgId existe. Uma porta
// só é uma porta que dá para auditar: quando o banco entrar no lugar das
// fixtures, é esta assinatura que vira query com `where org_id = $1`.
// ============================================================================

import type { Org, Viagem } from "@ai4l/core";
import { ORGS } from "./orgs";
import { VIAGENS_ORG1 } from "./viagens-org1";
import { VIAGENS_ORG2 } from "./viagens-org2";

export { AGORA } from "./viagens-org1";
export { ORGS } from "./orgs";

/** Tenant aberto por padrão. A org-2 existe para o vazamento aparecer. */
export const ORG_PADRAO = "org-1";

const TODAS: Viagem[] = [...VIAGENS_ORG1, ...VIAGENS_ORG2];

/**
 * Todas as viagens de todos os tenants. NÃO use em tela: só em ferramenta de
 * teste, em script de validação e no seed do banco.
 */
export function todasViagens(): Viagem[] {
  return TODAS;
}

/**
 * O único caminho que a UI usa para chegar em viagem.
 *
 * Filtra por orgId e nada mais. Se este filtro sumir, a placa e o CNPJ da
 * outra transportadora aparecem na primeira tela que carregar.
 */
export function viagensDaOrg(orgId: string): Viagem[] {
  return TODAS.filter((v) => v.orgId === orgId);
}

export function viagemPorId(id: string): Viagem | undefined {
  return TODAS.find((v) => v.id === id);
}

export function orgPorId(id: string): Org | undefined {
  return ORGS.find((o) => o.id === id);
}
