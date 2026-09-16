import type { ReactElement, SVGProps } from "react";

// Ícones de navegação. Traço em currentColor: a cor vem sempre do contexto,
// nunca de um literal aqui dentro.

export type NomeIcone =
  | "viagens"
  | "documentos"
  | "acertos"
  | "veiculos"
  | "motoristas"
  | "clientes"
  | "conformidade"
  | "menu"
  | "seta-esquerda"
  | "copiar";

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

const CAMINHOS: Record<NomeIcone, ReactElement> = {
  viagens: (
    <>
      <path d="M3 17h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m-4 0H9" />
      <path d="M3 17V7a1 1 0 0 1 1-1h9v11M13 9h4l4 4v4h-2" />
    </>
  ),
  documentos: (
    <>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
      <path d="M14 3v4h4M9 12h6M9 16h4" />
    </>
  ),
  acertos: (
    <>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.7-1.8-2.5-4.5-2.5S7.5 5.9 7.5 7.6 9.4 10 12 10.4s4.5 1 4.5 2.9-1.9 2.7-4.5 2.7-4.5-.9-4.5-2.6" />
    </>
  ),
  veiculos: (
    <>
      <path d="M3 16V9a1 1 0 0 1 1-1h8v8" />
      <path d="M12 11h4l3 3v2h-2" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  motoristas: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  clientes: (
    <>
      <path d="M3 21V9l6-4 6 4v12" />
      <path d="M15 21V12h6v9M3 21h18M7 12h2M7 16h2" />
    </>
  ),
  conformidade: (
    <>
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.6-7 9.5-4.1-1.9-7-5.2-7-9.5V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  "seta-esquerda": (
    <>
      <path d="M15 5l-7 7 7 7" />
    </>
  ),
  copiar: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h9" />
    </>
  ),
};

export function Icone({ nome, tamanho = 20 }: { nome: NomeIcone; tamanho?: number }) {
  return (
    <svg {...base} width={tamanho} height={tamanho}>
      {CAMINHOS[nome]}
    </svg>
  );
}
