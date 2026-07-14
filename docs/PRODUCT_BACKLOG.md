# Product Backlog

This backlog is an index of planning. It does not replace sprint specs.

## Catálogo de epicos

| ID  | Epico                         | Objetivo                                                                                                | Status    | Gate                                                           |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| E10 | Renderizacao Controlada       | Entregar a primeira capacidade real, controlada e auditavel de renderizacao de video.                   | completed | Renderizar video curto de teste com logs, custo e validacao.   |
| E11 | Cortes Derivados Controlados  | Entregar cortes derivados persistentes, rastreaveis e vinculados ao video principal.                    | completed | Gerar pelo menos um corte valido vinculado ao video principal. |
| E12 | Publicacao Assistida          | Preparar publicacao com aprovacao humana, compliance e contratos seguros, sem envio externo automatico. | planned   | Pacote de publicacao pronto, sem envio externo automatico.     |
| E13 | Integracoes Reais Autorizadas | Conectar provedores externos com governanca, autorizacao e seguranca documental.                        | planned   | Integracao oficial funcionando sem expor segredo.              |
| E14 | Metricas e Aprendizado        | Fechar o ciclo editorial com metricas por canal e recomendacoes assistidas.                             | planned   | Metricas geram recomendacao editorial por canal.               |
| E15 | Hardening V1.0                | Consolidar a base operacional demonstravel para V1.0.                                                   | planned   | Demonstracao ponta a ponta pelo frontend.                      |

## Catálogo de historias

| ID    | Epico | Historia                                                  | Prioridade | Dependencias                                                                                                                                                              | Sprint | Status |
| ----- | ----- | --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| H11.1 | E12   | Catalogo de alvos de publicacao e readiness da plataforma | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/007-costs-operational-modes.md`, `docs/specs/008-media-assets-storage.md`, `docs/specs/011-publication-assisted.md` | S11    | ready  |
| H11.2 | E12   | Modelo de job de publicacao e rastreio de estados         | P1         | `docs/specs/011-publication-assisted.md`, `docs/FRONTEND_API_CONTRACTS.md`                                                                                                | S11    | ready  |
| H11.3 | E12   | Preparacao assistida de payload e agendamento             | P1         | `docs/specs/008-media-assets-storage.md`, `docs/specs/009-rendering.md`, `docs/specs/011-publication-assisted.md`                                                         | S11    | ready  |
| H11.4 | E12   | Gate de aprovacao e compliance para publicacao            | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/011-publication-assisted.md`                                                                                        | S11    | ready  |

## Observacoes

- Não usar story points.
- Não usar estimativa de velocidade.
- Não duplicar criterios completos das specs.
- Quando uma historia nao estiver pronta para sprint, manter o status apropriado no backlog e atualizar a spec antes de implementacao.
