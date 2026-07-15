# Codex Handoff - Sprint 13

## Estado atual

- Sprint 11 foi encerrada no PR #19.
- Sprint 12 - Integracoes Reais Autorizadas foi encerrada e mergeada no PR #22,
  commit `6690008aa92749415838f97f10a4b407301f2233`.
- A validacao real da S12 comprovou OAuth autorizado, descoberta e selecao
  server-side, upload privado/nao listado, consulta, replay idempotente,
  isolamento e revogacao; a policy foi restaurada.
- A Sprint 13 pertence ao E14 e e governada por `docs/specs/014-metrics-learning.md`.
- A Sprint 13 foi encerrada no PR #23, merge commit
  `9b89d1be04e7a6e319efb9a957282097c4854f31`.
- A Sprint 14/V1 Acceptance permanece planejada e nao pode ser iniciada aqui.

## Baseline e branch

- Branch inicial: `main`.
- SHA inicial: `6690008aa92749415838f97f10a4b407301f2233`.
- `main` e `origin/main` alinhadas, divergencia `0 0`.
- Working tree limpo e sem worktrees adicionais.
- Branch de trabalho: `codex/sprint-13-metrics-learning` (PR #23 mergeada e branch
  removida no encerramento).

## Objetivo e gate

Registrar metricas por canal, consultar/agregar os dados e gerar recomendacoes
editoriais deterministicas, explicaveis e auditaveis.

Gate: metricas geram recomendacao editorial por canal.

## Historias

- H14.1 - Registro controlado de metricas por conteudo.
- H14.2 - Consulta e agregacao canal-scoped.
- H14.3 - Aprendizado editorial assistido.
- H14.4 - Dashboard operacional de metricas e recomendacoes.

## Decisoes operacionais

- Origem desta Sprint: registro controlado pela API, com `manual`, `imported`,
  `demo` e `fixture` explicitamente identificados.
- YouTube Analytics nao sera conectado; nenhum escopo OAuth novo sera solicitado.
- Metricas aprovadas: views, reach, average watch seconds, completion rate,
  shares, saves, comments e followers gained. Receita nao entra.
- Persistencia: repository JSON atomico existente em
  `ARALUME_ASSET_STORAGE_ROOT`, arquivo `metrics.json`.
- Idempotencia: `channelId + idempotencyKey`, replay identico e conflito para
  payload divergente.
- Analise: regra local `metrics-learning-v1`, sem IA externa, com evidencias,
  baseline, confianca e limitacoes.
- Recomendacoes nunca alteram regras editoriais automaticamente.
- Custos externos: zero nesta fatia; policy operacional nao sera alterada.

## Contratos

- `POST /api/metrics`
- `GET /api/metrics`
- `GET /api/metrics/:metricId`
- `GET /api/metrics/summary`

Todos exigem `channelId` quando aplicavel, envelopes oficiais, requestId, validacao
de referencias e erros sanitizados.

## Fora de escopo

Scraping, Analytics/OAuth novo, novos provedores, IA externa, receita, aplicacao
automatica de recomendacoes, banco/migration SQL, hardening, V1 Acceptance,
recriacao do frontend e limpeza administrativa da S12.

## Evidencias esperadas

- Testes de dominio e HTTP para registro, origem, valores, referencias, idempotencia,
  persistencia, filtros, agregacao, recomendacao, insuficiencia e isolamento.
- `/metrics` sem import de mocks e consumindo API real.
- Validacao de reload, auditoria sanitizada e ausencia de segredos.
- QA visual em 1366x768, 1600x900, 1792x1024 e 1920x1080, incluindo sidebar,
  estados vazios, parciais, erro e recomendacao.
- Quality gates do package.json, `git diff --check` e PR #23 mergeada.

## Riscos

- Dados controlados nao podem parecer producao: origem deve ser exibida.
- Canal, conteudo, publicacao, video, cache e auditoria devem permanecer isolados.
- Dados insuficientes nao podem resultar em recomendacao falsa.
- A regra nao demonstra causalidade; deve comunicar sinal e limitacoes.

## Definition of Done

H14.1-H14.4 implementadas, documentacao coerente, testes adicionais passando sem
reduzir os 56 existentes, persistencia e isolamento demonstrados, QA visual feito,
PR #23 revisada e mergeada por merge commit. Sprint 14 nao foi iniciada.
