import Link from "next/link";

import { ABAS_VIAGEM, url, type AbaViagem } from "@/app/_lib/parametros";
import { t } from "@/lib/i18n/pt-BR";
import s from "./Viagem.module.css";

/** Abas da viagem. Vivem na URL: sem estado de cliente, o link abre a aba certa. */
export function AbasViagem({
  viagemId,
  abaAtual,
  orgId,
}: {
  viagemId: string;
  abaAtual: AbaViagem;
  orgId?: string | undefined;
}) {
  return (
    <nav className={s.abas} aria-label={t.viagem.abas.rotulo}>
      {ABAS_VIAGEM.map((aba) => (
        <Link
          key={aba}
          href={url(`/viagens/${viagemId}`, {
            org: orgId,
            aba: aba === "resumo" ? undefined : aba,
          })}
          className={s.aba}
          aria-current={aba === abaAtual ? "page" : undefined}
        >
          {t.viagem.abas[aba]}
        </Link>
      ))}
    </nav>
  );
}
