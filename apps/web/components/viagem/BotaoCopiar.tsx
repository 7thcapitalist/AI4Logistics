"use client";

import { useState } from "react";

import { Icone } from "@/components/shell/Icone";
import { t } from "@/lib/i18n/pt-BR";
import s from "./Viagem.module.css";

type Situacao = "parado" | "feito" | "falhou";

/** Cópia do texto para a área de transferência, com plano B quando a API não existe. */
async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* segue para o plano B */
  }

  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(campo);
    return ok;
  } catch {
    return false;
  }
}

export function BotaoCopiar({ texto }: { texto: string }) {
  const [situacao, setSituacao] = useState<Situacao>("parado");

  return (
    <div>
      <button
        type="button"
        className={s.botao}
        onClick={async () => {
          setSituacao((await copiar(texto)) ? "feito" : "falhou");
        }}
      >
        <Icone nome="copiar" tamanho={16} />
        {situacao === "feito" ? t.viagem.linha.copiado : t.viagem.linha.copiar}
      </button>
      <p className={s.avisoCopia} role="status">
        {situacao === "falhou" ? t.viagem.linha.falhaCopia : ""}
      </p>
    </div>
  );
}
