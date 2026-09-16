import type { ReactNode } from "react";
import { contarPorSeveridade } from "@ai4l/core";
import { EstadoErro } from "@ai4l/ui";

import { listaOrgs, resolverOrg, riscosDaOperacao, viagensDe } from "@/app/_lib/dados";
import { t } from "@/lib/i18n/pt-BR";
import { Shell } from "./Shell";

/**
 * Resolve a organização ativa, calcula as contagens de risco e entrega a
 * moldura pronta. Toda página passa por aqui, inclusive as que ainda são
 * stub — o bloco de saúde da operação precisa aparecer em todas.
 */
export function MolduraPagina({
  orgId,
  titulo,
  rotaAtiva,
  destinoTrocaOrg,
  children,
}: {
  orgId?: string | undefined;
  titulo: string;
  rotaAtiva: string;
  destinoTrocaOrg?: string | undefined;
  children: ReactNode;
}) {
  const org = resolverOrg(orgId);

  if (!org) {
    return <EstadoErro titulo={t.erroGeral.titulo} descricao={t.erroGeral.descricao} />;
  }

  const viagens = viagensDe(org);
  const contagens = contarPorSeveridade(riscosDaOperacao(org, viagens));

  return (
    <Shell
      org={org}
      orgs={listaOrgs()}
      titulo={titulo}
      contagens={contagens}
      rotaAtiva={rotaAtiva}
      destinoTrocaOrg={destinoTrocaOrg}
    >
      {children}
    </Shell>
  );
}
