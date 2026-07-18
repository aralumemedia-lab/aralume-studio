# Next Sprints

## Regras de sequenciamento

- Epico, sprint, fase e spec sao identificadores diferentes.
- A Fase 12 do roadmap foi materializada na Sprint 11 e esta encerrada.
- A Sprint 12 pertence ao E13 e e governada por `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 12 foi encerrada no PR #22, merge commit
  `6690008aa92749415838f97f10a4b407301f2233`.
- A Sprint 13 pertence ao E14 e e governada por `docs/specs/014-metrics-learning.md`.
- A Sprint 14 pertence ao E15 - Hardening V1.0 e e governada por
  `docs/specs/012-v1-acceptance.md`.

## Fila operacional

| Ordem | Sprint | Epico | Spec normativa | Estado | Liberacao | Dependencias |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sprint 12 | E13 - Integracoes Reais Autorizadas | `docs/specs/015-authorized-real-integrations.md` | completed | released | PR #22 mergeado; OAuth com dois escopos, descoberta, selecao, upload privado/nao listado, consulta, replay idempotente, isolamento e revogacao validados. |
| 2 | Sprint 13 | E14 - Metricas e Aprendizado | `docs/specs/014-metrics-learning.md` | completed | released | PR #23 mergeada em `9b89d1be04e7a6e319efb9a957282097c4854f31`; gate E14 atendido. |
| 3 | Sprint 14 | E15 - Hardening V1.0 | `docs/specs/012-v1-acceptance.md` | completed | not released | Gate de aceite concluido; `V1.0 NÃƒÆ’O ACEITA`; PR #24 registra 13 criterios pendentes e a remediacao proposta. |
| 4 | Sprint 15 | E16 - Pipeline Editorial Operavel pelo Frontend | `docs/specs/016-sprint-15-editorial-profile-ideas-research.md` | completed | not released | PR #26 entregou H16.0, H16.1 e H16.2; a fatia complementar da Sprint 16 concluiu H16.3 e H16.4. |
| 5 | Sprint 16 | E16 - Pipeline Editorial Operavel pelo Frontend | `docs/specs/017-sprint-16-scripts-visual-planning.md` | completed | not released | PR desta execucao entregou H16.3 e H16.4; E16 concluido. |
| 6 | Sprint 17 | E17 - Pipeline Midia e Producao Operavel pelo Frontend | `docs/specs/018-sprint-17-narration-media-assets.md` | completed | not released | PR #28 entregou H17.1 e H17.2 com API real, reload, auditoria, isolamento e evidencia browser. |
| 7 | Sprint 18 | E17 - Pipeline Midia e Producao Operavel pelo Frontend | `docs/specs/019-sprint-18-render-derived-clips.md` | completed and integrated by PR #30 | not released | Segunda fatia de E17; H17.3 e H17.4 integradas com render, cortes, reload, auditoria e isolamento. |
| 8 | Sprint 19 | E18 - Governanca e Publicacao Assistida pelo Frontend | `docs/specs/020-sprint-19-governance-gates.md` | merged in PR #32 | not released | H18.1, H18.2 e H18.3 concluidas com mutacoes reais, auditoria requestId, reload, isolamento, E2E e screenshots. |
| 9 | Sprint 20 | E18 - Governanca e Publicacao Assistida pelo Frontend | `docs/specs/021-sprint-20-assisted-publication.md` | merged in PR #33 | not released | H18.4; pacote de publicacao com confirmacao humana, readiness e sem auto-send. |

## Sprint 12 - Integracoes Reais Autorizadas

- PR #22 e o merge commit `6690008aa92749415838f97f10a4b407301f2233`.
- O gate real foi validado em 2026-07-15: autorizacao, descoberta e selecao
  server-side, upload privado/nao listado, consulta, replay idempotente,
  isolamento e revogacao.
- A policy operacional foi restaurada apos a validacao.
- YouTube permanece a unica integracao externa aprovada para E13; Analytics nao
  foi incluido operacionalmente.

## Sprint 13 - Metricas e Aprendizado

| Campo | Valor |
| --- | --- |
| Numero | Sprint 13 |
| Epic principal | E14 - Metricas e Aprendizado |
| Spec governante | `docs/specs/014-metrics-learning.md` |
| Objetivo | Registrar metricas por canal e gerar aprendizado editorial assistido sem antecipar V1 Acceptance. |
| Estado | completed |
| Gate de inicio | Atendido: S12 encerrada; metricas controladas, contratos, canais, isolamento e regra de recomendacao formalizados. |
| Historias | H14.1 registro; H14.2 consulta/agregacao; H14.3 aprendizado assistido; H14.4 dashboard real. |
| Fora de escopo | Analytics/OAuth novo, scraping, novos provedores, IA externa, aplicacao automatica, hardening e V1 Acceptance. |
| Gate de conclusao | Atendido: metricas persistidas geram recomendacao editorial por canal, com procedencia, auditoria, evidencias e frontend real; PR #23 mergeada. |

## Sprint 14 - V1 Acceptance

- Sprint 14 executada em 2026-07-15 na branch `codex/sprint-14-v1-acceptance`, a partir de `d78959a47a2bafbb343408d703eafafec8c6df59`.
- S12 e S13 foram confirmadas como encerradas no preflight.
- O gate concluiu com veredito `V1.0 NÃƒÆ’O ACEITA`; 5 criterios passaram, 5 falharam e 8 ficaram sem prova suficiente.
- A remediacao foi formalizada no backlog como proposta, sem iniciar sprint ou implementaÃƒÂ§ÃƒÂ£o.
- E15 foi executado como gate documental; V1.0 nÃƒÂ£o estÃƒÂ¡ liberada para release.

## Proposta de remediacao apos Sprint 14

- Epic selecionado: E16 - Pipeline Editorial Operavel pelo Frontend.
- Iniciativa: Remediacao da Operabilidade da V1.
- CritÃƒÂ©rios V1 mapeados: V1-03, V1-04, V1-05, V1-06; V1-02 apenas como dependencia de perfil editorial.
- Itens R14 mapeados: R14-03, R14-04, R14-05, R14-06; R14-02 como dependencia upstream.
- Historias propostas: H16.0 a H16.4.
- Sequencia sugerida: Sprint 15 para H16.0-H16.2; Sprint 16 para H16.3-H16.4.
- Estado: planejamento documental concluido, sem inicio de remediacao, sem sprint iniciada e sem novo V1 Acceptance.
- Reaceite futuro: somente apos evidencias front-end reais, persistencia, auditoria e isolamento por canal.

## Proposta de remediacao consolidada

| Ordem | Epic | Escopo principal | Tipo | Dependencias | Resultado esperado |
| --- | --- | --- | --- | --- | --- |
| Sprint 15 | E16 - Pipeline Editorial Operavel pelo Frontend | V1-02 a V1-04 | funcional + frontend + UX | E16 depende do canal ativo e dos contratos editoriais | perfil editorial, pauta, pesquisa, fontes e claims operaveis |
| Sprint 17 | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-07 a V1-08 | funcional + frontend + backend + integracao | E16 concluida | narracao e ativos visuais operaveis |
| Sprint 18 (entregue pela PR #30) | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-09 a V1-10 | funcional + frontend + backend + integracao | Sprint 17 concluida | render e cortes operaveis com reload, auditoria e isolamento |
| Sprint 19 | E18 - Governanca e Publicacao Assistida pelo Frontend | V1-11 a V1-13 | funcional + frontend + backend + governance | E17 concluida | mergeada pela PR #32 |
| Sprint 20 | E18 - Governanca e Publicacao Assistida pelo Frontend | V1-14 | funcional + frontend + backend + governance | Sprint 19 aceita | mergeada pela PR #33; pacote com confirmacao humana e sem auto-send |
| Sprint proposta D | E19 - Cockpits Reais e Evidencias Transversais | R14-T01, R14-T02 | technical + evidence + QA | E16, E17 e E18 concluidos | dashboard e escritorio de agentes reais, mais evidencias reutilizaveis |
| Gate final | R14-REACCEPT | V1-01..V1-18 | evidence / reaccept | E16, E17, E18, E19 concluidos | novo V1 Acceptance com prova nova no mesmo head |

## Condicoes para iniciar R14-REACCEPT

- E16 concluido e evidenciado.
- E17 concluido e evidenciado.
- E18 concluido e evidenciado.
- E19 concluido e evidenciado.
- Mapa de criterio e rastreabilidade fechados para V1-01..V1-18.
- QA visual e browser E2E repetiveis no mesmo head.
- Nenhum segredo novo, nenhum mock residual nas superficies de cockpit e nenhum conflito de escopo aberto.

## Observacoes

- Esta pagina nao substitui specs.
- Mudanca material de escopo exige atualizacao documental antes do codigo.
- Nenhuma limpeza administrativa ou remocao da branch da Sprint 12 pertence a S13.

## Sprint 15 - Editorial Profile, Ideas and Research

- Epic: E16 - Pipeline Editorial Operavel pelo Frontend.
- Spec normativa: `docs/specs/016-sprint-15-editorial-profile-ideas-research.md`.
- Estado: completed.
- Objetivo: entregar H16.0, H16.1 e H16.2 como primeira fatia funcional do E16.
- Escopo: perfil editorial, pautas, pesquisa, fontes e claims.
- Fora de escopo: H16.3, H16.4, media, render, clips, governanca, publicacao, dashboard, agent office e novo V1 Acceptance.
- Resultado: H16.0, H16.1 e H16.2 entregues no head da PR #26; H16.3 e H16.4 continuam pendentes.
- Sequencia posterior: Sprint 17 executa H17.1 e H17.2; Sprint 18 conclui H17.3 e H17.4; E18 e E19 seguem somente apos o E17 ser completado.

## Sprint 17 - Narration and Visual Assets

- Epic: E17 - Pipeline Midia e Producao Operavel pelo Frontend.
- Spec normativa: `docs/specs/018-sprint-17-narration-media-assets.md`.
- Estado: completed pela PR #28.
- Resultado: H17.1 e H17.2 entregues com create/update real, reload no mesmo processo, auditoria e isolamento por canal.
- Evidencia: `scripts/sprint17-browser-e2e.mjs` e `screenshots/sprint-17/`.
- Pendente: E18, E19 e `R14-REACCEPT` seguem pendentes.
- V1.0 permanece `NAO ACEITA`; nenhum reaceite ou release foi executado.

## Sprint 18 - Render and Derived Clips

- Epic: E17 - Pipeline Midia e Producao Operavel pelo Frontend.
- Spec normativa: `docs/specs/019-sprint-18-render-derived-clips.md`.
- Estado: completed and integrated by PR #30.
- Historias: H17.3 e H17.4.
- Criterios V1: V1-09 e V1-10.
- Itens R14: R14-09 e R14-10.
- Escopo: render controlado em `/videos`, video resultante, cortes derivados em `/clips`, intervalos, auditoria, reload e isolamento.
- Fora de escopo: E18, E19, reaceite, release, tag, deploy, banco e migrations.
- Gate: atendido com testes, E2E, screenshots e rastreabilidade das duas historias; E17 esta integrado em `main`.
- Evidencia: `node scripts/sprint18-browser-e2e.mjs`, `screenshots/sprint-18/`, 68 testes aprovados, auditoria correlacionada por `requestId`.
- V1-09/V1-10 receberam evidencia nova; nenhum V1 Acceptance formal foi executado.

## Sprint 19 - Governance Gates

- Epic: E18 - Governanca e Publicacao Assistida pelo Frontend.
- Spec normativa: `docs/specs/020-sprint-19-governance-gates.md`.
- Estado: proposed / not started.
- Historias: H18.1 qualidade, H18.2 compliance e H18.3 aprovacao humana.
- Criterios V1: V1-11, V1-12 e V1-13.
- Itens R14: R14-11, R14-12 e R14-13.
- Objetivo: tornar os gates de governanca operaveis pelo frontend, com mutacoes reais, reload no mesmo processo, isolamento, auditoria correlacionada por requestId e E2E browser.
- Fora de escopo: H18.4, publicacao, OAuth, upload externo, E19, reaceite, release, tag, deploy, banco e migrations.
- Definition of Ready: contratos revisados, caminho de criacao/consulta definido, requestId propagado ate auditoria, fixtures controladas e cenarios bloqueados planejados.
- Definition of Done: historias aceitas no mesmo head, testes backend/frontend/browser, screenshots, isolamento e auditoria verificaveis.

## Sprint 20 - Assisted Publication

- Epic: E18 - Governanca e Publicacao Assistida pelo Frontend.
- Spec normativa: `docs/specs/021-sprint-20-assisted-publication.md`.
- Estado: completed and integrated by PR #33.
- Historia: H18.4 publicacao assistida.
- Criterio V1: V1-14.
- Item R14: R14-14.
- Dependencia: gate da Sprint 19 aceito e integrado pela PR #32.
- Objetivo: preparar readiness ou pacote/draft de publicacao consultavel pelo frontend, sem auto-send ou chamada a provedor externo.
- Fora de escopo: OAuth, conexao ou upload YouTube, E19, reaceite, release, tag, deploy, banco e migrations.
- Definition of Ready: contratos de readiness e pacote revisados, limite no-auto-send instrumentado, requestId auditavel e fixtures de bloqueio/ready definidas.
- Definition of Done: pacote persistido no mesmo processo após confirmação humana, reload, isolamento, estados, auditoria requestId, E2E e screenshots aprovados; gate integrado pela PR #33.

## Sequencia recomendada apos E17

1. Sprint 19 mergeada: governanca e gates.
2. Sprint 20 mergeada pela PR #33: publicacao assistida sem auto-send.
3. E18 concluido apos os dois gates.
4. Sprint proposta D: E19, R14-T01 e R14-T02.
5. `R14-REACCEPT` somente depois de E16, E17, E18 e E19.

Sprint 20 está integrada pela PR #33. Nenhuma sprint seguinte foi iniciada. V1.0 permanece `NAO ACEITA`.
