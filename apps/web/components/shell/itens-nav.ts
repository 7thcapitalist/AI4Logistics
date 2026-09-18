import { t } from "@/lib/i18n/pt-BR";
import type { NomeIcone } from "./Icone";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: NomeIcone;
  /** Área ainda não construída: leva a uma página "em breve". */
  emBreve?: boolean;
};

export const ITENS_NAV: ItemNav[] = [
  { href: "/viagens", rotulo: t.nav.viagens, icone: "viagens" },
  { href: "/documentos", rotulo: t.nav.documentos, icone: "documentos", emBreve: true },
  { href: "/acertos", rotulo: t.nav.acertos, icone: "acertos", emBreve: true },
  { href: "/veiculos", rotulo: t.nav.veiculos, icone: "veiculos", emBreve: true },
  { href: "/motoristas", rotulo: t.nav.motoristas, icone: "motoristas", emBreve: true },
  { href: "/clientes", rotulo: t.nav.clientes, icone: "clientes", emBreve: true },
  {
    href: "/conformidade",
    rotulo: t.nav.conformidade,
    icone: "conformidade",
    emBreve: true,
  },
];
