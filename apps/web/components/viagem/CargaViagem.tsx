import type { Viagem } from "@ai4l/core";
import { Dinheiro } from "@ai4l/ui";

import { t } from "@/lib/i18n/pt-BR";
import s from "./Viagem.module.css";

export function CargaViagem({ viagem }: { viagem: Viagem }) {
  const c = viagem.carga;

  return (
    <div className={s.painel}>
      <section className={s.bloco}>
        <h2 className={s.blocoTitulo}>{t.viagem.carga.titulo}</h2>
        <dl className={s.definicoes}>
          <dt>{t.viagem.carga.produto}</dt>
          <dd>{c.produtoPredominante}</dd>
          <dt>{t.viagem.carga.ncm}</dt>
          <dd>{c.ncm ?? t.comum.naoInformado}</dd>
          <dt>{t.viagem.carga.peso}</dt>
          <dd>{`${c.pesoKg.toLocaleString("pt-BR")} kg`}</dd>
          <dt>{t.viagem.carga.valor}</dt>
          <dd>
            <Dinheiro centavos={c.valorCentavos} />
          </dd>
        </dl>
      </section>

      {/* Honestidade sobre o que o produto ainda não faz. */}
      <section className={s.stub}>
        <h2 className={s.stubTitulo}>{t.viagem.carga.nfe}</h2>
        <p className={s.stubTexto}>{t.viagem.carga.nfeAusente}</p>
      </section>
    </div>
  );
}

export function AcertoViagem() {
  return (
    <section className={s.stub}>
      <h2 className={s.stubTitulo}>{t.viagem.acerto.titulo}</h2>
      <p className={s.stubTexto}>{t.viagem.acerto.descricao}</p>
    </section>
  );
}
