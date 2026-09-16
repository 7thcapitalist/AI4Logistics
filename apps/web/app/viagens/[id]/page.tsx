import { notFound } from "next/navigation";
import { riscosDaViagem } from "@ai4l/core";

import { AGORA, buscarViagem, resolverOrg, viagensDe } from "@/app/_lib/dados";
import { lerAbaViagem, url, type ParamsBrutos } from "@/app/_lib/parametros";
import { MolduraPagina } from "@/components/shell/MolduraPagina";
import { AbasViagem } from "@/components/viagem/AbasViagem";
import { AncoraDocumento } from "@/components/viagem/AncoraDocumento";
import { AcertoViagem, CargaViagem } from "@/components/viagem/CargaViagem";
import { CabecalhoViagem } from "@/components/viagem/CabecalhoViagem";
import { DocumentosViagem } from "@/components/viagem/DocumentosViagem";
import { LinhaDoTempo } from "@/components/viagem/LinhaDoTempo";
import { ResumoViagem } from "@/components/viagem/ResumoViagem";
import { t } from "@/lib/i18n/pt-BR";

export default function PaginaViagem({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: ParamsBrutos;
}) {
  const viagem = buscarViagem(params.id);
  if (!viagem) notFound();

  const aba = lerAbaViagem(searchParams);

  // A organização vem da viagem, não da URL: abrir o link de uma viagem não
  // pode mostrar os números de outra organização na barra lateral.
  const org = resolverOrg(viagem.orgId);
  const viagensDaMesmaOrg = org ? viagensDe(org) : [viagem];

  // O bloqueio de veículo depende das outras viagens, por isso o contexto.
  const riscos = riscosDaViagem(viagem, AGORA, { viagens: viagensDaMesmaOrg });

  return (
    <MolduraPagina
      orgId={viagem.orgId}
      titulo={`${t.viagem.cabecalho.viagem} ${viagem.numero}`}
      rotaAtiva="/viagens"
      destinoTrocaOrg="/viagens"
    >
      <AncoraDocumento
        abaAtual={aba}
        destinoDocumentos={url(`/viagens/${viagem.id}`, {
          org: viagem.orgId,
          aba: "documentos",
        })}
      />

      <CabecalhoViagem viagem={viagem} orgId={viagem.orgId} />
      <AbasViagem viagemId={viagem.id} abaAtual={aba} orgId={viagem.orgId} />

      {aba === "resumo" ? <ResumoViagem viagem={viagem} riscos={riscos} /> : null}
      {aba === "documentos" ? <DocumentosViagem viagem={viagem} riscos={riscos} /> : null}
      {aba === "linha" ? <LinhaDoTempo viagem={viagem} /> : null}
      {aba === "carga" ? <CargaViagem viagem={viagem} /> : null}
      {aba === "acerto" ? <AcertoViagem /> : null}
    </MolduraPagina>
  );
}
