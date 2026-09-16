# Verificação normativa em fonte primária — setembro/2026

**Data de consulta:** 16/09/2026
**Escopo:** itens abertos da seção 8 do mapa `fluxos-documentais.md`.
**Regra aplicada:** portal oficial ou norma no repositório do órgão confirma. Fornecedor, consultoria, ERP e sindicato serviram só para achar o caminho, nunca como resposta. Onde o texto oficial não abriu, está registrado como lacuna com a URL para conferência manual.

**Nota de método, e ela importa para quem for reauditar:** dois canais de rede se comportam diferente nesta sessão. O acesso direto via shell é bloqueado por política de egresso (HTTP 403 no CONNECT) para `cte.fazenda.gov.br`, `dfe-portal.svrs.rs.gov.br` e `confaz.fazenda.gov.br`. O buscador de páginas funciona nesses hosts. Consequência prática: **os PDFs longos chegam truncados**. Sempre que um código não apareceu, eu verifiquei antes se a parte do documento que o conteria estava visível, e só chamei de "não existe" quando a tabela terminava dentro da parte visível. Onde o corte impediu a conclusão, o veredito é NÃO CONFIRMADO, não DERRUBADO. Essa distinção é a diferença entre uma lacuna e uma mentira.

**Achado de infraestrutura que vale registrar:** o Portal Nacional do CT-e hospeda também os manuais e as notas técnicas **do MDF-e**, e ao contrário do CONFAZ e do SVRS ele é legível por robô. `https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=Y0nErnoZpsg%3D` (notas técnicas) e `?tipoConteudo=YIi+H8VETH0%3D` (manuais) são as duas URLs que resolveram quase toda esta verificação. **Essa deve ser a fonte de vigilância do produto**, não o portal SVRS.

---

## 1. Tabela de vereditos

| #     | Item                                                          | Veredito                                                                       | Selo final | Fonte (primária)                                                                                                                                                                         | Consulta   |
| ----- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1     | Rejeição 686 é nacional?                                      | **CONFIRMADO — é nacional**                                                    | 🟢         | MOC MDF-e 3.00b Anexo I, seção 2.2, regra **F86**, cStat 686, aplicação "Obrig." — [Portal Nacional](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=%2FvyTwObecyA%3D) | 16/09/2026 |
| 1b    | Bloqueio por veículo: chave da regra                          | **DERRUBADO** — a chave que a equipe definiu não é a da norma                  | 🟢         | MOC MDF-e 3.00b Anexo I, regras **F85/611**, **F87/462**, **F88/662**                                                                                                                    | 16/09/2026 |
| 1c    | Existe bloqueio de **5 dias**, desconhecido pela equipe       | **CONFIRMADO**                                                                 | 🟢         | Anexo I, regra **F87**, cStat 462                                                                                                                                                        | 16/09/2026 |
| 2     | NT MDF-e 2026.001 — datas                                     | **CONFIRMADO**: homologação **21/09/2026**, produção **23/11/2026**            | 🟢         | [NT MDF-e 2026.001 v1.00](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=F9WDPRCi0Bs%3D)                                                                              | 16/09/2026 |
| 2b    | NT 2026.001 — regra 684 e condições de `tpEmit`               | **CONFIRMADO**                                                                 | 🟢         | idem                                                                                                                                                                                     | 16/09/2026 |
| 2c    | Exceção de carga própria no leiaute                           | **CONFIRMADO, por construção da regra** (não há cláusula de exceção escrita)   | 🟢/🟡      | idem                                                                                                                                                                                     | 16/09/2026 |
| 3     | Obrigatoriedade de MDF-e em GO                                | **CONFIRMADO** (interna, incl. intermunicipal e intramunicipal)                | 🟢         | Decreto GO 9.095/2017 art. 6º + Decreto GO 8.064/2013 art. 8º + página oficial SEFAZ-GO                                                                                                  | 16/09/2026 |
| 3b    | Citação "art. 248-A/248-B do RCTE" como dispositivo operativo | **CORRIGIDO** — o operativo é o Decreto 8.064/2013 art. 8º, III                | 🟡         | ver `obrigatoriedade-mdfe-por-uf.md`                                                                                                                                                     | 16/09/2026 |
| 3c    | MG: art. 87-H                                                 | **DERRUBADO** — é **art. 87-B** do Anexo V                                     | 🟢         | [SEF/MG](https://portalsped.fazenda.mg.gov.br/spedmg/mdfe/Obrigatoriedade/)                                                                                                              | 16/09/2026 |
| 4     | `CTeDistribuicaoDFe` retorna encerramento de MDF-e?           | **DERRUBADO — pergunta errada.** Existe serviço dedicado: **`MDFeConsNaoEnc`** | 🟢         | MOC MDF-e 3.00b Visão Geral seção 4.4 + [Serviços SVRS](https://dfe-portal.svrs.rs.gov.br/MDFE/Servicos)                                                                                 | 16/09/2026 |
| 5     | "em datas distintas" na regra de bloqueio                     | **DERRUBADO** — a expressão não existe em nenhuma regra nacional               | 🟢         | Anexo I seção 2.2 (F85, F87, F88, F86) + [FAQ MDF-e](https://dfe-portal.svrs.rs.gov.br/mdfe/Faq)                                                                                         | 16/09/2026 |
| 6     | Ajuste SINIEF 3/2026 — data de efeitos                        | **NÃO CONFIRMADO**                                                             | 🔴         | CONFAZ e Imprensa Nacional bloqueiam robôs                                                                                                                                               | 16/09/2026 |
| 7     | Ajuste SINIEF 21/2010 cl. 14ª — texto literal                 | **NÃO CONFIRMADO** (substituto oficial obtido: CAT 102/2013 art. 13)           | 🔴/🟢      | CONFAZ bloqueado; [Portaria CAT 102/2013](https://legislacao.fazenda.sp.gov.br/Paginas/pcat1022013.aspx)                                                                                 | 16/09/2026 |
| 8     | Prazo de cancelamento de CT-e em GO e MG                      | **NÃO CONFIRMADO**                                                             | 🔴         | nenhuma fonte primária estadual localizada                                                                                                                                               | 16/09/2026 |
| 9     | CT-e Simplificado exige mesma UF?                             | **DERRUBADO — não exige. Serve para o interestadual**                          | 🟢         | [NT CT-e 2024.002 v1.05](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=Y1psoH3SyAA%3D)                                                                               | 16/09/2026 |
| 10    | Prazo de 45 dias do evento 610110                             | **NÃO CONFIRMADO**                                                             | 🔴         | MOC CT-e 4.00 Anexo I truncado antes da seção de eventos                                                                                                                                 | 16/09/2026 |
| 11    | Guarda de XML: 5 anos ou 132 meses                            | **NÃO CONFIRMADO**                                                             | 🔴         | CONFAZ bloqueado; FAQ do portal não trata                                                                                                                                                | 16/09/2026 |
| 12    | Rejeição 539                                                  | **CONFIRMADO, com significado diferente do suposto**                           | 🟢         | MOC CT-e 4.00 Anexo I, regra **G157**                                                                                                                                                    | 16/09/2026 |
| 12b   | Rejeições 626 e 729 (CT-e)                                    | **NÃO CONFIRMADO** (truncamento)                                               | 🔴         | Anexo I CT-e visível só até p.26 de 110                                                                                                                                                  | 16/09/2026 |
| 12c   | Rejeição 304 (MDF-e)                                          | **DERRUBADO como código do MOC 3.00b**                                         | 🟢         | Anexo I MDF-e: tabela vai de F01 a F113 e 304 não está nela                                                                                                                              | 16/09/2026 |
| 13    | CIOT: carga própria × frota própria                           | **RESOLVIDO — não há divergência**                                             | 🟢         | [ANTT, FAQ CIOT para Todos](https://www.gov.br/antt/pt-br/assuntos/cargas/ciot-para-todos-1/perguntas-frequentes), perguntas 2.7 e 2.8                                                   | 16/09/2026 |
| 14    | NT CT-e 2026.002: data impossível                             | **DERRUBADO — não há impossibilidade**                                         | 🟢         | [NT CT-e 2026.002 v1.01](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=nYNUxSrXYaU%3D)                                                                               | 16/09/2026 |
| extra | Existe uma **NT CT-e 2026.001** que o mapa não conhece        | **NOVO**                                                                       | 🟢         | [NT CT-e 2026.001 v1.01](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=9qjN8INgSkA%3D)                                                                               | 16/09/2026 |

---

## 2. O QUE A VERIFICAÇÃO DERRUBOU

Sete coisas. Duas derrubam desenho de produto, uma derruba um índice do modelo de dados, uma derruba um alarme falso e três derrubam citações erradas. O item mais importante da task — a rejeição 686 — **sobreviveu, e sobreviveu inteiro.**

### 2.1 A chave de bloqueio do MDF-e está errada no mapa, e ela era "o índice mais importante do modelo de dados"

O mapa afirma, na seção 3.2 e na seção 0.1, que a regra de bloqueio é **"o par (UF carregamento × UF descarregamento) + veículo"**, qualificada por "em datas distintas", citando o MOC seção 2.2.

A seção 2.2 do Anexo I do MOC MDF-e 3.00b é, de fato, a tabela de regras de validação — a citação aponta para o lugar certo. Mas o conteúdo é outro. **Não existe uma regra de bloqueio. Existem quatro, com chaves diferentes**, e nenhuma delas tem a expressão "em datas distintas":

| Regra   | cStat | Chave real do bloqueio                                                                               | Gatilho                    |
| ------- | ----- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| **F85** | 611   | CNPJ base/CPF do emitente + **placa principal** + **tipo de emitente** + **UF de descarregamento**   | imediato                   |
| **F87** | 462   | CNPJ base/CPF + placa, **com no máximo 2 UF de percurso** além de carregamento e descarregamento     | **5 dias** da autorização  |
| **F88** | 662   | CNPJ base/CPF + placa + tipo de emitente + par UF carregamento/descarregamento **no sentido oposto** | imediato                   |
| **F86** | 686   | **só o CNPJ/CPF do emitente** — trava tudo                                                           | **30 dias** da autorização |

O que muda concretamente:

- **A UF de carregamento não entra na regra imediata.** F85 usa `UF de descarregamento` sozinha. O par carregamento×descarregamento só aparece na F88, e ali invertido, para pegar a viagem de volta.
- **`tipo de emitente` (`tpEmit`) faz parte da chave** e o mapa não o menciona. Dois MDF-e com mesma placa e mesma UF de descarga mas `tpEmit` diferente não se bloqueiam.
- **É CNPJ base**, não CNPJ completo. Filiais compartilham o bloqueio. Para uma transportadora com matriz e filiais isso é exatamente o oposto do que um modelo por estabelecimento assumiria.
- **Existe um bloqueio de 5 dias que a equipe não sabia que existia** (F87/462), e ele morde muito antes dos 30 dias. Ele é condicionado a rotas com até 2 UF de percurso — ou seja, atinge justamente a viagem curta e regional, que é o perfil do cliente de Goiás. **Provavelmente é este, e não o de 30 dias, o alarme que mais vai disparar na base real.**
- **Existe a regra do sentido oposto** (F88/662), que bloqueia o retorno do caminhão. Operacionalmente é a mais perversa: o motorista chega, não encerra, e a empresa não consegue emitir o MDF-e da volta.

O produto precisa de **quatro** contadores, não de um. E o índice do modelo de dados é `(CNPJ base, placa, tpEmit, UF descarregamento)` mais um índice de par invertido, mais dois relógios (5 e 30 dias).

### 2.2 "Em datas distintas" não existe na norma

Procurei a expressão nas quatro regras acima e no FAQ oficial do Portal Nacional. Não está em nenhum dos dois. O que o FAQ oficial diz é mais simples, e **também diverge do texto normativo**:

> FAQ oficial (Portal Nacional MDF-e, SVRS): "Enquanto houver MDFe pendente de encerramento não será possível autorizar novo MDFe, para o mesmo par UF de carregamento e UF de descarregamento, para o mesmo veículo."

Ou seja: o mapa copiou o FAQ (que é uma simplificação imprecisa da F85/F88) e acrescentou uma qualificação — "em datas distintas" — que não está nem no FAQ nem na tabela de regras.

**De onde veio a expressão:** existe uma rejeição **610**, amplamente documentada por ERPs, com a mensagem "Existe MDF-e não encerrado para esta placa, UF carregamento e UF descarregamento **em data de emissão diferente**". Verifiquei: **o código 610 não consta do MOC MDF-e 3.00b.** A faixa 605–615 visível contém 606, 607, 609, 611, 612 — não 610. A qualificação entrou no mapa por uma fonte de fornecedor descrevendo um código que não está no manual nacional vigente.

**Consequência:** a preocupação registrada no item 12 da seção 8 ("se for literal, a regra é mais estreita do que o produto vai implementar") **se dissolve**. Não há estreitamento por data. Mas a regra é diferente do que o produto ia implementar por outros motivos — os de 2.1.

### 2.3 `CTeDistribuicaoDFe` era a pergunta errada, e a resposta certa é melhor

A pergunta era se o `CTeDistribuicaoDFe` devolve o estado de encerramento, e se não, quantas chamadas custaria consultar chave por chave. Ambas as pontas caem.

`CTeDistribuicaoDFe` é serviço do **projeto CT-e**. Não carrega evento de MDF-e. Mas o projeto MDF-e tem serviço próprio e dedicado exatamente a isto:

- **`MDFeConsNaoEnc`** — "Serviço de Consulta MDF-e não encerrados", documentado na **seção 4.4 do MOC MDF-e 3.00b Visão Geral**. Processo **síncrono**. Entrada: CNPJ/CPF, `tpAmb`, `cUF`. Retorno: "Estrutura XML com a listagem dos MDFe não encerrados", com `chMDFe` e `nProt` por item.
- Existe ainda **`MDFeDistribuicaoDFe`** v1.00, serviço de distribuição próprio do MDF-e.

**Uma chamada por CNPJ devolve a lista inteira de manifestos abertos.** Não é chave por chave. O painel de manifestos abertos é viável e barato — é um polling por CNPJ, não um fan-out por documento. Esta é a melhor notícia técnica desta verificação.

Ressalva: o serviço é oferecido por autorizador. Empresa com inscrição em UF de autorizadores distintos precisa de uma chamada por autorizador. Limites de frequência e de número de registros retornados **não constavam da parte visível** do manual — ver lacunas.

E há um segundo presente, na própria regra F86: a mensagem de rejeição **já devolve a chave e o protocolo do MDF-e que está travando**. O manual registra: _"Observação: retornar chave de acesso e protocolo de autorização mais antigo que causa o bloqueio."_ Mesmo quem só emite descobre, na rejeição, exatamente qual documento encerrar.

### 2.4 O CT-e Simplificado serve, sim, para o caso interestadual

O mapa registra como 🔴: _"Se a restrição de 'mesma UF de origem e destino' for real, o Simplificado não serve para o caso interestadual, que é o foco."_

**A restrição não é real.** A NT CT-e 2024.002 v1.05 (outubro/2024) descreve a hipótese como _"prestações de serviços de transporte intermunicipal **ou interestadual** de mercadorias, que envolvam diversos remetentes ou destinatários, e um único tomador de serviço"_, e traz regra de validação que **pressupõe** UF de início diferente da de fim (G045: _"Se UF de início da prestação <> UF de fim da prestação (e UF fim <> EX) CFOP deve iniciar por 6"_).

Além disso, a NT **não** estabelece mínimo de 2 NF-e — outra condição que o mapa listava como 🟡 e que não se sustentou no texto.

O desenho de produto em cima do CT-e Simplificado está liberado para o caso interestadual.

### 2.5 A "data impossível" da NT CT-e 2026.002 não existe

O mapa registra: _"a data de publicação (04/08) é posterior ao início da homologação (03/08). Uma das duas está errada."_

Nenhuma das duas está errada. Dois erros se somaram:

1. **04/08/2026 não é a data do documento.** É o rótulo de postagem do portal ("Publicada em 04/08/2026"). A capa do PDF diz **"Versão 1.01 de 16 de julho de 2026"**.
2. **A NT tem dois cronogramas, não um.** O próprio documento avisa: _"Observação: Esta NT tem 2 datas, uma para a Regra de Preenchimento dos campos da RTC e outra para o restante das definições desta NT."_

| Versão | Objeto                                                                                           | Homologação    | Produção             |
| ------ | ------------------------------------------------------------------------------------------------ | -------------- | -------------------- |
| 1.00   | Obrigatoriedade do preenchimento dos campos da RTC                                               | 01/07/2026     | **03/08/2026**       |
| 1.00   | SUFRAMA do emitente para ALC; atualização de regras; CBS alíquota zero; antecipação de pagamento | **03/08/2026** | 31/08/2026           |
| 1.01   | Alteração da data de exigência do preenchimento dos campos da RTC                                | Implantada     | Implementação futura |

03/08/2026 é simultaneamente **produção** de um conjunto e **homologação** do outro. É coerente. A contradição era artefato de colapsar dois cronogramas em um e de confundir data de postagem com data de documento.

**Lição de método, não só de fato:** rótulo de listagem de portal não é data de norma. Vale para todo o restante do mapa.

### 2.6 A rejeição 539 não é o que o mapa diz que é

O mapa lista 539 e 626 na linha _"Digitação manual de chave de 44 dígitos — Rejeições 539 e 626. Maior sumidouro de tempo e maior fonte de erro do processo"_, e na tabela 2.3 associa 539/626 ao campo `infNFe/chave`.

A regra **G157** do MOC CT-e 4.00 Anexo I diz outra coisa:

> G157 — "Verificar Duplicidade de CTe com diferença na Chave de Acesso" — Obrig. — 539 — Rej. — "Rejeição: Duplicidade de CTe, com diferença na Chave de Acesso"

539 é **duplicidade do próprio CT-e** (mesmo número/série já autorizado com chave diferente), não chave de NF-e digitada errada. É um erro de controle de numeração do emissor, não de digitação do operador. O código 626 não pôde ser verificado (truncamento), então a associação dele à digitação de chave **permanece não confirmada**.

O item 11 da tabela da seção 7 ("onde a transportadora perde tempo") está apoiado em uma atribuição de código incorreta. A dor de digitar chave de 44 dígitos pode ser real — mas ela **não é evidenciada por essas rejeições**, e o número não deve aparecer em material de venda amarrado a esses códigos.

### 2.7 Duas citações de artigo estão erradas

- **MG:** o mapa cita `art. 87-H, Anexo V, RICMS/MG`. A SEF/MG cita **art. 87-B**. Além disso, a ampliação intermunicipal de 01/07/2015 incide sobretudo sobre o **emitente de NF-e** (carga própria); para o emitente de CT-e em carga fracionada o piso nacional já exigia. MG **não** é "GO com outro número de artigo".
- **GO:** o mapa cita `art. 248-A e 248-B do RCTE-GO; Decreto 9.095/2017`. O dispositivo que efetivamente cria a obrigação é o **art. 8º, III, do Decreto 8.064/2013**, na redação dada pelo **art. 6º do Decreto 9.095/2017**, com efeitos desde **01/12/2017**. O 248-B § 4º é citado pela própria SEFAZ-GO, mas o texto do RCTE não abriu. A substância da regra está confirmada; a citação precisa ser corrigida.

### 2.8 E o que NÃO foi derrubado, que é o que mais importa

**A rejeição 686 é nacional.** Era o item mais importante da task e ele passou íntegro, com texto literal, em manual nacional aprovado por Ato COTEPE. Não é regra de Mato Grosso do Sul. A NT 01/2015 da SEFAZ-MS estava apenas divulgando uma regra nacional. O número de 30 dias vale para todo cliente, em qualquer UF. **A feature e o argumento comercial de "faltam N dias para o CNPJ inteiro travar" estão de pé** — e ganharam três irmãos (5 dias, sentido oposto, placa+UF descarga) que tornam o alerta mais frequente e mais útil, não menos.

**A data de 23/11/2026 do CIOT é real**, confirmada em nota técnica oficial. A janela comercial de ~10 semanas existe.

---

## 3. Texto literal das normas que abriram

### 3.1 MOC MDF-e 3.00b — Anexo I, seção 2.2 (Regras de Validação)

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=%2FvyTwObecyA%3D · consulta 16/09/2026.
Manual nacional, versão 3.00b de 07/12/2022, aprovado por Ato COTEPE ICMS 124/22. Tabela de regras F01 a F113.

**Regra F86 — cStat 686 — o item central da task:**

> "F86 | Verificar se existe MDFe não encerrado para o CNPJ / CPF do emitente com mais de 30 dias desde a autorização. Observação: retornar chave de acesso e protocolo de autorização mais antigo que causa o bloqueio. Exceção: essa regra não deverá ser aplicada para MDFe com forma de emissão (tpEmis=3) Regime Especial da Nota Fiscal Fácil | Obrig. | 686 | Rej. | Rejeição: Existe MDFe não encerrado há mais de 30 dias para o emitente [chMDFe: 99999999999999999999999999999999999999999999][nProt:999999999999999]"

Aplicação **"Obrig."**, sem qualquer restrição de UF no manual nacional.

**Regra F85 — cStat 611:**

> "F85 | Verificar se existe MDFe não encerrado, para a placa principal (mesmo CNPJ base / CPF do emitente do MDFe, mesma placa, mesmo tipo de emitente e mesma UF descarregamento). | Obrig. | 611 | Rej. | Rejeição: Existe MDFe não encerrado para esta placa, tipo de emitente e UF descarregamento [chMDFe: ...][nProt: ...]"

**Regra F87 — cStat 462 — o bloqueio de 5 dias:**

> "F87 | Se modal rodoviário: Verificar se existe MDFe não encerrado para a placa do veículo com o mesmo CNPJ Base / CPF do emitente com mais de 5 dias desde a autorização indicando no máximo duas UF de percurso além do carregamento e descarregamento. Observação: retornar chave de acesso e protocolo de autorização mais antigo que causa o bloqueio. Exceção: essa regra não deverá ser aplicada para MDFe com forma de emissão (tpEmis=3) Regime Especial da Nota Fiscal Fácil | Obrig. | 462 | Rej. | Rejeição: Existe MDFe não encerrado há mais de 5 dias para placa com até 2 UF de percurso informadas [chMDFe: ...][nProt: ...]"

**Regra F88 — cStat 662 — sentido oposto:**

> "F88 | Se modal rodoviário: - Verificar se existe MDFe não encerrado, para a placa principal (mesmo CNPJ base / CPF do emitente do MDFe, mesma placa, mesmo tipo de emitente e contendo o par UF de Carregamento/ UF de Descarregamento no sentido oposto ao MDFe que está sendo autorizado). Observação: retornar chave de acesso e protocolo de autorização mais antigo que causa o bloqueio. Exceção: essa regra não deverá ser aplicada para MDFe com forma de emissão (tpEmis=3) Regime Especial da Nota Fiscal Fácil | Obrig. | 662 | Rej. | Rejeição: Existe MDFe não encerrado para esta placa, tipo de emitente no sentido oposto da viagem"

**Regra F113 — cStat 684 — CIOT, redação da base 3.00b (antes da NT 2026.001):**

> "Se modal rodoviário, UF Carregamento e Descarregamento forem diferentes de Exterior e informado RNTRC Verificar se foi informado CIOT quando este for obrigatório para o RNTRC | Facult. | 684 | Rej | Rejeição: CIOT obrigatório para RNTRC informado."

Note a aplicação **"Facult."** e o condicionamento ao RNTRC. É exatamente isto que a NT 2026.001 endurece.

**Regra F101 — CIOT, validação do responsável:**

> "Se modal Rodoviário e informado grupo do CIOT (grupo: infCIOT): Rejeitar se o CPF ou CNPJ do responsável pela geração do CIOT informado estiver inválido"

**Seguro (confirma o mapa):**

> "F91 | ... | 698 | Rej. | Rejeição: Seguro da carga é obrigatório para modal Prestador de Serviço de Transporte no modal rodoviário"
> "F92 | ... | 699 | Rej. | Rejeição: Dados do seguro de carga incompletos para o modal rodoviário"

**Outros da faixa 605–615, para o dicionário de UI:**

> 606 — "Rejeição: Segundo Código de Barras deve ser informado para NFe em contingência (FS-DA e FS-IA)"
> 607 — "Rejeição: Segundo Código de Barras não deve ser informado para NFe com este tipo de emissão"
> **609 — "Rejeição: MDFe já está encerrado na base de dados da SEFAZ"**
> 612 — "Rejeição: Código de Município diverge da UF de descarregamento do MDFe"
> 616 — "Rejeição: Nenhum grupo de documentos foi informado (CTe, CT, NFe, MDFe)"

Faixa 680–690 completa: 680 (F13) município de descarregamento duplicado; 681 (F109) RNTRC inexistente; 682 (F110) RNTRC com situação inválida; 683 (F112) placa não vinculada ao RNTRC; 684 (F113) CIOT; 685 (F10) município de carregamento duplicado; 686 (F86); 687 (F111) RNTRC não associado ao transportador; 688 (F108) RNTRC obrigatório para PST.

### 3.2 MOC MDF-e 3.00b — Visão Geral, seção 4.4

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=QWruTo%2FrvI8%3D · consulta 16/09/2026.

> Seção 4.4 — **"Serviço de Consulta MDFe não encerrados"**. Processo **síncrono**. Retorno: **"Estrutura XML com a listagem dos MDFe não encerrados"**, com os campos `chMDFe` ("Chave de acesso do MDFe"), `nProt`, `dhRecbto`, `cStat` e `xMotivo`. Entrada com identificador CNPJ/CPF, `tpAmb` ("1 – Produção / 2 - Homologação") e `cUF`.

Serviços do projeto MDF-e descritos no manual: `MDFeRecepcaoSinc`, `MDFeConsulta` (situação), **`MDFeConsNaoEnc`**, `MDFeStatusServico`, `MDFeRecepcaoEvento`, `NFeConsultaCadastro`.

Endpoints publicados no Portal Nacional (SVRS), consulta 16/09/2026:

> `MDFeConsNaoEnc` versão 3.00 — produção `https://mdfe.svrs.rs.gov.br/ws/MDFeConsNaoEnc/MDFeConsNaoEnc.asmx` · homologação `https://mdfe-homologacao.svrs.rs.gov.br/ws/MDFeConsNaoEnc/MDFeConsNaoEnc.asmx`
> `MDFeDistribuicaoDFe` versão 1.00 — produção `https://mdfe.svrs.rs.gov.br/ws/MDFeDistribuicaoDFe/MDFeDistribuicaoDFe.asmx` · homologação `https://mdfe-homologacao.svrs.rs.gov.br/ws/MDFeDistribuicaoDFe/MDFeDistribuicaoDFe.asmx`

### 3.3 FAQ oficial do Portal Nacional do MDF-e

Fonte: https://dfe-portal.svrs.rs.gov.br/mdfe/Faq · consulta 16/09/2026.

> Conceito de encerramento: "informar ao fisco, através de Web Service de registro de eventos o fim de sua vigência."
> "A empresa emitente deverá encerrar o MDFe no final do percurso."
> "Enquanto houver MDFe pendente de encerramento não será possível autorizar novo MDFe, para o mesmo par UF de carregamento e UF de descarregamento, para o mesmo veículo."

**O FAQ não contém** a expressão "em datas distintas", nem menção ao prazo de 30 dias, nem à rejeição 686, nem a qualquer prazo em horas ou dias para encerrar. Isso **reconfirma o achado 0.1 do mapa**: não há prazo regulamentar para encerrar. O que há são bloqueios cronometrados.

### 3.4 NT MDF-e 2026.001 v1.00 (maio/2026) — CIOT

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=F9WDPRCi0Bs%3D · consulta 16/09/2026. Listada no portal como "Publicada em 01/06/2026"; o portal SVRS a lista com data 29/05/2026.

**Objeto:**

> "Esta NT dispõe sobre regra de validação do MDFe obrigando o CIOT para as prestações de serviço de transporte rodoviário de cargas realizadas **por conta de terceiros e mediante remuneração** conforme o Ajuste SINIEF n° 03 de 2026."

**Cronograma:**

> "Regra de validação exigência do CIOT | **21/09/2026** | **23/11/2026**"

(coluna Homologação = 21/09/2026; coluna Produção = 23/11/2026)

**Regra de validação:**

> "Se modal rodoviário (modal=1) e tipo do emitente for igual a prestador de serviço de transporte (tpEmit=1) ou transportador que emitirá CT-e globalizado (tpEmit=3) ou transportador próprio que informou o tipo de transportador (tpEmit=2 com tag tpTransp informada): - O grupo de dados do CIOT (tag: infCIOT) deverá estar informado."
>
> "Obrig. | 684 | Rej. | Rejeição: CIOT deverá ser informado"

**Sobre a exceção de carga própria — leitura precisa, porque aqui é fácil errar:**

A NT **não traz cláusula de exceção escrita** e **não usa a expressão "carga própria"** em nenhum ponto. A exceção existe **por construção da condição**: `tpEmit=2` só é alcançado **quando `tpTransp` estiver informada**. O emitente de carga própria que não informa `tpTransp` fica fora da regra. E o objeto declarado da NT limita a obrigação às prestações "por conta de terceiros e mediante remuneração", o que exclui carga própria por definição legal.

Isto está alinhado com a ANTT (seção 3.7) e **confirma a data de 23/11/2026** que circulava só em material de fornecedor. A aplicação em produção passa de "Facult." (redação 3.00b) para **"Obrig."**, e deixa de ser condicionada ao RNTRC para ser condicionada a `tpEmit`.

### 3.5 NT CT-e 2024.002 v1.05 (outubro/2024) — CT-e Simplificado

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=Y1psoH3SyAA%3D · consulta 16/09/2026.

> "prestações de serviços de transporte intermunicipal **ou interestadual** de mercadorias, que envolvam diversos remetentes ou destinatários, e um único tomador de serviço"
> "O transportador poderá emitir um único CT-e referente a todas as prestações realizadas para este tomador"
> Regra G045: "Se UF de início da prestação <> UF de fim da prestação (e UF fim <> EX) CFOP deve iniciar por 6"
> Regra G046: "Se UF do emitente for diferente da UF de início da prestação"

Sem exigência de mesma UF de origem e destino. Sem mínimo de 2 NF-e no texto da NT.

### 3.6 NT CT-e 2026.002 v1.01 — Reforma Tributária

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=nYNUxSrXYaU%3D · consulta 16/09/2026.

> Capa: **"Versão 1.01 de 16 de julho de 2026"**
> "Observação: Esta NT tem 2 datas, uma para a Regra de Preenchimento dos campos da RTC e outra para o restante das definições desta NT"
> cStat 310: **"Rejeição: IBS / CBS não informado"**, para emitente do Regime Normal (CRT 3).

Cronograma completo na seção 2.5 deste documento.

### 3.7 ANTT — FAQ oficial "CIOT para Todos"

Fonte: https://www.gov.br/antt/pt-br/assuntos/cargas/ciot-para-todos-1/perguntas-frequentes · consulta 16/09/2026.

**Pergunta 2.7 — "Transporte de carga própria precisa cumprir piso mínimo?"**

> "Não. O piso mínimo se aplica ao transporte rodoviário remunerado de cargas. Na carga própria, o dono da mercadoria transporta sua própria carga, em veículo próprio ou em sua posse, sem contratar frete de terceiro. Como não há prestação remunerada de serviço de transporte por conta de terceiros, a regra do piso mínimo não se aplica."

**Pergunta 2.8 — "Transporte com frota própria é sempre carga própria?"**

> "Não. Frota própria significa apenas que o veículo pertence à empresa ou está sob sua posse. Se a empresa transporta sua própria mercadoria, pode ser carga própria. Mas se transporta carga de terceiros mediante remuneração, há prestação de serviço de transporte rodoviário remunerado de cargas, e as regras de CIOT e de piso mínimo podem se aplicar, conforme o caso."

### 3.8 Portaria CAT 102/2013 (SEFAZ-SP) — arts. 2º, 12 e 13

Fonte: https://legislacao.fazenda.sp.gov.br/Paginas/pcat1022013.aspx · consulta 16/09/2026.

O art. 2º está transcrito integralmente em `obrigatoriedade-mdfe-por-uf.md`.

**Art. 12 — cancelamento (confirma as 24h e o caráter cumulativo):**

> "Artigo 12 - O cancelamento do MDF-e poderá ser solicitado pelo contribuinte emitente à Secretaria da Fazenda e Planejamento quando, observadas as demais normas pertinentes, cumulativamente:
> I - não tenha iniciado o transporte dos bens e mercadorias;
> II - não tenha decorrido período de 24 (vinte e quatro) horas desde a concessão da respectiva Autorização de Uso do MDF-e."

**Art. 13 — encerramento. É a melhor reprodução oficial que consegui da cláusula 14ª do Ajuste SINIEF 21/2010:**

> "Artigo 13 - O encerramento é o ato que estabelece o fim da vigência do MDF-e, por meio do registro do evento, e deverá ocorrer:
> I - ao término do último descarregamento descrito no documento;
> II - quando houver transbordo, redespacho, subcontratação ou substituição do veículo ou do contêiner;
> III - na hipótese de retenção imprevista e parcial da carga transportada;
> IV - no caso de inclusão de novas mercadorias para a mesma UF de descarregamento.
> § 1º - O MDF-e pode ser encerrado de ofício pela Secretaria da Fazenda e Planejamento quando, ocorridas as situações descritas no caput, o contribuinte não tenha providenciado o encerramento ou, ainda, quando entender conveniente.
> § 2º - **O MDF-e pode ser encerrado pelo transportador declarado no documento quando, ocorridas as situações descritas no caput, o emitente não tenha providenciado o encerramento, ficando o transportador responsável pelos efeitos jurídicos deste evento.**"

**O § 2º é achado novo e vale uma conversa de produto.** Existe uma válvula de escape: o transportador declarado no MDF-e pode encerrar quando o emitente não encerra, assumindo os efeitos jurídicos. Em cadeia com subcontratação isso muda quem o produto precisa notificar — e abre a hipótese de o app do motorista/subcontratado encerrar legitimamente. Confirmado em SP; **verificar se as demais UF reproduzem o § 2º antes de generalizar.**

Note também que o caput do art. 13 **não fixa prazo**, o que reconfirma o achado 0.1 do mapa por mais um caminho independente.

### 3.9 MOC CT-e 4.00 — Anexo I (parte visível)

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=6aFNuknaWsc%3D · consulta 16/09/2026.

> "G157 | Verificar Duplicidade de CTe com diferença na Chave de Acesso | Obrig. | 539 | Rej. | Rejeição: Duplicidade de CTe, com diferença na Chave de Acesso"

> "G096 | A autorização do CTe de substituição deve ocorrer em até 60 dias, ou outro limite conforme critério definido pela SEFAZ (a SEFAZ Virtual deve considerar a hora local do emissor para a validação) da data de autorização do CTe objeto substituição | ... | 563 | Rej. | Rejeição: A substituição de um CTe deve ocorrer no prazo máximo de 60 dias contados da data de autorização do CTe objeto de Substituição"

**G096/563 confirma em texto literal o prazo de 60 dias do CT-e de Substituição**, que o mapa trazia como 🟡 inferido da existência da rejeição. Passa a 🟢.

### 3.10 FAQ oficial do Portal Nacional do CT-e — cancelamento

Fonte: https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx · consulta 16/09/2026.

> "Os Conhecimentos de Transporte autorizados na versão 1.04 de leiaute poderão ser cancelados em até 7 dias (168 horas) a partir da data de emissão do documento."
> "Somente poderá ser cancelado um CT-e que tenha sido previamente autorizado o seu uso pelo Fisco e desde que não tenha ainda ocorrido o fato gerador, ou seja, em regra, ainda não tenha ocorrido o inicio da prestação de serviço de transporte."

⚠️ **O FAQ está desatualizado**: fala em "versão 1.04 de leiaute", quando a versão vigente é a 4.00. As 168h seguem sendo a referência nacional, mas **este FAQ não é base sólida para a versão atual**. Tratar as 168h como 🟡 até achar o dispositivo na 4.00.

### 3.11 Legislação de Goiás e de Minas Gerais

Transcrita integralmente em `obrigatoriedade-mdfe-por-uf.md` (Decreto GO 9.095/2017 art. 6º; Decreto GO 8.064/2013 art. 8º; SEFAZ-GO; SEF/MG art. 87-B).

### 3.12 Achado colateral: existe uma NT CT-e 2026.001 fora do radar do mapa

Fonte: https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=9qjN8INgSkA%3D · consulta 16/09/2026.

> Título: "Projeto Conhecimento de Transporte Eletrônico - Reforma Tributária do Consumo - **Nota Técnica 2026.001 – Vinculação com a transação de pagamento do DFe**". Versão 1.01, **27 de fevereiro de 2026**. Homologação 06/04/2026, produção **04/05/2026**.
> Cria o **evento 110300 (vinculação de pagamento)** e o **evento 110301 (cancelamento da vinculação)**.

O mapa não registra esses dois eventos. Eles **já estão em produção desde 04/05/2026**. A tabela de eventos do CT-e na seção 2.7 do mapa está incompleta, e o aviso do próprio mapa de que "o mesmo código significa eventos diferentes em CT-e e em MDF-e" ganha dois códigos novos para indexar. **Isto merece uma verificação própria** — não estava na task e não foi aprofundado aqui.

---

## 4. Lacunas: o que não abriu

Todas as tentativas abaixo falharam por bloqueio da fonte, não por ausência de busca.

| #   | Item                                                                                         | Motivo                                                                                                                                  | Conferir manualmente em                                                                                                     |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 6   | Ajuste SINIEF 3/2026, data de efeitos (01/05 × 01/06/2026)                                   | CONFAZ retorna ROBOTS_DISALLOWED; Imprensa Nacional idem; acesso por shell bloqueado por política de egresso (403)                      | https://www.confaz.fazenda.gov.br/legislacao/ajustes/2026/AJ003_26 e DOU de 02/04/2026, Seção 1                             |
| 7   | Ajuste SINIEF 21/2010 consolidado, cláusula décima quarta, texto literal                     | CONFAZ bloqueia robôs. **Substituto oficial obtido:** Portaria CAT 102/2013 art. 13 (seção 3.8), que reproduz as quatro hipóteses       | https://www.confaz.fazenda.gov.br/legislacao/ajustes/2010/AJ_021_10                                                         |
| 8   | Prazo de cancelamento de CT-e em **GO** e em **MG**                                          | Nenhuma fonte primária estadual localizada. Só blog de fornecedor, que foi descartado                                                   | Legislação tributária da SEFAZ-GO e da SEF/MG; e verificar se há procedimento de cancelamento extemporâneo análogo ao de SP |
| 10  | Prazo do evento **610110** (45 dias?)                                                        | MOC CT-e 4.00 Anexo I chega truncado na página 26 de 110, terminando na regra G198. A seção de regras de **eventos** está além do corte | PDF completo do Anexo I do MOC CT-e 4.00, baixado em navegador                                                              |
| 11  | Guarda de XML: 5 anos ou **132 meses** (Ajuste SINIEF 2/2025)                                | CONFAZ bloqueado. FAQ do Portal Nacional não trata do tema. Só escritórios de advocacia, descartados por não serem primários            | CONFAZ, Ajustes SINIEF 2025                                                                                                 |
| 12b | Rejeições **626** e **729** do CT-e                                                          | Truncamento, mesmo motivo do item 10                                                                                                    | idem item 10                                                                                                                |
| —   | Limites de chamada e de registros do `MDFeConsNaoEnc`                                        | Não constavam da parte visível do MOC Visão Geral                                                                                       | MOC MDF-e 3.00b Visão Geral, seção 4.4 completa                                                                             |
| —   | Texto do **art. 248-A/248-B do RCTE-GO** e do **art. 87-B do Anexo V do RICMS/MG**           | RCTE-GO: 404 no repositório e "Acesso Negado" no `sefaz.go.gov.br`                                                                      | ver `obrigatoriedade-mdfe-por-uf.md`, seção 5                                                                               |
| —   | Código **610** do MDF-e: é código estadual, de versão anterior, ou invenção de fornecedor?   | Confirmado que **não está** no MOC 3.00b. A origem não foi determinada                                                                  | Notas técnicas do MDF-e (2024.001, 2024.002, 2025.001) e MOC 3.00/3.00a                                                     |
| —   | Se as demais UF reproduzem o **§ 2º do art. 13** (encerramento pelo transportador declarado) | Verificado só em SP                                                                                                                     | Legislação de GO e MG                                                                                                       |

**Sobre os códigos 301, 302, 303, 304, 521 e 523 do MDF-e:** a tabela de regras do MOC 3.00b está **inteira** na parte visível (vai de F01 a F113) e nenhum desses códigos aparece nela. Isso é consistente com o que o próprio mapa diz — eles vêm de **notas técnicas posteriores** (NT 2025.001 para NCM/301 e pagamento/302-303). O veredito é: **não são códigos da base 3.00b**; para confirmar texto e significado é preciso ler a NT 2025.001 v1.03, que **não foi aberta nesta verificação**. O 304, em particular, não deve ser listado ao lado do 684 como código de CIOT sem essa leitura.

---

## 5. PRECISA DE HUMANO

Nenhuma pesquisa documental resolve os itens abaixo.

### 5.1 Ligação para a ANTT — **a prioridade caiu**

O item 10 da seção 8 do mapa ("CIOT: carga própria vs frota própria — ANTT e SETCERGS divergem") **foi resolvido por documento** e não precisa mais de ligação. A ANTT distingue os dois conceitos explicitamente no seu próprio FAQ (seção 3.7): frota própria é sobre **de quem é o veículo**; carga própria é sobre **de quem é a mercadoria**. Frota própria carregando mercadoria de terceiro mediante remuneração **está dentro** do CIOT. Não havia divergência real entre ANTT e SETCERGS — havia imprecisão de vocabulário na leitura. **Corrigir o alerta ⚠️ da seção 0.2 do mapa**, que hoje afirma existir uma ambiguidade a resolver.

**O que ainda justifica contato com a ANTT**, e é outra pergunta:

- A **lista fechada de exceções** ao CIOT. O FAQ diz "observadas as exceções previstas na regulamentação" sem enumerá-las. O mapa lista três (veículos não emplacados, cargas especiais, transporte internacional) com selo 🟢 — essa lista precisa ser confirmada contra a Resolução 6.078/2026.
- A contradição do **cancelamento do CIOT** apontada na seção 4.3 do mapa (gerar "antes do início" × cancelar "até 24 horas antes do início"). É contradição de texto, e quem resolve é a ANTT.

### 5.2 Conversa com a SEFAZ-GO — **subiu para prioridade máxima**

Este é agora o item humano mais importante, porque é o que sustenta o argumento comercial no mercado-base.

**Pergunta exata a fazer:** _uma transportadora goiana emitente de CT-e modelo 57, prestando serviço a terceiro em viagem **intramunicipal** dentro de Goiás, é obrigada a emitir MDF-e?_

Por que não fecha sozinho: a página da SEFAZ-GO afirma que sim ("operações internas... intermunicipais ou intramunicipais"), mas o texto do Decreto 8.064/2013 art. 8º, III descreve o transporte "realizado em veículos próprios ou arrendados, ou mediante contratação de transportador autônomo" — redação típica de conta própria — ainda que nomeie o emitente de CT-e 57. O RCTE, que teria o texto desambiguador, não abriu.

Sem essa confirmação, **não usar "você precisa de MDF-e até na entrega dentro de Goiânia" em material de venda.** É a afirmação mais forte do pitch regional e a que mais rápido seria desmentida pelo contador do cliente.

Canal: SETCEG, ou atendimento da Secretaria da Economia de Goiás. Pedir a resposta **por escrito**.

### 5.3 Conversa com o SETCEG — validação de campo, não jurídica

Duas perguntas que só quem opera responde:

1. **Qual dos quatro bloqueios realmente dói?** A verificação revelou que existem quatro (5 dias, 30 dias, placa+UF descarga, sentido oposto). Minha leitura é que o de **5 dias (F87/462)** é o que mais vai disparar em transportadora regional de rota curta, e o do **sentido oposto (F88/662)** é o mais caro operacionalmente. Isso é inferência a partir da norma, **não é dado de campo**. Se o produto priorizar o alerta errado, entrega um alarme que ninguém liga.
2. **Alguém usa o § 2º do art. 13** (encerramento pelo transportador declarado quando o emitente não encerra)? Se for prática real em subcontratação, muda o desenho do app do motorista.

### 5.4 Call comercial — o que não tem documento público

- **Preço real por transportadora na IPEF** (Extratta, Target Tech, Repom, Roadcard/Pamcard). Nenhuma publica. Continua sendo o item 11 da seção 8 do mapa, intocado por esta verificação.
- **Qual IPEF cada prospect já usa.** Continua sendo objeção de venda, não escolha técnica.
- **Preço do TecnoSpeed** e se CT-e está na API REST ou só no componente DLL.

### 5.5 Alguém precisa abrir três PDFs em navegador

Trabalho mecânico, mas ninguém deve chutar o conteúdo:

1. **Anexo I do MOC CT-e 4.00 completo** (110 páginas) → fecha os itens 10 e 12b: prazo do evento 610110 e os códigos 626 e 729.
2. **NT MDF-e 2025.001 v1.03** → fecha os códigos 301, 302, 303, 304.
3. **Ajuste SINIEF 3/2026 no CONFAZ ou no DOU de 02/04/2026** → fecha o item 6, a data de efeitos.

Os três são bloqueados a robô mas abrem normalmente em navegador com sessão humana.

---

## 6. Ações imediatas sobre o mapa `fluxos-documentais.md`

1. **Seção 0.1, tabela de consequências:** trocar "Bloqueio imediato de nova emissão para o mesmo par (UF carregamento × UF descarregamento) + mesmo veículo em datas distintas" pelas **quatro** regras reais da seção 2.1 deste documento. Promover a rejeição 686 de 🟡 para **🟢 nacional**.
2. **Seção 3.2, nota sobre a chave de bloqueio:** reescrever. A chave é `(CNPJ base, placa, tpEmit, UF descarregamento)`, mais o par invertido, mais dois relógios.
3. **Seção 8, itens 1, 4, 7, 12:** fechar como confirmados/derrubados. Item 10 fechar como resolvido por documento.
4. **Seção 2.7:** acrescentar os eventos **110300** e **110301** do CT-e, em produção desde 04/05/2026.
5. **Seção 2.9:** remover a inconsistência de datas da NT 2026.002 — ela não existe.
6. **Seção 2.3 e seção 7 item 11:** corrigir a atribuição das rejeições 539/626 à digitação de chave de NF-e.
7. **Seção 3.1:** corrigir MG para **art. 87-B** e GO para **Decreto 8.064/2013 art. 8º, III**.
8. **Seção 0.2:** remover o alerta de ambiguidade ANTT × SETCERGS; está resolvido.
9. **Seção 2.5:** rebaixar as 168h nacionais para 🟡 — o FAQ que as sustenta fala da versão 1.04 de leiaute.
10. **Novo:** registrar o `MDFeConsNaoEnc` como a fundação técnica do painel de manifestos abertos, e o Portal Nacional do CT-e como fonte de vigilância normativa no lugar do SVRS.
