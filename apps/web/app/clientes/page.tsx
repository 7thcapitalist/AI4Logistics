import type { Metadata } from "next";

import { lerOrg, type ParamsBrutos } from "@/app/_lib/parametros";
import { EmBreve } from "@/components/shell/EmBreve";
import { t } from "@/lib/i18n/pt-BR";

export const metadata: Metadata = { title: `${t.nav.clientes} · ${t.app.nome}` };

export default function PaginaClientes({ searchParams }: { searchParams: ParamsBrutos }) {
  return (
    <EmBreve titulo={t.nav.clientes} rota="/clientes" orgId={lerOrg(searchParams)} />
  );
}
