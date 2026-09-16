import type { ReactNode } from "react";
import type { Org, RiscoSeveridade } from "@ai4l/core";

import { t } from "@/lib/i18n/pt-BR";
import { Nav } from "./Nav";
import { SaudeOperacao } from "./SaudeOperacao";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import s from "./Shell.module.css";

/**
 * Moldura de toda tela: barra lateral com navegação e saúde da operação,
 * barra superior e o conteúdo.
 *
 * É Server Component. A organização ativa e as contagens de risco chegam
 * prontas de quem chamou, porque `layout.tsx` não recebe searchParams e a
 * organização vive na URL — então quem monta a moldura é a página.
 */
export function Shell({
  org,
  orgs,
  titulo,
  contagens,
  rotaAtiva,
  destinoTrocaOrg = "/viagens",
  children,
}: {
  org: Org;
  orgs: Org[];
  titulo: string;
  contagens: Record<RiscoSeveridade, number>;
  rotaAtiva: string;
  destinoTrocaOrg?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={s.shell}>
      <a className={s.atalho} href="#conteudo">
        {t.comum.irParaConteudo}
      </a>

      <Sidebar>
        <Nav rotaAtiva={rotaAtiva} orgId={org.id} />
        <SaudeOperacao contagens={contagens} orgId={org.id} />
      </Sidebar>

      <Topbar
        titulo={titulo}
        orgs={orgs.map((o) => ({ id: o.id, nome: o.nome }))}
        orgAtual={org.id}
        destinoTrocaOrg={destinoTrocaOrg}
      />

      <main className={s.principal} id="conteudo">
        <div className={s.interno}>{children}</div>
      </main>
    </div>
  );
}
