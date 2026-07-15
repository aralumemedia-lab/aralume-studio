# Spec 014 - Metrics and Editorial Learning

## Status

Planejada.

## Identification

- Spec ID: `014-metrics-learning.md`
- Sprint number: 13
- Sprint name: Metricas e Aprendizado
- Epic principal: E14 - Metricas e Aprendizado
- Roadmap relation: esta spec governa a Sprint 13 e vem depois do encerramento comprovado da Sprint 12.
- Relacao historica: a Fase 12 do roadmap e Publicacao Assistida e foi materializada na Sprint 11.

## Objective

Definir metricas de performance e aprendizado editorial por canal, sem incorporar hardening ou aceite da V1.0.

## Context

A Aralume deve registrar resultados de conteudo e usar esses dados para orientar decisoes editoriais futuras, sem automatizar decisoes criticas sem aprovacao.

Esta sprint depende da existencia de uma base de integracao real autorizada. Sem a Sprint 12 encerrada, os dados de origem e a governanca necessaria para aprendizado nao ficam suficientemente definidos.

## Distincao entre identificadores

- **Fase do roadmap**: linha historica de capacidade do produto no Documento Mestre.
- **Sprint de execucao**: unidade sequencial de entrega e integracao.
- **Spec**: contrato normativo da sprint.
- Os numeros podem divergir.
- A Fase 14 do roadmap nao e a Sprint 14.
- A Sprint 13 pertence ao E14 e usa esta spec como contrato normativo.

## Dependencias

- Sprint 11 - Publicacao Assistida deve estar encerrada.
- Sprint 12 - Integracoes Reais Autorizadas deve estar encerrada.
- A definicao de origem de metricas e de canais integrados deve estar formalizada.
- A origem documental aprovada para a futura leitura automatizada de metricas e o YouTube Analytics API, sem obrigar sua implementacao nesta sprint.
- A documentacao de V1 Acceptance permanece downstream e nao substitui esta spec.

## Histórias incluidas

- Registro de metricas por conteudo.
- Agregacoes por canal.
- Aprendizado editorial assistido.
- Dashboards e leitura operacional.
- Distincao entre metricas manuais e importadas.
- Documentacao de origem e auditoria.

## Historias nao incluidas

- Scraping sem autorizacao.
- APIs externas sem spec.
- Integracoes novas que nao estejam aprovadas na documentacao oficial.
- Decisoes editoriais irreversiveis automaticas.
- IA real sem custos e gates.
- Hardening ou aceite da V1.0.
- Implementacao de integracoes reais novas.

## Pre-condicoes

- Canais implementados.
- Publicacao assistida definida.
- Integracao real autorizada definida e encerrada na Sprint 12.
- Pipeline editorial definido.
- Custos definidos.

## Gate de inicio

A implementacao da Sprint 13 somente pode comecar quando todos os itens abaixo estiverem verdadeiros:

- a normalizacao documental tiver sido mergeada em `main`;
- `main` estiver limpa e alinhada com `origin/main`;
- a Sprint 12 estiver comprovadamente encerrada;
- esta spec estiver formalizada como governante da Sprint 13;
- a base de metricas e aprendizado estiver explicitamente vinculada a canais e fontes reais;
- nao houver conflito entre Documento Mestre, roadmap, backlog e handoff.

## Escopo

- `PerformanceMetric`.
- Metricas por conteudo.
- Agregacoes por canal.
- Aprendizado editorial assistido.
- Dashboards.
- Documentacao.
- Leitura auditavel da procedencia das metricas.

## Fora de escopo

- Scraping sem autorizacao.
- APIs externas sem spec.
- Decisoes editoriais irreversiveis automaticas.
- IA real sem custos e gates.
- Hardening/V1 Acceptance.
- Criacao de novos provedores ou novos fluxos de autorizacao.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/011-publication-assisted.md`
- `docs/specs/012-v1-acceptance.md`
- `docs/specs/015-authorized-real-integrations.md`

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
- Validar que a origem da metricas nao mistura canais.

## Critérios de aceite

- Modelo de metricas existe.
- Dados por canal.
- Documentacao atualizada.
- Sem API externa nao autorizada.
- Validacoes passam.
- A saida desta sprint permanece coerente com a futura Sprint 14 de V1 Acceptance.

## Definition of Done

- O contrato da Sprint 13 esta explicitado sem ambiguidade.
- O inicio da sprint depende dos gates documentais definidos acima.
- O resultado final e reproduzivel e auditavel.
- A documentacao necessaria permanece coerente com Documento Mestre, roadmap, backlog, handoff e spec de V1 Acceptance.
- Nenhum segredo foi exposto.
- Nenhum comportamento de produto foi implementado nesta execucao documental.

## Sprint alvo

Sprint 13 - Metricas e Aprendizado.
