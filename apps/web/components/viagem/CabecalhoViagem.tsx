import Link from "next/link";
import type { Viagem } from "@ai4l/core";
import { podeCancelarCte, podeEncerrarMdfe } from "@ai4l/core";
import { Acao, Dinheiro, Placa, Rota, StatusViagem } from "@ai4l/ui";

import { AGORA } from "@/app/_lib/dados";
import { url } from "@/app/_lib/parametros";
import { Icone } from "@/components/shell/Icone";
import { t } from "@/lib/i18n/pt-BR";
import { documentoPrincipal } from "./documentos";
import s from "./Viagem.module.css";

/**
 * Cabeçalho da viagem, com as ações contextuais à direita.
 *
 * As ações NUNCA somem. Quando a guarda nega, `<Acao>` mostra o botão
 * desabilitado com o motivo e a fonte que vieram do core. Esconder o botão
 * transformaria uma explicação em mistério: a pessoa ficaria procurando onde
 * clicar em vez de ler por que não dá.
 */
export function CabecalhoViagem({
  viagem,
  orgId,
}: {
  viagem: Viagem;
  orgId?: string | undefined;
}) {
  const cte = documentoPrincipal(viagem, "cte");
  const mdfe = documentoPrincipal(viagem, "mdfe");

  return (
    <>
      <Link className={s.voltar} href={url("/viagens", { org: orgId })}>
        <Icone nome="seta-esquerda" tamanho={16} />
        {t.comum.voltarParaViagens}
      </Link>

      <header className={s.cabecalho}>
        <div className={s.identidade}>
          <div className={s.linhaTopo}>
            <span className={s.numero}>{viagem.numero}</span>
            <StatusViagem status={viagem.status} />
          </div>

          <p className={s.rota}>
            <Rota origem={viagem.origem} destino={viagem.destino} />
          </p>

          <div className={s.fatos}>
            <div className={s.fato}>
              <span className={s.fatoRotulo}>{t.viagem.cabecalho.tomador}</span>
              <span className={s.fatoValor}>{viagem.tomador.nome}</span>
            </div>
            <div className={s.fato}>
              <span className={s.fatoRotulo}>{t.viagem.cabecalho.valorDoFrete}</span>
              <span className={s.fatoValor}>
                <Dinheiro centavos={viagem.valorFreteCentavos} />
              </span>
            </div>
            <div className={s.fato}>
              <span className={s.fatoRotulo}>{t.viagem.cabecalho.veiculo}</span>
              <span className={s.fatoValor}>
                <Placa valor={viagem.veiculo.placa} />
              </span>
            </div>
            <div className={s.fato}>
              <span className={s.fatoRotulo}>{t.viagem.cabecalho.motorista}</span>
              <span className={s.fatoValor}>{viagem.motorista.nome}</span>
            </div>
          </div>
        </div>

        <div className={s.acoesCabecalho}>
          <span className={s.acoesRotulo}>{t.viagem.cabecalho.acoes}</span>
          {mdfe ? (
            <Acao variante="primario" guarda={podeEncerrarMdfe(viagem, mdfe)}>
              {t.viagem.documentos.acoes.encerrarMdfe}
            </Acao>
          ) : null}
          {cte ? (
            <Acao variante="fantasma" guarda={podeCancelarCte(viagem, cte, AGORA)}>
              {t.viagem.documentos.acoes.cancelarCte}
            </Acao>
          ) : null}
        </div>
      </header>
    </>
  );
}
