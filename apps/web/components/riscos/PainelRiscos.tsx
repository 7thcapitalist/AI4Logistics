import Link from "next/link";
import type { Risco } from "@ai4l/core";
import { ordenarRiscos } from "@ai4l/core";
import { SeloFonte, Severidade } from "@ai4l/ui";

import { t } from "@/lib/i18n/pt-BR";
import s from "./Riscos.module.css";

/**
 * Cartão de risco.
 *
 * Título, explicação, contagem regressiva e fonte vêm inteiros do core. Aqui
 * não se escreve prazo, multa nem norma: se o texto precisa mudar, muda em
 * `packages/core`, onde ele vem acompanhado de `Fonte`.
 */
function CartaoRisco({ risco }: { risco: Risco }) {
  const regressiva = risco.contagemRegressiva;

  return (
    <li className={s.cartao} data-severidade={risco.severidade}>
      <div className={s.topo}>
        <Severidade nivel={risco.severidade} comRotulo />
        <h3 className={s.titulo}>{risco.titulo}</h3>
      </div>

      <p className={s.explicacao}>{risco.explicacao}</p>

      {regressiva ? (
        <p className={s.regressiva}>
          {`${t.viagem.riscos.restam} ${
            regressiva.tipo === "dias"
              ? t.viagem.riscos.dias(regressiva.restante)
              : t.viagem.riscos.horas(regressiva.restante)
          } ${t.viagem.riscos.ate} ${regressiva.ate}`}
        </p>
      ) : null}

      <div className={s.rodape}>
        <SeloFonte fonte={risco.fonte} />
        {risco.acao ? (
          <Link className={s.acao} href={risco.acao.href}>
            {risco.acao.label}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function PainelRiscos({
  riscos,
  titulo,
  descricao,
}: {
  riscos: Risco[];
  titulo: string;
  descricao?: string;
}) {
  if (riscos.length === 0) return null;

  return (
    <section className={s.secao} aria-label={titulo}>
      <h2 className={s.secaoTitulo}>{titulo}</h2>
      {descricao ? <p className={s.explicacao}>{descricao}</p> : null}
      <ul className={s.lista}>
        {ordenarRiscos(riscos).map((r) => (
          <CartaoRisco key={r.id} risco={r} />
        ))}
      </ul>
    </section>
  );
}
