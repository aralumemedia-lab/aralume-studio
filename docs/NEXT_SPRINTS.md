# Next Sprints

## Modelo de planejamento a partir da Sprint 11

- O Documento Mestre passa a ser lido por epicos, nao por sprints.
- A Sprint 11 e a primeira sprint formalizada no modelo novo.
- Epico, sprint, historia e spec sao identificadores diferentes.
- Nao assumir que numero de sprint corresponde ao numero da spec.
- Nao assumir que fase do Documento Mestre corresponde ao numero da sprint.
- `docs/specs/010-publication-assisted.md` nao existe; o identificador correto e `docs/specs/011-publication-assisted.md`.

## Resolucao do conflito de numeracao

| Epico                        | Sprint historica / atual | Spec normativa                           | Observacao                                             |
| ---------------------------- | ------------------------ | ---------------------------------------- | ------------------------------------------------------ |
| Renderizacao Controlada      | Sprint 9                 | `docs/specs/009-rendering.md`            | Capacidade concluida; funciona como epico estrategico. |
| Cortes Derivados Controlados | Sprint 10                | `docs/specs/010-derived-clips.md`        | Capacidade concluida; funciona como epico estrategico. |
| Publicacao Assistida         | Sprint 11                | `docs/specs/011-publication-assisted.md` | Primeira sprint formalizada no novo modelo.            |

## Catalogo de epicos

| ID  | Epico                         | Objetivo                                                                                                | Status    | Dependencias                                                                                | Gate final                                                     | Sprints planejadas |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| E10 | Renderizacao Controlada       | Entregar a primeira capacidade real, controlada, reproduzivel e auditavel de renderizacao de video.     | completed | Assets de midia, validacao de storage, custos, compliance e modo operacional.               | Renderizar video curto de teste com logs, custos e validacao.  | S9                 |
| E11 | Cortes Derivados Controlados  | Entregar cortes derivados persistentes, rastreaveis e vinculados ao video principal.                    | completed | Renderizacao controlada, assets de midia, validacao temporal, custos e auditoria.           | Gerar pelo menos um corte valido vinculado ao video principal. | S10                |
| E12 | Publicacao Assistida          | Preparar publicacao com aprovacao humana, compliance e contratos seguros, sem envio externo automatico. | completed | Aprovacoes, compliance, custos, modo operacional, video pronto e contratos de publicacao. | Pacote de publicacao pronto, sem envio externo automatico.     | S11                |
| E13 | Integracoes Reais Autorizadas | Conectar provedores externos com governanca, autorizacao e seguranca documental.                        | planned   | Publicacao assistida e aprovacao de credenciais.                                            | Integracao oficial funcionando sem expor segredo.              | TBD                |
| E14 | Metricas e Aprendizado        | Fechar o ciclo editorial com metricas por canal e recomendacoes assistidas.                             | planned   | Publicacao assistida e consolidacao de canal.                                               | Metricas geram recomendacao editorial por canal.               | TBD                |
| E15 | Hardening V1.0                | Consolidar a base operacional demonstravel para V1.0.                                                   | planned   | Epicos anteriores concluidos e docs coerentes.                                              | Demonstracao ponta a ponta pelo frontend.                      | TBD                |

## Sprints futuras formalizadas

| Numero | Nome                 | Epico | Objetivo                                                                                                          | Historias incluidas        | Historias nao incluidas                                                                                                             | Dependencias                                                                                                                                                                                             | Resultado demonstravel                                                                                         | Gate                                                       | Status    |
| ------ | -------------------- | ----- | ----------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------- |
| S11    | Publicacao Assistida | E12   | Preparar publicacao assistida com aprovacao humana, compliance e contratos seguros, sem envio externo automatico. | H11.1, H11.2, H11.3, H11.4 | Publicacao automatica sem humano; automacao de browser; envio externo automatico; conteudo bloqueado; contratos novos fora da spec. | `docs/specs/006-approvals-compliance.md`, `docs/specs/007-costs-operational-modes.md`, `docs/specs/008-media-assets-storage.md`, `docs/specs/009-rendering.md`, `docs/specs/011-publication-assisted.md` | Operador prepara pacote de publicacao e acompanha status de aprovacao/compliance sem envio externo automatico. | Pacote de publicacao pronto, sem envio externo automatico. | completed |

## Historia planejada da Sprint 11

| ID    | Epico | Historia                                                  | Prioridade | Dependencias                                                                                                                    | Sprint | Status    |
| ----- | ----- | --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| H11.1 | E12   | Catalogo de alvos de publicacao e readiness da plataforma | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/007-costs-operational-modes.md`, `docs/specs/011-publication-assisted.md` | S11    | completed |
| H11.2 | E12   | Modelo de job de publicacao e rastreio de estados         | P1         | `docs/specs/011-publication-assisted.md`, `docs/FRONTEND_API_CONTRACTS.md`                                                      | S11    | completed |
| H11.3 | E12   | Preparacao assistida de payload e agendamento             | P1         | `docs/specs/009-rendering.md`, `docs/specs/011-publication-assisted.md`                                                         | S11    | completed |
| H11.4 | E12   | Gate de aprovacao e compliance para publicacao            | P1         | `docs/specs/006-approvals-compliance.md`, `docs/specs/011-publication-assisted.md`                                              | S11    | completed |

## Historico preservado

- Sprint 10 - Cortes Derivados Controlados foi concluida e integrada ao `main` via PR #17.
- O merge commit oficial da Sprint 10 e `dffd197449176fffab6ad6b93b6dfb0904cca513`.
- A rota `/clips` faz parte do fluxo operacional real e nao depende de mocks crus.
- Sprint 9 - Renderizacao Controlada foi concluida e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- Sprint 5 - Editorial Pipeline foi concluida formalmente e integrada ao `main`.
- O merge commit oficial e `9d6393738cb26264b876fe6b9e43f1435fc3a229`.
- Sprint 4 - Channels Frontend Integration foi concluida e integrada ao `main` via PR #10.
- O merge commit oficial e `3ee439ca7e0ae414a68a459ab9fcba650e076148`.
- Sprint 3 - Channels Domain Foundation foi concluida e integrada ao `main` via PR #8.
- O merge commit oficial e `6bf1bfec40cafaa7d2228f040745127e7ede9041`.
- Sprint 2 - Backend Foundation foi concluida e integrada ao `main` via PR #6.
- O merge commit oficial e `20b7c503761840910d78ceec604d9f8de55c3e84`.
- Sprint 0.3 foi documental e nao introduziu backend ou alteracao funcional de frontend.
- Sprint 0.2 consolidou a preparacao segura de variaveis de ambiente.

## Observacoes

- Esta pagina de planejamento nao substitui specs.
- Mudanca de escopo exige atualizacao documental antes de implementacao.
- Nao registrar conclusao de sprint sem evidencia concreta.
- Nao antecipar historias futuras fora da Sprint 11 sem atualizar a spec e o backlog.
- Referencias a Sprint 12 em specs posteriores permanecem downstream e nao alteram a formalizacao da Sprint 11.
