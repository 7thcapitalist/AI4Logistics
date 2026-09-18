import type { Parte, Risco, Viagem } from "@ai4l/core";
import { formatarDataHora } from "@ai4l/core";
import { Placa, Rota } from "@ai4l/ui";

import { PainelRiscos } from "@/components/riscos/PainelRiscos";
import { t } from "@/lib/i18n/pt-BR";
import s from "./Viagem.module.css";

function Data({ valor }: { valor?: number | undefined }) {
  return <>{valor === undefined ? t.comum.semRegistro : formatarDataHora(valor)}</>;
}

/**
 * As três partes aparecem separadas e com o papel escrito por extenso.
 * Tomador, remetente e destinatário são frequentemente empresas diferentes, e
 * trocar um pelo outro no documento não é o tipo de erro que se conserta
 * depois — por isso a tela não deixa a distinção implícita.
 */
function BlocoParte({
  papel,
  explicacao,
  parte,
}: {
  papel: string;
  explicacao: string;
  parte: Parte;
}) {
  return (
    <div className={s.parte}>
      <span className={s.partePapel}>{papel}</span>
      <span className={s.parteNome}>{parte.nome}</span>
      <span className={s.parteExplicacao}>{explicacao}</span>
      <dl className={s.definicoes}>
        <dt>{t.viagem.resumo.cnpjCpf}</dt>
        <dd>{parte.cnpjCpf}</dd>
        {parte.ie ? (
          <>
            <dt>{t.viagem.resumo.ie}</dt>
            <dd>{parte.ie}</dd>
          </>
        ) : null}
        <dt>{t.viagem.resumo.local}</dt>
        <dd>{`${parte.local.municipio} / ${parte.local.uf}`}</dd>
      </dl>
    </div>
  );
}

export function ResumoViagem({ viagem, riscos }: { viagem: Viagem; riscos: Risco[] }) {
  return (
    <div className={s.painel}>
      <PainelRiscos riscos={riscos} titulo={t.viagem.riscos.titulo} />

      <section className={s.bloco}>
        <h2 className={s.blocoTitulo}>{t.viagem.resumo.origemDestino}</h2>
        <p className={s.rota}>
          <Rota origem={viagem.origem} destino={viagem.destino} />
        </p>
        <dl className={s.definicoes}>
          <dt>{t.viagem.resumo.origem}</dt>
          <dd>{`${viagem.origem.municipio} / ${viagem.origem.uf}`}</dd>
          <dt>{t.viagem.resumo.destino}</dt>
          <dd>{`${viagem.destino.municipio} / ${viagem.destino.uf}`}</dd>
        </dl>
        <h3 className={s.blocoTitulo}>{t.viagem.resumo.ufs}</h3>
        <ul className={s.ufs}>
          {viagem.ufsPercurso.map((uf) => (
            <li key={uf} className={s.uf}>
              {uf}
            </li>
          ))}
        </ul>
      </section>

      <section className={s.bloco}>
        <h2 className={s.blocoTitulo}>{t.viagem.resumo.partes}</h2>
        <div className={s.grade}>
          <BlocoParte
            papel={t.viagem.resumo.papelTomador}
            explicacao={t.viagem.resumo.tomadorPapel}
            parte={viagem.tomador}
          />
          <BlocoParte
            papel={t.viagem.resumo.papelRemetente}
            explicacao={t.viagem.resumo.remetentePapel}
            parte={viagem.remetente}
          />
          <BlocoParte
            papel={t.viagem.resumo.papelDestinatario}
            explicacao={t.viagem.resumo.destinatarioPapel}
            parte={viagem.destinatario}
          />
        </div>
      </section>

      <section className={s.bloco}>
        <h2 className={s.blocoTitulo}>{t.viagem.resumo.veiculoEMotorista}</h2>
        <div className={s.grade}>
          <dl className={s.definicoes}>
            <dt>{t.viagem.resumo.placa}</dt>
            <dd>
              <Placa valor={viagem.veiculo.placa} />
            </dd>
            <dt>{t.viagem.resumo.modelo}</dt>
            <dd>{viagem.veiculo.modelo ?? t.comum.naoInformado}</dd>
            <dt>{t.viagem.resumo.renavam}</dt>
            <dd>{viagem.veiculo.renavam ?? t.comum.naoInformado}</dd>
            <dt>{t.viagem.resumo.tara}</dt>
            <dd>
              {viagem.veiculo.taraKg === undefined
                ? t.comum.naoInformado
                : `${viagem.veiculo.taraKg.toLocaleString("pt-BR")} kg`}
            </dd>
          </dl>
          <dl className={s.definicoes}>
            <dt>{t.viagem.resumo.motorista}</dt>
            <dd>{viagem.motorista.nome}</dd>
            <dt>{t.viagem.resumo.cpf}</dt>
            <dd>{viagem.motorista.cpf}</dd>
            <dt>{t.viagem.resumo.telefone}</dt>
            <dd>{viagem.motorista.telefone ?? t.comum.naoInformado}</dd>
          </dl>
        </div>
      </section>

      <section className={s.bloco}>
        <h2 className={s.blocoTitulo}>{t.viagem.resumo.datas}</h2>
        <dl className={s.definicoes}>
          <dt>{t.viagem.resumo.criadaEm}</dt>
          <dd>
            <Data valor={viagem.criadaEm} />
          </dd>
          <dt>{t.viagem.resumo.atualizadaEm}</dt>
          <dd>
            <Data valor={viagem.atualizadaEm} />
          </dd>
          <dt>{t.viagem.resumo.iniciadaEm}</dt>
          <dd>
            <Data valor={viagem.iniciadaEm} />
          </dd>
          <dt>{t.viagem.resumo.entregueEm}</dt>
          <dd>
            <Data valor={viagem.entregueEm} />
          </dd>
          <dt>{t.viagem.resumo.encerradaEm}</dt>
          <dd>
            <Data valor={viagem.encerradaEm} />
          </dd>
        </dl>
      </section>
    </div>
  );
}
