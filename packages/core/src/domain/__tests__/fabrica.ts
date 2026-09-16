// ============================================================================
// Fábrica de objetos de domínio para os testes.
//
// Tudo aceita overrides parciais para que cada teste diga SÓ o que importa
// para ele. Relógio fixo em AGORA: nenhum teste do núcleo pode depender de
// Date.now(), porque prazo fiscal medido contra relógio real é teste que
// quebra sozinho na virada do dia.
// ============================================================================

import type {
  Carga,
  Documento,
  DocumentoStatus,
  DocumentoTipo,
  EventoFiscal,
  Local,
  ModeloFiscal,
  Motorista,
  Org,
  Parte,
  UF,
  Veiculo,
  Viagem,
  ViagemStatus,
} from "../tipos";
import { DIA_MS, HORA_MS, MAX_UF_PERCURSO_ROTA_CURTA } from "../prazos";

/** Relógio fixo de todos os testes. epoch ms. */
export const AGORA = 1789574400000;

export const horasAtras = (h: number): number => AGORA - h * HORA_MS;
export const diasAtras = (d: number): number => AGORA - d * DIA_MS;
export const horasAFrente = (h: number): number => AGORA + h * HORA_MS;
export const diasAFrente = (d: number): number => AGORA + d * DIA_MS;

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

/**
 * Overrides de fábrica.
 *
 * Aceitam `undefined` EXPLÍCITO, porque é assim que um teste diz "este campo
 * não existe" — `mdfe(1, { autorizadoEm: undefined })` quer dizer "MDF-e sem
 * data de autorização", que é um caso real e testado. O tsconfig da raiz liga
 * `exactOptionalPropertyTypes`, sob o qual `{ a: undefined }` NÃO é o mesmo que
 * `{}`, então `semUndefined` remove a chave de verdade antes de compor o objeto
 * e a intenção do teste volta a valer.
 */
export type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

function semUndefined<T extends object>(o: Overrides<T>): T {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(o as Record<string, unknown>)) {
    if (valor !== undefined) saida[chave] = valor;
  }
  return saida as T;
}

/**
 * Primeiro item de uma lista, com falha explícita quando não há nenhum.
 * `noUncheckedIndexedAccess` está ligado no tsconfig da raiz; isto dá uma
 * mensagem útil em vez de um `possibly undefined` no compilador ou um
 * `Cannot read properties of undefined` no meio da asserção.
 */
export function um<T>(xs: readonly T[]): T {
  const v = xs[0];
  if (v === undefined) {
    throw new Error(`esperava ao menos um item, a lista veio com ${xs.length}`);
  }
  return v;
}

// ---------------------------------------------------------------------------

/** Chave de acesso em formato real: 44 dígitos. */
export const CHAVE_44 = "35260912345678000190570010000010011000010012";

let seq = 0;
const proximoId = (prefixo: string) => `${prefixo}-${++seq}`;

/** Zera o contador de ids, para que ids sejam estáveis dentro de um teste. */
export function resetarIds(): void {
  seq = 0;
}

// ---------------------------------------------------------------------------

export function local(overrides: Overrides<Local> = {}): Local {
  return semUndefined<Local>({ municipio: "São Paulo", uf: "SP", ...overrides });
}

export function parte(overrides: Overrides<Parte> = {}): Parte {
  return semUndefined<Parte>({
    nome: "Parte Ltda",
    cnpjCpf: "12345678000190",
    local: local(),
    ...overrides,
  });
}

export function veiculo(overrides: Overrides<Veiculo> = {}): Veiculo {
  return semUndefined<Veiculo>({ placa: "ABC1D23", ...overrides });
}

export function motorista(overrides: Overrides<Motorista> = {}): Motorista {
  return semUndefined<Motorista>({
    nome: "João Motorista",
    cpf: "12345678909",
    ...overrides,
  });
}

export function carga(overrides: Overrides<Carga> = {}): Carga {
  return semUndefined<Carga>({
    produtoPredominante: "Carga geral",
    pesoKg: 12000,
    valorCentavos: 5_000_000,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

export function org(overrides: Overrides<Org> = {}): Org {
  return semUndefined<Org>({
    id: proximoId("org"),
    nome: "Transportadora Teste Ltda",
    cnpj: "12345678000190",
    uf: "SP",
    regimeTributario: "lucro_presumido",
    crt: 3,
    rntrc: "12345678",
    rntrcStatus: "ativo",
    // Longe de qualquer aviso: quem quiser risco de certificado, que passe.
    certificadoA1: { validoAte: diasAFrente(365) },
    segurosVerificadosEm: diasAtras(10),
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

export function documento(overrides: Overrides<Documento> = {}): Documento {
  const tipo: DocumentoTipo = overrides.tipo ?? "cte";
  const status: DocumentoStatus = overrides.status ?? "autorizado";
  return semUndefined<Documento>({
    id: proximoId("doc"),
    tipo,
    status,
    numero: "1001",
    serie: "1",
    chaveAcesso: CHAVE_44,
    ...overrides,
  });
}

/** CT-e autorizado há `h` horas. */
export function cte(h: number, overrides: Overrides<Documento> = {}): Documento {
  return documento({
    tipo: "cte",
    status: "autorizado",
    autorizadoEm: horasAtras(h),
    ...overrides,
  });
}

/** MDF-e autorizado (aberto) há `d` dias. */
export function mdfe(d: number, overrides: Overrides<Documento> = {}): Documento {
  return documento({
    tipo: "mdfe",
    status: "autorizado",
    autorizadoEm: diasAtras(d),
    parUf: { carregamento: "SP", descarregamento: "MG" },
    temCiot: true,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

export function evento(overrides: Overrides<EventoFiscal> = {}): EventoFiscal {
  const modelo: ModeloFiscal = overrides.modelo ?? 57;
  return semUndefined<EventoFiscal>({
    id: proximoId("ev"),
    modelo,
    codigo: "110111",
    nome: "Evento",
    autor: "emitente",
    ocorridoEm: horasAtras(1),
    ...overrides,
  });
}

/** Comprovante de Entrega eletrônico no CT-e. */
export const eventoComprovanteEntrega = (o: Overrides<EventoFiscal> = {}) =>
  evento({ modelo: 57, codigo: "110180", nome: "Comprovante de Entrega", ...o });

/** Carta de Correção Eletrônica no CT-e. */
export const eventoCartaCorrecao = (o: Overrides<EventoFiscal> = {}) =>
  evento({ modelo: 57, codigo: "110110", nome: "Carta de Correção", ...o });

// ---------------------------------------------------------------------------

export function viagem(overrides: Overrides<Viagem> = {}): Viagem {
  const status: ViagemStatus = overrides.status ?? "pronta";
  const origemUf: UF = overrides.origem?.uf ?? "SP";
  return semUndefined<Viagem>({
    id: proximoId("viagem"),
    orgId: "org-1",
    numero: "V-0001",
    status,
    origem: local({ uf: origemUf, municipio: "São Paulo" }),
    destino: local({ uf: "MG", municipio: "Belo Horizonte" }),
    ufsPercurso: [origemUf, "MG"],
    tomador: parte({ nome: "Tomador Ltda" }),
    remetente: parte({ nome: "Remetente Ltda" }),
    destinatario: parte({ nome: "Destinatário Ltda" }),
    veiculo: veiculo(),
    motorista: motorista(),
    carga: carga(),
    valorFreteCentavos: 842_000,
    documentos: [],
    eventos: [],
    criadaEm: diasAtras(2),
    atualizadaEm: horasAtras(1),
    ...overrides,
  });
}

/** Viagem com UF de origem `uf` — atalho, já que a janela do CT-e é por UF. */
export function viagemEm(uf: UF, overrides: Overrides<Viagem> = {}): Viagem {
  return viagem({
    origem: local({ uf, municipio: "Cidade" }),
    ufsPercurso: [uf, "MG"],
    ...overrides,
  });
}

// ------------------------------------------------- Rota curta × rota longa
//
// A regra F87/462 (bloqueio da placa em 5 dias) só morde rota com no máximo
// MAX_UF_PERCURSO_ROTA_CURTA UF de percurso. Como o comprimento da rota decide
// QUAIS riscos nascem, todo teste de limiar precisa dizer explicitamente em
// qual dos dois mundos está. Ambas as listas são derivadas do parâmetro, não
// escritas à mão: se o MOC mudar o máximo, elas acompanham.

/** Percurso curto: exatamente no limite da F87. */
export const PERCURSO_CURTO: UF[] = (["GO", "MG", "SP", "RJ", "BA", "PR"] as UF[]).slice(
  0,
  MAX_UF_PERCURSO_ROTA_CURTA,
);

/** Percurso longo: uma UF acima do limite da F87, logo fora dela. */
export const PERCURSO_LONGO: UF[] = (
  ["RS", "SC", "PR", "SP", "MG", "GO", "TO", "PA", "MA", "CE"] as UF[]
).slice(0, MAX_UF_PERCURSO_ROTA_CURTA + 1);

/**
 * Viagem de ROTA LONGA: fora da F87, para isolar o limiar de 30 dias (F86).
 * Sem isto, todo teste do limiar do CNPJ vem contaminado pelo risco de rota
 * curta, que dispara muito antes.
 */
export function viagemRotaLonga(overrides: Overrides<Viagem> = {}): Viagem {
  return viagem({
    origem: local({ uf: PERCURSO_LONGO[0]!, municipio: "Porto Alegre" }),
    destino: local({ uf: PERCURSO_LONGO.at(-1)!, municipio: "Destino" }),
    ufsPercurso: PERCURSO_LONGO,
    ...overrides,
  });
}

/** Viagem de ROTA CURTA: dentro da F87. */
export function viagemRotaCurta(overrides: Overrides<Viagem> = {}): Viagem {
  return viagem({
    origem: local({ uf: PERCURSO_CURTO[0]!, municipio: "Goiânia" }),
    destino: local({ uf: PERCURSO_CURTO.at(-1)!, municipio: "Destino" }),
    ufsPercurso: PERCURSO_CURTO,
    ...overrides,
  });
}
