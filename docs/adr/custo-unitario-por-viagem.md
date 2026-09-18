# Custo unitário por viagem — camada fiscal + camada CIOT

- **Status:** estimativa, **pendente dos mesmos spikes** dos ADRs 0003 e 0006.
- **Data:** 2026-09-16
- **Para que serve:** este número é o **piso de preço do produto**. Abaixo dele
  cada viagem vendida dá prejuízo em custo variável, antes de infra, suporte e
  qualquer coisa que se pareça com margem.

---

## 0. A resposta, primeiro

> **Custo de fornecedor por viagem, em regime (≥ 2.000 viagens/mês na
> plataforma inteira): ≈ R$ 1,90.**
> **Faixa plausível: R$ 0,90 a R$ 4,30.**
> **Margem de erro: −55% / +125%.**

E a parte que importa mais que o número:

> **A camada fiscal é conhecida e barata (≈ R$ 0,25/viagem, preço publicado).**
> **A camada CIOT é desconhecida e domina o custo (≈ 87% do total estimado),**
> **e nenhum fornecedor de CIOT publica preço.**

Toda a incerteza está em um lugar só. Isso é uma boa notícia: uma ligação para a
Extratta fecha a maior parte da margem de erro deste documento.

**Notação:** 🟢 = preço publicado, com URL. 🟡 = suposição nossa, declarada.
🔴 = não público, sem referência de mercado sequer.

---

## 1. Camada fiscal — 🟢 preço publicado

Fonte: [focusnfe.com.br/precos](https://focusnfe.com.br/precos/), plano **Growth**.

| Item                | Valor                                                          | Procedência  |
| ------------------- | -------------------------------------------------------------- | ------------ |
| Mensalidade         | **R$ 548,00/mês**                                              | 🟢 publicado |
| CNPJs               | **ilimitados**                                                 | 🟢 publicado |
| Pacote incluído     | **4.000 notas**                                                | 🟢 publicado |
| Documento adicional | **R$ 0,12**                                                    | 🟢 publicado |
| Cobre CT-e e MDF-e? | Sim — "Emissão de NFe, NFSe, NFCe, **CTe, MDFe**, NFCom e DCe" | 🟢 publicado |

**CNPJs ilimitados é a variável que faz o modelo fechar.** No plano Start
(R$ 37,90 por CNPJ adicional), 100 transportadoras custariam ~R$ 3.900/mês só em
assinatura de CNPJ, e o custo cresceria linear com clientes em vez de com
volume. Growth desacopla as duas coisas.

### 1.1 Documentos por viagem

🟡 **Suposição: 2 documentos fiscais por viagem** — 1 CT-e + 1 MDF-e.

Justificativa: transportadora pequena opera majoritariamente carga lotação — um
caminhão, uma carga, um CT-e, um MDF-e. Em carga fracionada um MDF-e agrupa
vários CT-e e o número cai para ~1,2; em viagem com redespacho sobe para ~3.
**Não medido com transportadoras reais.** É a segunda maior fonte de erro deste
documento.

🔴 **Não confirmado: eventos contam como "nota" na franquia?** Encerramento de
MDF-e (110112), cancelamento, carta de correção — se cada evento consumir uma
unidade, o consumo por viagem vai de 2 para ~3, e o custo marginal sobe ~50%.
A documentação pública não responde isso. **É o item de preço do spike.**

### 1.2 Custo fiscal por viagem, por volume da plataforma

Fórmula: `548 + max(0, 2N − 4000) × 0,12`, com N = viagens/mês na plataforma.

| Viagens/mês (toda a base) | Documentos | Custo fiscal/mês | **Custo fiscal/viagem** |
| ------------------------- | ---------- | ---------------- | ----------------------- |
| 100                       | 200        | R$ 548,00        | **R$ 5,48**             |
| 250                       | 500        | R$ 548,00        | **R$ 2,19**             |
| 500                       | 1.000      | R$ 548,00        | **R$ 1,10**             |
| 1.000                     | 2.000      | R$ 548,00        | **R$ 0,55**             |
| **2.000**                 | 4.000      | R$ 548,00        | **R$ 0,27**             |
| 3.000                     | 6.000      | R$ 788,00        | **R$ 0,26**             |
| 5.000                     | 10.000     | R$ 1.268,00      | **R$ 0,25**             |
| 10.000                    | 20.000     | R$ 2.468,00      | **R$ 0,25**             |

**Custo marginal assintótico: R$ 0,24/viagem** (2 × R$ 0,12). A mensalidade some
como custo unitário a partir de ~2.000 viagens/mês.

**A leitura estratégica desta tabela:** os primeiros clientes são caros por
viagem não porque a emissão é cara, mas porque R$ 548 fixos divididos por pouca
gente dá muito. Nos primeiros meses, a camada fiscal é **custo de estar aberto**
(R$ 548/mês), não custo variável. Precificar os primeiros clientes com base no
custo unitário de R$ 5,48 seria um erro: esse número desaparece com escala.

---

## 2. Camada CIOT — 🔴 nenhum preço público

**Nenhum dos sete candidatos** — Extratta, Repom, Roadcard/Pamcard, Target Tech,
Sem Parar, NDD, nstech — publica preço de CIOT. Ver ADR 0006 §2.

A única âncora numérica pública que encontramos é de **outro** fornecedor, não
de um candidato:

> "Preços CIOT Online — **A partir de R$ 1,29 por emissão**"
> — [ciotonline.com.br/precos](https://ciotonline.com.br/precos)

🟡 Usamos R$ 1,29 como **piso de mercado**, não como preço da Extratta. É um
"a partir de", ou seja, o menor preço do menor plano de um concorrente.

### 2.1 Suposições

| Item                                | Valor                                 | Procedência                                 |
| ----------------------------------- | ------------------------------------- | ------------------------------------------- |
| Custo por CIOT emitido              | **R$ 2,50** (faixa R$ 1,29 – R$ 5,00) | 🟡 suposição ancorada na referência acima   |
| Mensalidade / mínimo mensal da IPEF | **R$ 0**                              | 🔴 assumido zero **e provavelmente errado** |
| Taxa de serviço do vale-pedágio     | **R$ 0**                              | 🔴 não público                              |
| Cancelamento e baixa                | **R$ 0**                              | 🔴 não público                              |
| % de viagens que exigem CIOT        | **65%**                               | 🟡 suposição                                |

Sobre os **65%**: CIOT é obrigatório no transporte rodoviário de cargas por
conta de terceiros contratando TAC (autônomo). Viagem com frota própria e
motorista empregado não gera CIOT. Transportadora pequena mistura os dois
modelos. 65% é um meio-termo **sem medição**. Faixa plausível: 40% a 90%.

**Duas suposições assumidamente frágeis:**

- **Mínimo mensal zero.** Instituição de pagamento costuma ter piso mensal ou
  taxa de manutenção de conta. Se a Extratta cobrar R$ 300/mês por CNPJ da
  transportadora, o modelo econômico muda de forma, não de grau — vira custo por
  cliente, e não por viagem. **Este é o maior risco escondido deste documento.**
- **Vale-pedágio de graça.** O valor do pedágio em si é dinheiro do cliente
  passando por nós (_pass-through_), não custo nosso — mas a **taxa de serviço**
  sobre a compra é custo, e não é pública.

### 2.2 Custo CIOT por viagem

`0,65 × R$ 2,50` = **R$ 1,63/viagem** (faixa: `0,40 × 1,29` = R$ 0,52 até
`0,90 × 5,00` = R$ 4,50).

---

## 3. Soma

Em regime (≥ 2.000 viagens/mês):

| Camada                    | Por viagem  | Faixa                 | Procedência   | Peso    |
| ------------------------- | ----------- | --------------------- | ------------- | ------- |
| Fiscal (Focus NFe Growth) | **R$ 0,27** | R$ 0,25 – R$ 0,40     | 🟢 publicado  | 14%     |
| CIOT + vale-pedágio       | **R$ 1,63** | R$ 0,52 – R$ 4,50     | 🔴/🟡 suposto | **86%** |
| **Total**                 | **R$ 1,90** | **R$ 0,90 – R$ 4,30** |               |         |

E na fase inicial, que é onde o produto realmente vai estar em 2026:

| Cenário                      | Viagens/mês | Fiscal  | CIOT    | **Total/viagem** | Custo fixo/mês |
| ---------------------------- | ----------- | ------- | ------- | ---------------- | -------------- |
| Piloto (5 clientes)          | 250         | R$ 2,19 | R$ 1,63 | **R$ 3,82**      | R$ 548         |
| Tração inicial (20 clientes) | 1.000       | R$ 0,55 | R$ 1,63 | **R$ 2,18**      | R$ 548         |
| Escala (60 clientes)         | 3.000       | R$ 0,26 | R$ 1,63 | **R$ 1,89**      | R$ 788         |

**Margem de erro declarada: −55% / +125%**, e ela é quase inteiramente da linha
de CIOT. A linha fiscal tem preço publicado com URL e erra, no máximo, no
consumo de franquia por eventos.

---

## 4. O que este número implica para o preço

Isto é **custo de fornecedor**, não custo total. Fora da conta: infraestrutura,
armazenamento de XML, suporte, certificados, impostos sobre a receita, aquisição
de cliente. Regra de bolso: COGS de fornecedor ≤ 20% da receita.

> **R$ 1,90 ÷ 0,20 ⇒ piso de preço ≈ R$ 9,50 por viagem.**

Traduzindo para um plano mensal, que é como transportadora pequena compra:

| Perfil                         | Viagens/mês | Custo fornecedor | **Piso de mensalidade (COGS 20%)** |
| ------------------------------ | ----------- | ---------------- | ---------------------------------- |
| Transportadora com 2 caminhões | 30          | R$ 57            | **~R$ 285/mês**                    |
| Com 5 caminhões                | 75          | R$ 143           | **~R$ 715/mês**                    |
| Com 10 caminhões               | 150         | R$ 285           | **~R$ 1.425/mês**                  |

Duas consequências de precificação que caem direto daqui:

1. **Cobrar por viagem repassa a incerteza do CIOT para o cliente e nos protege.**
   Mensalidade fixa com CIOT ilimitado nos deixa expostos ao cliente de alto
   volume — que é justamente o cliente bom. Se for mensalidade, precisa de teto
   de viagens.
2. **Enquanto a base for pequena, o custo é fixo (R$ 548/mês), não variável.**
   O décimo cliente custa quase nada a mais na camada fiscal. Isso argumenta a
   favor de adquirir rápido e não perseguir margem unitária no primeiro ano.

---

## 5. O que muda este número

| Descoberta                               | Efeito                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Extratta cobra mínimo mensal por CNPJ    | 🔴 **Muda a forma do modelo**, não só o valor. Custo por cliente, não por viagem. Mata a transportadora de baixo volume |
| Eventos consomem a franquia da Focus     | Fiscal +50% (R$ 0,27 → ~R$ 0,40). Impacto pequeno no total                                                              |
| CIOT sai a R$ 1,29 e não R$ 2,50         | Total cai para ~R$ 1,11/viagem. Piso de preço ~R$ 5,55                                                                  |
| CIOT sai a R$ 5,00                       | Total sobe para ~R$ 3,52/viagem. Piso de preço ~R$ 17,60                                                                |
| Incidência de CIOT é 90%, não 65%        | Total → R$ 2,52                                                                                                         |
| Carga fracionada domina (1,2 doc/viagem) | Fiscal −40%. Irrelevante no total                                                                                       |
| `POST /v2/empresas` exigir revenda       | Pode mudar o plano e a tabela inteira da seção 1                                                                        |

---

## 6. O que NÃO foi possível confirmar

- **Preço de CIOT de qualquer candidato.** Nenhum é público.
- Se há **mínimo mensal, taxa de adesão ou manutenção de conta** na IPEF.
- Se a **taxa de serviço do vale-pedágio** é fixa, percentual ou zero.
- Se **cancelamento e baixa** de CIOT são cobrados.
- Se **eventos fiscais consomem a franquia** de 4.000 notas da Focus.
- Se o plano Growth tem **limite de CNPJs na prática**, apesar de "ilimitados".
- Se existe **desconto por volume** ou contrato de revenda na Focus.
- A **distribuição real de documentos por viagem** e a **incidência real de
  CIOT** — as duas dependem de dados de transportadoras que ainda não temos.

**Nada acima foi estimado no lugar de ser medido. Onde está 🔴, está 🔴.**
