# Matriz de aceite V1.0 — Sprint 14

## Identificação

- Data da execução: 2026-07-15
- Branch: `codex/sprint-14-v1-acceptance`
- Base do candidato: `d78959a47a2bafbb343408d703eafafec8c6df59`
- Spec governante: [`docs/specs/012-v1-acceptance.md`](../../specs/012-v1-acceptance.md)
- Documento Mestre: [`docs/PROJECT_MASTER.md`](../../PROJECT_MASTER.md), critérios V1-01 a V1-18
- Regra: todos os 18 critérios precisam estar `PASS` para aceitar a V1.0.

## Resultado

`V1.0 NÃO ACEITA`

| Critério | Status | Evidência observada | Bloqueio / próximo trabalho |
| --- | --- | --- | --- |
| V1-01 Criar/selecionar canal e isolar contexto | PASS | `/channels`, API de canais, testes de canais e contexto por `channelId`. | Reexecutar no fluxo ponta a ponta após os demais fluxos estarem disponíveis. |
| V1-02 Configurar perfil editorial | FAIL | O perfil é exibido, mas não foi encontrado fluxo frontend completo para configurar e persistir os campos obrigatórios. | Entregar formulário de perfil com persistência, validação e evidência visual. |
| V1-03 Criar pauta | FAIL | `/ideas` lista ideias reais, mas `Nova pauta` não abriu formulário nem mutation; ações `Pesquisar` e `Priorizar` exibem toasts `mockado`. | Implementar criação real de pauta e transições persistidas pelo frontend. |
| V1-04 Pesquisa e fontes rastreáveis | FAIL | `/research` é somente consulta de sessões; não há fluxo frontend comprovado para registrar fontes/claims. | Entregar captura de fonte, claim, procedência e vínculo com pauta. |
| V1-05 Roteiro versionado | FAIL | `/scripts` lista roteiros, sem criação/versionamento demonstrado pelo frontend. | Entregar criação de roteiro, versões e histórico persistidos. |
| V1-06 Planejamento visual | NOT PROVEN | Há contratos/backend relacionados, mas não foi comprovada uma tela frontend operacional para criar e editar o plano visual. | Expor plano visual no fluxo da pauta/roteiro e registrar evidência. |
| V1-07 Narração própria ou autorizada | NOT PROVEN | Há ativos seed de narração no backend, mas não foi comprovada a entrada/validação do fluxo pelo frontend. | Demonstrar origem/autorização, vínculo e validação no fluxo. |
| V1-08 Ativos visuais rastreáveis | FAIL | `/media-assets` lista/detalha ativos, mas não foi demonstrada criação/importação pelo frontend com procedência completa. | Entregar registro/importação e trilha de origem/licença/prompt/modelo. |
| V1-09 Render controlado | NOT PROVEN | `/videos` expõe controles de render real e os testes passam, mas nenhum render foi executado no E2E desta aceitação. | Executar render controlado com saída, status, custo, qualidade e auditoria. |
| V1-10 Corte derivado | NOT PROVEN | `/clips` possui contrato/serviço, mas o fluxo E2E de criação e persistência não foi concluído nesta rodada. | Executar criação de corte derivado via frontend e capturar evidência. |
| V1-11 Qualidade técnica | NOT PROVEN | Existem validações no backend/fluxo de aprovação, porém não houve demonstração frontend completa do gate de qualidade. | Exibir resultado do gate, falhas e bloqueio de avanço. |
| V1-12 Compliance e direitos | NOT PROVEN | `/compliance` consulta alertas reais, mas o cenário negativo/obrigação de bloqueio não foi exercitado pelo frontend. | Demonstrar alerta bloqueante, correção e revalidação. |
| V1-13 Aprovação humana | NOT PROVEN | Ações reais e testes existem em `/approvals`, mas não houve decisão humana E2E registrada nesta execução. | Executar aprovação/rejeição/solicitação de mudança e comprovar auditoria. |
| V1-14 Publicação assistida | NOT PROVEN | Há contratos e telas de publicação assistida, mas readiness/job não foram demonstrados ponta a ponta nesta rodada. | Demonstrar rascunho/preparação sem upload real e com bloqueios visíveis. |
| V1-15 Custos por canal/etapa | PASS | `/costs`, API, isolamento por canal e testes de custos passaram; dados operacionais foram exibidos. | Cobrir novamente no E2E após fechar o fluxo principal. |
| V1-16 Métricas reais | PASS | `/metrics`, API, testes de métricas e evidências de E14 no mesmo baseline. | Manter procedência e origem explícitas na demonstração final. |
| V1-17 Recomendação assistida | PASS | Regra local `metrics-learning-v1`, testes e tela de métricas/recomendação presentes; sem aplicação automática. | Revalidar vínculo com o conteúdo produzido no fluxo final. |
| V1-18 Histórico operacional | PASS | `/audit-logs`, eventos persistidos, API e testes de auditoria; tabela observada no browser local. | Garantir que todos os eventos dos fluxos faltantes também sejam registrados. |

## Contagem

- `PASS`: 5
- `FAIL`: 5
- `NOT PROVEN`: 8
- Critérios obrigatórios não atendidos: 13

Como a regra de aceite é conjuntiva, os cinco `FAIL` e os oito `NOT PROVEN` impedem o aceite. Os passes técnicos não compensam a ausência de prova operacional pelo frontend.
