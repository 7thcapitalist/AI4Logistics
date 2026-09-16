// ============================================================================
// Acesso aos dados (hoje: fixtures) e resolução da organização ativa.
//
// Nenhuma regra de negócio aqui. Só seleção e leitura.
// ============================================================================

import type { Org, Risco, Viagem } from "@ai4l/core";
import { riscosDaOrg, riscosDaViagem } from "@ai4l/core";
import {
  AGORA,
  ORGS,
  ORG_PADRAO,
  orgPorId,
  viagemPorId,
  viagensDaOrg,
} from "@/lib/fixtures";

/**
 * `ORG_PADRAO` pode chegar como a organização inteira ou só como o id.
 * Aceita os dois para não depender da forma exata do fixture.
 */
export function idOrgPadrao(): string {
  const padrao: unknown = ORG_PADRAO;
  return typeof padrao === "string" ? padrao : (padrao as Org).id;
}

export function listaOrgs(): Org[] {
  const orgs: unknown = ORGS;
  return Array.isArray(orgs) ? (orgs as Org[]) : (Object.values(orgs as object) as Org[]);
}

export function resolverOrg(orgId?: string): Org | undefined {
  return orgPorId(orgId ?? idOrgPadrao()) ?? orgPorId(idOrgPadrao());
}

export function viagensDe(org: Org): Viagem[] {
  return viagensDaOrg(org.id);
}

export function buscarViagem(id: string): Viagem | undefined {
  return viagemPorId(id);
}

/** Riscos de toda a organização, viagem a viagem incluída. */
export function riscosDaOperacao(org: Org, viagens: Viagem[]): Risco[] {
  return riscosDaOrg(org, viagens, AGORA);
}

/** Riscos por viagem, indexados por id, calculados uma vez só. */
export function mapaDeRiscos(viagens: Viagem[]): Map<string, Risco[]> {
  const mapa = new Map<string, Risco[]>();
  for (const v of viagens) {
    mapa.set(v.id, riscosDaViagem(v, AGORA, { viagens }));
  }
  return mapa;
}

export { AGORA };
