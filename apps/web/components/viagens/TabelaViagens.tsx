import Link from "next/link";
import type { Risco, Viagem } from "@ai4l/core";
import { formatarDataHora, formatarRelativo } from "@ai4l/core";
import {
  Dinheiro,
  Placa,
  Rota,
  Severidade,
  StatusViagem,
  TrilhaDocumentos,
} from "@ai4l/ui";

import { AGORA } from "@/app/_lib/dados";
import { riscoMaisGrave } from "@/app/_lib/filtros";
import {
  url,
  urlViagens,
  type CampoOrdem,
  type ConsultaViagens,
} from "@/app/_lib/parametros";
import { t } from "@/lib/i18n/pt-BR";
import { rotuloStatus } from "./rotulos";
import s from "./Tabela.module.css";

type Props = {
  viagens: Viagem[];
  riscos: Map<string, Risco[]>;
  consulta: ConsultaViagens;
};

function hrefViagem(v: Viagem, consulta: ConsultaViagens): string {
  return url(`/viagens/${v.id}`, { org: consulta.org });
}

export function TabelaViagens({ viagens, riscos, consulta }: Props) {
  return (
    <div className={s.quadro}>
      <table className={s.tabela}>
        <caption className="visualmente-oculto">{t.viagens.titulo}</caption>
        <colgroup>
          <col className={s.colStatus} />
          <col className={s.colNumero} />
          <col className={s.colRota} />
          <col className={s.colTomador} />
          <col className={s.colVeiculo} />
          <col className={s.colDocumentos} />
          <col className={s.colValor} />
          <col className={s.colRisco} />
          <col className={s.colAtualizada} />
        </colgroup>
        <thead>
          <tr>
            <Cabecalho
              campo="status"
              rotulo={t.viagens.colunas.status}
              consulta={consulta}
            />
            <Cabecalho
              campo="numero"
              rotulo={t.viagens.colunas.numero}
              consulta={consulta}
            />
            <th scope="col">
              <span className={s.cabecalhoTexto}>{t.viagens.colunas.rota}</span>
            </th>
            <th scope="col">
              <span className={s.cabecalhoTexto}>{t.viagens.colunas.tomador}</span>
            </th>
            <th scope="col">
              <span className={s.cabecalhoTexto}>{t.viagens.colunas.veiculo}</span>
            </th>
            <th scope="col">
              <span className={s.cabecalhoTexto}>{t.viagens.colunas.documentos}</span>
            </th>
            <Cabecalho
              campo="valor"
              rotulo={t.viagens.colunas.valor}
              consulta={consulta}
              direita
            />
            <th scope="col">
              <span className={s.cabecalhoTexto}>{t.viagens.colunas.risco}</span>
            </th>
            <Cabecalho
              campo="atualizada"
              rotulo={t.viagens.colunas.atualizada}
              consulta={consulta}
            />
          </tr>
        </thead>
        <tbody>
          {viagens.map((v) => {
            const risco = riscoMaisGrave(riscos.get(v.id));
            return (
              <tr key={v.id}>
                <td>
                  <StatusViagem status={v.status} />
                </td>
                <td>
                  <Link className={s.numeroLink} href={hrefViagem(v, consulta)}>
                    {v.numero}
                  </Link>
                </td>
                <td>
                  <span className={s.corta}>
                    <Rota origem={v.origem} destino={v.destino} />
                  </span>
                </td>
                <td>
                  <span className={s.corta} title={v.tomador.nome}>
                    {v.tomador.nome}
                  </span>
                </td>
                <td>
                  <Placa valor={v.veiculo.placa} />
                </td>
                <td>
                  <TrilhaDocumentos compacto documentos={v.documentos} />
                </td>
                <td className={s.valor}>
                  <Dinheiro centavos={v.valorFreteCentavos} />
                </td>
                <td className={s.celulaRisco} title={risco?.titulo}>
                  {risco ? (
                    <span className={s.marcaRisco} title={risco.titulo}>
                      <Severidade nivel={risco.severidade} comRotulo={false} />
                      <span className="visualmente-oculto">{risco.titulo}</span>
                    </span>
                  ) : null}
                </td>
                <td>
                  <span className={s.tempo} title={formatarDataHora(v.atualizadaEm)}>
                    {formatarRelativo(v.atualizadaEm, AGORA)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mesma lista, formato de cartão. Vale abaixo de 760px. */}
      <ul className={s.cartoes}>
        {viagens.map((v) => {
          const risco = riscoMaisGrave(riscos.get(v.id));
          return (
            <li key={v.id} className={s.cartao}>
              <div className={s.cartaoTopo}>
                <span className={`${s.cartaoNumero} num`}>{v.numero}</span>
                <StatusViagem status={v.status} />
                {risco ? (
                  <span className={s.cartaoRisco} title={risco.titulo}>
                    <Severidade nivel={risco.severidade} comRotulo={false} />
                    <span className="visualmente-oculto">{risco.titulo}</span>
                  </span>
                ) : null}
              </div>

              <div className={s.cartaoRota}>
                <Rota origem={v.origem} destino={v.destino} />
              </div>

              <dl className={s.cartaoLinhas}>
                <dt className={s.cartaoRotulo}>{t.viagens.colunas.tomador}</dt>
                <dd>{v.tomador.nome}</dd>
                <dt className={s.cartaoRotulo}>{t.viagens.colunas.veiculo}</dt>
                <dd>
                  <Placa valor={v.veiculo.placa} />
                </dd>
                <dt className={s.cartaoRotulo}>{t.viagens.colunas.documentos}</dt>
                <dd>
                  <TrilhaDocumentos compacto documentos={v.documentos} />
                </dd>
                <dt className={s.cartaoRotulo}>{t.viagens.colunas.valor}</dt>
                <dd className={s.cartaoValor}>
                  <Dinheiro centavos={v.valorFreteCentavos} />
                </dd>
                <dt className={s.cartaoRotulo}>{t.viagens.colunas.atualizada}</dt>
                <dd className={s.tempo} title={formatarDataHora(v.atualizadaEm)}>
                  {formatarRelativo(v.atualizadaEm, AGORA)}
                </dd>
              </dl>

              <div className={s.cartaoRodape}>
                <span className="visualmente-oculto">{rotuloStatus(v.status)}</span>
                <Link className={s.cartaoAbrir} href={hrefViagem(v, consulta)}>
                  {`${t.viagem.cabecalho.viagem} ${v.numero}`}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Cabeçalho clicável. A ordenação também mora na URL. */
function Cabecalho({
  campo,
  rotulo,
  consulta,
  direita,
}: {
  campo: CampoOrdem;
  rotulo: string;
  consulta: ConsultaViagens;
  direita?: boolean;
}) {
  const ativo = consulta.ordenar === campo;
  const proximaDir = ativo && consulta.dir === "asc" ? "desc" : "asc";
  const ariaSort = ativo
    ? consulta.dir === "asc"
      ? ("ascending" as const)
      : ("descending" as const)
    : ("none" as const);

  return (
    <th scope="col" aria-sort={ariaSort}>
      <Link
        href={urlViagens(consulta, { ordenar: campo, dir: proximaDir })}
        className={`${s.cabecalhoLink} ${direita ? s.cabecalhoDireita : ""}`}
        data-ordenado={ativo ? consulta.dir : undefined}
        title={
          proximaDir === "asc"
            ? t.viagens.ordenar.crescente
            : t.viagens.ordenar.decrescente
        }
      >
        <span>{rotulo}</span>
        <span
          className={`${s.setaOrdem} ${ativo ? "" : s.setaInativa}`}
          aria-hidden="true"
        >
          {ativo && consulta.dir === "desc" ? "▼" : "▲"}
        </span>
      </Link>
    </th>
  );
}
