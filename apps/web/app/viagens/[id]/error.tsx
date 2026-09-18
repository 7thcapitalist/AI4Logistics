"use client";

import { Falha } from "@/components/comum/Falha";
import { t } from "@/lib/i18n/pt-BR";

export default function ErroViagem({ reset }: { error: Error; reset: () => void }) {
  return (
    <Falha
      titulo={t.viagem.erro.titulo}
      descricao={t.viagem.erro.descricao}
      refazer={reset}
      voltarPara="/viagens"
    />
  );
}
