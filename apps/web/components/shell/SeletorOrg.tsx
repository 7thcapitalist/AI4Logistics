"use client";

import { useRouter } from "next/navigation";

import { t } from "@/lib/i18n/pt-BR";
import s from "./Topbar.module.css";

export type OpcaoOrg = { id: string; nome: string };

/**
 * Troca de organização.
 *
 * A organização é um parâmetro de URL, então trocar aqui recarrega a rota
 * inteira do servidor e TODO o conteúdo acompanha: lista, contagens de risco e
 * cabeçalho. Não existe organização guardada em estado de cliente.
 *
 * `destino` existe porque, na tela de uma viagem, trocar de organização não
 * pode manter a pessoa numa viagem que não é daquela organização: vai para a
 * lista.
 */
export function SeletorOrg({
  orgs,
  orgAtual,
  destino,
}: {
  orgs: OpcaoOrg[];
  orgAtual: string;
  destino: string;
}) {
  const router = useRouter();

  return (
    <div className={s.campo}>
      <label className={s.rotulo} htmlFor="seletor-org">
        {t.topbar.organizacao}
      </label>
      <span className={s.selectEnvolucro}>
        <select
          id="seletor-org"
          className={s.select}
          value={orgAtual}
          aria-label={t.topbar.trocarOrganizacao}
          onChange={(e) => {
            const params = new URLSearchParams({ org: e.target.value });
            router.push(`${destino}?${params.toString()}`);
          }}
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
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
