"use client";

import { useEffect, useState } from "react";

import { t } from "@/lib/i18n/pt-BR";
import s from "./Topbar.module.css";

type Tema = "patio" | "torre";
type Modo = "light" | "dark";

const CHAVE_TEMA = "ai4l:tema";
const CHAVE_MODO = "ai4l:modo";

function lerAtributo<T extends string>(nome: string, padrao: T, validos: T[]): T {
  if (typeof document === "undefined") return padrao;
  const atual = document.documentElement.getAttribute(nome);
  return validos.includes(atual as T) ? (atual as T) : padrao;
}

/**
 * Seletor de aparência. É ferramenta de decisão: serve para escolher o visual
 * do produto olhando dado real, e sai da barra depois da escolha feita.
 *
 * Grava a escolha no localStorage dentro de try/catch. Sem armazenamento, a
 * troca vale só enquanto a aba estiver aberta.
 */
export function SeletorTema() {
  const [tema, setTema] = useState<Tema>("patio");
  const [modo, setModo] = useState<Modo>("light");

  useEffect(() => {
    setTema(lerAtributo<Tema>("data-theme", "patio", ["patio", "torre"]));
    setModo(lerAtributo<Modo>("data-mode", "light", ["light", "dark"]));
  }, []);

  function aplicar(atributo: string, chave: string, valor: string) {
    try {
      document.documentElement.setAttribute(atributo, valor);
    } catch {
      /* sem documento: nada a fazer */
    }
    try {
      window.localStorage.setItem(chave, valor);
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  }

  return (
    <div className={s.campo}>
      <p className={s.nota}>{t.topbar.notaTema}</p>

      <div className={s.grupo} role="group" aria-label={t.topbar.tema}>
        {(["patio", "torre"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            className={s.opcao}
            aria-pressed={tema === valor}
            onClick={() => {
              setTema(valor);
              aplicar("data-theme", CHAVE_TEMA, valor);
            }}
          >
            {t.topbar.temas[valor]}
          </button>
        ))}
      </div>

      {/* O eixo claro/escuro existe só no tema Torre: o Pátio é uma variante
          deliberadamente clara. Mostrar um botão que não muda nada seria
          pior do que não mostrar. */}
      <div className={s.grupo} role="group" aria-label={t.topbar.modo}>
        {(["light", "dark"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            className={s.opcao}
            aria-pressed={tema === "torre" && modo === valor}
            disabled={tema !== "torre"}
            title={tema === "torre" ? undefined : t.topbar.modoSoTorre}
            onClick={() => {
              setModo(valor);
              aplicar("data-mode", CHAVE_MODO, valor);
            }}
          >
            {t.topbar.modos[valor]}
          </button>
        ))}
      </div>
    </div>
  );
}
