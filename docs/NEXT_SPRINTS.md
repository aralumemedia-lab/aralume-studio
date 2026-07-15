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
| 2 | Sprint 13 | E14 - Metricas e Aprendizado | `docs/specs/014-metrics-learning.md` | in progress | released | Sprint 12 encerrada; origem controlada e recomendacao deterministica formalizadas na Spec 014 e ADR 003. |
| 3 | Sprint 14 | E15 - Hardening V1.0 | `docs/specs/012-v1-acceptance.md` | planned | blocked until S12/S13 | As Sprints 12 e 13 precisam estar encerradas com evidencia; V1 Acceptance nao faz parte desta execucao. |

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
| Estado | in progress |
| Gate de inicio | Atendido: S12 encerrada; metricas controladas, contratos, canais, isolamento e regra de recomendacao formalizados. |
| Historias | H14.1 registro; H14.2 consulta/agregacao; H14.3 aprendizado assistido; H14.4 dashboard real. |
| Fora de escopo | Analytics/OAuth novo, scraping, novos provedores, IA externa, aplicacao automatica, hardening e V1 Acceptance. |
| Gate de conclusao | Metricas persistidas geram recomendacao editorial por canal, com procedencia, auditoria, evidencias e frontend real. |

## Sprint 14 - V1 Acceptance

- Permanece planejada e nao foi iniciada.
- Depende do encerramento comprovado das Sprints 12 e 13.
- A spec 012 continua downstream e nao autoriza implementar hardening nesta Sprint.

## Observacoes

- Esta pagina nao substitui specs.
- Mudanca material de escopo exige atualizacao documental antes do codigo.
- Nenhuma limpeza administrativa ou remocao da branch da Sprint 12 pertence a S13.
