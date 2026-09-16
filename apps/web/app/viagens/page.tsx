import type { Metadata } from "next";
import { EstadoVazio } from "@ai4l/ui";

import { mapaDeRiscos, resolverOrg, riscosDaOperacao, viagensDe } from "@/app/_lib/dados";
import {
  contarNaAba,
  filtrarViagens,
  opcoesDeFiltro,
  ordenarViagens,
} from "@/app/_lib/filtros";
import {
  ABAS,
  lerConsultaViagens,
  type Aba,
  type ParamsBrutos,
} from "@/app/_lib/parametros";
import { PainelRiscos } from "@/components/riscos/PainelRiscos";
import { MolduraPagina } from "@/components/shell/MolduraPagina";
import { Abas } from "@/components/viagens/Abas";
import { Filtros } from "@/components/viagens/Filtros";
import { TabelaViagens } from "@/components/viagens/TabelaViagens";
import { t } from "@/lib/i18n/pt-BR";
import s from "@/components/viagens/Lista.module.css";

export const metadata: Metadata = { title: `${t.viagens.titulo} · ${t.app.nome}` };

export default function PaginaViagens({ searchParams }: { searchParams: ParamsBrutos }) {
  const consultaBruta = lerConsultaViagens(searchParams);
  const org = resolverOrg(consultaBruta.org);

  if (!org) {
    return (
      <MolduraPagina titulo={t.viagens.titulo} rotaAtiva="/viagens">
        <EstadoVazio
          titulo={t.viagens.vazioTotal.titulo}
          descricao={t.viagens.vazioTotal.descricao}
        />
      </MolduraPagina>
    );
  }

  // A organização resolvida volta para a consulta: assim todo link gerado
  // daqui em diante carrega a organização certa.
  const consulta = { ...consultaBruta, org: org.id };

  const viagens = viagensDe(org);
  const riscosPorViagem = mapaDeRiscos(viagens);

  const contagensAbas = ABAS.reduce(
    (acc, aba) => {
      acc[aba] = contarNaAba(viagens, aba, riscosPorViagem);
      return acc;
    },
    {} as Record<Aba, number>,
  );

  const filtradas = ordenarViagens(
    filtrarViagens(viagens, consulta, riscosPorViagem),
    consulta.ordenar,
    consulta.dir,
  );

  const opcoes = opcoesDeFiltro(viagens);

  // Riscos que não pertencem a nenhuma viagem (certificado, RNTRC) entram na
  // contagem da barra lateral. Se o filtro por gravidade escondesse isso, a
  // lista não bateria com a contagem e o produto estaria mentindo.
  const mostrarRiscosDaOrg = Boolean(consulta.severidade) || consulta.aba === "risco";
  const riscosSoltos = mostrarRiscosDaOrg
    ? riscosDaOperacao(org, viagens).filter(
        (r) =>
          !r.viagemId && (!consulta.severidade || r.severidade === consulta.severidade),
      )
    : [];

  return (
    <MolduraPagina orgId={org.id} titulo={t.viagens.titulo} rotaAtiva="/viagens">
      <div className={s.topo}>
        <Abas consulta={consulta} contagens={contagensAbas} />
        <Filtros
          consulta={consulta}
          veiculos={opcoes.veiculos}
          tomadores={opcoes.tomadores}
          status={opcoes.status}
        />
        <p className={s.resumo}>{t.viagens.resumo(filtradas.length, viagens.length)}</p>
      </div>

      {riscosSoltos.length > 0 ? (
        <div className={s.riscosOrg}>
          <PainelRiscos
            riscos={riscosSoltos}
            titulo={t.viagens.riscosDaOperacao.titulo}
            descricao={t.viagens.riscosDaOperacao.descricao}
          />
        </div>
      ) : null}

      {filtradas.length === 0 ? (
        viagens.length === 0 ? (
          <EstadoVazio
            titulo={t.viagens.vazioTotal.titulo}
            descricao={t.viagens.vazioTotal.descricao}
          />
        ) : (
          <EstadoVazio
            titulo={t.viagens.vazio.titulo}
            descricao={t.viagens.vazio.descricao}
          />
        )
      ) : (
        <TabelaViagens viagens={filtradas} riscos={riscosPorViagem} consulta={consulta} />
      )}
    </MolduraPagina>
  );
}
