"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Os riscos do core apontam para `/viagens/<id>#doc-<documentoId>`, sem dizer
 * a aba. Como os cartões de documento vivem atrás de `?aba=documentos`, quem
 * clicasse no risco cairia no Resumo e a âncora não existiria — o link
 * pareceria quebrado.
 *
 * Aqui a âncora é honrada: chegando com `#doc-`, a aba de documentos abre e a
 * tela rola até o cartão certo. O hash não é enviado ao servidor, então este é
 * o único lugar onde dá para resolver isso.
 */
export function AncoraDocumento({
  abaAtual,
  destinoDocumentos,
}: {
  abaAtual: string;
  destinoDocumentos: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let hash = "";
    try {
      hash = window.location.hash;
    } catch {
      return;
    }
    if (!hash.startsWith("#doc-")) return;

    if (abaAtual !== "documentos") {
      router.replace(`${destinoDocumentos}${hash}`);
      return;
    }

    const alvo = document.getElementById(hash.slice(1));
    alvo?.scrollIntoView({ block: "start" });
  }, [abaAtual, destinoDocumentos, router]);

  return null;
}
