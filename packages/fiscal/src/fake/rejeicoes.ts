// ============================================================================
// Catálogo de rejeições usado pelas fixtures do produto.
//
// Cada entrada carrega OS DOIS TEXTOS, sempre:
//
//   `mensagem`   — o texto CRU, no formato em que a SEFAZ devolve: prefixo
//                  "Rejeicao:", sem acento, sem reescrita. É o que o contador
//                  procura no Google e o que vai no ticket de suporte.
//   `explicacao` — linguagem de dono de transportadora. Diz O QUE ACONTECEU e
//                  O QUE FAZER AGORA. Sem jargão de leiaute.
//
// Mostrar só o cru é o mesmo que não mostrar nada: "Rejeicao 524: CFOP
// incompativel com a UF de inicio da prestacao" não diz a ninguém que o
// problema é que o CT-e foi marcado como viagem dentro do estado mas sai de um
// estado e entra em outro.
//
// ⚠️ PROCEDÊNCIA: os textos de `mensagem` são RECONSTRUÇÕES a partir do leiaute
// da SEFAZ, e NÃO capturas de resposta real de fornecedor — não temos
// credenciais. O item 6 do spike do ADR 0003 é justamente capturar os textos
// literais e corrigir este arquivo. Enquanto isso, trate `mensagem` como
// aproximação de FORMATO, não como string oficial.
//
// O mesmo código significa coisas diferentes em CT-e (57) e MDF-e (58), então
// o catálogo é indexado por (modelo, codigo), nunca só por código.
// ============================================================================

import type { ModeloFiscal } from "@ai4l/core";
import type { DenegacaoSefaz, RejeicaoSefaz } from "../provider";

export type EntradaCatalogo = {
  codigo: string;
  modelo: ModeloFiscal;
  mensagem: string;
  explicacao: string;
  campo?: string;
  corrigivel: boolean;
  /** Denegação queima a numeração e não se corrige nem se cancela. */
  denegacao?: boolean;
  parteIrregular?: "emitente" | "tomador" | "remetente" | "destinatario";
};

export const CATALOGO_REJEICOES: readonly EntradaCatalogo[] = [
  {
    codigo: "698",
    modelo: 58,
    mensagem:
      "Rejeicao: Informacao do seguro da carga obrigatoria para este tipo de emitente",
    explicacao:
      "O MDF-e foi recusado porque falta a informação do seguro da carga. A " +
      "SEFAZ exige o CNPJ da seguradora e o número da apólice no manifesto. " +
      "Pegue a apólice vigente da transportadora, cadastre uma vez nos dados " +
      "da empresa e reenvie — não precisa refazer a viagem. Se o seguro é do " +
      "contratante e não seu, marque essa opção no cadastro.",
    campo: "seguros",
    corrigivel: true,
  },
  {
    codigo: "301",
    modelo: 58,
    mensagem: "Rejeicao: NCM do produto predominante nao informado",
    explicacao:
      "Falta o NCM do produto predominante da carga. NCM é o código de 8 " +
      "dígitos que classifica a mercadoria e aparece na nota fiscal que você " +
      "está transportando. Copie o NCM da NF-e de maior valor da carga. Se a " +
      "carga é variada, use o da mercadoria que pesa mais.",
    campo: "carga.ncm",
    corrigivel: true,
  },
  {
    codigo: "302",
    modelo: 57,
    mensagem: "Rejeicao: Irregularidade fiscal do tomador do servico",
    explicacao:
      "ATENÇÃO: este CT-e foi DENEGADO, não apenas recusado. O tomador do " +
      "serviço está com irregularidade fiscal na Receita do estado. A " +
      "diferença importa: um documento denegado queima o número, não pode ser " +
      "corrigido e não pode ser cancelado — ele fica registrado assim. Pule " +
      "para o próximo número. Antes de emitir de novo para este cliente, peça " +
      "que ele regularize a inscrição estadual, senão vai acontecer outra vez.",
    campo: "tomador.cnpjCpf",
    corrigivel: false,
    denegacao: true,
    parteIrregular: "tomador",
  },
  {
    codigo: "524",
    modelo: 57,
    mensagem: "Rejeicao: CFOP incompativel com a UF de inicio da prestacao",
    explicacao:
      "O tipo de operação do CT-e não bate com o trajeto. Você marcou uma " +
      "operação dentro do mesmo estado, mas a viagem começa em um estado e " +
      "termina em outro (ou o contrário). Confira a cidade de origem e a de " +
      "destino: se elas estão em estados diferentes, a operação é " +
      "interestadual. Corrigir isso e reenviar resolve.",
    campo: "origem.uf",
    corrigivel: true,
  },
  {
    codigo: "626",
    modelo: 57,
    mensagem: "Rejeicao: Chave de acesso da NF-e invalida",
    explicacao:
      "Uma das notas fiscais informadas neste CT-e tem chave inválida. A " +
      "chave tem exatamente 44 dígitos e o último é um verificador — então um " +
      "único número digitado errado já derruba a emissão. Quase sempre é erro " +
      "de digitação ou uma chave colada pela metade. Confira as 44 posições " +
      "da chave de cada nota da carga e reenvie.",
    campo: "chavesNfe",
    corrigivel: true,
  },
  {
    codigo: "686",
    modelo: 58,
    mensagem:
      "Rejeicao: Existe MDF-e nao encerrado ha mais de 30 dias para este emitente",
    explicacao:
      "A SEFAZ bloqueou a emissão porque existe um MDF-e antigo em aberto, " +
      "sem encerramento, há mais de 30 dias. Isso não se resolve mexendo " +
      "neste manifesto: você precisa encerrar o manifesto antigo primeiro. " +
      "Depois de encerrar o que ficou para trás, reenvie este aqui. É o caso " +
      "clássico de viagem que terminou e ninguém deu baixa no sistema.",
    corrigivel: false,
  },
] as const;

function chaveCatalogo(modelo: ModeloFiscal, codigo: string): string {
  return `${modelo}:${codigo}`;
}

const INDICE: ReadonlyMap<string, EntradaCatalogo> = new Map(
  CATALOGO_REJEICOES.map((e) => [chaveCatalogo(e.modelo, e.codigo), e]),
);

export function buscarRejeicao(
  modelo: ModeloFiscal,
  codigo: string,
): EntradaCatalogo | undefined {
  return INDICE.get(chaveCatalogo(modelo, codigo));
}

/**
 * Converte uma entrada do catálogo no erro tipado correspondente.
 * Denegação vira `DenegacaoSefaz`, não `RejeicaoSefaz` — são categorias
 * distintas porque a UI reage diferente a cada uma.
 */
export function comoErro(
  entrada: EntradaCatalogo,
  chaveAcesso?: string,
): RejeicaoSefaz | DenegacaoSefaz {
  if (entrada.denegacao) {
    return {
      tipo: "denegacao",
      codigo: entrada.codigo,
      mensagem: entrada.mensagem,
      explicacao: entrada.explicacao,
      modelo: entrada.modelo,
      ...(chaveAcesso ? { chaveAcesso } : {}),
      ...(entrada.parteIrregular ? { parteIrregular: entrada.parteIrregular } : {}),
    };
  }
  return {
    tipo: "rejeicao",
    codigo: entrada.codigo,
    mensagem: entrada.mensagem,
    explicacao: entrada.explicacao,
    modelo: entrada.modelo,
    ...(entrada.campo ? { campo: entrada.campo } : {}),
    corrigivel: entrada.corrigivel,
  };
}

/** Códigos que as fixtures do produto exercitam. */
export const CODIGOS_FIXTURE = ["698", "301", "302", "524", "626", "686"] as const;
export type CodigoFixture = (typeof CODIGOS_FIXTURE)[number];
