import Link from "next/link";
import { EstadoVazio } from "@ai4l/ui";

import { t } from "@/lib/i18n/pt-BR";
import s from "@/components/comum/Falha.module.css";

export default function ViagemNaoEncontrada() {
  return (
    <div className={s.envolucro}>
      <EstadoVazio
        titulo={t.viagem.naoEncontrada.titulo}
        descricao={t.viagem.naoEncontrada.descricao}
      />
      <Link className={s.botao} href="/viagens">
        {t.comum.voltarParaViagens}
      </Link>
    </div>
  );
}
