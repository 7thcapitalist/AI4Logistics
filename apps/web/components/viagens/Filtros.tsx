"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { RiscoSeveridade, ViagemStatus } from "@ai4l/core";

import {
  SEVERIDADES,
  temFiltroAtivo,
  urlViagens,
  type ConsultaViagens,
} from "@/app/_lib/parametros";
import { t } from "@/lib/i18n/pt-BR";
import { rotuloStatus } from "./rotulos";
import s from "./Lista.module.css";

/**
 * Filtros da lista. Cada mudança vira endereço: nada fica só na memória do
 * navegador, e o botão voltar desfaz filtro.
 */
export function Filtros({
  consulta,
  veiculos,
  tomadores,
  status,
}: {
  consulta: ConsultaViagens;
  veiculos: string[];
  tomadores: string[];
  status: string[];
}) {
  const router = useRouter();
  const [busca, setBusca] = useState(consulta.busca ?? "");

  // A busca também pode mudar por navegação (voltar, link colado).
  useEffect(() => {
    setBusca(consulta.busca ?? "");
  }, [consulta.busca]);

  function ir(trocas: Partial<ConsultaViagens>) {
    router.push(urlViagens(consulta, trocas));
  }

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ir({ busca: busca.trim() || undefined });
  }

  return (
    <form
      className={s.filtros}
      onSubmit={enviar}
      role="search"
      aria-label={t.viagens.filtros.rotulo}
    >
      <div className={`${s.campo} ${s.campoBusca}`}>
        <label className={s.rotulo} htmlFor="filtro-busca">
          {t.viagens.filtros.busca}
        </label>
        <input
          id="filtro-busca"
          className={s.entrada}
          type="search"
          value={busca}
          placeholder={t.viagens.filtros.buscaDica}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <Campo
        id="filtro-status"
        rotulo={t.viagens.filtros.status}
        valor={consulta.status ?? ""}
        aoTrocar={(v) => ir({ status: (v || undefined) as ViagemStatus | undefined })}
        opcoes={status.map((valor) => ({ valor, rotulo: rotuloStatus(valor) }))}
      />

      <Campo
        id="filtro-veiculo"
        rotulo={t.viagens.filtros.veiculo}
        valor={consulta.veiculo ?? ""}
        aoTrocar={(v) => ir({ veiculo: v || undefined })}
        opcoes={veiculos.map((valor) => ({ valor, rotulo: valor }))}
      />

      <Campo
        id="filtro-tomador"
        rotulo={t.viagens.filtros.tomador}
        valor={consulta.tomador ?? ""}
        aoTrocar={(v) => ir({ tomador: v || undefined })}
        opcoes={tomadores.map((valor) => ({ valor, rotulo: valor }))}
      />

      <Campo
        id="filtro-severidade"
        rotulo={t.viagens.filtros.severidade}
        valor={consulta.severidade ?? ""}
        aoTrocar={(v) =>
          ir({ severidade: (v || undefined) as RiscoSeveridade | undefined })
        }
        opcoes={SEVERIDADES.map((valor) => ({
          valor,
          rotulo: t.saude.niveis[valor],
        }))}
      />

      <div className={s.acoesFiltro}>
        <button type="submit" className={s.botao}>
          {t.viagens.filtros.aplicar}
        </button>
        {temFiltroAtivo(consulta) ? (
          <Link
            className={s.limpar}
            href={urlViagens({
              org: consulta.org,
              aba: consulta.aba,
              ordenar: consulta.ordenar,
              dir: consulta.dir,
            })}
          >
            {t.viagens.filtros.limpar}
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  opcoes,
  aoTrocar,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opcoes: { valor: string; rotulo: string }[];
  aoTrocar: (valor: string) => void;
}) {
  return (
    <div className={s.campo}>
      <label className={s.rotulo} htmlFor={id}>
        {rotulo}
      </label>
      <span className={s.envolucro}>
        <select
          id={id}
          className={s.select}
          value={valor}
          onChange={(e) => aoTrocar(e.target.value)}
        >
          <option value="">{t.comum.todos}</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <span className={s.seta} aria-hidden="true">
          ▾
        </span>
      </span>
    </div>
  );
}
