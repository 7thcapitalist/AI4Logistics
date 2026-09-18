import type { ViagemStatus } from "@ai4l/core";

import { t } from "@/lib/i18n/pt-BR";

const ROTULOS: Record<ViagemStatus, string> = t.viagens.status;

/** Rótulo de texto do status, para select e leitor de tela. */
export function rotuloStatus(status: string): string {
  return ROTULOS[status as ViagemStatus] ?? status;
}
