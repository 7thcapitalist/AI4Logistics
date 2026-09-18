# Obrigatoriedade de MDF-e por UF: piso nacional × GO × SP × MG

**Verificado em:** 16/09/2026
**Método:** só fonte primária (portal nacional CT-e/MDF-e, SEFAZ estaduais, decretos estaduais no repositório oficial da UF).
**Regra de leitura:** linha sem fonte primária não entra nesta tabela. O que não abriu está na seção "Lacunas".

---

## 1. O piso nacional

O piso nacional vem do Ajuste SINIEF 21/2010. A formulação operacional que consegui abrir **em texto literal** é a Portaria CAT 102/2013 art. 2º (SEFAZ-SP), que reproduz o piso. SP **não amplia** o piso: SP _é_ o piso.

> **Portaria CAT 102/2013, art. 2º** (transcrito de legislacao.fazenda.sp.gov.br em 16/09/2026):
>
> "Artigo 2º - O MDF-e deverá ser emitido, no término do carregamento e antes do início do transporte, por contribuinte:
> I - emitente de Conhecimento de Transporte Eletrônico - CT-e, modelo 57, no transporte:
> a) interestadual e intermunicipal de carga fracionada, assim entendida a que corresponda a mais de um CT-e;
> b) interestadual de carga lotação, assim entendida a que corresponda a um único CT-e.
> II - emitente de Nota Fiscal Eletrônica - NF-e, modelo 55, quando ele for o responsável pelo transporte, realizado em veículos próprios ou arrendados, ou mediante contratação de transportador autônomo de cargas:
> a) no transporte interestadual de quaisquer bens ou mercadorias;
> b) no transporte intermunicipal de combustíveis líquidos ou gasosos acobertados por mais de uma NF-e ou por uma única NF-e na qual não conste a identificação do veículo transportador.
> § 1º - O MDF-e também deverá ser emitido sempre que ocorrer qualquer alteração durante o percurso relativamente às mercadorias ou ao transporte.
> § 2º - Deverá ser emitido um MDF-e distinto para cada unidade federada de descarregamento, agregando, em cada MDF-e, os documentos referentes às cargas a serem descarregadas em cada uma delas."

Dois detalhes do caput que o mapa da equipe não registrava e que são regra de produto:

- **"no término do carregamento e antes do início do transporte"** — o MDF-e tem uma janela de emissão, não é "emitir quando der".
- **§ 1º** — qualquer alteração no percurso obriga **novo** MDF-e. Isso convive com os eventos 110113/110114 e precisa ser desambiguado caso a caso antes de virar automação.

---

## 2. Tabela comparativa

Legenda: **SIM** = obrigatório · **NÃO** = não exigido pela norma verificada · **?** = não confirmado em fonte primária.

### 2.1 Transportadora prestando serviço a terceiros (emitente de CT-e, modelo 57)

| Situação                                 | Piso nacional / SP | GO                                                  | MG               |
| ---------------------------------------- | ------------------ | --------------------------------------------------- | ---------------- |
| Carga **fracionada**, **interestadual**  | SIM 🟢             | SIM 🟢                                              | SIM 🟢           |
| Carga **fracionada**, **intermunicipal** | SIM 🟢             | SIM 🟢                                              | SIM 🟢           |
| Carga **lotação**, **interestadual**     | SIM 🟢             | SIM 🟢                                              | SIM 🟢           |
| Carga **lotação**, **intermunicipal**    | **NÃO** 🟢         | **SIM** 🟢 (via "operações ou prestações internas") | **?** 🔴 ver 3.2 |
| Qualquer carga, **intramunicipal**       | **NÃO** 🟢         | **SIM** 🟢                                          | **NÃO** 🟡       |

### 2.2 Carga própria (emitente de NF-e, modelo 55, responsável pelo transporte)

| Situação                                                                        | Piso nacional / SP | GO         | MG                          |
| ------------------------------------------------------------------------------- | ------------------ | ---------- | --------------------------- |
| **Interestadual**, quaisquer bens                                               | SIM 🟢             | SIM 🟢     | SIM 🟢                      |
| **Intermunicipal**, combustíveis líquidos/gasosos (condições do art. 2º II "b") | SIM 🟢             | SIM 🟢     | SIM 🟢                      |
| **Intermunicipal**, demais mercadorias                                          | **NÃO** 🟢         | **SIM** 🟢 | **SIM** 🟢 desde 01/07/2015 |
| **Intramunicipal**                                                              | **NÃO** 🟢         | **SIM** 🟢 | **NÃO** 🟡                  |

---

## 3. Base normativa por UF

### 3.1 Goiás — a regra mais ampla das três, e confirmada

O dispositivo operativo **não é** o art. 248-A/248-B do RCTE isoladamente. A obrigação está no **Decreto 8.064/2013, art. 8º**, cujo **inciso III foi acrescentado pelo Decreto 9.095/2017, art. 6º**.

> **Decreto 9.095/2017, art. 6º** (appasp.economia.go.gov.br, 16/09/2026):
>
> "Art. 6º O art. 8º do Decreto nº 8.064, de 26 de dezembro de 2013, passa a vigorar com a seguinte redação:
> Art. 8º ...
> III - contribuinte emitente de CT-e, modelo 57, e de NF-e, modelo 55, no transporte de bens ou mercadorias realizado em veículos próprios ou arrendados, ou mediante contratação de transportador autônomo, ou mediante contratação de transportador autônomo de cargas, **nas operações ou prestações internas, a partir de 1º de dezembro de 2017**. (NR)"

> **Decreto 8.064/2013, art. 8º, caput e incisos I e II** (mesmo repositório):
>
> "Art. 8º A emissão do MDF-e é obrigatória aos seguintes contribuintes (Ajuste SINIEF 21/10, cláusula décima sétima):
> I - contribuinte emitente do CT-e de que trata o Ajuste SINIEF 09/07 no transporte interestadual de carga fracionada, a partir das seguintes datas: a) 2 de janeiro de 2014 [...] d) 1º de outubro de 2014, para os contribuintes que prestam serviço no modal rodoviário optantes pelo regime do Simples Nacional;
> II - na hipótese de contribuinte emitente de NF-e [...] no transporte interestadual de bens ou mercadorias acobertadas por mais de uma NF-e, realizado em veículos próprios ou arrendados, ou mediante contratação de transportador autônomo de cargas [...]"

E a leitura oficial de "internas" está na página da própria SEFAZ-GO:

> **SEFAZ-GO, página oficial do MDF-e** (goias.gov.br/economia, 16/09/2026):
>
> "Nas operações internas, ou seja, que ocorrem dentro do estado de Goiás, também deve ser emitido o MDF-e, seja em operações **intermunicipais ou intramunicipais**."
>
> A mesma página indica como base o **art. 248-B, § 4º do RCTE-GO** e o **art. 6º do Decreto 9.095/2017**, e cita o **art. 114, XXXII e XXXIII do RCTE-GO** para o modelo do documento.

**Veredito GO: CONFIRMADO 🟢.** Goiás exige MDF-e em operação interna, inclusive intermunicipal e intramunicipal, desde 01/12/2017. É de fato a regra mais ampla das três UF analisadas.

**Ressalva honesta, e ela é comercialmente relevante:** o texto do inciso III descreve o transporte "realizado em veículos próprios ou arrendados, ou mediante contratação de transportador autônomo". Essa é a redação típica de **conta própria**. Ela nomeia o emitente de CT-e 57 junto com o de NF-e 55, e a SEFAZ-GO lê o conjunto como abrangendo a operação interna em geral — mas o cruzamento "transportadora emitindo CT-e para terceiro em viagem **intramunicipal** dentro de Goiás" não aparece com todas as letras em nenhum dos dois decretos. A página da SEFAZ-GO afirma; o decreto não desambigua. Antes de transformar isso em argumento de venda ("você precisa de MDF-e até na entrega dentro de Goiânia"), **isso precisa de confirmação formal da SEFAZ-GO**. Ver "PRECISA DE HUMANO" no documento de verificação.

### 3.2 Minas Gerais — o artigo citado pela equipe está errado

O mapa da equipe cita **art. 87-H do Anexo V do RICMS/MG**. A página oficial da SEF/MG cita **art. 87-B do Anexo V do RICMS**.

> **SEF/MG, portalsped.fazenda.mg.gov.br/spedmg/mdfe/Obrigatoriedade** (16/09/2026), citação de base: **"Anexo V, art. 87-B do RICMS"**.
>
> Sobre a extensão intermunicipal: "os contribuintes elencados nos incisos I e II, desde 1º de julho de 2015, na hipótese de transporte intermunicipal de bens ou mercadorias."

Cronograma reproduzido pela SEF/MG: 03/02/2014 (rodoviário do Anexo Único do SINIEF 09/07, aéreo, ferroviário); 01/07/2014 (rodoviário não-Simples, aquaviário, carga lotação); 01/10/2014 (rodoviário optante do Simples); **01/07/2015 (transporte intermunicipal)**.

**Veredito MG: CONFIRMADO com correção 🟢/🟡.** A ampliação intermunicipal desde 01/07/2015 existe. Mas:

- O artigo é **87-B**, não 87-H. Corrigir a citação no mapa.
- A ampliação real de MG sobre o piso nacional está no **inciso II (emitente de NF-e / carga própria)**: o piso nacional só exige NF-e intermunicipal para combustíveis; MG estende a quaisquer bens ou mercadorias. Para o **inciso I (emitente de CT-e)**, o piso nacional **já** exigia fracionada intermunicipal, então nessa ponta MG acrescenta pouco.
- Se MG passa a exigir MDF-e em **carga lotação intermunicipal** por emitente de CT-e é o ponto que **não fecha**: a página lista "carga lotação" no cronograma de 01/07/2014 sem qualificar interestadual/intermunicipal, e a extensão de 2015 remete a "incisos I e II" sem reproduzir o texto dos incisos. Marquei **?** na tabela. Só o texto do art. 87-B do Anexo V resolve, e ele não abriu.
- MG não afirma obrigatoriedade **intramunicipal** em lugar nenhum. Não assumir que MG = GO.

### 3.3 São Paulo — é o piso, não uma ampliação

Portaria CAT 102/2013 art. 2º, transcrito na seção 1. SP não estende a intermunicipal lotação nem a intramunicipal.

---

## 4. O que isso significa para o produto

1. **A obrigatoriedade é tabela por UF, não constante.** Confirmado. O mapa já dizia isso e continua certo.
2. **A chave da tabela não é só a UF.** É `(UF, tipo de emitente [CT-e 57 | NF-e 55], tipo de carga [fracionada | lotação], âmbito [interestadual | intermunicipal | intramunicipal])`. Quatro dimensões. Uma tabela indexada só por UF vai errar.
3. **GO é realmente o caso mais amplo**, e isso é a favor da tese: mais documento por cliente no mercado-base. Mas a ponta intramunicipal com CT-e precisa de confirmação formal antes de virar promessa comercial.
4. **MG não é "igual a GO com outro artigo".** É uma ampliação mais estreita e numa outra ponta (carga própria). Vender MG com o discurso de GO quebra na primeira conversa com o contador.

---

## 5. Lacunas

| O que falta                                                                                | Por que não fechou                                                                                                                                                                                                                                           | Onde conferir manualmente                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Texto literal do **art. 248-A e 248-B, § 4º do RCTE-GO** e do **art. 114, XXXII e XXXIII** | O corpo do RCTE (Decreto 4.852/1997) não abriu: `appasp.economia.go.gov.br/legislacao/arquivos/decretos/D_04852.htm` retorna 404 e `sefaz.go.gov.br/lte/rcte.htm` responde "Acesso Negado" por política de segurança (código de suporte 7511325290816751541) | Abrir em navegador a partir de https://goias.gov.br/economia/legislacao-8/       |
| Texto literal do **art. 87-B do Anexo V do RICMS/MG**, incisos I e II                      | A página da SEF/MG cita o artigo mas não reproduz os incisos                                                                                                                                                                                                 | RICMS/MG no portal da SEF/MG, em navegador                                       |
| Se **MG exige MDF-e em carga lotação intermunicipal** por emitente de CT-e                 | Depende do texto dos incisos acima                                                                                                                                                                                                                           | idem                                                                             |
| Texto consolidado do **Ajuste SINIEF 21/2010**                                             | CONFAZ bloqueia robôs (ROBOTS_DISALLOWED em todas as tentativas)                                                                                                                                                                                             | https://www.confaz.fazenda.gov.br/legislacao/ajustes/2010/AJ_021_10 em navegador |
