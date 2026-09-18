// ============================================================================
// Fixtures: viagens da org-2 (Rodoviário Serra Dourada S/A, Anápolis/GO).
//
// Este arquivo existe para provar isolamento de tenant. TUDO aqui é distinto
// da org-1 a olho nu: numeração de viagem na faixa V-31xx, placas com letras
// iniciais que não aparecem na outra frota, CNPJs próprios, motoristas
// próprios. Se `viagensDaOrg` esquecer o filtro de orgId, a tela mostra placa
// e CNPJ de outra transportadora e o bug salta aos olhos no primeiro load.
//
// A operação da org-2 é saudável de propósito: certificado longe do
// vencimento, seguros já verificados pela ANTT, e só duas pendências leves
// (um MDF-e ainda não transmitido e um vale-pedágio a comprar). O contraste
// com a org-1 é o que torna a tela de risco legível.
//
// Determinismo e centavos inteiros valem igual. AGORA vem de viagens-org1.
// ============================================================================

import type { Carga, Local, Motorista, Parte, Veiculo, Viagem } from "@ai4l/core";
import { AGORA } from "./viagens-org1";

const DIA_MS = 86_400_000;
const HORA_MS = 3_600_000;

const diasAtras = (n: number) => AGORA - n * DIA_MS;
const horasAtras = (n: number) => AGORA - n * HORA_MS;

// ------------------------------------------------------------------- Locais

const ANAPOLIS: Local = { municipio: "Anápolis", uf: "GO", codigoIbge: "5201108" };
const RIO_VERDE: Local = { municipio: "Rio Verde", uf: "GO", codigoIbge: "5218805" };
const JATAI: Local = { municipio: "Jataí", uf: "GO", codigoIbge: "5211909" };
const CATALAO: Local = { municipio: "Catalão", uf: "GO", codigoIbge: "5205109" };
const ITUMBIARA: Local = { municipio: "Itumbiara", uf: "GO", codigoIbge: "5211306" };

const UBERLANDIA: Local = { municipio: "Uberlândia", uf: "MG", codigoIbge: "3170206" };
const UBERABA: Local = { municipio: "Uberaba", uf: "MG", codigoIbge: "3170107" };
const BETIM: Local = { municipio: "Betim", uf: "MG", codigoIbge: "3106705" };
const ARAXA: Local = { municipio: "Araxá", uf: "MG", codigoIbge: "3103504" };

const RIBEIRAO_PRETO: Local = {
  municipio: "Ribeirão Preto",
  uf: "SP",
  codigoIbge: "3543402",
};
const CAMPINAS: Local = { municipio: "Campinas", uf: "SP", codigoIbge: "3509502" };
const SOROCABA: Local = { municipio: "Sorocaba", uf: "SP", codigoIbge: "3552205" };
const SAO_PAULO: Local = { municipio: "São Paulo", uf: "SP", codigoIbge: "3550308" };

// --------------------------------------------------- Partes (todas exclusivas)

const SEMENTES_CHAPADAO: Parte = {
  nome: "Sementes Chapadão do Cerrado Ltda",
  cnpjCpf: "60518347000152",
  ie: "110384627",
  local: JATAI,
};
const NUTRI_SERRA_AZUL: Parte = {
  nome: "Nutrição Animal Serra Azul Ltda",
  cnpjCpf: "72904615000153",
  ie: "112057394",
  local: ANAPOLIS,
};
const LAT_MORRO_AGUDO: Parte = {
  nome: "Laticínios Morro Agudo S/A",
  cnpjCpf: "81392560000130",
  ie: "113642085",
  local: ITUMBIARA,
};
const TRANSBORDO_CATALAO: Parte = {
  nome: "Transbordo Catalão Armazéns Gerais Ltda",
  cnpjCpf: "45108936000179",
  ie: "109471530",
  local: CATALAO,
};

const GRAOS_UBERLANDIA: Parte = {
  nome: "Grãos Uberlândia Comércio e Exportação Ltda",
  cnpjCpf: "28605371000116",
  ie: "7021459630071",
  local: UBERLANDIA,
};
const AUTOPECAS_BETIM: Parte = {
  nome: "Autopeças Betim Indústria Ltda",
  cnpjCpf: "51839074000157",
  ie: "0628431790016",
  local: BETIM,
};
const CIMENTO_ARAXA: Parte = {
  nome: "Cimento Araxá Participações S/A",
  cnpjCpf: "73056219000186",
  ie: "0359128470042",
  local: ARAXA,
};
const LATICINIO_UBERABA: Parte = {
  nome: "Laticínio Uberaba Produtos Alimentícios Ltda",
  cnpjCpf: "06389542000184",
  ie: "7023185640029",
  local: UBERABA,
};

const AVICOLA_RIBEIRAO: Parte = {
  nome: "Avícola Ribeirão Preto Alimentos S/A",
  cnpjCpf: "39574206000160",
  ie: "582607419335",
  local: RIBEIRAO_PRETO,
};
const BEBIDAS_CAMPINAS: Parte = {
  nome: "Bebidas Campinas Engarrafadora Ltda",
  cnpjCpf: "62947108000143",
  ie: "244518073960",
  local: CAMPINAS,
};
const PAPEL_SOROCABA: Parte = {
  nome: "Papel e Celulose Sorocaba S/A",
  cnpjCpf: "84167320000120",
  ie: "671904238550",
  local: SOROCABA,
};
const ATACADAO_TIETE: Parte = {
  nome: "Atacadista Marginal Tietê Ltda",
  cnpjCpf: "95278431000120",
  ie: "110673204418",
  local: SAO_PAULO,
};

// ------------------------------------------- Veículos (frota separada da org-1)

const TJE_4B18: Veiculo = {
  placa: "TJE-4B18",
  renavam: "01427530968",
  modelo: "Scania R 460 A6x2",
  taraKg: 16_900,
};
const UKM_7C52: Veiculo = {
  placa: "UKM-7C52",
  renavam: "01536208741",
  modelo: "Volvo FH 500 6x4",
  taraKg: 18_100,
};
const LDV_9063: Veiculo = {
  placa: "LDV-9063",
  renavam: "00815943027",
  modelo: "Mercedes-Benz Atego 2430",
  taraKg: 11_400,
};
const TFN_2G85: Veiculo = {
  placa: "TFN-2G85",
  renavam: "01390746253",
  modelo: "DAF XF 530 FTS",
  taraKg: 17_300,
};
const KBR_5140: Veiculo = {
  placa: "KBR-5140",
  renavam: "00762418539",
  modelo: "Iveco S-Way 480",
  taraKg: 16_700,
};
const UPC_6D73: Veiculo = {
  placa: "UPC-6D73",
  renavam: "01608392574",
  modelo: "Volkswagen Meteor 29.520",
  taraKg: 17_800,
};
const LSA_8319: Veiculo = {
  placa: "LSA-8319",
  renavam: "00938261470",
  modelo: "Ford Cargo 2429",
  taraKg: 11_100,
};

// --------------------------------------------------------------- Motoristas

const WANDERLEY: Motorista = {
  nome: "Wanderley Coutinho Dias",
  cpf: "18274930541",
  telefone: "62992748130",
};
const ELIZEU: Motorista = {
  nome: "Elizeu Martins Falcão",
  cpf: "64018537271",
  telefone: "62981039475",
};
const NIVALDO: Motorista = {
  nome: "Nivaldo Ribeiro Tavares",
  cpf: "35706294810",
  telefone: "62994561278",
};
const JOCIMAR: Motorista = {
  nome: "Jocimar Andrade Peixoto",
  cpf: "82461307903",
  telefone: "64983720165",
};
const HELIO: Motorista = {
  nome: "Hélio Damasceno Borges",
  cpf: "50693821442",
  telefone: "62987314026",
};

// -------------------------------------------------------------------- Cargas

const carga = (
  produtoPredominante: string,
  pesoKg: number,
  valorCentavos: number,
  ncm?: string,
): Carga => ({ produtoPredominante, pesoKg, valorCentavos, ...(ncm ? { ncm } : {}) });

// =============================================================== As viagens

export const VIAGENS_ORG2: Viagem[] = [
  // 1 ------------------------------------------------------------------------
  {
    id: "v-3101",
    orgId: "org-2",
    numero: "V-3101",
    status: "em_transito",
    origem: ANAPOLIS,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: GRAOS_UBERLANDIA,
    remetente: NUTRI_SERRA_AZUL,
    destinatario: GRAOS_UBERLANDIA,
    veiculo: TJE_4B18,
    motorista: WANDERLEY,
    carga: carga("Farelo de soja ensacado", 31_000, 8_680_000, "23040090"),
    valorFreteCentavos: 706_000,
    documentos: [
      {
        id: "d-3101-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8812",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088121757517812",
        protocolo: "152260008812416",
        autorizadoEm: diasAtras(2),
      },
      {
        id: "d-3101-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "3350",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033501326029325",
        protocolo: "152260003350729",
        autorizadoEm: diasAtras(2),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(3),
    atualizadaEm: diasAtras(2),
    iniciadaEm: diasAtras(2),
  },

  // 2 ------------------------------------------------------------------------
  // Caminho completo: entregue, manifesto encerrado, frete acertado.
  {
    id: "v-3102",
    orgId: "org-2",
    numero: "V-3102",
    status: "acertada",
    origem: ANAPOLIS,
    destino: RIBEIRAO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: AVICOLA_RIBEIRAO,
    remetente: NUTRI_SERRA_AZUL,
    destinatario: AVICOLA_RIBEIRAO,
    veiculo: UKM_7C52,
    motorista: ELIZEU,
    carga: carga("Ração animal paletizada", 27_000, 7_020_000, "23099090"),
    valorFreteCentavos: 1_138_000,
    documentos: [
      {
        id: "d-3102-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8813",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088131757597007",
        protocolo: "152260008813284",
        autorizadoEm: diasAtras(14),
      },
      {
        id: "d-3102-mdfe",
        tipo: "mdfe",
        status: "encerrado",
        numero: "3351",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033511326108516",
        protocolo: "152260003351507",
        autorizadoEm: diasAtras(14),
        encerradoEm: diasAtras(11),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-3102-1",
        documentoId: "d-3102-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(12),
        protocolo: "152260011018318",
        detalhe: "Entrega em Ribeirão Preto/SP conferida na doca.",
      },
      {
        id: "e-3102-2",
        documentoId: "d-3102-mdfe",
        modelo: 58,
        codigo: "110112",
        nome: "Encerramento do MDF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(11),
        protocolo: "152260011011502",
        detalhe: "Encerrado em Ribeirão Preto/SP, fim do percurso.",
      },
    ],
    criadaEm: diasAtras(15),
    atualizadaEm: diasAtras(9),
    iniciadaEm: diasAtras(14),
    entregueEm: diasAtras(12),
    encerradaEm: diasAtras(11),
  },

  // 3 ------------------------------------------------------------------------
  // Pronta para sair, dentro de GO. PENDÊNCIA LEVE: vale-pedágio a comprar.
  {
    id: "v-3103",
    orgId: "org-2",
    numero: "V-3103",
    status: "pronta",
    origem: ANAPOLIS,
    destino: CATALAO,
    ufsPercurso: ["GO"],
    tomador: TRANSBORDO_CATALAO,
    remetente: NUTRI_SERRA_AZUL,
    destinatario: TRANSBORDO_CATALAO,
    veiculo: LDV_9063,
    motorista: NIVALDO,
    carga: carga("Sal mineral ensacado", 14_000, 2_240_000, "23099010"),
    valorFreteCentavos: 312_000,
    documentos: [
      {
        id: "d-3103-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8814",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088141757676192",
        protocolo: "152260008814061",
        autorizadoEm: horasAtras(9),
      },
      {
        id: "d-3103-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "3352",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033521326187707",
        protocolo: "152260003352843",
        autorizadoEm: horasAtras(8),
        parUf: { carregamento: "GO", descarregamento: "GO" },
        temCiot: true,
      },
      {
        id: "d-3103-vale-pedagio",
        tipo: "vale_pedagio",
        status: "pendente",
        explicacao:
          "Falta comprar e vincular o vale-pedágio desta viagem. Documentos fiscais já estão de pé, então isto não segura a emissão; segura o acerto com o motorista, que senão paga o pedágio do próprio bolso. Peça o vale ao contratante antes do veículo sair de Anápolis.",
      },
    ],
    eventos: [],
    criadaEm: horasAtras(14),
    atualizadaEm: horasAtras(7),
  },

  // 4 ------------------------------------------------------------------------
  // Entregue há 1 dia com o manifesto ainda autorizado. É o mesmo buraco da
  // org-1, só que novo: 3 dias de manifesto aberto, bem longe do limiar.
  {
    id: "v-3104",
    orgId: "org-2",
    numero: "V-3104",
    status: "entregue",
    origem: ANAPOLIS,
    destino: BETIM,
    ufsPercurso: ["GO", "MG"],
    tomador: AUTOPECAS_BETIM,
    remetente: NUTRI_SERRA_AZUL,
    destinatario: AUTOPECAS_BETIM,
    veiculo: TFN_2G85,
    motorista: JOCIMAR,
    carga: carga("Peças automotivas paletizadas", 18_000, 19_800_000, "87089990"),
    valorFreteCentavos: 884_000,
    documentos: [
      {
        id: "d-3104-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8815",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088151757755383",
        protocolo: "152260008815937",
        autorizadoEm: diasAtras(5),
      },
      {
        id: "d-3104-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "3353",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033531326266892",
        protocolo: "152260003353192",
        autorizadoEm: diasAtras(3),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-3104-1",
        documentoId: "d-3104-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(1),
        protocolo: "152260011018345",
        detalhe: "Descarga concluída em Betim/MG.",
      },
    ],
    criadaEm: diasAtras(6),
    atualizadaEm: diasAtras(1),
    iniciadaEm: diasAtras(3),
    entregueEm: diasAtras(1),
  },

  // 5 ------------------------------------------------------------------------
  {
    id: "v-3105",
    orgId: "org-2",
    numero: "V-3105",
    status: "encerrada",
    origem: ANAPOLIS,
    destino: CAMPINAS,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: BEBIDAS_CAMPINAS,
    remetente: LAT_MORRO_AGUDO,
    destinatario: BEBIDAS_CAMPINAS,
    veiculo: KBR_5140,
    motorista: HELIO,
    carga: carga("Leite em pó em sacaria", 22_000, 24_200_000, "04021010"),
    valorFreteCentavos: 1_296_000,
    documentos: [
      {
        id: "d-3105-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8816",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088161757834574",
        protocolo: "152260008816470",
        autorizadoEm: diasAtras(9),
      },
      {
        id: "d-3105-mdfe",
        tipo: "mdfe",
        status: "encerrado",
        numero: "3354",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033541326346087",
        protocolo: "152260003354655",
        autorizadoEm: diasAtras(9),
        encerradoEm: diasAtras(6),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-3105-1",
        documentoId: "d-3105-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(7),
        protocolo: "152260011018372",
        detalhe: "Entrega em Campinas/SP.",
      },
      {
        id: "e-3105-2",
        documentoId: "d-3105-mdfe",
        modelo: 58,
        codigo: "110112",
        nome: "Encerramento do MDF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(6),
        protocolo: "152260011011536",
        detalhe: "Encerrado em Campinas/SP no fim do percurso.",
      },
    ],
    criadaEm: diasAtras(10),
    atualizadaEm: diasAtras(6),
    iniciadaEm: diasAtras(9),
    entregueEm: diasAtras(7),
    encerradaEm: diasAtras(6),
  },

  // 6 ------------------------------------------------------------------------
  // PENDÊNCIA LEVE: CT-e autorizado e manifesto ainda não transmitido.
  {
    id: "v-3106",
    orgId: "org-2",
    numero: "V-3106",
    status: "documentos_pendentes",
    origem: RIO_VERDE,
    destino: SOROCABA,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: PAPEL_SOROCABA,
    remetente: SEMENTES_CHAPADAO,
    destinatario: PAPEL_SOROCABA,
    veiculo: UPC_6D73,
    motorista: WANDERLEY,
    carga: carga("Celulose em fardos", 25_000, 17_500_000, "47032900"),
    valorFreteCentavos: 1_342_000,
    documentos: [
      {
        id: "d-3106-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8817",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088171757913765",
        protocolo: "152260008817128",
        autorizadoEm: horasAtras(6),
      },
      {
        id: "d-3106-mdfe",
        tipo: "mdfe",
        status: "pendente",
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: horasAtras(11),
    atualizadaEm: horasAtras(5),
  },

  // 7 ------------------------------------------------------------------------
  // Operação com terceiro completa: CIOT e vale-pedágio em ordem.
  {
    id: "v-3107",
    orgId: "org-2",
    numero: "V-3107",
    status: "em_transito",
    origem: ANAPOLIS,
    destino: UBERABA,
    ufsPercurso: ["GO", "MG"],
    tomador: LATICINIO_UBERABA,
    remetente: NUTRI_SERRA_AZUL,
    destinatario: LATICINIO_UBERABA,
    veiculo: LSA_8319,
    motorista: ELIZEU,
    carga: carga("Embalagens cartonadas paletizadas", 12_000, 4_800_000, "48191000"),
    valorFreteCentavos: 468_000,
    documentos: [
      {
        id: "d-3107-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8818",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088181757992956",
        protocolo: "152260008818703",
        autorizadoEm: diasAtras(1),
      },
      {
        id: "d-3107-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "3355",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033551326425278",
        protocolo: "152260003355380",
        autorizadoEm: diasAtras(1),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
      {
        id: "d-3107-ciot",
        tipo: "ciot",
        status: "autorizado",
        numero: "587301429065",
        autorizadoEm: diasAtras(1),
      },
      {
        id: "d-3107-vale-pedagio",
        tipo: "vale_pedagio",
        status: "autorizado",
        numero: "904612738055",
        autorizadoEm: diasAtras(1),
      },
    ],
    eventos: [],
    criadaEm: diasAtras(2),
    atualizadaEm: horasAtras(22),
    iniciadaEm: diasAtras(1),
  },

  // 8 ------------------------------------------------------------------------
  {
    id: "v-3108",
    orgId: "org-2",
    numero: "V-3108",
    status: "encerrada",
    origem: JATAI,
    destino: SAO_PAULO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ATACADAO_TIETE,
    remetente: SEMENTES_CHAPADAO,
    destinatario: ATACADAO_TIETE,
    veiculo: TJE_4B18,
    motorista: NIVALDO,
    carga: carga("Sementes de soja tratadas em big bags", 24_000, 21_600_000, "12019000"),
    valorFreteCentavos: 1_512_000,
    documentos: [
      {
        id: "d-3108-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8819",
        serie: "1",
        chaveAcesso: "52260809451872000140570010000088191758072145",
        protocolo: "152260008819246",
        autorizadoEm: diasAtras(22),
      },
      {
        id: "d-3108-mdfe",
        tipo: "mdfe",
        status: "encerrado",
        numero: "3356",
        serie: "1",
        chaveAcesso: "52260809451872000140580010000033561326504465",
        protocolo: "152260003356914",
        autorizadoEm: diasAtras(22),
        encerradoEm: diasAtras(18),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-3108-1",
        documentoId: "d-3108-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(19),
        protocolo: "152260011018409",
        detalhe: "Entrega no CD da marginal Tietê, São Paulo/SP.",
      },
      {
        id: "e-3108-2",
        documentoId: "d-3108-mdfe",
        modelo: 58,
        codigo: "110112",
        nome: "Encerramento do MDF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(18),
        protocolo: "152260011011571",
        detalhe: "Encerrado em São Paulo/SP.",
      },
    ],
    criadaEm: diasAtras(23),
    atualizadaEm: diasAtras(18),
    iniciadaEm: diasAtras(22),
    entregueEm: diasAtras(19),
    encerradaEm: diasAtras(18),
  },

  // 9 ------------------------------------------------------------------------
  {
    id: "v-3109",
    orgId: "org-2",
    numero: "V-3109",
    status: "em_transito",
    origem: ITUMBIARA,
    destino: ARAXA,
    ufsPercurso: ["GO", "MG"],
    tomador: CIMENTO_ARAXA,
    remetente: LAT_MORRO_AGUDO,
    destinatario: CIMENTO_ARAXA,
    veiculo: UKM_7C52,
    motorista: JOCIMAR,
    carga: carga("Gesso agrícola a granel", 33_000, 1_980_000, "25201000"),
    valorFreteCentavos: 524_000,
    documentos: [
      {
        id: "d-3109-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "8820",
        serie: "1",
        chaveAcesso: "52260909451872000140570010000088201758151333",
        protocolo: "152260008820591",
        autorizadoEm: diasAtras(3),
      },
      {
        id: "d-3109-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "3357",
        serie: "1",
        chaveAcesso: "52260909451872000140580010000033571326583650",
        protocolo: "152260003357026",
        autorizadoEm: diasAtras(3),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(4),
    atualizadaEm: diasAtras(3),
    iniciadaEm: diasAtras(3),
  },
];
