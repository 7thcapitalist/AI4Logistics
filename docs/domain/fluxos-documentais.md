# Fluxos documentais do TRC: mapa operacional

**Status:** v1, 16/09/2026
**Regra de uso:** este documento segue a convenção do `docs/domain/`, **linha sem fonte é pista, não regra.** Cada afirmação carrega um selo:

| Selo | Significado                                                                             |
| ---- | --------------------------------------------------------------------------------------- |
| 🟢   | Confirmado em fonte oficial (CONFAZ, SEFAZ, Portal Nacional CT-e/MDF-e, ANTT, Planalto) |
| 🟡   | Só em fornecedor / entidade de classe / consultoria. **Verificar antes de codar.**      |
| 🔴   | Divergência entre fontes, ou não confirmado                                             |

---

## 0. Os três achados que mudam o plano

Antes do mapa, o que a pesquisa derrubou do PRD e do engineering setup plan.

### 0.1 O alerta de MDF-e estava construído sobre uma regra que não existe

O PRD define como P0: _"alerta antes de um MDF-e precisar ser fechado"_, com threshold de 24h. O engineering setup plan já marcava esse prazo como **não verificado**. A pesquisa fecha a questão:

> 🟢 **Não existe prazo regulamentar em horas ou dias para encerrar o MDF-e.** (Conclusão 🟢, triangulada em MOC 2.2, Portaria CAT 102/2013 art. 13 e FAQ do Portal Nacional. A _literalidade_ da cláusula 14ª veio de espelho, e está na seção 8 item 3.)
> O Ajuste SINIEF 21/2010, cláusula décima quarta (redação do Ajuste SINIEF 17/2020), vincula o encerramento a **eventos**, fim do percurso, transbordo, redespacho, subcontratação, troca de veículo/contêiner, retenção parcial da carga, inclusão de mercadoria para a mesma UF, e **não a um relógio**. O MOC oficial (seção 2.2) e a Portaria CAT 102/2013 art. 13 confirmam por caminhos independentes. Nenhuma UF verificada (SP, PR, SC, MA) fixa prazo em horas.

Isso não enfraquece a feature. **Fortalece**, porque troca um threshold arbitrário por duas consequências reais e cronometráveis:

| Consequência                                                                                                                         | Quando                                                                                                       | Fonte                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Bloqueio imediato de nova emissão** para o **mesmo par (UF carregamento × UF descarregamento) + mesmo veículo** em datas distintas | No instante em que o MDF-e fica aberto                                                                       | 🟢 MOC seção 2.2 + FAQ Portal Nacional                                                                     |
| **Rejeição 686, bloqueio total do CNPJ** para emitir qualquer MDF-e                                                                  | **30 dias** após a autorização do MDF-e mais antigo não encerrado                                            | 🟡 SEFAZ-MS, NT 01/2015. **Fonte estadual única: abrangência nacional NÃO confirmada.** Ver seção 8 item 4 |
| Encerramento de ofício pelo fisco                                                                                                    | MG: automático para MDF-e rodoviário com +60 dias, rodado 1×/dia. Não regulariza a infração, só limpa a base | 🟢 Ajuste SINIEF 4/2018 + SEFAZ-MG                                                                         |

> **Reescrita da feature:** o produto não alerta "faltam X horas para o prazo". Ele alerta **"esse caminhão não consegue emitir MDF-e para essa rota até você encerrar o anterior"** e **"faltam N dias para o CNPJ inteiro travar"**. A primeira frase é operacional e imediata; a segunda é o incêndio. Ambas são verdadeiras e ancoradas em regra confirmada.

E o gargalo estrutural, que é a tese de produto em uma linha: **o gatilho do encerramento (fim da descarga) está com o motorista na estrada; o ato do encerramento está com o escritório.** Essa lacuna de informação é o que quebra. É exatamente o que um app de motorista + evento automático resolve.

### 0.2 CIOT vira obrigatório no MDF-e em 23/11/2026: daqui a ~10 semanas

Não é um "regulatory hook de GTM" abstrato. É uma data em que caminhão para de sair.

| Data           | O que acontece                                                                                                                                                                                                                                                                   | Fonte                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 24/05/2026     | 🟢 **"CIOT para Todos"** entra em vigor. Res. ANTT 6.078/2026: _"Toda operação de transporte rodoviário de cargas deverá ser registrada por meio do CIOT"_. Acaba a regra antiga de "só quando contrata TAC", **frota própria prestando serviço remunerado também emite**        | 🟢 ANTTlegis                                |
| 01/06/2026     | 🔴 Ajuste SINIEF 3/2026 torna o CIOT obrigatório no MDF-e no plano tributário. Duas de três fontes e a fórmula padrão do CONFAZ apontam 01/06/2026; uma aponta 01/05/2026. **Verificar no Despacho CONFAZ 15/2026, DOU 02/04/2026**                                              | 🔴                                          |
| 05/08/2026     | 🟢 **Lei nº 15.485/2026** converte a MP 1.343/2026 (com veto parcial). Art. 7º, § 7º: multa de **R$ 10.500** por descumprimento. Prazo para derrubada de vetos aberto até 04/10/2026. **Atenção:** de 24/05 a 04/08/2026 a base é a MP 1.343/2026, não a Lei; a Lei não retroage | 🟢 Planalto                                 |
| **21/09/2026** | 🟡 NT MDF-e 2026.001: validação do CIOT em **homologação**, daqui a 5 dias                                                                                                                                                                                                       | 🟡 TecnoSpeed                               |
| **23/11/2026** | 🟡 Validação em **produção**. `infCIOT` obrigatório para `tpEmit=1` (prestador de serviço), `tpEmit=3` (CT-e globalizado) e `tpEmit=2` com `tpTransp`. **Rejeição 684, "CIOT deverá ser informado"**                                                                             | 🟡 TecnoSpeed, **verificar no portal SVRS** |

Três consequências diretas para o build:

1. **CIOT não pode ser fase 2.** A partir de 23/11 um MDF-e de prestador de serviço sem CIOT é rejeitado pela SEFAZ. Um produto que emite MDF-e e não emite CIOT não funciona.
2. **São dois fornecedores, não um.** Nenhum provedor de API fiscal (Focus NFe, TecnoSpeed, Migrate, Webmania) emite CIOT ou vale-pedágio. CIOT/VPO são serviços de **IPEF**, instituição de pagamento autorizada pelo Bacen. A ADR 0003 precisa virar **duas** ADRs: `FiscalProvider` e `CiotProvider`.
3. **Existe uma janela de venda de ~10 semanas** em que a dor é datada, pública e assustadora. Uma transportadora que não tiver CIOT funcionando em novembro para. Isso é o melhor gancho de outreach que a tese já teve, e ele expira.

> ⚠️ Ambiguidade a resolver antes de vender isso: a ANTT lista **carga própria** como exceção; a SETCERGS afirma que vale _"inclusive frota própria"_. São coisas diferentes, carga própria (mercadoria sua) está fora; frota própria prestando serviço remunerado a terceiros está dentro (`tpEmit=1`). Confirmar com a ANTT antes de usar em material de venda.

### 0.3 A ADR 0003 tem um finalista óbvio, e um fornecedor do PRD morreu

- **Nuvem Fiscal está em desativação** (comunicado de 22/04/2026, guia oficial de migração para ACBr API, org no GitHub esvaziada). Não usar.
- **Focus NFe** é o único com **preço público e por documento** (Solo R$ 89,90/mês, 100 docs, R$ 0,10 excedente; Growth R$ 548/mês, CNPJs ilimitados, 4.000 docs), cobre CT-e 57 + CT-e OS 67 + CT-e Simplificado + MDF-e com os eventos que importam (**encerramento**, CC-e, inclusão de DF-e), REST/JSON assíncrono com **webhooks**, homologação separada, e, o ponto decisivo para SaaS, **API de revendas que cadastra CNPJ e vincula certificado A1 programaticamente**. Sem isso, onboarding de transportadora vira alguém do time manipulando `.pfx` à mão.
- **TecnoSpeed** é o incumbente, mas preço não é público, o Reclame Aqui mostra tempo médio de resposta de **9 dias e 17h** com queixas de cobrança pós-cancelamento, e há ambiguidade se CT-e está na API REST (PlugNotas) ou só no componente DLL (PlugDFe).
- **Extratta** é a única IPEF-adjacente com documentação REST/JSON pública cobrindo **CIOT + PEF + VPO**, com URLs de homologação e produção explícitas. Segunda opção: **Target Tech**.
- Realidade comercial: suas transportadoras provavelmente já têm conta em **Repom** ou **Roadcard/Pamcard**. O `CiotProvider` precisa suportar "a IPEF que o cliente já usa", isso é objeção de venda, não escolha técnica sua.

---

## 1. O fluxo, de ponta a ponta

```
                    ┌─ embarcador emite NF-e ─┐
                    │  (🟢 Ajuste SINIEF 17/16:│
                    │  deve enviar o XML antes │
                    │  do início da prestação) │
                    └────────────┬─────────────┘
                                 │  ← na prática chega DANFE em PDF.
                                 │    digitação manual de chave de 44 dígitos.
                                 ▼
    ┌────────────────────────────────────────────────────┐
    │  CT-e (mod. 57): um por prestação/tomador          │
    │  assina → transmite SEFAZ → autoriza → DACTE       │
    └────────────────────────┬───────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌─────────────┐     ┌──────────────┐
   │   CIOT    │      │ vale-pedágio│     │ averbação do │
   │  (IPEF)   │      │  (TAG/FVPO) │     │    seguro    │
   └─────┬─────┘      └──────┬──────┘     └──────┬───────┘
         └────────────┬──────┴───────────────────┘
                      ▼
    ┌────────────────────────────────────────────────────┐
    │  MDF-e (mod. 58): UM POR UF DE DESCARREGAMENTO     │
    │  agrega chaves de CT-e + veículo + condutor        │
    │  + seguro + CIOT + vale-pedágio + NCM predominante │
    └────────────────────────┬───────────────────────────┘
                             ▼
                      DAMDFE vai com o motorista
                             ▼
              ┌──── viagem ────┬──── eventos em rota ────┐
              │                │ 110113 inclusão de DF-e │
              │                │ 110114 troca de condutor│
              ▼                └─────────────────────────┘
       entrega → evento 110180 (comprovante de entrega)
                  ou 110190 (insucesso)
                             ▼
       ╔═════════════════════════════════════════════════╗
       ║  ENCERRAMENTO DO MDF-e: evento 110112           ║
       ║  ⚠️ ONDE TUDO QUEBRA                            ║
       ╚═════════════════════════════════════════════════╝
                             ▼
                    acerto com o motorista
```

**A leitura que importa:** entregue ≠ encerrado. São dois eventos, em dois lugares, com duas pessoas diferentes. O produto vive nessa lacuna.

---

## 2. CT-e (modelo 57)

### 2.1 Pré-requisitos

| #   | Item                                              | Fonte                                             |
| --- | ------------------------------------------------- | ------------------------------------------------- |
| 1   | Credenciamento prévio na SEFAZ da UF de inscrição | 🟢 Ajuste SINIEF 9/07, cl. 4ª                     |
| 2   | Certificado digital ICP-Brasil (e-CNPJ A1 ou A3)  | 🟢 cl. 5ª                                         |
| 3   | RNTRC ativo na ANTT                               | 🟢 Lei 11.442/2007 + Res. ANTT 5.982/2022         |
| 4   | XML da NF-e do embarcador                         | 🟢 Ajuste SINIEF 17/16 (🟡 quanto à literalidade) |

### 2.2 Layout e serviços

- 🟢 **Versão vigente em 2026: 4.00** (MOC 4.0, fev/2023, Ato COTEPE ICMS 123/2022). Obrigatória desde 01/02/2024. **Não houve troca de versão maior em 2026**, as mudanças vêm por Nota Técnica sobre a 4.00.
- 🟢 Web services 4.00: `CTeRecepcaoSincV4`, `CTeRecepcaoSimpV4`, `CTeRecepcaoOSV4`, `CteRecepcaoEventoV4`, `CteConsultaV4`, `CteStatusServicoV4`, `CTeDistribuicaoDFe`.
- 🟢 Autorizadores: próprios (MT, MS, MG, PR, RS, SP), SVRS (18 UF incluindo **GO**), SVSP (AP, PE, RR). Contingência: SVC-RS, SVC-SP.
- 🟢 O CT-e autorizado é replicado para o Ambiente Nacional e para as SEFAZ de **início e término** da prestação. Erro de UF/CFOP é pego nas duas pontas.

### 2.3 Campos que geram erro em transportadora pequena

| Campo                         | Regra                                                                                                                                              | Rejeição típica              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `toma` (tomador)              | 🟢 Define quem paga. **Não corrigível por CC-e** (ver 2.6)                                                                                         | n/a, mas trava toda correção |
| `CFOP`                        | 🟢 G050: intraestadual inicia com 5, **interestadual com 6**. G051/G052: quando **UF do emitente ≠ UF de início da prestação**, usar **5932/6932** | 524                          |
| `infNFe/chave`                | Chave de 44 dígitos da NF-e                                                                                                                        | 🟡 539, 626                  |
| `emit/CRT`                    | 🟡 Obrigatório desde a v4.00                                                                                                                       | 🟡 n/a                       |
| `infModal/rodo/RNTRC`         | RNTRC da transportadora                                                                                                                            | n/a                          |
| `imp/ICMS`                    | 🟢 G047: ICMS = base × alíquota                                                                                                                    | 675                          |
| `imp/IBSCBS`                  | **Novo, Reforma Tributária**, ver 2.6                                                                                                              | 310                          |
| indicador de CT-e Globalizado | Carga fracionada com múltiplos emitentes de NF-e                                                                                                   | 🟡 729                       |

### 2.4 Ciclo de vida

| Estado                                    | Nota                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autorizado**                            | 🟢 Depois da Autorização de Uso o XML **não pode mais ser alterado** (cl. 8ª)                                                                                          |
| **Rejeitado**                             | 🟡 Não consome numeração. Corrige e reenvia com o mesmo número                                                                                                         |
| **Denegado** (301 emitente / 302 tomador) | 🟡 Numeração **queima permanentemente**. Não cancela, não inutiliza, não corrige. A 302 depende da regularidade fiscal do **cliente**, fora do seu controle            |
| **Cancelado**                             | 🟢 Evento 110111                                                                                                                                                       |
| **Inutilizado**                           | 🟡 Até o 10º dia do mês subsequente (FAQ Portal Nacional, sem cláusula citada). 🟡 Possivelmente desativado pelo Ajuste SINIEF 31/22 (cStat 998), **verificar por UF** |

### 2.5 Prazo de cancelamento: ⚠️ NÃO É UNIFORME

| Jurisdição     | Prazo                                                                                                | Fonte                       |
| -------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| Regra nacional | **168 horas (7 dias)** da emissão                                                                    | 🟢 FAQ Portal Nacional CT-e |
| SC             | 168h, art. 47 do Anexo 11 do RICMS/SC                                                                | 🟢 Decreto SC 942/2025      |
| **SP**         | **31 dias** da emissão (Portaria CAT 55/09, art. 21 § 2º); após deferimento, 15 dias para transmitir | 🟢 SEFAZ-SP                 |

Condições cumulativas 🟢: só cancela CT-e autorizado, **desde que o fato gerador não tenha ocorrido** (na prática: antes do caminhão sair), e **não pode** se já houver CC-e emitida.

**Três travas que fecham a porta do cancelamento:**

- 🟢 CT-e vinculado a MDF-e **autorizado ou encerrado** não cancela (SEFAZ-SP)
- 🟡 Rejeição **862**, comprovante de entrega registrado veda o cancelamento
- 🟡 Rejeição **863**, NF-e já tem comprovante de entrega para este CT-e

> **Implicação de produto:** o prazo de cancelamento é **parâmetro por UF**, nunca constante. E a ordem das operações importa: emitiu MDF-e ou registrou entrega, perdeu a chance de cancelar. O sistema precisa avisar _antes_.

### 2.6 Correção: o caminho é mais longo do que parece

🟢 A CC-e (evento 110110) **não pode** corrigir: valores que determinam o imposto (base, alíquota, preço, quantidade, valor da prestação), **dados cadastrais que mudem emitente, tomador, remetente ou destinatário**, e data de emissão ou saída.

Portanto, tomador errado ou valor errado seguem este caminho:

```
1. Transportadora erra.
2. 🟡 O TOMADOR registra o evento 610110 "Prestação de Serviço em Desacordo"
   (prazo alegado: 45 dias da autorização, verificar no Anexo I do MOC)
3. Só então a transportadora emite o CT-e de Substituição,
   dentro de 60 dias da autorização do original
   (🟡 confirmado pela existência da rejeição 563)
```

> 🔴 **Dependência externa crítica:** a transportadora **não corrige sozinha**. Ela depende de um ato do cliente. Isso é dor real, é invisível hoje, e é uma feature óbvia (acompanhar o desacordo, cobrar o tomador, contar o relógio dos 60 dias).

🟢 **O CT-e de Anulação acabou** (Ajuste SINIEF 31/22, efeitos 🟡 26/06/2023). A nova sistemática de substituição **só existe na 4.00** (rejeições 990/991).

### 2.7 Eventos

> ⚠️ **O mesmo código significa eventos diferentes em CT-e e em MDF-e.** `110113` é EPEC no CT-e e Inclusão de DF-e no MDF-e. Qualquer dicionário de código para nome precisa ser indexado por modelo (57 ou 58), nunca só pelo código.

| Código     | Evento                                | Autor       |
| ---------- | ------------------------------------- | ----------- |
| 110110     | Carta de Correção                     | Emitente    |
| 110111     | Cancelamento                          | Emitente    |
| 110113     | EPEC (contingência)                   | Emitente    |
| **110180** | **Comprovante de Entrega**            | Emitente    |
| 110181     | Cancelamento do Comprovante           | Emitente    |
| **110190** | **Insucesso de Entrega** (só v4.00)   | Emitente    |
| 110191     | Cancelamento do Insucesso             | Emitente    |
| **610110** | **Prestação de Serviço em Desacordo** | **Tomador** |
| 240140     | CT-e de Substituição                  | Fisco       |
| 310620     | Registro de Passagem                  | Fisco       |

**Comprovante de Entrega Eletrônico (110180)** 🟢 NT 2019.001, produção desde ago/2019. Substitui o canhoto de papel. Campos: data/hora da entrega, **lat/long (opcional)**, documento e nome do recebedor, **hash SHA-1 em Base64 da concatenação chave de acesso + imagem capturada**, chaves de NF-e relacionadas.

> 🔴 **Não encontrei norma nacional que torne o 110180 obrigatório.** A obrigatoriedade na prática vem de exigência contratual de embarcador. Não afirmar obrigatoriedade em material de venda.

**Insucesso de Entrega (110190)** 🟢 NT 2023.002, produção jul/2023. Campos: data/hora da tentativa, **número da tentativa**, tipo de motivo (recebedor não encontrado / recusa / endereço inexistente / outros), justificativa, lat/long, hash da imagem.

> Esses dois eventos são o POD do PRD, já especificados pela norma, com hash de imagem e geolocalização. **O PRD descrevia como "foto + timestamp + GPS" uma coisa que já tem formato fiscal definido.** Construir contra o evento, não contra uma ideia de POD.

### 2.8 Contingência

🟢 Três modalidades, **sem hierarquia entre elas** (SEFAZ-GO: _"o emissor pode adotar qualquer uma ou não as adotar"_):

| Modalidade                | Quando                                                                                  | Modelos |
| ------------------------- | --------------------------------------------------------------------------------------- | ------- |
| **FS-DA**                 | Impressão em formulário de segurança                                                    | 57 e 67 |
| **SVC** (SVC-RS / SVC-SP) | SEFAZ autorizadora fora. DACTE em papel comum. Depende de ativação pela SEFAZ de origem | 57 e 67 |
| **EPEC** (evento 110113)  | Falha **no sistema do emitente ou na internet**. Layout mínimo à SVC                    | só 57   |

🟢 Vedada a reutilização, em contingência, de número já transmitido como Normal. Pós-contingência: cancelar duplicados, inutilizar não autorizados.

🔴 O "prazo limite de transmissão" pós-contingência **não está quantificado em fonte nacional**, remete à legislação estadual. **Não hardcodar 168h aqui** (esse número é do MDF-e, ver 3.6).

### 2.9 Reforma Tributária no CT-e

🟢 **NT CT-e 2025.001 RTC**, versão corrente 1.14b (30/04/2026). Novo grupo `imp/IBSCBS` com `CST`, `cClassTrib`, `gIBSUF`, `gIBSMun`, `gCBS`, `gTribRegular`, créditos presumidos, compras governamentais.

| Marco                             | Data           |
| --------------------------------- | -------------- |
| Produção (v1.05)                  | 06/10/2025     |
| **Validações ativas em produção** | **05/01/2026** |
| v1.14b produção                   | 04/05/2026     |

🟡 **Alíquotas de transição:** 2026, IBS Estadual **0,1%**, IBS Municipal **0%**, CBS **0,9%**. 2027-2028, IBS 0,05% cada. Números vindos da NT, **sem o dispositivo legal citado**: confirmar na LC/EC da Reforma antes de usar em cálculo.

> 🟢🔑 **Dispensa: Simples Nacional (CRT=1) e MEI (CRT=4) estão fora da obrigação de preencher IBS/CBS.**
> Boa parte do ICP (5–50 caminhões) é Simples Nacional. **Não vender pânico de Reforma Tributária para quem está dispensado**, isso queima credibilidade na primeira conversa com o contador do cliente. O produto precisa ramificar por `CRT`, e o discurso comercial também.

🟢 **NT 2026.002** (04/08/2026): cria o **cStat 310, rejeita CT-e sem o grupo `imp/IBSCBS` para contribuintes do Regime Normal**. Homologação das demais regras 03/08/2026, produção **31/08/2026**.

> 🔴 Inconsistência: a data de publicação (04/08) é posterior ao início da homologação (03/08). Uma das duas está errada. Conferir no PDF oficial.

🟢 **MDF-e não foi tocado pela Reforma Tributária**, ele não tem campos de tributo. O esforço de RTC está no CT-e; o esforço de 2026 no MDF-e é CIOT. Duas frentes, dois calendários, não misturar.

### 2.10 CT-e Simplificado

🟢 `tpCTe = 5` (substituição = 6), base Ajuste SINIEF 46/2023, NT 2024.002. Um único CT-e para várias prestações com **múltiplos remetentes ou destinatários e um único tomador**.

🟡 Condições alegadas: tomador único, tratamento tributário uniforme, mínimo 2 NF-e, múltiplos remetentes **ou** múltiplos destinatários (não misturado), **mesma UF de origem e destino**, credenciamento prévio.

> 🔴 Se a restrição de "mesma UF de origem e destino" for real, o Simplificado **não serve** para o caso interestadual, que é o foco. **Confirmar no texto da NT antes de desenhar produto em cima disso.**

🟡 **Ajuste SINIEF 04/2026** (operacional 01/06/2026): no CT-e Simplificado, valor informado a menor se corrige **exclusivamente por CT-e de substituição**, complementar proibido, e dispensa o evento de desacordo.

### 2.11 Guarda do XML

🟡 **Ajuste SINIEF 2/2025**: prazo passou de 5 anos para **132 meses (11 anos)**, desde 01/05/2025, para NF-e, NFC-e, CT-e, CT-e OS, MDF-e, BP-e. Três fontes secundárias convergentes; texto oficial no CONFAZ inacessível a robôs. **Verificar**, isso muda a política de retenção do blob storage (o setup plan diz 5 anos).

---

## 3. MDF-e (modelo 58)

### 3.1 Quando é obrigatório

🟢 Base: Ajuste SINIEF 21/2010. A formulação operacional mais clara está na Portaria CAT 102/2013, art. 2º (SEFAZ-SP), que reproduz o piso nacional.

**Transportadora prestando serviço a terceiros (emite CT-e):**

| Situação                             | Obrigatório?                     |
| ------------------------------------ | -------------------------------- |
| Carga **fracionada**, interestadual  | 🟢 Sim                           |
| Carga **fracionada**, intermunicipal | 🟢 Sim                           |
| Carga **lotação**, interestadual     | 🟢 Sim                           |
| Carga **lotação**, intermunicipal    | 🟢 Não previsto no piso nacional |

**Ampliações estaduais, e isso importa muito para vocês:**

| UF     | Regra                                                                                                                                  | Fonte       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **MG** | Obrigatório em operações **intermunicipais desde 01/07/2015** (art. 87-H, Anexo V, RICMS/MG)                                           | 🟢 SEFAZ-MG |
| **GO** | Obrigatório em operações **internas, inclusive intermunicipais e intramunicipais** (art. 248-A e 248-B do RCTE-GO; Decreto 9.095/2017) | 🟢 SEFAZ-GO |

> 🔑 **Goiás é a base de operação de vocês e tem a regra mais ampla do país.** Uma transportadora goiana precisa de MDF-e em viagem intramunicipal. Isso significa (a) mais volume de documento por cliente do que o piso nacional sugere, (b) mais superfície de erro, (c) o produto precisa de uma **tabela de obrigatoriedade por UF**, não de uma constante.

🟢 **Um MDF-e por UF de descarregamento** (cl. 3ª § 2º): _"deverão ser emitidos tantos MDF-e distintos quantas forem as unidades federadas de descarregamento"_.

🟢 **Quem emite quando há vários envolvidos** (cl. 3ª § 6º): _"o transportador responsável pelo gerenciamento desse serviço, assim entendido aquele que detenha as informações do veículo, da carga e sua documentação, do motorista e da logística do transporte"_.

🟡 Dispensas (cl. 3ª-A, Ajuste SINIEF 08/21): veículos novos não emplacados transportados por si mesmos, MEI e não inscritos, produtor rural com NFA-e, contratante quando o TAC emite sob "Nota Fiscal Fácil".

### 3.2 O que entra no MDF-e

| Bloco                | Conteúdo                                                                                                                                                                          | Rejeição se faltar |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Chaves de DF-e       | CT-e (serviço a terceiros) ou NF-e (carga própria). 🟡 **Não podem ter mais de 6 meses**                                                                                          | n/a                |
| Veículo              | Placa, RENAVAM, tara, capacidade, rodado, carroceria. 🟡 Placa validada contra **SENATRAN**; cavalo mecânico exige ao menos um reboque                                            | 521, 523           |
| Condutor             | Nome e CPF. Alterável em rota pelo evento 110114                                                                                                                                  | n/a                |
| **Seguro da carga**  | 🟢 Obrigatório no rodoviário quando o emitente é prestador de serviço. CPF/CNPJ do responsável, seguradora, **nº da apólice**, **nº da averbação**. Base: Lei 11.442/2007 art. 13 | **698, 699**       |
| **CIOT**             | Grupo `infCIOT`. 🟡 Obrigatório de forma ampla a partir de 23/11/2026 (**data não confirmada, ver seção 8 item 1**)                                                               | 🟡 304, **684**    |
| Vale-pedágio         | 🟡 `tpValePed` aceita **somente 01 (TAG) e 04 (leitura de placa)**; tipos 02 e 03 descontinuados                                                                                  | n/a                |
| Produto predominante | 🟡 **NCM obrigatório** em carga lotação desde out/2025. `tpCarga` ganhou valor 12 (Granel Pressurizada)                                                                           | **301**            |
| Pagamento            | 🟡 Obrigatório em lotação; dados bancários obrigatórios para TAC com RNTRC                                                                                                        | 302, 303           |
| Percurso             | UF de carregamento, UF de descarregamento, UFs de percurso                                                                                                                        | n/a                |

> **O par (UF carregamento × UF descarregamento) + veículo é a chave de bloqueio**, e o MOC qualifica com "em datas distintas". Essa qualificação muda o alcance da regra e está na seção 8 como item a confirmar. É o índice mais importante do modelo de dados desse produto.

### 3.3 Eventos

> ⚠️ Ver o aviso em 2.7: `110113` aqui é Inclusão de DF-e, e no CT-e é EPEC.

| Código          | Evento                                                           | Autor                  |
| --------------- | ---------------------------------------------------------------- | ---------------------- |
| 110111          | Cancelamento                                                     | Emitente               |
| **110112**      | **Encerramento**                                                 | Emitente               |
| 110113          | Inclusão de DF-e                                                 | Emitente               |
| 110114          | Inclusão de Condutor                                             | Emitente               |
| 110116          | Pagamento da Operação de Transporte                              | Contratante do TAC     |
| 110117 / 110118 | 🟡 Confirmação do Serviço / Alteração do Pagamento (NT 2022.001) | Contratante / Emitente |
| 240170          | Liberação de Prazo de Cancelamento                               | Fisco                  |
| 310620 / 510620 | Registro de Passagem / automático                                | Fisco                  |

> 🔑 **Erro caro e comum:** coletou carga no caminho → usar **110113**, não cancelar e refazer. Trocou motorista → **110114**. Transportadora pequena cancela-e-reemite por não conhecer os eventos, e aí esbarra no prazo de 24h.

### 3.4 Cancelamento: 24 horas

🟢 Portaria CAT 102/2013 art. 12 + FAQ Portal Nacional:

> _"prazo não superior a vinte e quatro horas, contado do momento em que foi concedida a Autorização de Uso do MDF-e, desde que não tenha iniciado o transporte"_

Passadas 24h: processo administrativo de **Liberação de Prazo de Cancelamento** (evento 240170) na SEFAZ. 🟢 Em MG, via SIARE.

> **Cancelar ≠ encerrar.** Viagem iniciada não se cancela, se encerra. É a confusão nº 1 do setor.

### 3.5 Encerramento: ver seção 0.1

🟢 Hipóteses (cl. 14ª): (I) após o final do percurso; (II) transbordo, redespacho, subcontratação ou substituição de veículo/contêiner; (III) retenção imprevista e parcial da carga; (IV) inclusão de novas mercadorias para a mesma UF de descarregamento.

**Sem prazo em horas ou dias.** As consequências reais estão na tabela da seção 0.1.

### 3.6 Contingência: 168 horas

🟢 MOC seção 4.1 + Portaria CAT 102/2013 art. 15: emite o DAMDFE em formulário comum e autoriza o MDF-e **em até 168 horas contadas da EMISSÃO** (não da resolução do problema).

🟢 Regras por modal: aéreo até 3h após decolagem; cabotagem antes da próxima atracação; ferroviário antes da chegada ao destino final.

### 3.7 Multa por não encerrar

🔴 **Não existe dispositivo específico em nenhuma UF verificada.** O RICMS-SP art. 527 foi lido na íntegra e **não tem inciso sobre MDF-e ou manifesto**.

O que existe em SP 🟢:

| Dispositivo       | Infração                                        | Multa                          |
| ----------------- | ----------------------------------------------- | ------------------------------ |
| art. 527, IV, "a" | Falta de emissão de documento fiscal            | **50% do valor da operação**   |
| art. 527, IV, "z" | Falta de transmissão/autorização quando exigida | 50% do valor, mínimo 15 UFESPs |
| art. 527, § 6º    | Residual, sem importância expressa              | **100 UFESPs**                 |

🟡 Leitura mais defensável: falta de **encerramento** cairia na residual (100 UFESPs); **não emitir** o MDF-e cai no 50% do valor da operação, muito mais grave.

> ⚠️ **Para o time comercial:** a multa por não encerrar é **fraca e incerta**. O argumento de venda **não é multa**, é **bloqueio**: o CNPJ para de emitir em 30 dias. Isso é confirmado, verificável e assusta mais. Qualquer material que prometa "evite multas de R$ X por MDF-e não encerrado" está inventando.

> ⚠️ E: **ANTT não multa por MDF-e**. ANTT multa CIOT, vale-pedágio, RNTRC e piso de frete. SEFAZ multa MDF-e e CT-e. São dois universos com dois fiscais. O PRD tratava "multas ANTT de R$ 550–5.500" como decorrentes de MDF-e, isso está errado e precisa ser corrigido antes de virar material de venda.

### 3.8 Layout vigente

🟢 **MOC MDF-e 3.00b** (07/12/2022). **Sem troca de versão maior.** Mudanças por NT: 2024.001 (SENATRAN, reboque, 6 meses), 2024.002 (CT-e Simplificado), 2025.001 (NCM, pagamento, dados bancários TAC, `tpValePed`, produção out/2025), 2026.001 (CIOT).

🟡 **Ajuste SINIEF 32/2026** (publicado 14/09/2026): especificações técnicas saem do Ajuste e passam a viver no MOC. **Mudanças passam a ser mais rápidas e menos previsíveis, via NT.** Isso é um argumento forte para o adapter de provider, e para vigiar o portal SVRS como fonte de mudança.

---

## 4. CIOT

### 4.1 Regra antiga vs. nova

|                                            | Até 23/05/2026                                                                            | Desde 24/05/2026                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Escopo                                     | Só contratação/subcontratação de **TAC**, **TAC-equiparado** (ETC ≤3 veículos) ou **CTC** | 🟢 _"Toda operação de transporte rodoviário remunerado de cargas"_                                              |
| Frota própria prestando serviço remunerado | Fora                                                                                      | 🟢 **Dentro**, responsabilidade da ETC                                                                          |
| Base                                       | Res. ANTT 5.862/2019                                                                      | Res. ANTT 6.078/2026 + MP 1.343/2026 (24/05 a 04/08/2026), convertida na Lei 15.485/2026 a partir de 05/08/2026 |

🟢 Exceções: veículos não emplacados, cargas especiais com veículos não homologados, transporte rodoviário **internacional**.

🟡 **Regra da "última perna"** (Portaria SUROC 16/2026): na subcontratação, o CIOT é gerado _"somente para a relação entre subcontratante e subcontratado da operação em que efetivamente ocorrer o transporte"_. Evita CIOT em cascata, mas **muda quem é o emitente** em cadeias de 3+ elos. É o maior risco operacional para transportadora pequena que subcontrata.

### 4.2 Emissão

🟢 **Correção de premissa comum:** desde a Res. 6.005/2022 _"a ANTT não mais habilita Instituições de Pagamento"_. A exigência hoje é instituição autorizada pelo **Banco Central** e participante do **PIX**. A lista da ANTT é legado.

🟢 Portaria SUROC 6/2026: _"A comunicação para fins de geração do CIOT se dará por meio de Web Services"_, com certificado ICP-Brasil obrigatório.

🟢 Dados obrigatórios: RNTRC do contratado, identificação de contratante/contratado/subcontratado, origem e destino, características e quantidade da carga, **valor do frete e o piso mínimo aplicável**, valor do pedágio, placas, **dados da conta de pagamento do contratado**, datas previstas de início e término, forma e meio de pagamento.

🟢 **Geração é gratuita por norma.** A IPEF cobra pelos serviços associados (PEF, cartão, VPO), e é aí que está o custo real, que ninguém publica.

### 4.3 Ciclo de vida

🟢 Portaria SUROC 6/2026 + 16/2026:

| Etapa                  | Regra                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geração                | **Antes do início** da prestação                                                                                                                                                                  |
| Duração, carga lotação | Início a fim **não pode exceder 90 dias**                                                                                                                                                         |
| Duração, TAC-Agregado  | Vínculo de **10 a 30 dias**                                                                                                                                                                       |
| Cancelamento           | 🟡 Até **24 horas antes** do início da operação. Isso colide com a regra de geração ("antes do início"): um CIOT gerado 2h antes da viagem nasceria fora da janela. Reler a Portaria SUROC 6/2026 |
| Baixa/quitação         | Até **5 dias após** a data prevista de término; **baixa automática** se não houver manual                                                                                                         |

🟢 Reclassificação (SUROC 16/2026): **lotação = um único contratante**; **fracionada = mais de um contratante**, com um único CIOT para todo o percurso. A validação do piso mínimo foi **desacoplada** da classificação.

### 4.4 Multas

🟢 Lei 15.485/2026 art. 7º § 7º e Res. ANTT 6.078/2026, **R$ 10.500** para cada conduta:

1. Deixar de cadastrar a operação de transporte
2. Gerar CIOT com dados divergentes para burlar a fiscalização
3. **Deixar de informar o CIOT no MDF-e**

🟢 **Catraca digital:** a ANTT impede a geração do CIOT quando o frete está abaixo do piso mínimo. O piso é atualizado semestralmente, publicado até 20 de janeiro e 20 de julho.

🟡 Sanções conexas do piso mínimo (Lei 15.485/2026): multa de até **R$ 1.000.000**, duplicável por reincidência; suspensão cautelar do RNTRC de 5 a 30 dias; cancelamento por contumácia até 24 meses; indenização ao transportador de até 2× o piso; responsabilização de sócios e grupo econômico.

---

## 5. Vale-pedágio obrigatório

🟢 Lei 10.209/2001, art. 1º § 1º: _"O pagamento de pedágio, por veículos de carga, passa a ser de responsabilidade do embarcador."_

🟢 **Art. 1º § 3º, equipara-se ao embarcador:** _"II - a empresa transportadora que subcontratar serviço de transporte de carga prestado por transportador autônomo."_

> ⚠️ **Quando a transportadora subcontrata TAC, ela vira embarcadora equiparada e tem de antecipar o vale-pedágio.** Erro comum e caro.

🟢 Art. 2º: o VPO **não integra o frete**, não é base de tributo nem encargo, e deve ser **destacado em campo específico** do documento de transporte.

🟢 **Res. ANTT 6.024/2023** (vigência 01/09/2023) revogou a 2.885/2008. Compra-se de FVPO habilitada pela ANTT; o modelo exige validação eletrônica da transação e antecipação eletrônica.

🟢 **Só TAG desde 31/01/2025.** Cupons e cartões físicos emitidos até 31/12/2024 valeram 30 dias. Meios físicos descontinuados.

🟡 Grupo `ValePed` no MDF-e: `CNPJForn`, `CNPJPg`, `nCompra`, `vValePed`, `tpValePed`.

### Multas

| Conduta                            | Multa                                           | Fonte                      |
| ---------------------------------- | ----------------------------------------------- | -------------------------- |
| **Contratante que descumpre**      | **R$ 3.000,00 por veículo por viagem**          | 🟢 Res. 6.024/2023 art. 23 |
| Indenização civil ao transportador | **2× o valor do frete**, prescrição de 12 meses | 🟢 Lei 10.209/2001 art. 8º |

> ⚠️ **Armadilha:** a página institucional da ANTT ainda exibe R$ 550,00, valor da resolução revogada. **O vigente é R$ 3.000,00.** Muito blog e muita apresentação comercial repetem os R$ 550.

> O risco civil (dobra do frete) é maior que o administrativo, e o TAC é quem cobra.

---

## 6. Seguro e RNTRC: o ponto único de falha

🟢 **Lei 14.599/2023** reformou o art. 13 da Lei 11.442/2007. Três coberturas obrigatórias:

| Seguro     | Cobertura                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| **RCTR-C** | Perdas ou danos à carga por acidente, colisão, tombamento, incêndio, explosão                 |
| **RC-DC**  | Roubo, furto, apropriação indébita, estelionato, extorsão (substituiu o RCF-DC)               |
| **RC-V**   | Danos corporais e materiais a terceiros pelo veículo, **passou de facultativo a obrigatório** |

### Verificação eletrônica pela ANTT: já está em produção

🟢 **Res. ANTT 6.068/2025** (18/07/2025) + **Portaria SUROC 27/2025**:

| Marco                            | Data                                   |
| -------------------------------- | -------------------------------------- |
| Integração das seguradoras       | até 10/03/2026                         |
| Homologação (caráter educativo)  | 10/03/2026 a 30/06/2026                |
| **Produção, verificação válida** | **desde 01/07/2026**                   |
| Sanção                           | **Suspensão do RNTRC** até regularizar |

```
RNTRC suspenso
   → não gera CIOT (exige RNTRC ativo)
      → MDF-e rejeitado a partir de 23/11/2026 (rejeição 684)
         → caminhão não sai
```

> 🔑 **Todo o edifício regulatório apoia num ponto: RNTRC ativo com seguros comprovados eletronicamente.** Um painel de saúde de conformidade que monitore RNTRC + seguros + certificado A1 + CIOT é, provavelmente, a feature de maior valor percebido por menor esforço de engenharia do produto inteiro. Não depende de emitir nada, só de consultar e avisar.

🔴 **Averbação por viagem:** não localizei dispositivo legal ou resolução impondo prazo específico e **multa administrativa** por não averbar. A obrigatoriedade que encontrei é **contratual/securitária**, apólice sem averbação não cobre a viagem. Desconfiar de material comercial que afirme existir "multa por não averbar".

---

## 7. Onde a transportadora pequena perde tempo e erra

Ordenado por quanto dói, não por frequência.

| #   | Falha                                              | Consequência                                                                                                                                               | Confiança  |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Esquecer de encerrar o MDF-e**                   | Bloqueio imediato do par UF+veículo (🟢); aos 30 dias, CNPJ inteiro travado pela rejeição 686 (🟡, fonte só de MS). Sintoma aparece semanas depois do erro | 🟢/🟡      |
| 2   | **CIOT ausente no MDF-e** (a partir de 23/11/2026) | Rejeição 684 + multa ANTT de R$ 10.500                                                                                                                     | 🟡/🟢      |
| 3   | **RNTRC suspenso por seguro não verificado**       | Derruba CIOT, derruba MDF-e, para a operação                                                                                                               | 🟢         |
| 4   | **Confundir cancelar com encerrar**                | Passadas 24h, vira processo administrativo na SEFAZ                                                                                                        | 🟢         |
| 5   | **Certificado A1 vencido**                         | Rejeições 280–298, operação inteira parada. Ninguém monitora validade em empresa pequena                                                                   | 🟡         |
| 6   | **Não saber a regra da própria UF**                | GO e MG exigem MDF-e em operação interna/intermunicipal; o piso nacional não. Aplica-se a regra de uma UF no território de outra                           | 🟢         |
| 7   | **Um MDF-e para múltiplas UFs de descarga**        | Regra é um por UF. Erro comum em rota multi-estado                                                                                                         | 🟢         |
| 8   | **Seguro incompleto no MDF-e**                     | Rejeições 698/699, falta o número de **averbação**, não só a apólice                                                                                       | 🟢         |
| 9   | **NCM do produto predominante ausente** em lotação | Rejeição 301, nova desde out/2025                                                                                                                          | 🟡         |
| 10  | **Tomador ou valor errado no CT-e**                | Não corrigível por CC-e. Depende de ato do cliente (610110) + substituição em 60 dias                                                                      | 🟢/🟡      |
| 11  | **Digitação manual de chave de 44 dígitos**        | Rejeições 539 e 626. Maior sumidouro de tempo e maior fonte de erro do processo                                                                            | 🟢 (regra) |
| 12  | **Cancelar-e-refazer em vez de usar evento**       | Inclusão de DF-e (110113) e de condutor (110114) existem; quase ninguém usa                                                                                | 🟢         |
| 13  | **Contingência não transmitida em 168h**           | Relógio corre da emissão, não do fim do problema                                                                                                           | 🟢         |
| 14  | **Chave de NF-e com mais de 6 meses**              | Rejeição. Comum em carga parada em armazém                                                                                                                 | 🟡         |
| 15  | **Não antecipar VPO ao subcontratar TAC**          | R$ 3.000/veículo/viagem + dobra do frete cobrada pelo TAC                                                                                                  | 🟢         |

🔴 **Nenhum dado setorial quantitativo primário foi encontrado.** Números de fornecedor ("15 a 20 minutos por documento", "glosa de 2% a 5% do faturamento") não citam estudo, pesquisa ou fonte. **Não usar em pitch, deck ou PRD sem validar nas entrevistas de campo.** O número do PRD de "20-40 minutos por viagem" precisa vir das 30–50 entrevistas, não de blog de ERP.

---

## 8. Itens abertos: o que verificar antes de codar

| #   | Item                                                                              | Por que trava                                                               | Onde confirmar                                                                                 |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **NT MDF-e 2026.001**: datas 21/09 e 23/11/2026, regra 684, condições de `tpEmit` | É o marco mais crítico do calendário. Só temos fonte de fornecedor          | Portal SVRS `dfe-portal.svrs.rs.gov.br/mdfe/Documentos`                                        |
| 2   | **Ajuste SINIEF 3/2026**: data de efeitos (01/05 vs 01/06/2026)                   | Define desde quando a obrigação jurídica existe                             | Despacho CONFAZ 15/2026, DOU 02/04/2026                                                        |
| 3   | **Ajuste SINIEF 21/2010 consolidado**, cl. 14ª                                    | A literalidade do encerramento veio de espelho                              | `confaz.fazenda.gov.br/legislacao/ajustes/2010/AJ_021_10` (abrir em navegador; bloqueia robôs) |
| 4   | **Rejeição 686 é nacional ou só MS?**                                             | Define se o alerta de 30 dias vale para todo cliente                        | Anexo I do MOC MDF-e 3.00b; validar em GO, SP, MG                                              |
| 5   | **Tabela de obrigatoriedade de MDF-e por UF**                                     | GO é o mercado-base e tem a regra mais ampla                                | RCTE-GO art. 248-A/B; RICMS/MG art. 87-H; CAT 102/2013                                         |
| 6   | **Prazo de cancelamento de CT-e por UF**                                          | Não é constante (168h vs 31 dias SP)                                        | Legislação de GO, SP, MG                                                                       |
| 7   | **CT-e Simplificado exige mesma UF de origem e destino?**                         | Se sim, não serve para o caso interestadual                                 | NT 2024.002, texto oficial                                                                     |
| 8   | **Prazo do evento 610110 (desacordo)**, 45 dias?                                  | Define o relógio da feature de correção                                     | Anexo I do MOC CT-e 4.00                                                                       |
| 9   | **Guarda de XML: 5 anos ou 132 meses?**                                           | Muda política de retenção do blob storage                                   | Ajuste SINIEF 2/2025 no CONFAZ                                                                 |
| 10  | **CIOT: "carga própria" vs "frota própria"**                                      | ANTT e SETCERGS divergem. Afeta o discurso de venda                         | ANTT diretamente, ou via SETCEG                                                                |
| 11  | **Custo real por transportadora na IPEF**                                         | Nenhuma publica preço. Define o piso de pricing junto com o provider fiscal | Contato comercial: Extratta, Target, Repom, Roadcard                                           |
| 12  | **Qualificação "em datas distintas"** na regra de bloqueio por veículo            | Se for literal, a regra é mais estreita do que o produto vai implementar    | MOC MDF-e seção 2.2                                                                            |
| 13  | **Códigos de rejeição 539, 626, 729, 304** e regra de consumo de numeração        | Viram fixtures e texto de UI                                                | Anexo I do MOC CT-e 4.00 e do MOC MDF-e 3.00b                                                  |
| 14  | **Vetos da Lei 15.485/2026**                                                      | Prazo de derrubada aberto até 04/10/2026                                    | Congresso Nacional                                                                             |

---

## Fontes

**Oficiais, CT-e**

- [Portal Nacional CT-e, Documentos e Manuais](https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=YIi+H8VETH0%3D)
- [Portal Nacional CT-e, Notas Técnicas](https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=Y0nErnoZpsg%3D)
- [Portal Nacional CT-e, Perguntas Frequentes](https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx?tipoConteudo=HC%2Fiuy94%2FRk%3D)
- [Portal Nacional CT-e, Web Services](https://www.cte.fazenda.gov.br/portal/webServices.aspx?tipoConteudo=wpdBtfbTMrw%3D)
- [NT 2019.001, Comprovante de Entrega Eletrônico](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=8EkgHcpFoPE%3D)
- [NT 2023.002, Insucesso de Entrega](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=130/jruGhMM=)
- [NT 2024.002, CT-e Simplificado](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=Y1psoH3SyAA=)
- [NT 2025.001, Reforma Tributária do Consumo](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=yaGboY8+9HY%3D)
- [NT 2026.002 v1.01](https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=nYNUxSrXYaU=)
- [SEFAZ-SP, Cancelamento Extemporâneo de CT-e](https://portal.fazenda.sp.gov.br/servicos/cte/Paginas/Cancelamento-Extempor%C3%A2neo-de-CT-e.aspx)
- [SEFAZ-GO, CT-e: Contingência](https://goias.gov.br/economia/ct-e-contingencia-na-ocorrencia-de-problemas-tecnicos/)
- [SEFAZ-PR, Regras Gerais de Contingência](https://sped.fazenda.pr.gov.br/CTe/Pagina/Regras-Gerais-de-Contingencia)

**Oficiais, MDF-e**

- [Portal Nacional MDF-e (SVRS), FAQ](https://dfe-portal.svrs.rs.gov.br/mdfe/Faq)
- [Portal Nacional MDF-e (SVRS), Documentos](https://dfe-portal.svrs.rs.gov.br/mdfe/Documentos)
- [MOC MDF-e v3.00 (SEFAZ-SP)](https://portal.fazenda.sp.gov.br/servicos/mdfe/Downloads/Manual_MDFe_v3.00.pdf)
- [Portaria CAT 102/2013 (SEFAZ-SP)](https://legislacao.fazenda.sp.gov.br/Paginas/pcat1022013.aspx)
- [RICMS-SP art. 527, penalidades](https://legislacao.fazenda.sp.gov.br/Paginas/art527.aspx)
- [SEFAZ-MS, Rejeição 686, MDF-e não encerrado há mais de 30 dias](https://www.sefaz.ms.gov.br/mdf-e-nao-encerrado-ha-mais-de-30-dias-implicara-bloqueio-para-emissao-de-novo-mdf-e-2/)
- [SEFAZ-MS, Seguro da carga no MDF-e](https://www.sefaz.ms.gov.br/seguro-da-carga-obrigatoriedade-de-preenchimento-no-mdf-e/)
- [SEFAZ-MG, MDF-e Eventos](https://portalsped.fazenda.mg.gov.br/spedmg/mdfe/Eventos/)
- [SEFAZ-GO, MDF-e](https://goias.gov.br/economia/mdf-e-manifesto-eletronico-de-documentos-fiscais/)

**Oficiais, ANTT e legislação federal**

- [Lei nº 15.485/2026](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15485.htm)
- [Lei nº 10.209/2001, Vale-Pedágio](https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10209.htm)
- [Resolução ANTT nº 6.078/2026, CIOT para Todos](https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RES&numeroAto=00006078&seqAto=000&valorAno=2026&orgao=DG%2FANTT%2FMT&cod_modulo=623&cod_menu=9230)
- [Portaria SUROC nº 6/2026](https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=POR&numeroAto=00000006&seqAto=000&valorAno=2026&orgao=SUROC%2FANTT%2FMT&cod_modulo=623&cod_menu=9230)
- [Resolução ANTT nº 6.024/2023, Vale-Pedágio](https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=RES&numeroAto=00006024&seqAto=000&valorAno=2023&orgao=DG/ANTT/MT&cod_modulo=161&cod_menu=7796)
- [Resolução ANTT nº 6.068/2025, seguros no RNTRC](https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RES&numeroAto=00006068&seqAto=000&valorAno=2025&orgao=DG%2FANTT%2FMT&cod_modulo=623&cod_menu=9230)
- [ANTT, CIOT para Todos: Perguntas Frequentes](https://www.gov.br/antt/pt-br/assuntos/cargas/ciot-para-todos-1/perguntas-frequentes)
- [ANTT, Instituições de PEF habilitadas](https://www.gov.br/antt/pt-br/assuntos/cargas/pagamento-eletronico-de-fretes-pef-ciot/instituicoes-de-pagamento-eletronico-de-frete)
- [ANTT, verificação automática dos seguros obrigatórios](https://www.gov.br/antt/pt-br/assuntos/ultimas-noticias/antt-inicia-integracao-nacional-para-verificacao-automatica-dos-seguros-obrigatorios-do-transporte-de-cargas)

**Provedores**

- [Focus NFe, preços](https://focusnfe.com.br/precos/) · [docs](https://doc.focusnfe.com.br/reference/introducao) · [status](https://status.focusnfe.com.br/)
- [TecnoSpeed PlugDFe CT-e](https://tecnospeed.com.br/en/plugdfe/cte/) · [docs PlugNotas](https://docs.plugnotas.com.br/)
- [Migrate / InvoiCy, desenvolvedores](https://desenvolvedores.migrate.info/)
- [Extratta, documentação da API (CIOT/PEF/VPO)](https://docs.extratta.com.br/)
- [Target Tech, wiki de APIs](https://targetlog.tech/wiki/)
- [Comunicado de desativação da Nuvem Fiscal](https://www.projetoacbr.com.br/forum/topic/91922-comunicado-de-desativação-do-serviço-nuvem-fiscal-22042026/)
