import Link from "next/link";
import type { RiscoSeveridade } from "@ai4l/core";
import { Severidade } from "@ai4l/ui";

import { SEVERIDADES, url } from "@/app/_lib/parametros";
import { t } from "@/lib/i18n/pt-BR";
import s from "./Sidebar.module.css";

export type Contagens = Record<RiscoSeveridade, number>;

/**
 * Bloco permanente da barra lateral.
 *
 * Uma linha por nível de severidade, as quatro sempre visíveis, inclusive em
 * zero. Cada linha leva ao filtro com o valor exato do nível — nunca a um
 * agrupamento tipo "atenção", porque o filtro do destino precisa de valor
 * exato para a lista bater com a contagem.
 *
 * Fica visível em toda tela de propósito: o risco desta operação não aparece
 * na tela que a pessoa está olhando, aparece trinta dias depois.
 */
export function SaudeOperacao({
  contagens,
  orgId,
}: {
  contagens: Contagens;
  orgId?: string | undefined;
}) {
  return (
    <section className={s.saude} aria-label={t.saude.titulo}>
      <h2 className={s.saudeTitulo}>{t.saude.titulo}</h2>
      <p className={s.saudeDescricao}>{t.saude.descricao}</p>

      <ul className={s.niveis}>
        {SEVERIDADES.map((nivel) => {
          const quantidade = contagens[nivel];
          const rotulo = t.saude.niveis[nivel];
          return (
            <li key={nivel}>
              <Link
                href={url("/viagens", { org: orgId, severidade: nivel })}
                className={`${s.nivel} ${quantidade === 0 ? s.nivelZero : ""}`}
                title={`${rotulo}: ${quantidade}`}
              >
                <span className={s.nivelMarca}>
                  <Severidade nivel={nivel} comRotulo={false} />
                </span>
                <span className={s.nivelRotulo}>{rotulo}</span>
                <span className={`${s.nivelContagem} num`}>{quantidade}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
