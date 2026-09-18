import Link from "next/link";

import { url } from "@/app/_lib/parametros";
import { Icone } from "./Icone";
import { ITENS_NAV } from "./itens-nav";
import s from "./Sidebar.module.css";

/**
 * Navegação. A rota ativa chega do servidor (a página sabe onde está), então
 * este componente não precisa de cliente nem de `usePathname`.
 */
export function Nav({
  rotaAtiva,
  orgId,
}: {
  rotaAtiva: string;
  orgId?: string | undefined;
}) {
  return (
    <nav className={s.nav}>
      {ITENS_NAV.map((item) => {
        const ativo = rotaAtiva === item.href || rotaAtiva.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={url(item.href, { org: orgId })}
            className={s.item}
            aria-current={ativo ? "page" : undefined}
            title={item.rotulo}
          >
            <span className={s.itemIcone}>
              <Icone nome={item.icone} />
            </span>
            <span className={s.itemRotulo}>{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
