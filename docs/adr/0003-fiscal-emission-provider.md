# ADR 0003 — Provedor da camada fiscal (CT-e, MDF-e e eventos)

- **Status:** **Proposta, pendente de spike com credenciais.** Nenhuma emissão real foi feita. Toda afirmação abaixo vem de documentação pública, com URL.
- **Data:** 2026-09-16
- **Decisores:** engenharia AI4Logistics
- **Relacionados:** ADR 0006 (provedor CIOT), `docs/adr/custo-unitario-por-viagem.md`

---

## 1. Contexto

O AI4Logistics é um SaaS pré-receita para transportadoras pequenas. Precisamos emitir CT-e
(modelo 57), CT-e OS (67), CT-e Simplificado e MDF-e (58), mais os eventos associados, **sem
integrar diretamente com os webservices da SEFAZ**. Integração direta significaria manter 27
webservices estaduais, contingência, notas técnicas e certificado em memória — um produto
inteiro que não é o nosso.

Três restrições moldam a escolha e valem mais que preço:

**(a) Onboarding self-service.** Uma transportadora pequena precisa se cadastrar e emitir no
mesmo dia. Se o vínculo do certificado A1 exigir painel web do fornecedor, alguém do nosso time
manipula um `.pfx` e uma senha à mão para cada cliente. Isso não escala, cria passivo de
segurança e mata o funil de auto-atendimento. **Este é o critério de maior peso.**

**(b) Encerramento do MDF-e por API (evento 110112).** MDF-e aberto bloqueia a emissão do
próximo MDF-e no mesmo par UF carregamento × descarregamento. O domínio já modela isso
(`RiscoTipo.mdfe_aberto_bloqueando_veiculo`, `DocumentoStatus.encerrado` em
`packages/core/src/domain/tipos.ts`). Se o encerramento não for programático, o produto central
— tirar o veículo do bloqueio sem o dono abrir o site de ninguém — não existe. **Critério de
eliminação: sem 110112 por API, a avaliação do candidato termina ali.**

**(c) Arquitetura REST.** Rodamos em contêineres Linux. Um componente binário DLL/OCX/BPL para
Delphi/C#/VB6 não é integrável ao nosso runtime sem hospedar um Windows de lado. Componente
binário é eliminação por arquitetura.

**Fora de escopo por decisão prévia:** Nuvem Fiscal, que anunciou desativação em 22/04/2026.
Não foi avaliada.

---

## 2. Opções consideradas

### 2.1 Cobertura documental e critério de eliminação

| Provedor              | CT-e 57                                | CT-e OS 67     | CT-e Simpl.                         | MDF-e 58        | **Encerramento MDF-e 110112 por API**                                                                                     | Veredito                |
| --------------------- | -------------------------------------- | -------------- | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Focus NFe (Acras)** | Sim                                    | Sim            | Sim                                 | Sim             | **Sim** — `POST /mdfe/{referencia}/encerrar` ([doc](https://doc.focusnfe.com.br/reference/encerrar_mdfe.md))              | **Passa**               |
| **Webmania BR**       | Sim (`cte`)                            | Sim (`cte_os`) | Sim (`/2/cte/emissao/simplificada`) | Sim             | **Sim** — `PUT /2/mdfe/encerrar` ([doc](https://webmaniabr.com/docs/rest-api-mdfe/))                                      | **Passa**               |
| **Migrate / InvoiCy** | Sim                                    | Não confirmado | Não confirmado                      | Sim             | **Sim** (listado em texto, sem rota citada) ([doc](https://desenvolvedores.migrate.info/ModulosFiscais/Documentos/MDFe/)) | Passa com ressalva      |
| **ACBr API**          | Sim                                    | Não confirmado | Não confirmado                      | Sim             | **Sim** (listado como capacidade, sem rota citada) ([doc](https://dev.acbr.api.br/docs/mdfe/))                            | Passa com ressalva      |
| **TecnoSpeed**        | **Só no PlugDFe (componente binário)** | —              | —                                   | Sim (PlugNotas) | n/a                                                                                                                       | **ELIMINADO — ver 2.2** |

### 2.2 A armadilha TecnoSpeed: onde o CT-e realmente vive

Verificado em três fontes independentes. **O CT-e não está na API REST (PlugNotas).**

| Fonte                                                                                                                                                                        | O que diz                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Página do produto PlugNotas](https://tecnospeed.com.br/en/plugdfe/plugnotas/)                                                                                               | Lista os documentos como "NF-e, NFC-e, NFS-e, NFCom, and MDF-e". **CT-e ausente.** CT-e só aparece como documento que o MDF-e _consolida_ ("Consolidate NF-e, NFC-e, and CT-e"), não como documento que o PlugNotas emite.                                               |
| [Primeiros Passos com o Plugnotas](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/23715383551767-Primeiros-Passos-com-o-Plugnotas) (central de atendimento oficial) | "NFSe e NFSe Nacional, NFe, NFCe, MDFe e NFCom". **CT-e ausente de novo.**                                                                                                                                                                                               |
| [Página CT-e do PlugDFe](https://tecnospeed.com.br/en/plugdfe/cte/)                                                                                                          | Oferece CT-e como "Library (DLL/OCX/BPL/TLB) containing all methods to issue CT-e (...) available for Delphi, C#, and VB6". Menciona também um caminho HTTPS via "Manager SaaS", mas **esse caminho não é o PlugNotas e não tem documentação pública de rotas de CT-e.** |

Existe uma rota de API de CT-e na central de atendimento da TecnoSpeed
([Comprovante de Entrega / CT-e](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360035195333-Rota-da-API-Comprovante-de-Entrega-Cancelamento-do-Comprovante-de-Entrega-Canhoto-Digital-CT-e)),
o que sugere que o "CTeManager" tem uma superfície HTTP. Mas ela não é o PlugNotas, não está no
portal de documentação pública, e o produto que a TecnoSpeed vende publicamente para CT-e é o
componente binário.

**Conclusão: TecnoSpeed eliminada para esta arquitetura.** Emitir CT-e exigiria ou hospedar um
componente Windows, ou negociar acesso a um produto sem documentação pública — as duas coisas
que este ADR existe para evitar. _Reversível se a TecnoSpeed publicar documentação REST de CT-e
no PlugNotas; ver seção 6._

### 2.3 Eventos expostos por API

| Evento                     | Código     | Focus NFe                                                                                                                                                                                                                     | Webmania BR                                                                                                         |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cancelamento CT-e          | 110111     | `POST /cte/{ref}/cancelar` ([llms.txt](https://doc.focusnfe.com.br/llms.txt))                                                                                                                                                 | `PUT /2/cte/cancelar`                                                                                               |
| Carta de Correção CT-e     | 110110     | `POST /cte/{ref}/carta_correcao` ([doc](https://doc.focusnfe.com.br/reference/carta_correcao_cte_cte_os.md))                                                                                                                  | `POST /2/cte/correcao`                                                                                              |
| **Comprovante de entrega** | **110180** | **NÃO EXPOSTO para CT-e.** O índice completo da documentação só traz insucesso/comprovante para **NF-e** (`emitir_evento_insucesso_entrega`). Nenhuma rota de CT-e 110180. ([llms.txt](https://doc.focusnfe.com.br/llms.txt)) | **Sim** — `POST /2/cte/entrega` e `PUT /2/cte/entrega/cancelar` ([doc](https://webmania.com.br/docs/rest-api-cte/)) |
| **Insucesso de entrega**   | **110190** | **NÃO EXPOSTO para CT-e** (só NF-e, mesma fonte)                                                                                                                                                                              | Não confirmado                                                                                                      |
| Cancelamento MDF-e         | 110111     | `POST /mdfe/{ref}/cancelar`                                                                                                                                                                                                   | `PUT /2/mdfe/cancelar`                                                                                              |
| **Encerramento MDF-e**     | **110112** | `POST /mdfe/{ref}/encerrar`, campos `data`, `sigla_uf`, `nome_municipio`                                                                                                                                                      | `PUT /2/mdfe/encerrar`                                                                                              |
| **Inclusão de DF-e**       | **110113** | `POST /mdfe/{ref}/incluir_dfe` ([llms.txt](https://doc.focusnfe.com.br/llms.txt))                                                                                                                                             | **NÃO EXPOSTO.** A doc lista só emissão, consulta, encerrar, cancelar, condutor.                                    |
| Inclusão de condutor       | 110114     | `POST /mdfe/{ref}/incluir_condutor`                                                                                                                                                                                           | `PUT /2/mdfe/condutor`                                                                                              |

**Leitura desta tabela: nenhum dos dois é completo, e as lacunas são complementares.**
Focus tem inclusão de DF-e e não tem comprovante de entrega. Webmania tem comprovante de entrega
e não tem inclusão de DF-e.

Qual lacuna dói mais? **A falta de inclusão de DF-e (Focus tem, Webmania não) dói mais.** Sem
110113, uma NF-e que entra na carga depois do MDF-e autorizado obriga a cancelar e reemitir o
MDF-e inteiro — que é exatamente o tipo de retrabalho que o produto promete eliminar. Já o
comprovante de entrega 110180 é opcional na operação e hoje é resolvido por canhoto em papel ou
foto no WhatsApp na maioria das transportadoras pequenas; é uma feature de roadmap, não do MVP.
_Nenhuma das duas afirmações de impacto foi validada com transportadoras; é julgamento nosso._

### 2.4 Protocolo, webhooks, ambientes

| Critério                   | Focus NFe                                                                                                                                                                                                                                                                                                | Webmania BR                    | Migrate / InvoiCy                                                                                              | ACBr API                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Protocolo                  | REST/JSON ([doc](https://doc.focusnfe.com.br/reference/introducao))                                                                                                                                                                                                                                      | REST/JSON                      | REST **ou** SOAP **ou** conector ([doc](https://desenvolvedores.migrate.info/ModulosFiscais/Documentos/MDFe/)) | REST/JSON ([doc](https://dev.acbr.api.br/docs/))       |
| Sync/Async                 | **Assíncrono** por padrão: pré-validação síncrona, fila para a SEFAZ. Modo síncrono configurável. ([doc](https://doc.focusnfe.com.br/reference/emitir_mdfe.md))                                                                                                                                          | Não confirmado                 | Não confirmado                                                                                                 | Não confirmado                                         |
| Base URL homologação       | `https://homologacao.focusnfe.com.br` ([doc](https://doc.focusnfe.com.br/reference/ambiente.md))                                                                                                                                                                                                         | Não confirmado na doc pública  | Não confirmado                                                                                                 | **Não confirmado** — a introdução não separa ambientes |
| Base URL produção          | `https://api.focusnfe.com.br` (prefixo `/v2`)                                                                                                                                                                                                                                                            | `/2/...` (host não confirmado) | Não confirmado                                                                                                 | Não confirmado                                         |
| Autenticação               | HTTP Basic, token como usuário, senha em branco ([doc](https://doc.focusnfe.com.br/reference/criar_empresa.md))                                                                                                                                                                                          | Não confirmado                 | Não confirmado                                                                                                 | Token de acesso                                        |
| **Webhooks**               | **Sim.** CRUD completo: `criar_webhook`, `listar_webhooks`, `consultar_webhook`, `excluir_webhook` ([llms.txt](https://doc.focusnfe.com.br/llms.txt))                                                                                                                                                    | Não confirmado                 | Não confirmado                                                                                                 | **Não mencionado** na doc                              |
| **Retentativa de webhook** | **Publicada e explícita:** dispara de novo em **1 minuto, 30 minutos, 1 hora, 3 horas, 24 horas** (5 tentativas). Gatilho para quando a resposta está "fora da família 2xx". "Depois da última tentativa, o gatilho não é disparado de novo." ([doc](https://doc.focusnfe.com.br/reference/webhooks.md)) | Não confirmado                 | Não confirmado                                                                                                 | Não confirmado                                         |
| Reenvio manual             | **Sim**, rota dedicada por documento: `reenviar_hook_mdfe`, `reenviar_hook_cte_cte_os` ([llms.txt](https://doc.focusnfe.com.br/llms.txt))                                                                                                                                                                | Não confirmado                 | Não confirmado                                                                                                 | Não confirmado                                         |

O par "retentativa com política publicada + reenvio manual sob demanda" é o que permite tratar o
webhook como _otimização de latência_ e não como _fonte de verdade_: se a entrega morrer depois
de 24h, temos uma rota para buscar de volta em vez de um estado preso para sempre.

### 2.5 Certificado A1 por API — o critério decisivo

| Provedor          | Cadastro de CNPJ + vínculo do `.pfx` por API?                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Focus NFe**     | **SIM, confirmado no schema.** `POST /v2/empresas` aceita `arquivo_certificado_base64` ("Arquivo PFX/P12 em base64") e `senha_certificado` ("Senha do certificado digital. Obrigatória apenas se informado arquivo_certificado_base64"). CRUD completo de empresas por API: criar, listar, consultar, atualizar, excluir. ([doc](https://doc.focusnfe.com.br/reference/criar_empresa.md), [índice](https://doc.focusnfe.com.br/reference/empresas.md)) |
| Webmania BR       | **Não confirmado.** A documentação pública de CT-e/MDF-e não descreve cadastro de empresa nem upload de certificado por API.                                                                                                                                                                                                                                                                                                                           |
| Migrate / InvoiCy | Não confirmado.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ACBr API          | **Não confirmado.** A introdução não menciona registro de certificado por API.                                                                                                                                                                                                                                                                                                                                                                         |

Uma nuance honesta: o [artigo de blog da Focus](https://focusnfe.com.br/blog/como-vincular-o-certificado-digital-modelo-a1-a-empresa-cadastrada/)
descreve o caminho pelo painel e apresenta a via de API como "nossa API **para revendas**". O
schema do endpoint em si não declara restrição de permissão. **Se o `POST /v2/empresas` exigir
contrato de revenda, isso muda o modelo comercial, não a arquitetura** — continua sendo API. Mas
é a primeira coisa que o spike tem que checar, porque se for um "fale com o comercial" disfarçado,
a vantagem decisiva da Focus evapora.

### 2.6 Preço público

| Provedor          | Preço                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Focus NFe**     | **Público, com números.** ([precos](https://focusnfe.com.br/precos/)) Solo R$ 89,90/mês, 1 CNPJ, 100 notas, R$ 0,10 por nota adicional. Start R$ 113,90/mês, 3 CNPJs, R$ 37,90 por CNPJ adicional, 100 notas/CNPJ, R$ 0,10 adicional. **Growth R$ 548,00/mês, CNPJs ilimitados, 4.000 notas, R$ 0,12 por nota adicional.** Os três planos incluem "Emissão de NFe, NFSe, NFCe, **CTe, MDFe**, NFCom e DCe". |
| Webmania BR       | **NÃO PÚBLICO** nas páginas de documentação consultadas.                                                                                                                                                                                                                                                                                                                                                    |
| Migrate / InvoiCy | **NÃO PÚBLICO.**                                                                                                                                                                                                                                                                                                                                                                                            |
| ACBr API          | **NÃO PÚBLICO.**                                                                                                                                                                                                                                                                                                                                                                                            |
| TecnoSpeed        | **NÃO PÚBLICO.**                                                                                                                                                                                                                                                                                                                                                                                            |

O plano Growth é o único da categoria com **CNPJs ilimitados**, que é a forma exata do nosso
problema: muitas transportadoras, poucos documentos cada. Nos planos por CNPJ (Start, R$ 37,90
por CNPJ adicional) o custo cresce linear com clientes e o modelo não fecha.

### 2.7 Continuidade

| Sinal            | Focus NFe                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tempo de mercado | Fundada em **2005** em Curitiba; a controladora **Acras Tecnologia** completou 18 anos em 2023. Abandonou software sob medida em 2010 para focar em produto. ([sobre](https://focusnfe.com.br/sobre-a-focus-nfe/))                                                                                                                                                                                            |
| Controle         | Acras Tecnologia da Informação. CNPJ 07.504.505/0001-32. Sem aquisição mencionada.                                                                                                                                                                                                                                                                                                                            |
| Status page      | **Existe:** [status.focusnfe.com.br](https://status.focusnfe.com.br/) (HetrixTools).                                                                                                                                                                                                                                                                                                                          |
| Reclame Aqui     | **Sinal fraco, não conclusivo.** Perfil "Acras Tecnologia da Informação" com **1 reclamação**, nota 2.0/10, taxa de resposta 100%, tempo médio 3h, status `NO_INDEX` ("Sem reputação definida", menos de 10 reclamações avaliadas). ([RA](https://www.reclameaqui.com.br/empresa/acras-tecnologia-da-informacao/)) Com N=1, isso não diz nada sobre qualidade de suporte. Não é evidência a favor nem contra. |

Para os demais candidatos não foram levantados sinais de continuidade, porque foram descartados
antes por cobertura, arquitetura ou falta de documentação pública.

---

## 3. Decisão

**Adotamos a Focus NFe (Acras Tecnologia) como provedor da camada fiscal**, atrás da interface
`FiscalProvider` (`packages/fiscal/src/provider.ts`), em caráter de **proposta pendente de spike
com credenciais**.

Razões, em ordem de peso:

1. **É o único candidato com cadastro de CNPJ e vínculo de certificado A1 confirmados por API**
   (`arquivo_certificado_base64` + `senha_certificado` em `POST /v2/empresas`). Isso é a diferença
   entre onboarding self-service e um humano nosso mexendo em `.pfx` de cliente.
2. **Passa o critério de eliminação** com rota nominal e campos documentados para o 110112.
3. **Cobre os quatro documentos**, incluindo CT-e OS 67 e CT-e Simplificado, que vários
   concorrentes não confirmam.
4. **É o único com inclusão de DF-e (110113)** entre os dois finalistas.
5. **É o único com política de retentativa de webhook publicada em números**, o que dá base para
   desenhar a reconciliação em vez de adivinhá-la.
6. **É o único com preço público**, e o plano de CNPJs ilimitados casa com a forma do nosso
   problema.

**Webmania BR fica como segundo colocado documentado e plano de contingência**, não como
descartada. Ela passa o critério de eliminação, tem REST, e tem o 110180 que a Focus não tem.

**Decisão de arquitetura que vale independentemente do fornecedor:** toda a camada fica atrás de
`FiscalProvider`. A interface foi desenhada **depois** de ler Focus e Webmania, e tem duas marcas
disso: o `comprovanteEntrega` é declarado como **capacidade opcional** (`capacidades.comprovanteEntrega`)
porque a Focus não tem e a Webmania tem; e a idempotência é **nossa**, não do fornecedor
(seção 4.2).

---

## 4. Consequências

### 4.1 Boas

- Onboarding de transportadora pode ser 100% self-service no dia 1.
- Fluxo de encerramento de MDF-e — o coração do produto — é programável.
- Temos preço público, então `custo-unitario-por-viagem.md` tem um número real na camada fiscal.
- O `FakeFiscalProvider` (`packages/fiscal/src/fake/`) destrava frontend, testes e fixtures
  **agora**, sem esperar contrato assinado.

### 4.2 Ruins e mitigações

- **Não temos comprovante de entrega eletrônico (110180) com a Focus.** Mitigação: `capacidades`
  na interface; `comprovanteEntrega()` devolve `nao_suportado` tipado em vez de estourar. Se o
  110180 virar requisito de venda, ou migramos ou rodamos híbrido.
- **`ref` da Focus não é chave de idempotência de requisição, é chave única de negócio.**
  Reenviar o mesmo `ref` devolve `mdfe_em_processamento` ou `mdfe_ja_autorizado`
  ([doc](https://doc.focusnfe.com.br/reference/emitir_mdfe.md)). Isso é _bom_ para nós, mas só se
  o `ref` for determinístico. Mitigação: a interface obriga `IdempotencyKey` derivada de
  `(orgId, viagemId, tipo, tentativa)`, e o adapter mapeia ela para o `ref`. Assim um retry de
  rede colide de propósito e devolve o documento existente, em vez de emitir um CT-e duplicado —
  que é problema fiscal, não linha duplicada.
- **Emissão é assíncrona.** O estado `enviando` em `DocumentoStatus` já existe no domínio e não é
  decorativo. Webhook é otimização; a verdade vem de `consultar()` + reconciliação periódica.
- **Risco de fornecedor único.** Mitigação: a interface, mais o `FakeFiscalProvider` como
  segundo implementador que mantém a abstração honesta.
- **Risco comercial não resolvido:** se `POST /v2/empresas` for restrito a revendas, o modelo de
  contrato muda. É o item 1 do spike.

---

## 5. O que o spike precisa medir (quando houver credenciais)

Ordenado por poder de derrubar a decisão.

1. **`POST /v2/empresas` funciona com token comum ou exige contrato de revenda?** Se exigir, qual
   o custo e a fricção? _Se for inviável, a decisão cai — é a razão número 1 da escolha._
2. **Emitir e encerrar um MDF-e ponta a ponta em homologação.** Medir latência de
   `POST /mdfe` → webhook de autorização, e de `POST /mdfe/{ref}/encerrar` → status `encerrado`.
3. **Confirmar que o 110112 realmente libera o par UF.** Emitir MDF-e no par SP→MG, tentar o
   segundo (esperar bloqueio), encerrar o primeiro, tentar de novo. É a asserção que sustenta
   `mdfe_aberto_bloqueando_veiculo`.
4. **Reenviar a mesma emissão com o mesmo `ref`** e capturar a resposta exata. Confirmar que
   devolve o documento existente e não emite duplicata. Registrar os códigos literais.
5. **Confirmar CT-e OS 67 e CT-e Simplificado** com payload real — hoje só temos a lista da
   página de introdução, não um 200.
6. **Capturar os códigos e textos crus de rejeição** para 698, 301, 302, 524, 626 e 686 e conferir
   contra as fixtures de `packages/fiscal/src/fake/`. Hoje os textos do fake são reconstruções a
   partir do layout da SEFAZ, **não** capturas do fornecedor.
7. **Testar a retentativa de webhook na prática**: derrubar o endpoint, confirmar as 5 tentativas
   nos intervalos publicados, e exercitar `reenviar_hook_mdfe` depois da janela de 24h.
8. **Medir o comportamento de contingência** e ver o que a Focus expõe. Nada foi confirmado sobre
   EPEC/contingência de CT-e na doc pública, e `DocumentoStatus.contingencia` existe no domínio.
9. **Confirmar se `POST /v2/empresas` aceita troca de certificado** (renovação anual do A1) via
   `atualizar_empresa`, sem recriar a empresa e perder numeração.

---

## 6. O que nos faria reverter

| Gatilho                                                                                       | Para onde vamos                                                   |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `POST /v2/empresas` com certificado exige revenda/negociação e o custo não fecha              | Webmania BR, e reavaliar onboarding assistido no primeiro ano     |
| Spike mostra que o 110112 não libera o par UF de forma confiável                              | Reabrir a frente inteira; é a hipótese central do produto         |
| Comprovante de entrega 110180 vira requisito de venda em mais de ~30% dos deals               | Webmania (tem `POST /2/cte/entrega`), ou híbrido                  |
| Focus sem CNPJs ilimitados, ou Growth acima de ~R$ 800/mês                                    | Reabrir preço com Webmania, Migrate e ACBr                        |
| TecnoSpeed publicar documentação REST de CT-e no PlugNotas                                    | Reavaliar; a eliminação em 2.2 é de arquitetura, não de qualidade |
| Instabilidade recorrente visível em [status.focusnfe.com.br](https://status.focusnfe.com.br/) | Acionar o segundo provedor atrás da mesma interface               |
| Aquisição ou mudança de controle da Acras com sinal de descontinuidade                        | Vide Nuvem Fiscal. É precisamente por isso que existe a interface |

---

## 7. O que NÃO foi possível confirmar

Sem credenciais, e explicitamente não estimado:

- Qualquer comportamento em runtime: latência, taxa de erro, disponibilidade real.
- Se `POST /v2/empresas` é liberado para token comum.
- Payload e códigos de retorno exatos de CT-e OS 67 e CT-e Simplificado.
- Se a Focus expõe EPEC/contingência de CT-e.
- Base URLs de homologação de **Webmania, Migrate e ACBr API** — nenhuma publicada onde
  consultamos.
- Preço de **todos** os candidatos menos a Focus.
- Se a Webmania permite cadastro de empresa e certificado por API.
- Se existe rota REST pública de CT-e no ecossistema TecnoSpeed fora do componente.
- Limites de rate limit e tamanho de lote de qualquer fornecedor.
- Se os textos de rejeição que o fornecedor repassa são os da SEFAZ verbatim ou reescritos.
