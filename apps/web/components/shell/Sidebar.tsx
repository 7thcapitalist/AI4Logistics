"use client";

import { useEffect, useState, type ReactNode } from "react";

import { t } from "@/lib/i18n/pt-BR";
import { Icone } from "./Icone";
import s from "./Sidebar.module.css";

const CHAVE = "ai4l:lateral";

/**
 * A barra lateral é a única parte interativa do shell: guarda se está
 * recolhida (desktop) e se o menu está aberto (celular). O conteúdo — nav e
 * bloco de saúde — vem pronto do servidor como children.
 *
 * O estado recolhido mora no localStorage dentro de try/catch. Navegador com
 * armazenamento bloqueado ou aba anônima cai no padrão: expandida.
 */
export function Sidebar({ children }: { children: ReactNode }) {
  const [recolhida, setRecolhida] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    try {
      setRecolhida(window.localStorage.getItem(CHAVE) === "recolhida");
    } catch {
      /* sem armazenamento: fica expandida */
    }
  }, []);

  function alternar() {
    setRecolhida((antes) => {
      const proximo = !antes;
      try {
        window.localStorage.setItem(CHAVE, proximo ? "recolhida" : "expandida");
      } catch {
        /* sem armazenamento: vale só nesta sessão */
      }
      return proximo;
    });
  }

  return (
    <aside
      className={s.lateral}
      data-recolhida={recolhida ? "true" : "false"}
      data-menu={menuAberto ? "true" : "false"}
      aria-label={t.nav.rotulo}
    >
      <div className={s.topoLateral}>
        <span className={s.marca}>
          <span className={s.marcaSigla} aria-hidden="true">
            A4
          </span>
          <span>{t.app.nome}</span>
        </span>

        <button
          type="button"
          className={`${s.botaoLateral} ${s.botaoRecolher}`}
          onClick={alternar}
          aria-pressed={recolhida}
          aria-label={recolhida ? t.sidebar.expandir : t.sidebar.recolher}
          title={recolhida ? t.sidebar.expandir : t.sidebar.recolher}
        >
          <span className={recolhida ? s.girado : undefined}>
            <Icone nome="seta-esquerda" />
          </span>
        </button>

        <button
          type="button"
          className={`${s.botaoLateral} ${s.botaoMenu}`}
          onClick={() => setMenuAberto((a) => !a)}
          aria-expanded={menuAberto}
        >
          <Icone nome="menu" />
          <span>{t.sidebar.menu}</span>
        </button>
      </div>

      {children}
    </aside>
  );
}
