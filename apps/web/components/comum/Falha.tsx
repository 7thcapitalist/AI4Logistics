"use client";

import Link from "next/link";
import { EstadoErro } from "@ai4l/ui";

import { t } from "@/lib/i18n/pt-BR";
import s from "./Falha.module.css";

/**
 * Tela de erro. Diz o que não funcionou e oferece o caminho de volta. Sem
 * detalhe técnico: quem lê sabe tudo de frete e nada de software.
 */
export function Falha({
  titulo,
  descricao,
  refazer,
  voltarPara,
}: {
  titulo: string;
  descricao: string;
  refazer: () => void;
  voltarPara?: string;
}) {
  return (
    <div className={s.envolucro}>
      <EstadoErro titulo={titulo} descricao={descricao} />
      <div className={s.acoes}>
        <button type="button" className={s.botao} onClick={refazer}>
          {t.comum.tentarDeNovo}
        </button>
        {voltarPara ? (
          <Link className={s.botao} href={voltarPara}>
            {t.comum.voltarParaViagens}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
