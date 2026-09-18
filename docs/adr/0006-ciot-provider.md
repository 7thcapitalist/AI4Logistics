# ADR 0006 — Provedor da camada CIOT e vale-pedágio

- **Status:** **Proposta, pendente de spike com credenciais.** Nenhum CIOT real foi gerado.
- **Data:** 2026-09-16
- **Decisores:** engenharia AI4Logistics
- **Relacionados:** ADR 0003 (provedor fiscal), `docs/adr/custo-unitario-por-viagem.md`

---

## 1. Contexto

### 1.1 Por que este ADR é separado do 0003

**Nenhum provedor de API fiscal emite CIOT.** O CIOT é operação de **instituição de pagamento
autorizada pelo Banco Central** (IPEF), não de software house fiscal. A Focus NFe emite o MDF-e
com o grupo `infCIOT` preenchido, mas o número do CIOT tem que vir de outro lugar. O domínio já
reflete isso: `DocumentoTipo` inclui `'ciot'` e `'vale_pedagio'` ao lado de `'cte'` e `'mdfe'`, e
`Documento.temCiot` existe só para o MDF-e
(`packages/core/src/domain/tipos.ts`).

Consequência prática: **duas camadas, dois contratos, dois fornecedores, duas faturas.** A
interface `CiotProvider` é separada de `FiscalProvider` por essa razão, não por gosto de
arquitetura.

### 1.2 A regra que mudou o produto em 2026

A ANTT transformou o piso mínimo de frete em **bloqueio preventivo na geração do CIOT**.

> "se o valor do frete estiver abaixo do piso mínimo, o sistema bloqueia o registro, o CIOT não é
> gerado e a operação não existe"
> — [ANTT, notícia oficial](https://www.gov.br/antt/pt-br/assuntos/ultimas-noticias/frete-irregular-e-barrado-antes-de-existir-antt-transforma-ciot-em-filtro-obrigatorio-e-reforca-o-cumprimento-do-piso-minimo)

Base normativa apurada: **Portaria SUROC nº 6/2026**, publicada no DOU em 24/04/2026, com efeito
a partir de **24/05/2026**, apoiada na Resolução 6.078/2026 e na MP 1.343/2026.
🟡 _As referências normativas vêm da cobertura da própria ANTT e de fontes secundárias; os números
de portaria e as datas precisam ser conferidos no DOU antes de irem para a UI._

**Isto não é um erro de sistema. É um resultado de negócio esperado.** Um frete abaixo do piso é
uma coisa que acontece todo dia numa transportadora pequena, e a resposta correta do produto é
dizer quanto falta, não estourar uma exceção. É por isso que `PisoMinimoNaoAtingido` é um
resultado tipado em `CiotProvider`, e não uma `Error`.

A mensagem crua que efetivamente volta nessa situação, capturada em documentação pública de um
emissor:

> "O valor do frete informado é menor do que o valor mínimo de frete estabelecido."
> — [Bsoft, base de conhecimento](https://ajuda.bsoft.app/emissor/pt/articles/15261706-erro-ao-gerar-ciot-o-valor-do-frete-informado-e-menor-do-que-o-valor-minimo-de-frete-estabelecido)

🟡 Essa é a mensagem de **um** emissor. Não está confirmado que a Extratta devolva exatamente este
texto, nem que exista um código numérico associado — a documentação da Extratta expõe um array
`Faults` genérico com `Type`, `Code` e `Message`, e **não publica a tabela de códigos**.

### 1.3 O que o produto precisa da camada

Gerar CIOT, cancelar, dar baixa, comprar vale-pedágio, e consultar o piso mínimo **antes** de
tentar gerar — para que o usuário veja "faltam R$ 340 para o piso" na tela de conferência, e não
um erro no momento do envio.

---

## 2. Opções consideradas

### 2.1 Documentação pública de API — o filtro que quase todo mundo reprova

| Candidato                     | Doc pública de API?                                                                                                                                                                                                  | Protocolo              | URLs de ambiente                                                                                           | Veredito                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Extratta**                  | **SIM, aberta e completa** — [docs.extratta.com.br](https://docs.extratta.com.br/)                                                                                                                                   | **REST/JSON**          | **Homologação:** `http://apiho.extratta.com.br:50063/` · **Produção:** `https://api.extratta.com.br:2002/` | **Único candidato integrável hoje** |
| **Repom**                     | Parcial. Existe um endpoint SOAP exposto: [`integracao.asmx`](https://www.repom.com.br/repomintegracaows/integracao/integracao.asmx)                                                                                 | **SOAP/XML** (`.asmx`) | Só o de produção acima                                                                                     | Ver 2.2                             |
| **Roadcard / Pamcard**        | **NÃO.** A [página de geração de CIOT](https://roadcard.com.br/geracao-de-ciot/) não cita API, endpoint nem portal de desenvolvedor. Só o "Sistema Pamcard" e "integração de sistemas (...) com os sistemas da ANTT" | n/d                    | n/d                                                                                                        | Fora: exige parceria comercial      |
| **Target Tech / Target Bank** | **NÃO.** Só páginas de marketing de CIOT e PEF via Pix ([targetlog.tech](https://targetlog.tech/lp/ciot-o-que-e/))                                                                                                   | n/d                    | n/d                                                                                                        | Fora                                |
| **NDD (nddCargo)**            | **NÃO** encontrada. Integrações aparecem sempre via ERP/TMS de terceiro (ex. [Senior TMS](https://documentacao.senior.com.br/gestaodetransportestms/3.31/tms/ciot/tac-agregado-ndd.htm), TOTVS)                      | n/d                    | n/d                                                                                                        | Fora                                |
| **Sem Parar Empresas**        | **NÃO** para CIOT. O material público é sobre tag de vale-pedágio, não sobre API de CIOT ([blog](https://blog.sempararempresas.com.br/pedagio/integracao-vale-pedagio-com-tag-sem-parar-empresas-como-funciona/))    | n/d                    | n/d                                                                                                        | Fora                                |
| **nstech**                    | **NÃO** encontrada documentação pública de API de CIOT                                                                                                                                                               | n/d                    | n/d                                                                                                        | Fora                                |

Este quadro é o achado mais importante desta frente: **o mercado de CIOT não é um mercado de API
pública.** É um mercado de contratos de instituição de pagamento, onde a integração vem via ERP
homologado. A Extratta é a exceção, e isso por si só é a razão principal da recomendação.

### 2.2 Repom: SOAP exposto, mas sem CIOT nominal

O `.asmx` da Repom expõe 80+ operações SOAP. Operações de pagamento existem —
`AutorizaPagamento`, `AutorizaPagamentoContratos`, `AutorizaPagamentoPostos`,
`ContratoConfirmaPagamento`. Mas **nenhuma operação tem "CIOT" ou "vale-pedágio" no nome**, e não
há WSDL documentado publicamente que mapeie geração de CIOT.

Além disso: SOAP/XML, sem ambiente de homologação público, sem tabela de erros, sem preço. Para um
SaaS pré-receita, integrar SOAP não documentado contra um endpoint de produção é risco alto e
aprendizado lento. **Fora da decisão inicial, mas relevante em 2.4.**

### 2.3 Extratta em detalhe

| Critério                               | Achado                                                                                                                                                            | Fonte                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Escopo                                 | "Emissão de CIOT", pagamento eletrônico de frete, vale-pedágio (VPO) e despesas de viagem via cartão Extratta                                                     | [docs](https://docs.extratta.com.br/)                      |
| **CIOT + PEF + VP no mesmo contrato?** | **SIM, e no mesmo endpoint.** `Viagem/Integrar` "Realiza a integração de uma viagem para geração de CIOT, Pagamento Eletrônico de Frete e/ou Vale Pedágio"        | [Viagem V1](https://docs.extratta.com.br/Integrar_Viagem/) |
| Gerar                                  | `POST Viagem/Integrar` (V1) · `POST ViagemV2/Integrar` (V2)                                                                                                       | [V1](https://docs.extratta.com.br/Integrar_Viagem/)        |
| Resposta CIOT                          | Objeto `CIOT` com `Ciot`, `Verificador`, `Senha`, `Resultado` (0=Success, 1=Error, 2=NotRequired, 3=NotEnabled)                                                   | [V1](https://docs.extratta.com.br/Integrar_Viagem/)        |
| **Cancelar**                           | `POST Viagem/CancelarViagem`, campos `CNPJAplicacao`, `Token`, `DocumentoUsuarioAudit`, `NomeUsuarioAudit`, `CodigoViagem`, `MotivoCancelamento`                  | [Cancelar](https://docs.extratta.com.br/Cancelar_Viagem/)  |
| **Baixa**                              | Existe como operação distinta ("Baixa de Viagem"), documentada em seção própria. **URL exata não confirmada** — o caminho testado (`/Baixa_Viagem/`) devolveu 404 | [docs](https://docs.extratta.com.br/)                      |
| Vale-pedágio                           | Objeto `Pedagio` no request, com identificação de fornecedor; há endpoints de cálculo de custo de pedágio                                                         | [V2](https://docs.extratta.com.br/Integrar_Viagem_V2/)     |
| Dados ANTT                             | `DadosANTT` / `DadosAntt`: `TipoOperacao`, `TipoCarga`, latitude/longitude, códigos IBGE, CEP                                                                     | [V2](https://docs.extratta.com.br/Integrar_Viagem_V2/)     |
| **Consultar piso mínimo**              | **NÃO EXISTE endpoint dedicado.** Há "Tarifa ANTT" como tipo de evento 4 e validação de coordenadas, mas nenhuma rota de "simular piso"                           | [V2](https://docs.extratta.com.br/Integrar_Viagem_V2/)     |
| **Erro de piso mínimo**                | **NÃO DOCUMENTADO.** Array `Faults[]` com `Type`, `Code`, `Message`. **A tabela de códigos não é pública.**                                                       | [V1](https://docs.extratta.com.br/Integrar_Viagem/)        |
| Autenticação                           | `Token` + `CNPJAplicacao` + `CNPJEmpresa` no corpo                                                                                                                | [V1](https://docs.extratta.com.br/Integrar_Viagem/)        |
| Webhooks                               | **Não encontrados** na documentação                                                                                                                               | —                                                          |
| **Preço**                              | **NÃO PÚBLICO**                                                                                                                                                   | —                                                          |

Dois problemas sérios, ditos sem enfeite:

- **Homologação é `http://`, não `https://`, em porta alta (50063).** Produção é HTTPS em 2002.
  Porta não-padrão em produção já é atrito com egress corporativo; homologação sem TLS é um cheiro
  de engenharia legada. Não é bloqueante para homologação, mas entra na matriz de risco.
- **Sem tabela de erros pública, não dá para mapear `PisoMinimoNaoAtingido` com confiança.** É o
  item 1 do spike.

### 2.4 "Operar a instituição que o cliente já usa"

A realidade comercial: a transportadora que vamos vender **provavelmente já tem conta na Repom ou
na Roadcard/Pamcard**, com cartão na mão do motorista e um gerente de conta. Pedir para ela abrir
conta numa quarta instituição para usar o nosso software é atrito de venda real, não teórico.

O que foi possível apurar:

- **Nenhum candidato oferece um "CIOT multi-instituição" documentado publicamente.** Não achamos
  nenhum fornecedor que diga "gere o CIOT na IPEF que o seu cliente já tem".
- A [ANTT prevê emissão via integração direta com os sistemas da ANTT](https://roadcard.com.br/geracao-de-ciot/),
  o que em tese permitiria um caminho independente de IPEF. **Não investigado a fundo e não
  assumido como viável.** Se for, muda a arquitetura desta camada inteira — está no spike.
- O programa **"CIOT para Todos"** da ANTT ([gov.br](https://www.gov.br/antt/pt-br/assuntos/cargas/ciot-para-todos-1))
  aponta para uma via de emissão de baixo custo. **Não avaliado.** Entra no spike.

**Conclusão honesta: adotar a Extratta significa pedir ao cliente uma conta na Extratta.** Isso é
um custo de venda que a decisão assume conscientemente, e é o principal motivo pelo qual esta
decisão é mais frágil que a do ADR 0003. A mitigação é arquitetural: `CiotProvider` é uma interface
com implementação selecionável **por organização**, não global. Se a Repom virar necessária para
fechar contas grandes, escrevemos um `RepomCiotProvider` SOAP atrás da mesma interface e roteamos
por `orgId`.

---

## 3. Decisão

**Adotamos a Extratta como provedor inicial de CIOT e vale-pedágio**, atrás de `CiotProvider`
(`packages/fiscal/src/ciot/provider.ts`), em caráter de **proposta pendente de spike com
credenciais**.

Razões:

1. **É o único candidato com documentação pública de API REST e URLs de homologação e produção
   publicadas.** Podemos começar a integrar sem assinar nada. Nenhum outro permite isso.
2. **Cobre CIOT, pagamento eletrônico de frete e vale-pedágio na mesma operação** (`Viagem/Integrar`),
   evitando um terceiro contrato para pedágio.
3. **Tem cancelamento e baixa como operações distintas**, que é a forma do nosso ciclo de vida.
4. REST/JSON, alinhado ao resto da stack.

**Decisão explícita de arquitetura:** `CiotProvider` é resolvido **por organização**, não por
processo. É o que torna "operar a instituição que o cliente já usa" um trabalho de adapter em vez
de uma reescrita.

**Decisão explícita de produto:** piso mínimo é **pré-checagem**, não tratamento de exceção.
`consultarPisoMinimo()` existe na interface mesmo sem endpoint correspondente na Extratta, e a
primeira implementação vai ser **nossa**, a partir das tabelas da ANTT. Isso é dívida assumida:
tabela de piso é regra fiscal, e por `Fonte` no domínio ela vai para a UI marcada
`confianca: 'verificar'` até ser conferida contra a fonte oficial.

---

## 4. Consequências

### 4.1 Boas

- Integração pode começar contra homologação sem contrato assinado.
- Um fornecedor a menos: pedágio vem junto.
- Erro de piso mínimo vira um resultado de domínio que o produto trata com elegância — "faltam
  R$ X" — em vez de um 500 na cara do usuário.

### 4.2 Ruins e mitigações

- **Cliente precisa abrir conta na Extratta.** Sem mitigação técnica. É custo de venda. Mitigação
  estrutural: provider por `orgId`, para que Repom/Pamcard sejam adicionáveis.
- **Sem tabela de erros pública, o mapeamento de `PisoMinimoNaoAtingido` é palpite até o spike.**
  Mitigação: `CiotErro` carrega sempre `codigoBruto` e `mensagemBruta` do fornecedor, e o
  `FakeCiotProvider` usa a mensagem capturada em 1.2 como aproximação **marcada como tal**.
- **`consultarPisoMinimo()` não tem contraparte na Extratta.** Mitigação: implementação própria
  sobre tabelas da ANTT, marcada `confianca: 'verificar'`. Um piso calculado errado vira ou venda
  perdida ou autuação — é a dívida mais perigosa deste ADR.
- **Homologação sem TLS e produção em porta alta.** Mitigação: segredos só em produção HTTPS,
  homologação nunca com dados reais, e teste de egress cedo no spike.
- **Preço desconhecido.** `custo-unitario-por-viagem.md` usa referência de mercado, declarada como
  suposição.
- **Concentração de risco:** se a Extratta perder a autorização de IPEF, a camada para. Mitigação:
  a interface, e monitorar a lista de IPEFs autorizadas.

---

## 5. O que o spike precisa medir (quando houver credenciais)

1. **Gerar um CIOT abaixo do piso mínimo de propósito e capturar o `Faults[]` literal** — `Type`,
   `Code`, `Message` exatos. É o que permite mapear `PisoMinimoNaoAtingido` de verdade, e é o
   texto que vai aparecer na tela do cliente. **Item mais importante.**
2. **Pedir a tabela completa de `Faults`** ao suporte da Extratta. Se não existir, é um sinal
   negativo forte sobre a maturidade da API.
3. **A Extratta devolve o valor do piso** junto com a recusa, ou só diz "está abaixo"? Se devolver,
   `consultarPisoMinimo()` pode ser implementado por sonda e **não precisamos manter tabela da
   ANTT** — o que elimina a dívida mais perigosa de 4.2.
4. **Localizar a rota real de baixa de viagem** (a URL testada deu 404) e medir baixa parcial.
5. **Ciclo completo em homologação:** gerar → comprar vale-pedágio → baixa → cancelar. Medir
   latência e confirmar se é síncrono.
6. **Testar egress** para `apiho.extratta.com.br:50063` e `api.extratta.com.br:2002` do nosso
   ambiente de contêiner.
7. **Preço:** custo por CIOT, por vale-pedágio, mensalidade, mínimo mensal, e se há modelo de
   parceria/white-label que evite o cliente abrir conta próprio.
8. **Idempotência:** reenviar `Viagem/Integrar` com o mesmo número de controle. Gera CIOT
   duplicado? CIOT duplicado é problema regulatório, não linha duplicada.
9. **Perguntar diretamente se existe modo "instituição do cliente"**, e o que acontece se a
   transportadora já tem Repom.
10. **Investigar as vias da ANTT** — integração direta e "CIOT para Todos" — como alternativa
    independente de IPEF.
11. **Confirmar no DOU** a Portaria SUROC nº 6/2026 e as datas de 1.2 antes de qualquer texto
    normativo ir para a UI.

---

## 6. O que nos faria reverter

| Gatilho                                                    | Para onde vamos                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A Extratta não devolve erro distinguível para piso mínimo  | Reabrir a frente; sem isso o produto não trata o caso com elegância           |
| Exigência de conta Extratta derruba mais de ~40% dos deals | Adapter Repom (SOAP) ou Pamcard atrás da mesma interface                      |
| Preço por CIOT acima de ~R$ 5                              | Reabrir com Repom, NDD e as vias da ANTT                                      |
| Integração direta com a ANTT se mostrar viável             | Reduz a camada IPEF a pagamento, e o CIOT passa a ser nosso                   |
| Repom, Pamcard ou NDD publicarem API REST documentada      | Reavaliar; a eliminação delas foi por falta de doc pública, não por qualidade |
| Instabilidade ou incidente de segurança na Extratta        | Acionar o segundo provedor                                                    |
| Mudança regulatória da ANTT no papel da IPEF               | Reabrir o ADR inteiro                                                         |

---

## 7. O que NÃO foi possível confirmar

- **Qualquer preço**, de qualquer candidato da camada CIOT. Nenhum é público.
- **A tabela de códigos de `Faults` da Extratta**, incluindo o código de piso mínimo.
- Se a Extratta devolve o **valor** do piso mínimo junto com a recusa.
- A **URL exata da baixa de viagem** na Extratta.
- Se a Extratta tem **webhooks**.
- Se a Extratta é **idempotente** em `Viagem/Integrar`.
- Se **Repom, Roadcard/Pamcard, Target, NDD, Sem Parar ou nstech** têm API REST sob NDA — a
  ausência aqui é ausência de documentação **pública**, não prova de inexistência.
- Se o `.asmx` da Repom cobre CIOT sob outro nome de operação.
- Se algum fornecedor permite emitir CIOT **na instituição do cliente**.
- Viabilidade real da integração direta com a ANTT e do "CIOT para Todos".
- Os números de Portaria/Resolução de 1.2, que vieram de fontes secundárias.
