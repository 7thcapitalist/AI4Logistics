"use client";

import { Falha } from "@/components/comum/Falha";
import { t } from "@/lib/i18n/pt-BR";

export default function ErroViagens({ reset }: { error: Error; reset: () => void }) {
  return (
    <Falha
      titulo={t.viagens.erro.titulo}
      descricao={t.viagens.erro.descricao}
      refazer={reset}
    />
  );
}
