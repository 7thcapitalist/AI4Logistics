import Link from "next/link";

import { ABAS, urlViagens, type Aba, type ConsultaViagens } from "@/app/_lib/parametros";
import { t } from "@/lib/i18n/pt-BR";
import s from "./Lista.module.css";

/**
 * Abas da lista. Cada aba é um filtro pré-aplicado e um endereço próprio, não
 * um estado de cliente: a URL é o que a pessoa cola para outra pessoa.
 *
 * "Entregues não encerradas" ganha destaque porque é a razão de o produto
 * existir: mede a distância entre quem sabe que a viagem acabou (o motorista,
 * na estrada) e quem registra o evento (o escritório).
 */
export function Abas({
  consulta,
  contagens,
}: {
  consulta: ConsultaViagens;
  contagens: Record<Aba, number>;
}) {
  return (
    <nav className={s.abas} aria-label={t.viagens.abas.rotulo}>
      {ABAS.map((aba) => {
        const ativa = consulta.aba === aba;
        const lacuna = aba === "entregues_nao_encerradas";
        return (
          <Link
            key={aba}
            href={urlViagens(consulta, { aba })}
            className={`${s.aba} ${lacuna ? s.abaLacuna : ""}`}
            aria-current={ativa ? "page" : undefined}
          >
            <span>{t.viagens.abas[aba]}</span>
            <span className={s.contagemAba}>{contagens[aba]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
