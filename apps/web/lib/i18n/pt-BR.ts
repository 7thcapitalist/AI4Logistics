// ============================================================================
// Strings de chrome (navegação, cabeçalhos, botões, estados).
//
// O QUE ENTRA AQUI: rótulo de menu, título de coluna, texto de botão, estado
// vazio, microcópia de ajuda.
//
// O QUE NUNCA ENTRA AQUI: prazo, multa, limiar, rejeição, nome de norma ou
// qualquer afirmação de regra fiscal. Isso é dado de domínio: vem de
// `Risco.explicacao`, de `Guarda.motivo` e de `Documento.explicacao`, sempre
// acompanhado de `Fonte`. Se você sentiu vontade de escrever "168 horas" neste
// arquivo, o lugar certo é `packages/core/src/domain/prazos.ts`.
// ============================================================================

export const t = {
  app: {
    nome: "AI4Logistics",
    descricao: "Controle documental de viagens para transportadoras.",
  },

  comum: {
    carregando: "Carregando",
    voltar: "Voltar",
    voltarParaViagens: "Voltar para viagens",
    tentarDeNovo: "Tentar de novo",
    naoInformado: "Não informado",
    semRegistro: "Sem registro",
    todos: "Todos",
    todas: "Todas",
    de: "de",
    fechar: "Fechar",
    irParaConteudo: "Ir para o conteúdo",
  },

  nav: {
    rotulo: "Navegação principal",
    viagens: "Viagens",
    documentos: "Documentos",
    acertos: "Acertos",
    veiculos: "Veículos",
    motoristas: "Motoristas",
    clientes: "Clientes",
    conformidade: "Conformidade",
  },

  sidebar: {
    recolher: "Recolher menu",
    expandir: "Expandir menu",
    menu: "Menu",
  },

  saude: {
    titulo: "Saúde da operação",
    descricao: "Contagem de riscos abertos na organização, por gravidade.",
    niveis: {
      bloqueante: "Bloqueantes",
      critico: "Críticos",
      alto: "Altos",
      medio: "Médios",
    },
    verLista: (nivel: string) => `Ver viagens com risco ${nivel}`,
    limpo: "Nenhum risco aberto.",
  },

  topbar: {
    organizacao: "Organização",
    trocarOrganizacao: "Trocar de organização",
    aparencia: "Aparência",
    tema: "Tema",
    modoSoTorre: "O modo claro e escuro existe só no tema Torre.",
    modo: "Modo",
    temas: { patio: "Pátio", torre: "Torre" },
    modos: { light: "Claro", dark: "Escuro" },
    notaTema:
      "Seletor de aparência para decidir o visual do produto. Sai daqui depois da escolha.",
  },

  viagens: {
    titulo: "Viagens",
    subtitulo: "Todas as viagens da organização selecionada.",
    /* Rótulo de texto do status, para select e para leitor de tela. O selo
       colorido da tabela vem de <StatusViagem> em @ai4l/ui. */
    status: {
      rascunho: "Rascunho",
      documentos_pendentes: "Documentos pendentes",
      em_emissao: "Em emissão",
      pronta: "Pronta",
      em_transito: "Em trânsito",
      entregue: "Entregue",
      encerrada: "Encerrada",
      acertada: "Acertada",
      cancelada: "Cancelada",
    },
    abas: {
      rotulo: "Filtros rápidos",
      todas: "Todas",
      abertas: "Em aberto",
      risco: "Com risco",
      entregues_nao_encerradas: "Entregues não encerradas",
      encerradas: "Encerradas",
    },
    colunas: {
      status: "Status",
      numero: "Nº",
      rota: "Rota",
      tomador: "Tomador",
      veiculo: "Veículo",
      documentos: "Documentos",
      valor: "Valor",
      risco: "Risco",
      atualizada: "Atualizada",
    },
    ordenar: {
      crescente: "ordenar crescente",
      decrescente: "ordenar decrescente",
      ativoCrescente: "ordenado do menor para o maior",
      ativoDecrescente: "ordenado do maior para o menor",
    },
    filtros: {
      rotulo: "Filtros da lista",
      busca: "Buscar",
      buscaDica: "Número, tomador, placa ou cidade",
      status: "Status",
      veiculo: "Veículo",
      tomador: "Tomador",
      severidade: "Gravidade do risco",
      aplicar: "Aplicar",
      limpar: "Limpar filtros",
      ativos: "Filtros aplicados",
    },
    resumo: (mostradas: number, total: number) =>
      `${mostradas} ${mostradas === 1 ? "viagem" : "viagens"} ${
        mostradas === total ? "na organização" : `de ${total}`
      }`,
    riscosDaOperacao: {
      titulo: "Riscos da organização",
      descricao:
        "Estes riscos não estão presos a uma viagem. Entram na contagem da barra lateral.",
    },
    vazio: {
      titulo: "Nenhuma viagem com esses filtros",
      descricao: "Troque a aba ou limpe os filtros para ver a lista inteira.",
    },
    vazioTotal: {
      titulo: "Nenhuma viagem cadastrada",
      descricao: "Assim que a primeira viagem entrar, ela aparece aqui.",
    },
    erro: {
      titulo: "Não foi possível montar a lista",
      descricao: "A lista de viagens não carregou. Tente de novo.",
    },
  },

  viagem: {
    naoEncontrada: {
      titulo: "Viagem não encontrada",
      descricao: "Essa viagem não existe ou foi removida.",
    },
    erro: {
      titulo: "Não foi possível abrir a viagem",
      descricao: "Os dados desta viagem não carregaram. Tente de novo.",
    },
    abas: {
      rotulo: "Seções da viagem",
      resumo: "Resumo",
      documentos: "Documentos",
      linha: "Linha do tempo",
      carga: "Carga e NF-e",
      acerto: "Acerto",
    },
    cabecalho: {
      viagem: "Viagem",
      valorDoFrete: "Valor do frete",
      veiculo: "Veículo",
      motorista: "Motorista",
      tomador: "Tomador",
      acoes: "Ações",
    },
    riscos: {
      titulo: "Riscos abertos nesta viagem",
      restam: "Restam",
      dias: (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`,
      horas: (n: number) => `${n}h`,
      ate: "até",
    },
    resumo: {
      percurso: "Percurso",
      origemDestino: "Origem e destino",
      origem: "Origem",
      destino: "Destino",
      ufs: "UFs do percurso",
      partes: "Partes",
      papelTomador: "Tomador",
      papelRemetente: "Remetente",
      papelDestinatario: "Destinatário",
      local: "Local",
      tomadorPapel: "Quem contrata e paga o frete",
      remetentePapel: "Quem entrega a carga para o transporte",
      destinatarioPapel: "Quem recebe a carga no destino",
      cnpjCpf: "CNPJ / CPF",
      ie: "Inscrição estadual",
      veiculoEMotorista: "Veículo e motorista",
      placa: "Placa",
      modelo: "Modelo",
      renavam: "Renavam",
      tara: "Tara",
      motorista: "Motorista",
      cpf: "CPF",
      telefone: "Telefone",
      datas: "Datas",
      criadaEm: "Criada em",
      atualizadaEm: "Atualizada em",
      iniciadaEm: "Saída",
      entregueEm: "Entrega",
      encerradaEm: "Encerramento do manifesto",
    },
    documentos: {
      titulo: "Documentos da viagem",
      vazio: {
        titulo: "Nenhum documento nesta viagem",
        descricao: "Os documentos aparecem aqui conforme forem emitidos.",
      },
      riscos: "Riscos deste documento",
      numero: "Número",
      serie: "Série",
      chave: "Chave de acesso",
      protocolo: "Protocolo",
      autorizadoEm: "Autorizado em",
      encerradoEm: "Encerrado em",
      contingenciaDesde: "Em contingência desde",
      parUf: "Par de UFs do manifesto",
      ciot: "CIOT no manifesto",
      ciotSim: "Informado",
      ciotNao: "Não informado",
      codigoRejeicao: "Código",
      mensagemSefaz: "Mensagem da SEFAZ",
      mensagemSefazDica: "Texto cru do retorno. É o que o contador precisa ler.",
      explicacao: "O que isso quer dizer",
      acoes: {
        cancelarCte: "Cancelar CT-e",
        cancelarMdfe: "Cancelar MDF-e",
        encerrarMdfe: "Encerrar MDF-e",
      },
    },
    linha: {
      titulo: "Linha do tempo",
      descricao:
        "Registro de eventos, do mais recente para o mais antigo. Nada aqui é editável.",
      copiar: "Copiar linha do tempo",
      copiado: "Copiado",
      falhaCopia: "Não foi possível copiar. Selecione o texto e copie à mão.",
      vazio: {
        titulo: "Nenhum evento registrado",
        descricao: "Os eventos aparecem aqui assim que o primeiro for registrado.",
      },
      autores: {
        emitente: "Emitente",
        tomador: "Tomador",
        fisco: "Fisco",
        sistema: "Sistema",
      },
      foraDoControle: "Fora do controle da transportadora",
      cabecalhoCopia: "Linha do tempo da viagem",
      geradoEm: "Gerado em",
      protocolo: "Protocolo",
      evento: "Evento",
      modelo: "Modelo",
    },
    carga: {
      titulo: "Carga",
      produto: "Produto predominante",
      ncm: "NCM",
      peso: "Peso",
      valor: "Valor da carga",
      nfe: "Notas fiscais",
      nfeAusente:
        "As notas fiscais da carga ainda não são lidas pelo sistema. Chega junto com a leitura do XML.",
    },
    acerto: {
      titulo: "Acerto de viagem",
      descricao:
        "O acerto de frete ainda não está no produto. Por enquanto, os valores desta viagem aparecem no resumo.",
    },
  },

  emBreve: {
    titulo: "Ainda não está pronto",
    descricao: (secao: string) =>
      `A área de ${secao} entra depois. Por enquanto, o trabalho acontece em Viagens.`,
  },

  erroGeral: {
    titulo: "Alguma coisa quebrou",
    descricao: "A tela não carregou. Tente de novo.",
  },

  naoEncontrado: {
    titulo: "Página não encontrada",
    descricao: "O endereço não existe.",
  },
} as const;

export type Dicionario = typeof t;
