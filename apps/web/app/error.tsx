"use client";

import { Falha } from "@/components/comum/Falha";
import { t } from "@/lib/i18n/pt-BR";

export default function ErroGeral({ reset }: { error: Error; reset: () => void }) {
  return (
    <Falha
      titulo={t.erroGeral.titulo}
      descricao={t.erroGeral.descricao}
      refazer={reset}
      voltarPara="/viagens"
    />
  );
}
