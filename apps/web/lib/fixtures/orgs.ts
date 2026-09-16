// ============================================================================
// Fixtures: organizações (tenants).
//
// São DUAS de propósito. Multi-tenant só é testável de verdade quando existe
// um segundo tenant para vazar: se `viagensDaOrg` esquecer o filtro de orgId,
// a placa e o CNPJ da outra transportadora aparecem na primeira tela.
//
// Determinismo: nada aqui deriva de Date.now(). Tudo sai de AGORA.
// ============================================================================

import type { Org } from "@ai4l/core";
import { AGORA } from "./viagens-org1";

const DIA_MS = 86_400_000;
const diasAFrente = (n: number) => AGORA + n * DIA_MS;
const diasAtras = (n: number) => AGORA - n * DIA_MS;

export const ORGS: Org[] = [
  {
    id: "org-1",
    nome: "Transportes São Jorge Ltda",
    cnpj: "18742356000166",
    uf: "GO",
    regimeTributario: "simples_nacional",
    crt: 1,
    rntrc: "54219708",
    rntrcStatus: "ativo",
    // Exatamente 15 dias: encosta no limiar de aviso de AVISOS_CERTIFICADO_A1_DIAS.
    certificadoA1: { validoAte: diasAFrente(15) },
    // Ausente de propósito: a ANTT ainda não confirmou os seguros
    // eletronicamente, e isso levanta o risco rntrc_seguro_pendente.
    // segurosVerificadosEm: undefined,
  },
  {
    id: "org-2",
    nome: "Rodoviário Serra Dourada S/A",
    cnpj: "09451872000140",
    uf: "GO",
    regimeTributario: "lucro_presumido",
    crt: 3,
    rntrc: "61837402",
    rntrcStatus: "ativo",
    certificadoA1: { validoAte: diasAFrente(240) },
    segurosVerificadosEm: diasAtras(12),
  },
];
