# Product Backlog

This backlog is an index of planning. It does not replace sprint specs.

## Catalogo de epicos

| ID  | Epico                        | Objetivo                                                                                                | Status  | Gate | Dependencias |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------- | ---- | ------------ |
| E10 | Renderizacao Controlada      | Entregar a primeira capacidade real, controlada e auditavel de renderizacao de video.                  | completed | Renderizar video curto de teste com logs, custo e validacao. | - |
| E11 | Cortes Derivados Controlados | Entregar cortes derivados persistentes, rastreaveis e vinculados ao video principal.                   | completed | Gerar pelo menos um corte valido vinculado ao video principal. | - |
| E12 | Publicacao Assistida         | Preparar publicacao com aprovacao humana, compliance e contratos seguros, sem envio externo automatico. | completed | Pacote de publicacao pronto, sem envio externo automatico. | E10, E11 |
| E13 | Integracoes Reais Autorizadas | Conectar provedores externos com governanca, autorizacao e seguranca documental.                        | planned | Integracao oficial funcionando sem expor segredo. | E12 concluido; decisao documental sobre provedores ou plataformas abrangidos |
| E14 | Metricas e Aprendizado       | Fechar o ciclo editorial com metricas por canal e recomendacoes assistidas.                             | planned | Metricas geram recomendacao editorial por canal. | E13 concluido; origem das metricas e canais definidos |
| E15 | Hardening V1.0               | Consolidar a base operacional demonstravel para V1.0.                                                   | planned | Demonstracao ponta a ponta pelo frontend; decisao binaria V1.0 aceita ou V1.0 nao aceita. | E13 e E14 concluidos |

## Sprints formalizadas

| Numero | Nome | Epico | Spec | Estado | Observacao |
| --- | --- | --- | --- | --- | --- |
| S11 | Publicacao Assistida | E12 | `docs/specs/011-publication-assisted.md` | completed | Capacidade materializada e encerrada. |
| S12 | Integracoes Reais Autorizadas | E13 | `docs/specs/015-authorized-real-integrations.md` | planned | Proxima sprint executavel; depende da decisao documental sobre os provedores ou plataformas abrangidos. |
| S13 | Metricas e Aprendizado | E14 | `docs/specs/014-metrics-learning.md` | planned | Posterior a Sprint 12; depende da integracao real autorizada. |
| S14 | V1 Acceptance | E15 | `docs/specs/012-v1-acceptance.md` | planned | Posterior a Sprints 12 e 13; gate de hardening e aceite da V1.0. |

## Catalogo de historias

| ID    | Epico | Historia                                                  | Prioridade | Dependencias                                                                                                                                                              | Sprint | Status    |
| ----- | ----- | --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| H11.1 | E12   | Catalogo de alvos de publicacao e readiness da plataforma | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/007-costs-operational-modes.md`, `docs/specs/008-media-assets-storage.md`, `docs/specs/011-publication-assisted.md` | S11    | completed |
| H11.2 | E12   | Modelo de job de publicacao e rastreio de estados         | P1         | `docs/specs/011-publication-assisted.md`, `docs/FRONTEND_API_CONTRACTS.md`                                                                                                | S11    | completed |
| H11.3 | E12   | Preparacao assistida de payload e agendamento             | P1         | `docs/specs/008-media-assets-storage.md`, `docs/specs/009-rendering.md`, `docs/specs/011-publication-assisted.md`                                                         | S11    | completed |
| H11.4 | E12   | Gate de aprovacao e compliance para publicacao            | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/011-publication-assisted.md`                                                                                        | S11    | completed |

## Observacoes

- Nao usar story points.
- Nao usar estimativa de velocidade.
- Nao duplicar criterios completos das specs.
- Quando uma historia nao estiver pronta para sprint, manter o status apropriado no backlog e atualizar a spec antes de implementacao.
- Sprint 12 pertence ao E13 e nao a V1 Acceptance.
- Sprint 13 pertence ao E14.
- Sprint 14 pertence ao E15 / V1 Acceptance.
