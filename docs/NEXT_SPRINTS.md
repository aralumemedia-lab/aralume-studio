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
| 3 | Sprint 14 | E15 - Hardening V1.0 | `docs/specs/012-v1-acceptance.md` | in_progress | candidate | S12 e S13 estao encerradas; a execucao de aceite foi aberta na branch `codex/sprint-14-v1-acceptance`. |

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

- Execucao aberta em 2026-07-15 na branch `codex/sprint-14-v1-acceptance`, a partir de `d78959a47a2bafbb343408d703eafafec8c6df59`.
- S12 e S13 foram confirmadas como encerradas no preflight.
- O candidato recebeu o veredito `V1.0 NÃO ACEITA`; bloqueios e evidencias estao em `docs/acceptance/v1/`.
- A execucao permanece limitada a evidencia, hardening seguro e documentacao.

## Observacoes

- Esta pagina nao substitui specs.
- Mudanca material de escopo exige atualizacao documental antes do codigo.
- Nenhuma limpeza administrativa ou remocao da branch da Sprint 12 pertence a S13.
