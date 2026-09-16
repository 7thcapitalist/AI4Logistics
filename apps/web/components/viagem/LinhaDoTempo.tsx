import type { EventoFiscal, Viagem } from "@ai4l/core";
import { formatarDataHora } from "@ai4l/core";
import { EstadoVazio } from "@ai4l/ui";

import { AGORA } from "@/app/_lib/dados";
import { t } from "@/lib/i18n/pt-BR";
import { BotaoCopiar } from "./BotaoCopiar";
import s from "./Viagem.module.css";

/**
 * Linha do tempo dos eventos fiscais.
 *
 * Esta lista é a prova documental que o cliente leva quando contesta uma
 * multa. Por isso: ordem cronológica explícita, data e hora absolutas (nada de
 * "há 3 dias"), protocolo quando existe, nada editável e nada omitido.
 *
 * Evento de `fisco` e de `tomador` recebe tratamento visual distinto, porque
 * é o que a transportadora não escreveu e não controla.
 */

const FORA_DO_CONTROLE = new Set(["fisco", "tomador"]);

function ordenar(eventos: EventoFiscal[]): EventoFiscal[] {
  return [...eventos].sort((a, b) => b.ocorridoEm - a.ocorridoEm);
}

function montarTexto(viagem: Viagem, eventos: EventoFiscal[]): string {
  const l = t.viagem.linha;
  const linhas: string[] = [
    `${l.cabecalhoCopia} ${viagem.numero}`,
    `${l.geradoEm}: ${formatarDataHora(AGORA)}`,
    "",
  ];

  for (const e of eventos) {
    linhas.push(
      `${formatarDataHora(e.ocorridoEm)} — ${e.codigo} ${e.nome} (${
        l.autores[e.autor]
      }, ${l.modelo} ${e.modelo})`,
    );
    if (e.protocolo) linhas.push(`  ${l.protocolo}: ${e.protocolo}`);
    if (e.detalhe) linhas.push(`  ${e.detalhe}`);
  }

  return linhas.join("\n");
}

export function LinhaDoTempo({ viagem }: { viagem: Viagem }) {
  const eventos = ordenar(viagem.eventos);

  if (eventos.length === 0) {
    return (
      <EstadoVazio
        titulo={t.viagem.linha.vazio.titulo}
        descricao={t.viagem.linha.vazio.descricao}
      />
    );
  }

  return (
    <section aria-label={t.viagem.linha.titulo}>
      <div className={s.linhaTopoBarra}>
        <p className={s.linhaDescricao}>{t.viagem.linha.descricao}</p>
        <BotaoCopiar texto={montarTexto(viagem, eventos)} />
      </div>

      <ol className={s.eventos}>
        {eventos.map((e) => {
          const fora = FORA_DO_CONTROLE.has(e.autor);
          return (
            <li key={e.id} className={s.evento} data-autor={e.autor}>
              <span className={s.trilho} aria-hidden="true">
                <span className={s.ponto} />
              </span>

              <div className={s.corpoEvento}>
                <div className={s.cabecalhoEvento}>
                  <span className={s.codigoEvento}>{e.codigo}</span>
                  <span className={s.nomeEvento}>{e.nome}</span>
                </div>

                <div className={s.metaEvento}>
                  <span className={fora ? s.autorFora : undefined}>
                    {t.viagem.linha.autores[e.autor]}
                    {fora ? ` · ${t.viagem.linha.foraDoControle}` : ""}
                  </span>
                  <span>{formatarDataHora(e.ocorridoEm)}</span>
                  <span>{`${t.viagem.linha.modelo} ${e.modelo}`}</span>
                  {e.protocolo ? (
                    <span>{`${t.viagem.linha.protocolo} ${e.protocolo}`}</span>
                  ) : null}
                </div>

                {e.detalhe ? <p className={s.detalheEvento}>{e.detalhe}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
