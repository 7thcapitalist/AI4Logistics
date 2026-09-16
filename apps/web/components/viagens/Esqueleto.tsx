import { t } from "@/lib/i18n/pt-BR";
import s from "./Esqueleto.module.css";

/** Esqueleto da lista enquanto os dados não chegam. */
export function EsqueletoLista({ linhas = 8 }: { linhas?: number }) {
  return (
    <div className={s.pagina} aria-busy="true" aria-live="polite">
      <p className="visualmente-oculto">{t.comum.carregando}</p>
      <div className={`${s.bloco} ${s.titulo}`} />
      <div className={`${s.bloco} ${s.barra}`} />
      <div className={`${s.bloco} ${s.barra}`} />
      <div className={s.quadro}>
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className={`${s.bloco} ${s.linha}`} />
        ))}
      </div>
      <p className={s.aviso} aria-hidden="true">
        {t.comum.carregando}
      </p>
    </div>
  );
}

/** Esqueleto do detalhe de uma viagem. */
export function EsqueletoDetalhe() {
  return (
    <div className={s.pagina} aria-busy="true" aria-live="polite">
      <p className="visualmente-oculto">{t.comum.carregando}</p>
      <div className={`${s.bloco} ${s.titulo}`} />
      <div className={`${s.bloco} ${s.barra}`} />
      <div className={s.quadro}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${s.bloco} ${s.linha}`} />
        ))}
      </div>
    </div>
  );
}
