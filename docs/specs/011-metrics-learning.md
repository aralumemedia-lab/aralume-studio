# Spec 011 - Metrics and Editorial Learning

## Status
Planejada.

## Objetivo
Definir metricas de performance e aprendizado editorial por canal.

## Contexto
A Aralume deve registrar resultados de conteudo e usar esses dados para orientar decisoes editoriais futuras, sem automatizar decisoes criticas sem aprovacao.

## Pre-condicoes
- Canais implementados.
- Publicacao assistida definida.
- Pipeline editorial definido.
- Custos definidos.

## Escopo
- `PerformanceMetric`.
- Metricas por conteudo.
- Agregacoes por canal.
- Aprendizado editorial assistido.
- Dashboards.
- Documentacao.

## Fora de escopo
- Scraping sem autorizacao.
- APIs externas sem spec.
- Decisoes editoriais irreversiveis automaticas.
- IA real sem custos e gates.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/010-publication-assisted.md`

## Entidade minima
### PerformanceMetric
- `id`
- `channelId`
- `contentId`
- `platform`
- `metricName`
- `metricValue`
- `capturedAt`

## Metricas sugeridas
- views
- watch time
- retention
- likes
- comments
- shares
- CTR
- subscribers gained
- revenue estimate, se existir fonte autorizada

## Regras obrigatorias
- Metricas devem ser vinculadas a canal.
- Fonte da metrica deve ser clara.
- Dados manuais e dados via API devem ser distinguiveis.
- Aprendizado editorial deve ser auditavel.
- Recomendacoes nao devem substituir aprovacao humana.

## Endpoints esperados
- `GET /api/metrics`
- `GET /api/metrics/:metricId`
- `GET /api/metrics/summary`
- `GET /api/channels/:channelId/metrics`

## Validacoes
- Registrar metrica manual.
- Registrar metrica importada.
- Diferenciar origem.
- Agregar por canal.

## Critrios de aceite
- Modelo de metricas existe.
- Dados por canal.
- Documentacao atualizada.
- Sem API externa nao autorizada.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 12 - V1 Acceptance.

