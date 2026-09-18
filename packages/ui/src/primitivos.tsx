// ============================================================================
// Primitivos de UI do AI4Logistics.
//
// Server Components por padrão: nada aqui precisa de estado ou de evento de
// browser. Estilo vem de classes declaradas em tokens.css; `style` inline só
// aparece quando o valor é um token semântico escolhido em runtime.
//
// REGRA DURA: cor nunca vai sozinha. Todo indicador de status renderiza os
// três canais — cor, rótulo em texto e marcador de forma. Este produto trata
// de bloqueio fiscal de veículo; status ambíguo é bug, não detalhe estético.
// ============================================================================

import * as React from "react";
import {
  agruparChave,
  formatBRL,
  truncarChave,
  type Documento,
  type DocumentoStatus,
  type DocumentoTipo,
  type Fonte,
  type Guarda,
  type Local,
  type RiscoSeveridade,
  type ViagemStatus,
} from "@ai4l/core";

// ---------------------------------------------------------------- semântica

/** Eixo de estado. Cada tom tem uma forma fixa e exclusiva. */
type Semantico = "ok" | "pendente" | "processo" | "erro" | "neutro";

/**
 * Marcador de forma por tom semântico. O par forma<->tom é fixo no produto
 * inteiro: quem aprende "◐ = pendente" uma vez lê qualquer tela sem cor.
 */
const FORMA: Record<Semantico, string> = {
  ok: "●",
  pendente: "◐",
  processo: "▶",
  erro: "✕",
  neutro: "—",
};

type EstiloToken = React.CSSProperties & Record<string, string>;

function corDeStatus(tom: Semantico): EstiloToken {
  return {
    color: `var(--status-${tom})`,
    "--indicador-bg": `var(--status-${tom}-bg)`,
  };
}

/** Bloco cor + forma + rótulo. Os três canais sempre juntos. */
function Indicador({
  tom,
  rotulo,
  sub,
  titulo,
}: {
  tom: Semantico;
  rotulo: string;
  sub?: string;
  titulo?: string;
}) {
  return (
    <span className="indicador" style={corDeStatus(tom)} title={titulo}>
      <span className="indicador-forma" aria-hidden="true">
        {FORMA[tom]}
      </span>
      <span className="indicador-rotulo">{rotulo}</span>
      {sub ? <span className="indicador-sub">{sub}</span> : null}
    </span>
  );
}

// ------------------------------------------------------------ StatusViagem

const VIAGEM: Record<ViagemStatus, { tom: Semantico; rotulo: string }> = {
  rascunho: { tom: "neutro", rotulo: "Rascunho" },
  documentos_pendentes: { tom: "pendente", rotulo: "Documentos pendentes" },
  em_emissao: { tom: "processo", rotulo: "Em emissão" },
  pronta: { tom: "ok", rotulo: "Pronta" },
  em_transito: { tom: "processo", rotulo: "Em trânsito" },
  entregue: { tom: "ok", rotulo: "Entregue" },
  encerrada: { tom: "ok", rotulo: "Encerrada" },
  acertada: { tom: "ok", rotulo: "Acertada" },
  cancelada: { tom: "neutro", rotulo: "Cancelada" },
};

export function StatusViagem({ status }: { status: ViagemStatus }) {
  const { tom, rotulo } = VIAGEM[status] ?? {
    tom: "neutro" as const,
    rotulo: status,
  };
  return <Indicador tom={tom} rotulo={rotulo} />;
}

// ---------------------------------------------------------- StatusDocumento

const DOCUMENTO: Record<DocumentoStatus, { tom: Semantico; rotulo: string }> = {
  nao_aplicavel: { tom: "neutro", rotulo: "Não aplicável" },
  pendente: { tom: "pendente", rotulo: "Pendente" },
  enviando: { tom: "processo", rotulo: "Enviando" },
  autorizado: { tom: "ok", rotulo: "Autorizado" },
  rejeitado: { tom: "erro", rotulo: "Rejeitado" },
  denegado: { tom: "erro", rotulo: "Denegado" },
  cancelado: { tom: "neutro", rotulo: "Cancelado" },
  encerrado: { tom: "ok", rotulo: "Encerrado" },
  contingencia: { tom: "pendente", rotulo: "Contingência" },
};

export const ROTULO_TIPO: Record<DocumentoTipo, string> = {
  cte: "CT-e",
  mdfe: "MDF-e",
  ciot: "CIOT",
  vale_pedagio: "VP",
};

/** Ordem canônica da trilha documental. Nunca reordenar por conveniência. */
export const ORDEM_TIPOS: DocumentoTipo[] = ["cte", "mdfe", "ciot", "vale_pedagio"];

function resolverDocumento(status: DocumentoStatus, tipo: DocumentoTipo) {
  const base = DOCUMENTO[status] ?? { tom: "neutro" as const, rotulo: status };
  // MDF-e autorizado é MDF-e ABERTO: autorizado-e-não-encerrado é exatamente
  // o estado que bloqueia o veículo na próxima viagem. Chamar isso de
  // "Autorizado" em verde seria mentir com a cor certa.
  if (tipo === "mdfe" && status === "autorizado") {
    return { tom: "pendente" as const, rotulo: "ABERTO" };
  }
  return base;
}

export function StatusDocumento({
  status,
  tipo,
}: {
  status: DocumentoStatus;
  tipo: DocumentoTipo;
}) {
  const { tom, rotulo } = resolverDocumento(status, tipo);
  // A prop `titulo` é OMITIDA quando não há tooltip a dar. Com
  // `exactOptionalPropertyTypes` (tsconfig.base.json da raiz) passar `undefined`
  // não é o mesmo que não passar.
  const titulo =
    tipo === "mdfe" && status === "autorizado"
      ? { titulo: "MDF-e autorizado e ainda não encerrado." }
      : {};
  return <Indicador tom={tom} rotulo={rotulo} sub={ROTULO_TIPO[tipo]} {...titulo} />;
}

// --------------------------------------------------------- TrilhaDocumentos

/**
 * Os quatro tipos, sempre. Documento ausente vira chip esmaecido de
 * "não aplicável" e nunca desaparece: a ausência é informação — um MDF-e que
 * não existe é diferente de um MDF-e que não foi checado.
 */
const ROTULO_CURTO: Record<string, string> = {
  nao_aplicavel: "n/a",
  pendente: "pendente",
  enviando: "enviando",
  autorizado: "ok",
  rejeitado: "rejeitado",
  denegado: "denegado",
  cancelado: "cancelado",
  encerrado: "encerrado",
  contingencia: "conting.",
};

export function TrilhaDocumentos({
  documentos,
  compacto,
}: {
  documentos: Documento[];
  /** Em tabela densa: rótulo de status abreviado, sem perder cor nem forma. */
  compacto?: boolean;
}) {
  const porTipo = new Map<DocumentoTipo, Documento>();
  for (const doc of documentos) {
    if (!porTipo.has(doc.tipo)) porTipo.set(doc.tipo, doc);
  }

  return (
    <ol className={compacto ? "trilha trilha-compacta" : "trilha"}>
      {ORDEM_TIPOS.map((tipo, i) => {
        const doc = porTipo.get(tipo);
        if (compacto) {
          const st = doc?.status ?? "nao_aplicavel";
          const rotuloStatus = doc ? (ROTULO_CURTO[st] ?? st) : "n/a";
          // MDF-e autorizado é "aberto": autorizado-e-não-encerrado é o estado
          // perigoso, e chamá-lo de "ok" seria mentir com a cor certa.
          const rotulo = tipo === "mdfe" && st === "autorizado" ? "aberto" : rotuloStatus;
          const tom = doc ? DOCUMENTO[st].tom : ("neutro" as const);
          return (
            <li key={tipo} className="trilha-item-wrap">
              <span
                className="chip-doc"
                data-ausente={doc ? undefined : "sim"}
                style={{ color: `var(--status-${tom})` }}
                title={`${ROTULO_TIPO[tipo]}: ${doc ? rotulo : "não aplicável"}`}
              >
                <span className="indicador-forma" aria-hidden="true">
                  {FORMA[tom]}
                </span>
                <b>{ROTULO_TIPO[tipo]}</b>
                <i>{rotulo}</i>
              </span>
            </li>
          );
        }
        return (
          <li key={tipo} className="trilha-item-wrap">
            {i > 0 ? (
              <span className="trilha-sep" aria-hidden="true">
                ·
              </span>
            ) : null}
            <span className="trilha-item">
              {doc ? (
                <StatusDocumento status={doc.status} tipo={tipo} />
              ) : (
                <span className="indicador indicador-ausente">
                  <span className="indicador-forma" aria-hidden="true">
                    {FORMA.neutro}
                  </span>
                  <span className="indicador-rotulo">não aplicável</span>
                  <span className="indicador-sub">{ROTULO_TIPO[tipo]}</span>
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// --------------------------------------------------------------- ChaveAcesso

/**
 * 44 dígitos crus numa célula de tabela destroem a linha e ninguém lê mesmo.
 * 'curta' trunca, 'completa' agrupa de 4 em 4. A chave inteira fica sempre no
 * `title`, que é de onde o usuário copia para o portal da SEFAZ.
 */
export function ChaveAcesso({
  chave,
  modo = "curta",
}: {
  chave: string;
  modo?: "curta" | "completa";
}) {
  const texto = modo === "completa" ? agruparChave(chave) : truncarChave(chave);
  return (
    <span
      className={modo === "completa" ? "chave chave-completa num" : "chave num"}
      title={chave}
    >
      {texto}
    </span>
  );
}

// ---------------------------------------------------------------- Severidade

/**
 * Severidade de risco é um eixo SEPARADO do status. Cores e formas não se
 * cruzam com as de estado: "crítico" nunca pode ser confundido com "pendente".
 */
const SEVERIDADE: Record<RiscoSeveridade, { rotulo: string; forma: string }> = {
  bloqueante: { rotulo: "Bloqueante", forma: "■" },
  critico: { rotulo: "Crítico", forma: "▲" },
  alto: { rotulo: "Alto", forma: "◆" },
  medio: { rotulo: "Médio", forma: "◇" },
};

export function Severidade({
  nivel,
  comRotulo = true,
}: {
  nivel: RiscoSeveridade;
  comRotulo?: boolean;
}) {
  const { rotulo, forma } = SEVERIDADE[nivel] ?? {
    rotulo: nivel,
    forma: "◇",
  };
  const estilo: EstiloToken = {
    color: `var(--sev-${nivel})`,
    "--sev-bg": `var(--sev-${nivel}-bg)`,
  };
  return (
    <span className="severidade" style={estilo} title={`Severidade: ${rotulo}`}>
      <span className="indicador-forma" aria-hidden="true">
        {forma}
      </span>
      {comRotulo ? (
        <span className="indicador-rotulo">{rotulo}</span>
      ) : (
        <span className="visualmente-oculto">{`Severidade: ${rotulo}`}</span>
      )}
    </span>
  );
}

// ------------------------------------------------------------------ Dinheiro

/**
 * `formatBRL` de @ai4l/core já devolve "R$ 8.420,00" inteiro, com o símbolo.
 * Este componente NÃO acrescenta outro: ele apenas parte a string que formatBRL
 * produziu, para poder pintar o "R$" em tom secundário. Fonte única do formato.
 */
export function Dinheiro({ centavos }: { centavos: number }) {
  const negativo = centavos < 0;
  const texto = formatBRL(centavos);
  const corte = texto.indexOf("R$ ") + "R$ ".length;
  return (
    <span className={negativo ? "dinheiro num dinheiro-negativo" : "dinheiro num"}>
      <span className="dinheiro-moeda">{texto.slice(0, corte).trim()}</span>
      {texto.slice(corte)}
    </span>
  );
}

// ---------------------------------------------------------------------- Rota

function textoLocal(local: Local): string {
  return `${local.municipio}/${local.uf}`;
}

export function Rota({ origem, destino }: { origem: Local; destino: Local }) {
  return (
    <span className="rota" title={`${textoLocal(origem)} até ${textoLocal(destino)}`}>
      <span className="rota-local">{origem.municipio}</span>
      <span className="rota-uf">{origem.uf}</span>
      <span className="rota-seta" aria-hidden="true">
        →
      </span>
      <span className="visualmente-oculto">até</span>
      <span className="rota-local">{destino.municipio}</span>
      <span className="rota-uf">{destino.uf}</span>
    </span>
  );
}

// --------------------------------------------------------------------- Placa

/** Placa antiga AAA9999 ganha hífen; Mercosul AAA9A99 fica como está. */
function formatarPlaca(valor: string): string {
  const limpa = valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
  return limpa || valor;
}

export function Placa({ valor }: { valor: string }) {
  return <span className="placa">{formatarPlaca(valor)}</span>;
}

// ----------------------------------------------------------------- SeloFonte

/**
 * Guardrail anti-alucinação visível. Toda afirmação de regra fiscal na tela
 * carrega de onde ela veio; `confianca: 'verificar'` é dito em voz alta.
 */
export function SeloFonte({ fonte }: { fonte: Fonte }) {
  const verificar = fonte.confianca === "verificar";
  return (
    <span className="selo-fonte">
      <span className="selo-fonte-descricao">
        {fonte.url ? (
          <a
            className="selo-fonte-link"
            href={fonte.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {fonte.descricao}
          </a>
        ) : (
          fonte.descricao
        )}
      </span>
      {verificar ? (
        <span className="selo-fonte-verificar">
          <span className="indicador-forma" aria-hidden="true">
            {FORMA.pendente}
          </span>
          a verificar
        </span>
      ) : null}
    </span>
  );
}

// ---------------------------------------------------------------------- Acao

/**
 * O componente mais importante do produto.
 *
 * Guarda negada NÃO esconde o botão. Some o botão, some a regra, e o usuário
 * fica achando que o sistema quebrou. Aqui ele continua na tela, inerte, com
 * o motivo em português de dono de transportadora e a fonte logo abaixo. O
 * valor do produto está em explicar por que não dá.
 */
export function Acao({
  children,
  variante = "primario",
  href,
  guarda,
}: {
  children: React.ReactNode;
  variante?: "primario" | "fantasma";
  href?: string;
  guarda?: Guarda;
}) {
  const negada = guarda !== undefined && guarda.permitido === false;

  if (negada) {
    const g = guarda as Extract<Guarda, { permitido: false }>;
    return (
      <span className="acao-wrap">
        <span
          className="acao acao-bloqueada"
          role={href ? "link" : "button"}
          aria-disabled="true"
          tabIndex={0}
        >
          {children}
        </span>
        <span className="acao-motivo">
          <span className="acao-motivo-texto">{g.motivo}</span>
          <SeloFonte fonte={g.fonte} />
        </span>
      </span>
    );
  }

  const classe = `acao ${variante === "fantasma" ? "acao-fantasma" : "acao-primario"}`;

  if (href) {
    return (
      <a className={classe} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={classe} type="button">
      {children}
    </button>
  );
}
