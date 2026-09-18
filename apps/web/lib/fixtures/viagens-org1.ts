// ============================================================================
// Fixtures: viagens da org-1 (Transportes São Jorge Ltda, Goiânia/GO).
//
// Regras desta pasta:
//
// 1. DETERMINISMO. Nenhum Math.random, nenhum Date.now. Toda data sai de AGORA.
//    A mesma fixture carregada hoje, amanhã ou no CI produz exatamente os
//    mesmos riscos, os mesmos prazos e as mesmas telas.
// 2. DINHEIRO EM CENTAVOS INTEIROS. `valorFreteCentavos: 842000` é R$ 8.420,00.
//    Float em dinheiro é bug de produção esperando acontecer.
// 3. TEMPO EM EPOCH MS, sempre UTC.
// 4. Toda rejeição carrega DOIS textos: `mensagemRejeicao` com o retorno cru da
//    SEFAZ (sem acento, como ela devolve) e `explicacao` em português de dono de
//    transportadora, dizendo o que fazer.
// 5. Nenhuma `explicacao` afirma prazo ou multa que não esteja parametrizado em
//    prazos.ts. Em particular: NÃO existe prazo em horas para encerrar MDF-e, e
//    a data de obrigatoriedade do CIOT no manifesto não está confirmada — nenhum
//    texto daqui cita uma.
// 6. `entregue` e `encerrada` são estados diferentes. Entregue é a carga na mão
//    do destinatário; encerrada é o MDF-e baixado na SEFAZ. O buraco entre os
//    dois é o produto.
// ============================================================================

import type { Carga, Local, Motorista, Parte, Veiculo, Viagem } from "@ai4l/core";

/**
 * Relógio congelado de todas as fixtures.
 *
 * Observação honesta: o brief anotou este epoch como 2026-09-16T12:00:00Z;
 * 1789574400000 é de fato 2026-09-16T16:00:00Z. O VALOR é o contrato combinado
 * com o resto do time, então ele foi mantido e o comentário é que foi corrigido.
 */
export const AGORA = 1789574400000; // 2026-09-16T16:00:00Z

const DIA_MS = 86_400_000;
const HORA_MS = 3_600_000;

const diasAtras = (n: number) => AGORA - n * DIA_MS;
const horasAtras = (n: number) => AGORA - n * HORA_MS;

// ------------------------------------------------------------------- Locais

const GOIANIA: Local = { municipio: "Goiânia", uf: "GO", codigoIbge: "5208707" };
const ANAPOLIS: Local = { municipio: "Anápolis", uf: "GO", codigoIbge: "5201108" };
const RIO_VERDE: Local = { municipio: "Rio Verde", uf: "GO", codigoIbge: "5218805" };
const JATAI: Local = { municipio: "Jataí", uf: "GO", codigoIbge: "5211909" };
const CATALAO: Local = { municipio: "Catalão", uf: "GO", codigoIbge: "5205109" };
const ITUMBIARA: Local = { municipio: "Itumbiara", uf: "GO", codigoIbge: "5211306" };

const UBERLANDIA: Local = { municipio: "Uberlândia", uf: "MG", codigoIbge: "3170206" };
const UBERABA: Local = { municipio: "Uberaba", uf: "MG", codigoIbge: "3170107" };
const BETIM: Local = { municipio: "Betim", uf: "MG", codigoIbge: "3106705" };
const CONTAGEM: Local = { municipio: "Contagem", uf: "MG", codigoIbge: "3118601" };
const ARAXA: Local = { municipio: "Araxá", uf: "MG", codigoIbge: "3103504" };
const POCOS_DE_CALDAS: Local = {
  municipio: "Poços de Caldas",
  uf: "MG",
  codigoIbge: "3151800",
};

const RIBEIRAO_PRETO: Local = {
  municipio: "Ribeirão Preto",
  uf: "SP",
  codigoIbge: "3543402",
};
const CAMPINAS: Local = { municipio: "Campinas", uf: "SP", codigoIbge: "3509502" };
const SANTOS: Local = { municipio: "Santos", uf: "SP", codigoIbge: "3548500" };
const SOROCABA: Local = { municipio: "Sorocaba", uf: "SP", codigoIbge: "3552205" };
const RIO_PRETO: Local = {
  municipio: "São José do Rio Preto",
  uf: "SP",
  codigoIbge: "3549805",
};
const SAO_PAULO: Local = { municipio: "São Paulo", uf: "SP", codigoIbge: "3550308" };

// ------------------------------------------------------------------- Partes

const AGRO_CERRADO: Parte = {
  nome: "Agro Cerrado Insumos S/A",
  cnpjCpf: "21384769000120",
  ie: "103458721",
  local: RIO_VERDE,
};
const COOP_SUDOESTE: Parte = {
  nome: "Cooperativa Agroindustrial do Sudoeste Ltda",
  cnpjCpf: "07629431000160",
  ie: "104912336",
  local: RIO_VERDE,
};
const GRANJA_BOA_VISTA: Parte = {
  nome: "Granja Boa Vista Alimentos Ltda",
  cnpjCpf: "34801752000173",
  ie: "107235440",
  local: GOIANIA,
};
const FERT_PLANALTO: Parte = {
  nome: "Fertilizantes Planalto Central Ltda",
  cnpjCpf: "15960284000135",
  ie: "102876195",
  local: CATALAO,
};
const MOINHO_ANHANGUERA: Parte = {
  nome: "Moinho Anhanguera Alimentos S/A",
  cnpjCpf: "40273518000113",
  ie: "108640273",
  local: ANAPOLIS,
};
const FRIG_MEIA_PONTE: Parte = {
  nome: "Frigorífico Vale do Meia Ponte Ltda",
  cnpjCpf: "26839047000137",
  ie: "105318902",
  local: ITUMBIARA,
};
const USINA_AGUA_QUENTE: Parte = {
  nome: "Usina Água Quente Bioenergia S/A",
  cnpjCpf: "53187406000191",
  ie: "109774028",
  local: JATAI,
};
const ARMAZENS_JATAI: Parte = {
  nome: "Armazéns Gerais Jataí Ltda",
  cnpjCpf: "14276893000107",
  ie: "101663854",
  local: JATAI,
};

const DIST_TRIANGULO: Parte = {
  nome: "Distribuidora Triângulo Mineiro Ltda",
  cnpjCpf: "09746235000100",
  ie: "7020145630018",
  local: UBERLANDIA,
};
const LACTEOS_UBERABA: Parte = {
  nome: "Lácteos Uberaba Indústria e Comércio Ltda",
  cnpjCpf: "17490583000189",
  ie: "7020897410063",
  local: UBERABA,
};
const NUTRI_MINAS: Parte = {
  nome: "Nutrição Animal Minas Gerais Ltda",
  cnpjCpf: "31802476000170",
  ie: "0621334570092",
  local: BETIM,
};
const METAL_CONTAGEM: Parte = {
  nome: "Metalúrgica Contagem Industrial S/A",
  cnpjCpf: "29461733000105",
  ie: "1861209940047",
  local: CONTAGEM,
};
const AGRO_ARAXA: Parte = {
  nome: "Agro Araxá Corretivos Agrícolas Ltda",
  cnpjCpf: "36719050000170",
  ie: "0350478120031",
  local: ARAXA,
};
const QUIMICA_POCOS: Parte = {
  nome: "Química Poços Indústria Ltda",
  cnpjCpf: "85276019000118",
  ie: "5190623780055",
  local: POCOS_DE_CALDAS,
};

const ATACADO_PAULISTA: Parte = {
  nome: "Atacado Paulista Rodrigues Ltda",
  cnpjCpf: "38450197000133",
  ie: "582140317114",
  local: RIBEIRAO_PRETO,
};
const ALIMENTOS_CAMPINAS: Parte = {
  nome: "Alimentos Campinas Distribuição S/A",
  cnpjCpf: "48291357000100",
  ie: "244903156220",
  local: CAMPINAS,
};
const PORTO_SANTOS: Parte = {
  nome: "Armazéns Portuários de Santos Ltda",
  cnpjCpf: "51928640000105",
  ie: "633014928873",
  local: SANTOS,
};
const IND_SOROCABA: Parte = {
  nome: "Indústria Têxtil Sorocaba S/A",
  cnpjCpf: "63847102000167",
  ie: "671225408119",
  local: SOROCABA,
};
const FRIOS_RIO_PRETO: Parte = {
  nome: "Frios Rio Preto Comércio de Alimentos Ltda",
  cnpjCpf: "74103865000110",
  ie: "715803224067",
  local: RIO_PRETO,
};
const ATACADO_SAO_PAULO: Parte = {
  nome: "Atacadão Tietê Comércio de Alimentos S/A",
  cnpjCpf: "96318427000101",
  ie: "110042110113",
  local: SAO_PAULO,
};

// ----------------------------------------------------------------- Veículos
// Placa no padrão Mercosul (LLLNLNN) e no padrão antigo (LLLNNNN), sempre
// formatada com hífen no campo `placa`, que é como o motorista lê.

const RTA_2F41: Veiculo = {
  placa: "RTA-2F41",
  renavam: "01284763095",
  modelo: "Scania R 450 A6x2",
  taraKg: 16_800,
};
const SGD_8H22: Veiculo = {
  placa: "SGD-8H22",
  renavam: "01397048216",
  modelo: "Volvo FH 460 6x2T",
  taraKg: 17_200,
};
const NHP_4821: Veiculo = {
  placa: "NHP-4821",
  renavam: "00946172530",
  modelo: "Mercedes-Benz Actros 2546",
  taraKg: 16_400,
};
const PWL_5J07: Veiculo = {
  placa: "PWL-5J07",
  renavam: "01173905482",
  modelo: "DAF XF 480 FTS",
  taraKg: 17_050,
};
const QXB_7D09: Veiculo = {
  placa: "QXB-7D09",
  renavam: "01062384719",
  modelo: "Volkswagen Constellation 25.460",
  taraKg: 15_900,
};
const OVK_3097: Veiculo = {
  placa: "OVK-3097",
  renavam: "00873426105",
  modelo: "Iveco Hi-Way 440",
  taraKg: 16_150,
};
const RRB_1C63: Veiculo = {
  placa: "RRB-1C63",
  renavam: "01245809376",
  modelo: "Scania R 500 A6x4",
  taraKg: 18_300,
};
const MTZ_6504: Veiculo = {
  placa: "MTZ-6504",
  renavam: "00791530648",
  modelo: "Mercedes-Benz Axor 2544",
  taraKg: 15_700,
};
const SFH_9K30: Veiculo = {
  placa: "SFH-9K30",
  renavam: "01358920471",
  modelo: "Volvo FH 540 6x4",
  taraKg: 18_600,
};
const NQD_2178: Veiculo = {
  placa: "NQD-2178",
  renavam: "00904715283",
  modelo: "Ford Cargo 2842",
  taraKg: 15_200,
};

// --------------------------------------------------------------- Motoristas

const JOSUE: Motorista = {
  nome: "Josué Ramos da Silva",
  cpf: "04851237626",
  telefone: "62991430187",
};
const ADENILSON: Motorista = {
  nome: "Adenilson Pereira Gomes",
  cpf: "71520384904",
  telefone: "64992175430",
};
const VALDIR: Motorista = {
  nome: "Valdir Santana Rocha",
  cpf: "39286417519",
  telefone: "62984620715",
};
const CLEITON: Motorista = {
  nome: "Cleiton Ferreira Lima",
  cpf: "15794062894",
  telefone: "64993087265",
};
const MARCOS: Motorista = {
  nome: "Marcos Antônio Vilela",
  cpf: "86031749203",
  telefone: "62981564092",
};
const EDINALDO: Motorista = {
  nome: "Edinaldo Barbosa Cruz",
  cpf: "24978605300",
  telefone: "64991726348",
};
const GERALDO: Motorista = {
  nome: "Geraldo Nunes Ferraz",
  cpf: "57310826426",
  telefone: "62996208134",
};
const REINALDO: Motorista = {
  nome: "Reinaldo Souza Prado",
  cpf: "06147293516",
  telefone: "62985317420",
};
const ANTONIO: Motorista = {
  nome: "Antônio Carlos Bueno",
  cpf: "73829501668",
  telefone: "64994830572",
};
const SEBASTIAO: Motorista = {
  nome: "Sebastião Alves Trindade",
  cpf: "49563018710",
  telefone: "62983746215",
};

// -------------------------------------------------------------------- Cargas

const carga = (
  produtoPredominante: string,
  pesoKg: number,
  valorCentavos: number,
  ncm?: string,
): Carga => ({ produtoPredominante, pesoKg, valorCentavos, ...(ncm ? { ncm } : {}) });

// =============================================================== As viagens
// A ORDEM DO ARRAY É CONTRATO. A lista de casos do produto é indexada por ela.

export const VIAGENS_ORG1: Viagem[] = [
  // 1 ------------------------------------------------------------------------
  // Rascunho puro. Nenhum documento, nenhum evento. É o estado em que o cliente
  // abre o sistema pela primeira vez.
  {
    id: "v-2401",
    orgId: "org-1",
    numero: "V-2401",
    status: "rascunho",
    origem: GOIANIA,
    destino: ANAPOLIS,
    ufsPercurso: ["GO"],
    tomador: MOINHO_ANHANGUERA,
    remetente: GRANJA_BOA_VISTA,
    destinatario: MOINHO_ANHANGUERA,
    veiculo: NQD_2178,
    motorista: SEBASTIAO,
    carga: carga("Milho em grãos a granel", 27_000, 4_860_000, "10059010"),
    valorFreteCentavos: 268_000,
    documentos: [],
    eventos: [],
    criadaEm: horasAtras(3),
    atualizadaEm: horasAtras(2),
  },

  // 2 ------------------------------------------------------------------------
  // CT-e autorizado, MDF-e ainda pendente. A carga não pode rodar assim.
  {
    id: "v-2402",
    orgId: "org-1",
    numero: "V-2402",
    status: "documentos_pendentes",
    origem: RIO_VERDE,
    destino: SANTOS,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: COOP_SUDOESTE,
    remetente: COOP_SUDOESTE,
    destinatario: PORTO_SANTOS,
    veiculo: SGD_8H22,
    motorista: ADENILSON,
    carga: carga("Soja em grãos a granel", 33_000, 6_270_000, "12019000"),
    valorFreteCentavos: 1_184_000,
    documentos: [
      {
        id: "d-2402-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4471",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044711413754020",
        protocolo: "152260004471903",
        autorizadoEm: horasAtras(5),
      },
      {
        id: "d-2402-mdfe",
        tipo: "mdfe",
        status: "pendente",
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(1),
    atualizadaEm: horasAtras(4),
  },

  // 3 ------------------------------------------------------------------------
  // Tudo autorizado, pronta, ainda NÃO saiu: sem `iniciadaEm`. Enquanto o fato
  // gerador não ocorre, a janela de cancelamento do CT-e ainda existe.
  {
    id: "v-2403",
    orgId: "org-1",
    numero: "V-2403",
    status: "pronta",
    origem: ANAPOLIS,
    destino: BETIM,
    ufsPercurso: ["GO", "MG"],
    tomador: NUTRI_MINAS,
    remetente: MOINHO_ANHANGUERA,
    destinatario: NUTRI_MINAS,
    veiculo: PWL_5J07,
    motorista: VALDIR,
    carga: carga("Farelo de soja ensacado", 30_000, 8_400_000, "23040090"),
    valorFreteCentavos: 742_000,
    documentos: [
      {
        id: "d-2403-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4472",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044721413833211",
        protocolo: "152260004472118",
        autorizadoEm: horasAtras(125),
      },
      {
        id: "d-2403-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1890",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018901210411924",
        protocolo: "152260001890447",
        autorizadoEm: horasAtras(120),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(6),
    atualizadaEm: horasAtras(118),
  },

  // 4 ------------------------------------------------------------------------
  // Em trânsito, sem nenhuma anomalia. Serve de linha de base.
  {
    id: "v-2404",
    orgId: "org-1",
    numero: "V-2404",
    status: "em_transito",
    origem: JATAI,
    destino: RIBEIRAO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ATACADO_PAULISTA,
    remetente: USINA_AGUA_QUENTE,
    destinatario: ATACADO_PAULISTA,
    veiculo: QXB_7D09,
    motorista: CLEITON,
    carga: carga("Açúcar cristal ensacado", 28_000, 9_240_000, "17019900"),
    valorFreteCentavos: 968_000,
    documentos: [
      {
        id: "d-2404-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4473",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044731413912402",
        protocolo: "152260004473025",
        autorizadoEm: diasAtras(2),
      },
      {
        id: "d-2404-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1891",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018911210491119",
        protocolo: "152260001891309",
        autorizadoEm: diasAtras(2),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(3),
    atualizadaEm: diasAtras(2),
    iniciadaEm: diasAtras(2),
  },

  // 5 ------------------------------------------------------------------------
  // O CASO CENTRAL DO PRODUTO. A carga foi entregue, o comprovante de entrega
  // está registrado, e o MDF-e continua AUTORIZADO, não encerrado. Para o dono
  // da transportadora a viagem acabou; para a SEFAZ, não.
  {
    id: "v-2405",
    orgId: "org-1",
    numero: "V-2405",
    status: "entregue",
    origem: CATALAO,
    destino: UBERABA,
    ufsPercurso: ["GO", "MG"],
    tomador: LACTEOS_UBERABA,
    remetente: FERT_PLANALTO,
    destinatario: LACTEOS_UBERABA,
    veiculo: OVK_3097,
    motorista: MARCOS,
    carga: carga("Fertilizante NPK ensacado", 31_000, 7_130_000, "31052000"),
    valorFreteCentavos: 615_000,
    documentos: [
      {
        id: "d-2405-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4474",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044741413991598",
        protocolo: "152260004474612",
        autorizadoEm: diasAtras(5),
      },
      {
        id: "d-2405-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1892",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018921210570300",
        protocolo: "152260001892774",
        autorizadoEm: diasAtras(4),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2405-1",
        documentoId: "d-2405-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(1),
        protocolo: "152260011018055",
        detalhe: "Descarga concluída em Uberaba/MG. Canhoto digitalizado pelo motorista.",
      },
    ],
    criadaEm: diasAtras(6),
    atualizadaEm: diasAtras(1),
    iniciadaEm: diasAtras(4),
    entregueEm: diasAtras(1),
  },

  // 6 ------------------------------------------------------------------------
  // Mesmo buraco do caso 5, só que com 26 dias de idade: quatro dias do limiar
  // de bloqueio parametrizado em prazos.ts.
  {
    id: "v-2406",
    orgId: "org-1",
    numero: "V-2406",
    status: "entregue",
    origem: ITUMBIARA,
    destino: CAMPINAS,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ALIMENTOS_CAMPINAS,
    remetente: FRIG_MEIA_PONTE,
    destinatario: ALIMENTOS_CAMPINAS,
    veiculo: RRB_1C63,
    motorista: EDINALDO,
    carga: carga("Carne bovina congelada em caixas", 24_000, 38_400_000, "02023000"),
    valorFreteCentavos: 1_430_000,
    documentos: [
      {
        id: "d-2406-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4475",
        serie: "1",
        chaveAcesso: "52260818742356000166570010000044751414070783",
        protocolo: "152260004475380",
        autorizadoEm: diasAtras(27),
      },
      {
        id: "d-2406-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1893",
        serie: "1",
        chaveAcesso: "52260818742356000166580010000018931210649490",
        protocolo: "152260001893216",
        autorizadoEm: diasAtras(26),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2406-1",
        documentoId: "d-2406-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(23),
        protocolo: "152260011018092",
        detalhe: "Entrega no CD de Campinas/SP, recebida pelo conferente da doca 7.",
      },
    ],
    criadaEm: diasAtras(28),
    atualizadaEm: diasAtras(23),
    iniciadaEm: diasAtras(26),
    entregueEm: diasAtras(23),
  },

  // 7a -----------------------------------------------------------------------
  // MDF-e ABERTO para a placa RTA-2F41 no par GO → MG. Este é o manifesto que
  // trava o veículo. Ele é ÚNICO de propósito: a SEFAZ jamais autorizaria um
  // segundo para a mesma placa e o mesmo par, então a fixture mostra a regra em
  // vez de demonstrar a violação dela. A viagem barrada é a seguinte (v-2408).
  {
    id: "v-2407",
    orgId: "org-1",
    numero: "V-2407",
    status: "entregue",
    origem: GOIANIA,
    destino: CONTAGEM,
    ufsPercurso: ["GO", "MG"],
    tomador: METAL_CONTAGEM,
    remetente: GRANJA_BOA_VISTA,
    destinatario: METAL_CONTAGEM,
    veiculo: RTA_2F41,
    motorista: JOSUE,
    carga: carga("Óleo de soja degomado a granel", 30_000, 21_000_000, "15071000"),
    valorFreteCentavos: 1_052_000,
    documentos: [
      {
        id: "d-2407-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4476",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044761414149976",
        protocolo: "152260004476541",
        autorizadoEm: diasAtras(9),
      },
      {
        id: "d-2407-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1894",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018941210728684",
        protocolo: "152260001894168",
        autorizadoEm: diasAtras(8),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2407-1",
        documentoId: "d-2407-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(6),
        protocolo: "152260011018107",
        detalhe: "Descarga em Contagem/MG concluída.",
      },
    ],
    criadaEm: diasAtras(10),
    atualizadaEm: diasAtras(6),
    iniciadaEm: diasAtras(8),
    entregueEm: diasAtras(6),
  },

  // 7b -----------------------------------------------------------------------
  // A viagem BARRADA: mesma placa RTA-2F41, mesmo par GO → MG. Enquanto o
  // manifesto de v-2407 não for encerrado, esta não emite. Fica em rascunho e
  // sem documento nenhum, porque a emissão sequer chega a ser tentada.
  {
    id: "v-2408",
    orgId: "org-1",
    numero: "V-2408",
    status: "rascunho",
    origem: GOIANIA,
    destino: BETIM,
    ufsPercurso: ["GO", "MG"],
    tomador: NUTRI_MINAS,
    remetente: GRANJA_BOA_VISTA,
    destinatario: NUTRI_MINAS,
    veiculo: RTA_2F41,
    motorista: JOSUE,
    carga: carga("Farelo de soja a granel", 32_000, 8_960_000, "23040090"),
    valorFreteCentavos: 1_098_000,
    documentos: [],
    eventos: [],
    criadaEm: horasAtras(6),
    atualizadaEm: horasAtras(6),
  },

  // 8 ------------------------------------------------------------------------
  // MDF-e autorizado SEM CIOT. O produto avisa, mas não mostra contagem
  // regressiva: a data de obrigatoriedade não está confirmada.
  {
    id: "v-2409",
    orgId: "org-1",
    numero: "V-2409",
    status: "em_transito",
    origem: RIO_VERDE,
    destino: ARAXA,
    ufsPercurso: ["GO", "MG"],
    tomador: AGRO_ARAXA,
    remetente: AGRO_CERRADO,
    destinatario: AGRO_ARAXA,
    veiculo: MTZ_6504,
    motorista: GERALDO,
    carga: carga("Calcário agrícola a granel", 34_000, 2_380_000, "25210000"),
    valorFreteCentavos: 534_000,
    documentos: [
      {
        id: "d-2409-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4477",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044771414229160",
        protocolo: "152260004477293",
        autorizadoEm: diasAtras(3),
      },
      {
        id: "d-2409-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1895",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018951210807875",
        protocolo: "152260001895730",
        autorizadoEm: diasAtras(3),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        // Emitido para veículo de terceiro sem o grupo infCIOT preenchido.
        temCiot: false,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(4),
    atualizadaEm: diasAtras(3),
    iniciadaEm: diasAtras(3),
  },

  // 9 ------------------------------------------------------------------------
  // CT-e rejeitado, 524: CFOP incompatível com a UF de início da prestação.
  {
    id: "v-2410",
    orgId: "org-1",
    numero: "V-2410",
    status: "em_emissao",
    origem: JATAI,
    destino: SOROCABA,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: IND_SOROCABA,
    remetente: ARMAZENS_JATAI,
    destinatario: IND_SOROCABA,
    veiculo: SFH_9K30,
    motorista: REINALDO,
    carga: carga("Sorgo em grãos a granel", 29_000, 3_770_000, "10070090"),
    valorFreteCentavos: 1_265_000,
    documentos: [
      {
        id: "d-2410-cte",
        tipo: "cte",
        status: "rejeitado",
        numero: "4478",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044781414308351",
        codigoRejeicao: "524",
        mensagemRejeicao:
          "524 - Rejeicao: CFOP incompativel com a UF de inicio da prestacao",
        explicacao:
          "A prestação começa em Jataí (GO) e termina em Sorocaba (SP), mas o CFOP digitado no CT-e é de operação dentro do próprio estado. Para frete que cruza a divisa, o CFOP tem que ser o de prestação interestadual (série 6xxx no lugar de 5xxx). Corrija o CFOP no cadastro do serviço e transmita de novo. Nada foi autorizado: a numeração 4478 continua livre e o documento pode ser retransmitido com o mesmo número.",
      },
    ],
    eventos: [],
    criadaEm: horasAtras(20),
    atualizadaEm: horasAtras(19),
  },

  // 10 -----------------------------------------------------------------------
  // CT-e rejeitado, 626: chave de NF-e inválida, digitada à mão.
  {
    id: "v-2411",
    orgId: "org-1",
    numero: "V-2411",
    status: "em_emissao",
    origem: ANAPOLIS,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: DIST_TRIANGULO,
    remetente: MOINHO_ANHANGUERA,
    destinatario: DIST_TRIANGULO,
    veiculo: NQD_2178,
    motorista: SEBASTIAO,
    carga: carga("Ração animal ensacada", 26_000, 5_720_000, "23099090"),
    valorFreteCentavos: 487_000,
    documentos: [
      {
        id: "d-2411-cte",
        tipo: "cte",
        status: "rejeitado",
        numero: "4479",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044791414387542",
        codigoRejeicao: "626",
        mensagemRejeicao: "626 - Rejeicao: Chave de acesso da NF-e informada e invalida",
        explicacao:
          "A chave da nota fiscal do embarcador foi digitada à mão e saiu com dígito trocado, então o CT-e não amarra na NF-e e a SEFAZ devolve. Peça o XML da nota ao Moinho Anhanguera e importe a chave em vez de digitar os 44 dígitos. Corrigida a chave, é só transmitir de novo: nada foi autorizado e a numeração não queimou.",
      },
    ],
    eventos: [],
    criadaEm: horasAtras(28),
    atualizadaEm: horasAtras(27),
  },

  // 11 -----------------------------------------------------------------------
  // MDF-e rejeitado, 698: seguro obrigatório da carga ausente. O CT-e desta
  // viagem já está autorizado — só o manifesto voltou.
  {
    id: "v-2412",
    orgId: "org-1",
    numero: "V-2412",
    status: "em_emissao",
    origem: GOIANIA,
    destino: SAO_PAULO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ATACADO_SAO_PAULO,
    remetente: GRANJA_BOA_VISTA,
    destinatario: ATACADO_SAO_PAULO,
    veiculo: NHP_4821,
    motorista: ANTONIO,
    carga: carga("Produtos alimentícios paletizados", 22_000, 16_500_000, "19059090"),
    valorFreteCentavos: 1_312_000,
    documentos: [
      {
        id: "d-2412-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4480",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044801414466737",
        protocolo: "152260004480857",
        autorizadoEm: horasAtras(30),
      },
      {
        id: "d-2412-mdfe",
        tipo: "mdfe",
        status: "rejeitado",
        numero: "1896",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018961210887060",
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
        codigoRejeicao: "698",
        mensagemRejeicao:
          "698 - Rejeicao: Informacoes do seguro obrigatorio da carga nao informadas",
        explicacao:
          "O manifesto foi transmitido sem o grupo do seguro de carga: faltam a seguradora, o número da apólice e a averbação. Pegue esses dados na apólice vigente (RCTR-C e RCF-DC), preencha no MDF-e e transmita de novo. O CT-e 4480 desta viagem já está autorizado e não precisa ser refeito, e o caminhão não pode sair enquanto o manifesto não passar.",
      },
    ],
    eventos: [],
    criadaEm: diasAtras(2),
    atualizadaEm: horasAtras(26),
  },

  // 12 -----------------------------------------------------------------------
  // MDF-e rejeitado, 301: NCM do produto predominante ausente em carga lotação.
  // A carga desta viagem está SEM `ncm` de propósito: é exatamente a causa.
  {
    id: "v-2413",
    orgId: "org-1",
    numero: "V-2413",
    status: "em_emissao",
    origem: RIO_VERDE,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: DIST_TRIANGULO,
    remetente: COOP_SUDOESTE,
    destinatario: DIST_TRIANGULO,
    veiculo: SGD_8H22,
    motorista: ADENILSON,
    carga: carga("Milho em grãos a granel", 33_000, 5_940_000),
    valorFreteCentavos: 689_000,
    documentos: [
      {
        id: "d-2413-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4481",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044811414545928",
        protocolo: "152260004481264",
        autorizadoEm: horasAtras(14),
      },
      {
        id: "d-2413-mdfe",
        tipo: "mdfe",
        status: "rejeitado",
        numero: "1897",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018971210966250",
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
        codigoRejeicao: "301",
        mensagemRejeicao:
          "301 - Rejeicao: NCM do produto predominante nao informado para carga lotacao",
        explicacao:
          "Em carga lotação a SEFAZ exige o NCM do produto predominante, e o cadastro do milho está sem esse código. Informe o NCM do produto no cadastro (milho em grãos é 1005.90.10) e transmita o manifesto de novo. O CT-e 4481 já autorizado continua valendo, não é preciso mexer nele.",
      },
    ],
    eventos: [],
    criadaEm: horasAtras(18),
    atualizadaEm: horasAtras(13),
  },

  // 13 -----------------------------------------------------------------------
  // CT-e DENEGADO, 302: irregularidade fiscal do tomador. Denegado não é
  // rejeitado: a numeração queima e o documento não se cancela nem se corrige.
  {
    id: "v-2414",
    orgId: "org-1",
    numero: "V-2414",
    status: "em_emissao",
    origem: CATALAO,
    destino: POCOS_DE_CALDAS,
    ufsPercurso: ["GO", "MG"],
    tomador: QUIMICA_POCOS,
    remetente: FERT_PLANALTO,
    destinatario: QUIMICA_POCOS,
    veiculo: PWL_5J07,
    motorista: VALDIR,
    carga: carga("Ácido sulfúrico a granel", 25_000, 4_250_000, "28070010"),
    valorFreteCentavos: 826_000,
    documentos: [
      {
        id: "d-2414-cte",
        tipo: "cte",
        status: "denegado",
        numero: "4482",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044821414625112",
        protocolo: "152260004482509",
        codigoRejeicao: "302",
        mensagemRejeicao: "302 - Rejeicao: Irregularidade fiscal do tomador do servico",
        explicacao:
          "A SEFAZ denegou este CT-e por causa da situação cadastral do tomador, não por erro de digitação nosso. Documento denegado não se cancela, não se corrige e não se inutiliza: a numeração 4482 fica queimada e o XML tem que ser guardado assim mesmo. Para faturar este frete, ou o tomador regulariza a inscrição dele, ou o serviço passa a ser tomado por outra parte, e aí sai um CT-e novo com número novo.",
      },
    ],
    eventos: [],
    criadaEm: horasAtras(40),
    atualizadaEm: horasAtras(38),
  },

  // 14 -----------------------------------------------------------------------
  // CT-e autorizado, entrega feita, e o TOMADOR registrou Prestação de Serviço
  // em Desacordo (610110, modelo 57). O documento fica de pé aguardando
  // substituição — o autor do evento não é a transportadora.
  {
    id: "v-2415",
    orgId: "org-1",
    numero: "V-2415",
    status: "entregue",
    origem: GOIANIA,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: DIST_TRIANGULO,
    remetente: GRANJA_BOA_VISTA,
    destinatario: DIST_TRIANGULO,
    veiculo: QXB_7D09,
    motorista: CLEITON,
    carga: carga("Óleo vegetal refinado em bombonas", 21_000, 12_600_000, "15079011"),
    valorFreteCentavos: 734_000,
    documentos: [
      {
        id: "d-2415-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4483",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044831414704303",
        protocolo: "152260004483671",
        autorizadoEm: diasAtras(7),
      },
      {
        id: "d-2415-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1898",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018981211045440",
        protocolo: "152260001898402",
        autorizadoEm: diasAtras(7),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2415-1",
        documentoId: "d-2415-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(4),
        protocolo: "152260011018133",
        detalhe: "Entrega em Uberlândia/MG com canhoto assinado.",
      },
      {
        id: "e-2415-2",
        documentoId: "d-2415-cte",
        modelo: 57,
        codigo: "610110",
        nome: "Prestação de Serviço em Desacordo",
        autor: "tomador",
        ocorridoEm: diasAtras(2),
        protocolo: "152260061011088",
        detalhe:
          "Distribuidora Triângulo Mineiro registrou desacordo por divergência no valor do frete contratado. Aguardando CT-e de substituição.",
      },
    ],
    criadaEm: diasAtras(8),
    atualizadaEm: diasAtras(2),
    iniciadaEm: diasAtras(7),
    entregueEm: diasAtras(4),
  },

  // 15 -----------------------------------------------------------------------
  // MDF-e em CONTINGÊNCIA há 150h. O prazo de transmissão do manifesto é de
  // 168h contadas da EMISSÃO (prazos.ts), então restam 18h. Contingência de
  // CT-e não tem relógio nacional e por isso não aparece aqui.
  {
    id: "v-2416",
    orgId: "org-1",
    numero: "V-2416",
    status: "em_transito",
    origem: RIO_VERDE,
    destino: SANTOS,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: PORTO_SANTOS,
    remetente: AGRO_CERRADO,
    destinatario: PORTO_SANTOS,
    veiculo: OVK_3097,
    motorista: MARCOS,
    carga: carga("Soja em grãos a granel", 34_000, 6_460_000, "12019000"),
    valorFreteCentavos: 1_378_000,
    documentos: [
      {
        id: "d-2416-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4484",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044841414783499",
        protocolo: "152260004484930",
        autorizadoEm: horasAtras(152),
      },
      {
        id: "d-2416-mdfe",
        tipo: "mdfe",
        status: "contingencia",
        numero: "1899",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000018992211124639",
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
        contingenciaDesde: horasAtras(150),
      },
    ],
    eventos: [],
    criadaEm: horasAtras(160),
    atualizadaEm: horasAtras(150),
    iniciadaEm: horasAtras(149),
  },

  // 16 -----------------------------------------------------------------------
  // Viagem cancelada. O manifesto caiu primeiro, e só depois o CT-e: com MDF-e
  // autorizado de pé, a SEFAZ recusaria o cancelamento do conhecimento.
  {
    id: "v-2417",
    orgId: "org-1",
    numero: "V-2417",
    status: "cancelada",
    origem: ITUMBIARA,
    destino: RIBEIRAO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ATACADO_PAULISTA,
    remetente: FRIG_MEIA_PONTE,
    destinatario: ATACADO_PAULISTA,
    veiculo: RRB_1C63,
    motorista: EDINALDO,
    carga: carga("Carne suína congelada em caixas", 23_000, 27_600_000, "02032900"),
    valorFreteCentavos: 1_186_000,
    documentos: [
      {
        id: "d-2417-cte",
        tipo: "cte",
        status: "cancelado",
        numero: "4485",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044851414862680",
        protocolo: "152260004485177",
        autorizadoEm: horasAtras(295),
      },
      {
        id: "d-2417-mdfe",
        tipo: "mdfe",
        status: "cancelado",
        numero: "1900",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019001211203827",
        protocolo: "152260001900618",
        autorizadoEm: horasAtras(295),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2417-1",
        documentoId: "d-2417-mdfe",
        modelo: 58,
        codigo: "110111",
        nome: "Cancelamento do MDF-e",
        autor: "emitente",
        ocorridoEm: horasAtras(291),
        protocolo: "152260011011174",
        detalhe: "Embarcador desistiu do carregamento antes da saída do veículo.",
      },
      {
        id: "e-2417-2",
        documentoId: "d-2417-cte",
        modelo: 57,
        codigo: "110111",
        nome: "Cancelamento do CT-e",
        autor: "emitente",
        ocorridoEm: horasAtras(290),
        protocolo: "152260011011182",
        detalhe: "Cancelado depois da baixa do manifesto, dentro da janela da UF.",
      },
    ],
    criadaEm: horasAtras(320),
    atualizadaEm: horasAtras(290),
  },

  // 17 -----------------------------------------------------------------------
  // O CAMINHO FELIZ COMPLETO: emitiu, rodou, entregou (110180 no modelo 57),
  // encerrou o manifesto (110112 no modelo 58) e acertou o frete. Nenhum risco.
  {
    id: "v-2418",
    orgId: "org-1",
    numero: "V-2418",
    status: "acertada",
    origem: GOIANIA,
    destino: RIBEIRAO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: ATACADO_PAULISTA,
    remetente: GRANJA_BOA_VISTA,
    destinatario: ATACADO_PAULISTA,
    veiculo: MTZ_6504,
    motorista: GERALDO,
    carga: carga("Farelo de soja paletizado", 30_000, 8_700_000, "23040090"),
    valorFreteCentavos: 1_224_000,
    documentos: [
      {
        id: "d-2418-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4486",
        serie: "1",
        chaveAcesso: "52260818742356000166570010000044861414941877",
        protocolo: "152260004486044",
        autorizadoEm: diasAtras(16),
      },
      {
        id: "d-2418-mdfe",
        tipo: "mdfe",
        status: "encerrado",
        numero: "1901",
        serie: "1",
        chaveAcesso: "52260818742356000166580010000019011211283018",
        protocolo: "152260001901395",
        autorizadoEm: diasAtras(16),
        encerradoEm: diasAtras(12),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2418-1",
        documentoId: "d-2418-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(13),
        protocolo: "152260011018166",
        detalhe: "Entrega em Ribeirão Preto/SP conferida e aceita.",
      },
      {
        id: "e-2418-2",
        documentoId: "d-2418-mdfe",
        modelo: 58,
        codigo: "110112",
        nome: "Encerramento do MDF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(12),
        protocolo: "152260011011253",
        detalhe: "Encerrado em Ribeirão Preto/SP, município de descarregamento.",
      },
    ],
    criadaEm: diasAtras(17),
    atualizadaEm: diasAtras(10),
    iniciadaEm: diasAtras(16),
    entregueEm: diasAtras(13),
    encerradaEm: diasAtras(12),
  },

  // 18 -----------------------------------------------------------------------
  // CIOT gerado, vale-pedágio ainda pendente. O CIOT sai do RNTRC ativo; o
  // vale-pedágio é obrigação da contratante e trava a operação com terceiro.
  {
    id: "v-2419",
    orgId: "org-1",
    numero: "V-2419",
    status: "em_transito",
    origem: ANAPOLIS,
    destino: UBERABA,
    ufsPercurso: ["GO", "MG"],
    tomador: LACTEOS_UBERABA,
    remetente: MOINHO_ANHANGUERA,
    destinatario: LACTEOS_UBERABA,
    veiculo: SFH_9K30,
    motorista: REINALDO,
    carga: carga("Farinha de trigo ensacada", 28_000, 6_160_000, "11010010"),
    valorFreteCentavos: 598_000,
    documentos: [
      {
        id: "d-2419-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4487",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044871415021063",
        protocolo: "152260004487520",
        autorizadoEm: diasAtras(2),
      },
      {
        id: "d-2419-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1902",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019021211362202",
        protocolo: "152260001902871",
        autorizadoEm: diasAtras(2),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
      {
        id: "d-2419-ciot",
        tipo: "ciot",
        status: "autorizado",
        numero: "412739056184",
        autorizadoEm: diasAtras(2),
      },
      {
        id: "d-2419-vale-pedagio",
        tipo: "vale_pedagio",
        status: "pendente",
        explicacao:
          "O CIOT desta operação já saiu, mas o vale-pedágio ainda não foi comprado e vinculado. Quem contrata o frete é que tem de fornecer o vale-pedágio ao transportador; sem ele o motorista paga pedágio do próprio bolso e o acerto da viagem fecha errado. Cobre o embarcador e vincule o número do vale ao CIOT antes de fechar o acerto.",
      },
    ],
    eventos: [],
    criadaEm: diasAtras(3),
    atualizadaEm: diasAtras(1),
    iniciadaEm: diasAtras(2),
  },

  // 19 -----------------------------------------------------------------------
  // Troca de motorista em rota: 110114 no MODELO 58 (Inclusão de Condutor).
  {
    id: "v-2420",
    orgId: "org-1",
    numero: "V-2420",
    status: "em_transito",
    origem: JATAI,
    destino: RIO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: FRIOS_RIO_PRETO,
    remetente: USINA_AGUA_QUENTE,
    destinatario: FRIOS_RIO_PRETO,
    veiculo: NQD_2178,
    // O condutor atual é o que assumiu na troca, registrada no evento abaixo.
    motorista: SEBASTIAO,
    carga: carga("Etanol hidratado combustível a granel", 30_000, 11_400_000, "22072010"),
    valorFreteCentavos: 1_072_000,
    documentos: [
      {
        id: "d-2420-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4488",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044881415100254",
        protocolo: "152260004488316",
        autorizadoEm: diasAtras(4),
      },
      {
        id: "d-2420-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1903",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019031211441398",
        protocolo: "152260001903642",
        autorizadoEm: diasAtras(4),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2420-1",
        documentoId: "d-2420-mdfe",
        modelo: 58,
        codigo: "110114",
        nome: "Inclusão de Condutor",
        autor: "emitente",
        ocorridoEm: diasAtras(2),
        protocolo: "152260011011427",
        detalhe:
          "Troca de motorista em Itumbiara/GO: Sebastião Alves Trindade assumiu o veículo no lugar de Antônio Carlos Bueno.",
      },
    ],
    criadaEm: diasAtras(5),
    atualizadaEm: diasAtras(2),
    iniciadaEm: diasAtras(4),
  },

  // 20 -----------------------------------------------------------------------
  // Inclusão de DF-e em rota: 110113 no MODELO 58. ATENÇÃO: o MESMO código no
  // modelo 57 é EPEC, coisa completamente diferente.
  {
    id: "v-2421",
    orgId: "org-1",
    numero: "V-2421",
    status: "em_transito",
    origem: GOIANIA,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: DIST_TRIANGULO,
    remetente: GRANJA_BOA_VISTA,
    destinatario: DIST_TRIANGULO,
    veiculo: NHP_4821,
    motorista: JOSUE,
    carga: carga("Insumos agrícolas paletizados", 26_000, 9_360_000, "31059090"),
    valorFreteCentavos: 812_000,
    documentos: [
      {
        id: "d-2421-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4489",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044891415179443",
        protocolo: "152260004489208",
        autorizadoEm: diasAtras(3),
      },
      {
        id: "d-2421-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1904",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019041211520589",
        protocolo: "152260001904573",
        autorizadoEm: diasAtras(3),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2421-1",
        documentoId: "d-2421-mdfe",
        modelo: 58,
        codigo: "110113",
        nome: "Inclusão de DF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(2),
        protocolo: "152260011011361",
        detalhe:
          "Coleta adicional em Anápolis/GO: CT-e 4508 incluído no manifesto já em rota, com descarregamento no mesmo município de destino em MG.",
      },
    ],
    criadaEm: diasAtras(4),
    atualizadaEm: diasAtras(2),
    iniciadaEm: diasAtras(3),
  },

  // 21 -----------------------------------------------------------------------
  // MDF-e aberto há 33 DIAS. É o único caso que exercita o bloqueio do CNPJ: o
  // segundo documento é uma tentativa de nova emissão que voltou com 686.
  {
    id: "v-2422",
    orgId: "org-1",
    numero: "V-2422",
    status: "entregue",
    origem: GOIANIA,
    destino: UBERLANDIA,
    ufsPercurso: ["GO", "MG"],
    tomador: DIST_TRIANGULO,
    remetente: GRANJA_BOA_VISTA,
    destinatario: DIST_TRIANGULO,
    veiculo: SGD_8H22,
    motorista: VALDIR,
    carga: carga("Óleo de soja refinado paletizado", 24_000, 14_400_000, "15079011"),
    valorFreteCentavos: 948_000,
    documentos: [
      {
        id: "d-2422-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4490",
        serie: "1",
        chaveAcesso: "52260818742356000166570010000044901415258634",
        protocolo: "152260004490736",
        autorizadoEm: diasAtras(34),
      },
      {
        id: "d-2422-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1905",
        serie: "1",
        chaveAcesso: "52260818742356000166580010000019051211599774",
        protocolo: "152260001905482",
        autorizadoEm: diasAtras(33),
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
      },
      {
        // Tentativa de emitir manifesto novo hoje. Voltou com 686 por causa do
        // documento acima, que segue sem encerramento.
        id: "d-2422-mdfe-2",
        tipo: "mdfe",
        status: "rejeitado",
        numero: "1906",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019061211678969",
        parUf: { carregamento: "GO", descarregamento: "MG" },
        temCiot: true,
        codigoRejeicao: "686",
        mensagemRejeicao:
          "686 - Rejeicao: Existe MDF-e nao encerrado ha mais de 30 dias para o emitente",
        explicacao:
          "A SEFAZ recusou este manifesto por causa de outro que ficou aberto: o MDF-e 1905 desta mesma viagem está sem encerramento há 33 dias. Consta que, passados 30 dias sem encerramento, o bloqueio vale para o CNPJ inteiro, e não só para aquela placa: nenhum veículo da frota emite manifesto novo enquanto o antigo não for baixado. A saída é encerrar o MDF-e 1905 e transmitir este de novo.",
      },
    ],
    eventos: [
      {
        id: "e-2422-1",
        documentoId: "d-2422-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(30),
        protocolo: "152260011018204",
        detalhe:
          "Carga entregue em Uberlândia/MG. O manifesto ficou em aberto: ninguém encerrou depois da descarga.",
      },
    ],
    criadaEm: diasAtras(35),
    atualizadaEm: horasAtras(9),
    iniciadaEm: diasAtras(33),
    entregueEm: diasAtras(30),
  },

  // 22 -----------------------------------------------------------------------
  // Volume: viagem encerrada, com Carta de Correção no meio do caminho.
  {
    id: "v-2423",
    orgId: "org-1",
    numero: "V-2423",
    status: "encerrada",
    origem: JATAI,
    destino: SOROCABA,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: IND_SOROCABA,
    remetente: ARMAZENS_JATAI,
    destinatario: IND_SOROCABA,
    veiculo: PWL_5J07,
    motorista: CLEITON,
    carga: carga("Algodão em pluma prensado", 20_000, 32_000_000, "52010020"),
    valorFreteCentavos: 1_486_000,
    documentos: [
      {
        id: "d-2423-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4491",
        serie: "1",
        chaveAcesso: "52260818742356000166570010000044911415337825",
        protocolo: "152260004491862",
        autorizadoEm: diasAtras(19),
      },
      {
        id: "d-2423-mdfe",
        tipo: "mdfe",
        status: "encerrado",
        numero: "1907",
        serie: "1",
        chaveAcesso: "52260818742356000166580010000019071211758150",
        protocolo: "152260001907119",
        autorizadoEm: diasAtras(19),
        encerradoEm: diasAtras(15),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [
      {
        id: "e-2423-1",
        documentoId: "d-2423-cte",
        modelo: 57,
        codigo: "110110",
        nome: "Carta de Correção Eletrônica",
        autor: "emitente",
        ocorridoEm: diasAtras(18),
        protocolo: "152260011011018",
        detalhe:
          "Correção do endereço de entrega do destinatário. Valor do frete, tomador e dados do imposto não foram alterados.",
      },
      {
        id: "e-2423-2",
        documentoId: "d-2423-cte",
        modelo: 57,
        codigo: "110180",
        nome: "Comprovante de Entrega do CT-e",
        autor: "emitente",
        ocorridoEm: diasAtras(16),
        protocolo: "152260011018227",
        detalhe: "Descarga concluída em Sorocaba/SP.",
      },
      {
        id: "e-2423-3",
        documentoId: "d-2423-mdfe",
        modelo: 58,
        codigo: "110112",
        nome: "Encerramento do MDF-e",
        autor: "emitente",
        ocorridoEm: diasAtras(15),
        protocolo: "152260011011289",
        detalhe: "Encerrado em Sorocaba/SP no fim do percurso.",
      },
    ],
    criadaEm: diasAtras(20),
    atualizadaEm: diasAtras(15),
    iniciadaEm: diasAtras(19),
    entregueEm: diasAtras(16),
    encerradaEm: diasAtras(15),
  },

  // 23 -----------------------------------------------------------------------
  // Volume: viagem em trânsito, recém-saída, sem nenhuma pendência.
  {
    id: "v-2424",
    orgId: "org-1",
    numero: "V-2424",
    status: "em_transito",
    origem: CATALAO,
    destino: RIO_PRETO,
    ufsPercurso: ["GO", "MG", "SP"],
    tomador: FRIOS_RIO_PRETO,
    remetente: FERT_PLANALTO,
    destinatario: FRIOS_RIO_PRETO,
    veiculo: MTZ_6504,
    motorista: MARCOS,
    carga: carga("Ureia agrícola a granel", 32_000, 8_320_000, "31021010"),
    valorFreteCentavos: 1_015_000,
    documentos: [
      {
        id: "d-2424-cte",
        tipo: "cte",
        status: "autorizado",
        numero: "4492",
        serie: "1",
        chaveAcesso: "52260918742356000166570010000044921415417013",
        protocolo: "152260004492455",
        autorizadoEm: diasAtras(1),
      },
      {
        id: "d-2424-mdfe",
        tipo: "mdfe",
        status: "autorizado",
        numero: "1908",
        serie: "1",
        chaveAcesso: "52260918742356000166580010000019081211837344",
        protocolo: "152260001908990",
        autorizadoEm: diasAtras(1),
        parUf: { carregamento: "GO", descarregamento: "SP" },
        temCiot: true,
      },
    ],
    eventos: [],
    criadaEm: diasAtras(2),
    atualizadaEm: horasAtras(20),
    iniciadaEm: diasAtras(1),
  },
];
