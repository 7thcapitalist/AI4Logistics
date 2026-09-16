import { redirect } from "next/navigation";

import { lerOrg, url, type ParamsBrutos } from "@/app/_lib/parametros";

/** A casa do produto é a lista de viagens. */
export default function Inicio({ searchParams }: { searchParams: ParamsBrutos }) {
  redirect(url("/viagens", { org: lerOrg(searchParams) }));
}
