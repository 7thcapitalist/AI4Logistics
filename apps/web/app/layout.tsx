import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@ai4l/ui/tokens.css";
import "./globals.css";

/**
 * Metadata is the repository's, not the new build's: it is the string that is
 * already deployed and indexed, and it is in English on purpose while the UI is
 * in pt-BR. The pt-BR copy in @/lib/i18n is for what the carrier reads on screen.
 */
export const metadata: Metadata = {
  title: "AI4Logistics",
  description: "Compliance and operations for small transportadoras",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Aplica tema e modo antes da primeira pintura, para a tela não piscar.
 * Tudo dentro de try/catch: navegador com armazenamento bloqueado cai no
 * padrão do servidor (patio / claro) sem quebrar nada. Os valores de
 * data-mode são os que tokens.css lê: `light` e `dark`.
 */
const SCRIPT_APARENCIA = `(function(){try{var d=document.documentElement;
var tema=localStorage.getItem('ai4l:tema');
if(tema==='patio'||tema==='torre'){d.setAttribute('data-theme',tema);}
var modo=localStorage.getItem('ai4l:modo');
if(modo!=='light'&&modo!=='dark'){modo=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}
d.setAttribute('data-mode',modo);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="patio" data-mode="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_APARENCIA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
