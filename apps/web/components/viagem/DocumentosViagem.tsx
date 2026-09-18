import type { Documento, Risco, Viagem } from "@ai4l/core";
import {
  formatarDataHora,
  podeCancelarCte,
  podeCancelarMdfe,
  podeEncerrarMdfe,
} from "@ai4l/core";
import { Acao, ChaveAcesso, EstadoVazio, ROTULO_TIPO, StatusDocumento } from "@ai4l/ui";

import { AGORA } from "@/app/_lib/dados";
import { PainelRiscos } from "@/components/riscos/PainelRiscos";
import { t } from "@/lib/i18n/pt-BR";
import { riscosDoDocumento } from "./documentos";
import s from "./Viagem.module.css";

/**
 * Ações do documento.
 *
 * Toda ação passa por uma guarda do core e é renderizada SEMPRE. Quando a
 * guarda nega, `<Acao>` mostra o botão desabilitado com o motivo e a fonte.
 * Nenhuma ação desaparece da tela.
 */
function AcoesDocumento({ viagem, doc }: { viagem: Viagem; doc: Documento }) {
  if (doc.tipo === "cte") {
    return (
      <div className={s.acoesDoc}>
        <Acao variante="fantasma" guarda={podeCancelarCte(viagem, doc, AGORA)}>
          {t.viagem.documentos.acoes.cancelarCte}
        </Acao>
      </div>
    );
  }

  if (doc.tipo === "mdfe") {
    return (
      <div className={s.acoesDoc}>
        <Acao variante="primario" guarda={podeEncerrarMdfe(viagem, doc)}>
          {t.viagem.documentos.acoes.encerrarMdfe}
        </Acao>
        <Acao variante="fantasma" guarda={podeCancelarMdfe(viagem, doc, AGORA)}>
          {t.viagem.documentos.acoes.cancelarMdfe}
        </Acao>
      </div>
    );
  }

  return null;
}

function CartaoDocumento({
  viagem,
  doc,
  riscos,
}: {
  viagem: Viagem;
  doc: Documento;
  riscos: Risco[];
}) {
  const d = t.viagem.documentos;
  const foiRecusado = doc.status === "rejeitado" || doc.status === "denegado";

  return (
    <article className={s.doc} id={`doc-${doc.id}`}>
      <div className={s.docTopo}>
        <StatusDocumento status={doc.status} tipo={doc.tipo} />
        <h3 className={s.docTitulo}>
          {`${ROTULO_TIPO[doc.tipo]}${doc.numero ? ` ${doc.numero}` : ""}`}
        </h3>
      </div>

      <dl className={s.definicoes}>
        <dt>{d.numero}</dt>
        <dd>{doc.numero ?? t.comum.naoInformado}</dd>
        <dt>{d.serie}</dt>
        <dd>{doc.serie ?? t.comum.naoInformado}</dd>
        {doc.chaveAcesso ? (
          <>
            <dt>{d.chave}</dt>
            <dd>
              <ChaveAcesso chave={doc.chaveAcesso} modo="completa" />
            </dd>
          </>
        ) : null}
        <dt>{d.protocolo}</dt>
        <dd>{doc.protocolo ?? t.comum.semRegistro}</dd>
        <dt>{d.autorizadoEm}</dt>
        <dd>
          {doc.autorizadoEm === undefined
            ? t.comum.semRegistro
            : formatarDataHora(doc.autorizadoEm)}
        </dd>
        {doc.encerradoEm !== undefined ? (
          <>
            <dt>{d.encerradoEm}</dt>
            <dd>{formatarDataHora(doc.encerradoEm)}</dd>
          </>
        ) : null}
        {doc.contingenciaDesde !== undefined ? (
          <>
            <dt>{d.contingenciaDesde}</dt>
            <dd>{formatarDataHora(doc.contingenciaDesde)}</dd>
          </>
        ) : null}
        {doc.parUf ? (
          <>
            <dt>{d.parUf}</dt>
            <dd>{`${doc.parUf.carregamento} → ${doc.parUf.descarregamento}`}</dd>
          </>
        ) : null}
        {doc.temCiot !== undefined ? (
          <>
            <dt>{d.ciot}</dt>
            <dd>{doc.temCiot ? d.ciotSim : d.ciotNao}</dd>
          </>
        ) : null}
      </dl>

      {/* Documento recusado mostra OS DOIS textos. O cru é o que o contador
          usa para agir na SEFAZ; a explicação é o que o dono entende. Mostrar
          só o cru é jogar o problema por cima do muro. */}
      {foiRecusado ? (
        <div className={s.rejeicao}>
          {doc.codigoRejeicao ? (
            <p className={s.rejeicaoDica}>
              {`${d.codigoRejeicao} ${doc.codigoRejeicao}`}
            </p>
          ) : null}

          <div>
            <p className={s.rejeicaoRotulo}>{d.mensagemSefaz}</p>
            <p className={s.rejeicaoCru}>{doc.mensagemRejeicao ?? t.comum.semRegistro}</p>
            <p className={s.rejeicaoDica}>{d.mensagemSefazDica}</p>
          </div>

          {doc.explicacao ? (
            <div>
              <p className={s.rejeicaoRotulo}>{d.explicacao}</p>
              <p className={s.rejeicaoExplicacao}>{doc.explicacao}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <PainelRiscos riscos={riscos} titulo={d.riscos} />

      <AcoesDocumento viagem={viagem} doc={doc} />
    </article>
  );
}

export function DocumentosViagem({
  viagem,
  riscos,
}: {
  viagem: Viagem;
  riscos: Risco[];
}) {
  if (viagem.documentos.length === 0) {
    return (
      <EstadoVazio
        titulo={t.viagem.documentos.vazio.titulo}
        descricao={t.viagem.documentos.vazio.descricao}
      />
    );
  }

  return (
    <div className={s.docs}>
      {viagem.documentos.map((doc) => (
        <CartaoDocumento
          key={doc.id}
          viagem={viagem}
          doc={doc}
          riscos={riscosDoDocumento(riscos, doc.id)}
        />
      ))}
    </div>
  );
}
