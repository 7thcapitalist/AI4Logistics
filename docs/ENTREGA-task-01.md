# AI4Logistics: entrega da Task 01 + Task 02

Construído em 16/09/2026. Seis agentes em paralelo, integrado e verificado.

> Este documento foi escrito antes do merge no repositório principal e descreve
> o build como ele foi entregue. Os comandos abaixo já estão em pnpm + turbo, a
> convenção do repositório. O que mudou no merge está no corpo do PR; em
> particular, `formatarCentavos` deixou de existir (use `formatBRL`) e a máquina
> de estados de seis estados de `trip-state.ts` foi substituída pela de nove de
> `domain/transicoes.ts`.

## Como rodar

```bash
pnpm install
pnpm typecheck   # turbo run typecheck, em todos os pacotes
pnpm test        # turbo run test (vitest): domínio, settlement, trip-state, fiscal
pnpm build       # turbo run build
pnpm dev         # http://localhost:3000/viagens
```

Node 22. Sem banco, sem autenticação, sem chamada a provedor: os dados vêm de
fixtures determinísticas em memória, com o relógio fixo em
`AGORA = 1789574400000`.

## O que está pronto

|                             |                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/domain/` | Tipos, prazos parametrizados, guardas, máquina de estados e motor de risco. Funções puras, sem I/O, sem React. 186 testes.   |
| `packages/ui/src/`          | Design system em tokens CSS. Duas variantes de tema (Pátio e Torre) trocáveis por `data-theme`, primitivos acessíveis.       |
| `packages/fiscal/src/`      | Interfaces `FiscalProvider` e `CiotProvider` separadas, mais implementação falsa determinística com as seis rejeições reais. |
| `apps/web/`                 | Shell, `/viagens`, `/viagens/[id]`, 7 rotas stub. 58 arquivos.                                                               |
| `docs/domain/`              | Mapa dos fluxos documentais e a verificação em fonte primária de 16/09/2026.                                                 |
| `docs/adr/`                 | ADR 0003 (provedor fiscal), ADR 0006 (provedor CIOT), custo unitário por viagem.                                             |

## Verificado, não afirmado

- `pnpm typecheck` limpo, `pnpm test` verde, `pnpm build` verde.
- Zero cor literal fora de `tokens.css` (grep por hex, rgb e hsl).
- Isolamento de tenant: `?org=org-1` devolve 24 viagens, `?org=org-2` devolve 9,
  interseção vazia. As duas orgs não compartilham placa, CNPJ nem CPF.
- Sem scroll horizontal em 380px.
- Aba "Entregues não encerradas" devolve exatamente as 5 viagens da lacuna.

## Três regras que o produto encoda e que a maioria do setor erra

1. **Não existe prazo em horas para encerrar MDF-e.** A norma vincula o
   encerramento a eventos. `podeEncerrarMdfe` não recebe sequer o relógio, e um
   teste percorre manifestos abertos há 1h, 1 dia, 30 dias e 400 dias exigindo
   que nenhum seja negado por tempo.
2. **São quatro regras de bloqueio, não uma** (F85/611, F87/462, F88/662,
   F86/686), com chaves diferentes. A de cinco dias (F87) atinge rota curta e
   provavelmente é a que mais dispara numa transportadora de Goiás.
3. **Regra fiscal na UI só existe com fonte.** `Risco` e `Guarda` exigem o campo
   `Fonte` no tipo, com `confianca: 'oficial' | 'verificar'`. Um teste varre
   todos os riscos gerados e falha se algum de fonte não verificada exibir
   contagem regressiva.

## Dívidas registradas

- `bloqueiosDeEmissaoMdfe` não confere CNPJ: exige que o chamador entregue as
  viagens já escopadas por tenant. O modelo de dados não carrega o CNPJ do
  emitente. Há um teste-tripwire que quebra no dia em que o campo existir.
- ADR 0003 e 0006 estão "Proposta, pendente de spike com credenciais": a
  avaliação foi feita lendo documentação pública, sem emitir de verdade.
- `docs/domain/verificacao-2026-09.md` lista o que continua não confirmado e o
  que precisa de humano.
