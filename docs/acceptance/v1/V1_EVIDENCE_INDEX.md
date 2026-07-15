# Índice de evidências V1.0 — Sprint 14

Este índice separa prova direta, prova automatizada e lacunas. A evidência não deve ser interpretada como aceite parcial: a decisão depende dos 18 critérios em conjunto.

| ID | Tipo | Evidência | Uso |
| --- | --- | --- | --- |
| E-01 | Git/preflight | Base `d78959a47a2bafbb343408d703eafafec8c6df59`, `main...origin/main = 0 0`, working tree limpo e branch isolada. | Confirma baseline e escopo. |
| E-02 | Gates | `git diff --check`, `npm run lint`, `npm run backend:check`, `npm test` e `npm run build` passaram. | Prova saúde técnica, não aceite funcional. |
| E-03 | Backend | `server/src/app.ts` monta APIs de canais, editorial, assets, renders, governance, publications, costs, audit e metrics. | Prova existência de superfície backend. |
| E-04 | Frontend/source | `src/services/api-client.ts:91` e `:135` reexportam quatro superfícies de `mock-api.ts`; `src/routes/dashboard.tsx:59-63` e `src/routes/agent-office.tsx:58-60` as consomem. | Prova do bloqueio de integração mockada. |
| E-05 | Browser/E2E | `/ideas` carregou três ideias reais; `Nova pauta` não abriu formulário; ações `Pesquisar`/`Priorizar` mostraram toasts `mockado`. | Prova direta de V1-03 e do bloqueio P0. |
| E-06 | Browser/route sweep | Rotas críticas foram abertas em servidor local; listas de canais, custos, compliance e auditoria renderizaram dados; várias telas de criação/transição não foram comprovadas. | Evidência de cobertura visual e lacunas. |
| E-07 | Security | Busca de padrões de segredo não encontrou credenciais; a única ocorrência foi o texto de código `client_secret` em `server/src/modules/youtube/youtube.client.ts`. | Prova de não exposição de segredo. |
| E-08 | Histórico | Screenshots e evidências anteriores em [`screenshots/`](../../../screenshots/) sustentam E14 e superfícies já existentes, mas não substituem o E2E dos fluxos faltantes. | Contexto, não substituição de prova atual. |

## Comandos reproduzíveis

```text
npm run lint
npm run backend:check
npm test
npm run build
git diff --check
```

## Gaps de evidência

- Não há screenshot persistido desta rodada para cada uma das 18 etapas; a observação visual foi feita no browser local e os gaps foram registrados como `NOT PROVEN` quando não houve transação completa.
- Não houve credencial externa nem publicação real; a aceitação esperada é de publicação assistida/preparada, não de upload automático.
- Dados seed podem provar leitura, mas não substituem criação, alteração, isolamento e auditoria de um registro novo.
