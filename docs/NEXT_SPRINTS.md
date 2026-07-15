# Next Sprints

## Regras de sequenciamento

- O Documento Mestre passa a ser lido por epicos, nao por sprints.
- Epico, sprint, fase e spec sao identificadores diferentes.
- Nao assumir que o numero de sprint corresponde ao numero da spec.
- Nao assumir que a fase do Documento Mestre corresponde ao numero da sprint.
- A Fase 12 do roadmap materializou-se na Sprint 11 e esta encerrada.
- A Sprint 12 e a proxima sprint executavel.
- A Sprint 12 corresponde ao E13 e e governada por `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 13 corresponde ao E14 e e governada por `docs/specs/014-metrics-learning.md`.
- A Sprint 14 corresponde ao E15 - Hardening V1.0 e e governada por `docs/specs/012-v1-acceptance.md`.
- `docs/specs/012-v1-acceptance.md` nao governa a Sprint 12.

## Fila operacional

| Ordem | Sprint | Epico | Spec normativa | Status | Liberacao | Dependencias |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sprint 12 | E13 - Integracoes Reais Autorizadas | `docs/specs/015-authorized-real-integrations.md` | next / correcao documental concluida | ready for corrective implementation | `main` limpo e alinhado com `origin/main`; Sprint 11 encerrada; ADR 002 emendado; spec 015, contratos, backlog e handoff alinhados; OAuth aprovado com `youtube.upload` + `youtube.readonly`; reautorizacao e validacao real ainda pendentes. |
| 2 | Sprint 13 | E14 - Metricas e Aprendizado | `docs/specs/014-metrics-learning.md` | planned | bloqueada ate o encerramento da Sprint 12 | Sprint 12 encerrada; integracoes reais autorizadas disponiveis como base; origem de metricas e canais definidos. |
| 3 | Sprint 14 | E15 - Hardening V1.0 | `docs/specs/012-v1-acceptance.md` | planned | bloqueada ate o encerramento das Sprints 12 e 13 | Sprints 12 e 13 encerradas; pre-requisitos da V1.0 identificados; documento mestre, backlog e handoff sem conflito. |

## Sprint 11 encerrada

- Sprint 11 foi implementada na branch `codex/sprint-11-publication-assisted`.
- PR: `https://github.com/aralumemedia-lab/aralume-studio/pull/19`.
- Merge commit: `966e5bef50446f81701cedd861689b3e07b14a7d`.
- A rota `/publications` consome backend real de publicacoes, com alvos, jobs, aprovacao humana, conformidade, auditoria e bloqueio de envio externo automatico.
- A capa normativa desta sprint e `docs/specs/011-publication-assisted.md`.
- A sprint 11 encerra a materializacao da Fase 12 do roadmap.

## Sprint 12 - Integracoes Reais Autorizadas

| Campo | Valor |
| --- | --- |
| Numero | Sprint 12 |
| Nome | Integracoes Reais Autorizadas |
| Epic principal | E13 - Integracoes Reais Autorizadas |
| Spec governante | `docs/specs/015-authorized-real-integrations.md` |
| Objetivo | Habilitar integracoes reais autorizadas, seguras, auditaveis e isoladas por canal. |
| Estado | next / correcao documental concluida |
| Liberacao | ready for corrective implementation |
| Gate de inicio | `main` limpo e alinhado com `origin/main`, Sprint 11 encerrada, ADR 002 emendado, spec 015 formalizada, finalidade/permissoes/autorizacao/revogacao/contratos documentados e sem conflito documental. A correção funcional deve solicitar somente `youtube.upload` + `youtube.readonly`. |
| Historias incluidas | Autorizacao humana documentada; estado de integracao por canal; armazenamento seguro de tokens e segredos; revogacao auditavel; estados de erro operacionais; isolamento por canal; aprovacao documentada de YouTube como unica integracao aprovada. |
| Fora de escopo | Metricas e aprendizado; V1 Acceptance; grandes modulos novos; recriacao do frontend; publicacao externa sem autorizacao; novos provedores sem spec; TikTok, Instagram e LinkedIn; segredos em codigo, docs, commits ou logs; mascarar ausencia de integracao com mocks; arquitetura generica hipotetica para contornar a falta de definicao aprovada. |
| Dependencias | Lista fechada de integracoes aprovada no ADR 002; politica de segredos; aprovacao humana; auditoria; YouTube como unica integracao aprovada para E13. |
| Gate de conclusao | Integração real autorizada funcionando sem expor segredo, com descoberta/seleção server-side do canal, aprovação humana, revogação, auditoria por canal e evidência reproduzível de upload privado/não listado e idempotência. |

## Sprint 13 - Metricas e Aprendizado

| Campo | Valor |
| --- | --- |
| Numero | Sprint 13 |
| Nome | Metricas e Aprendizado |
| Epic principal | E14 - Metricas e Aprendizado |
| Spec governante | `docs/specs/014-metrics-learning.md` |
| Objetivo | Registrar metricas por canal e consolidar aprendizado editorial assistido sem antecipar V1 Acceptance. |
| Estado | planned |
| Gate de inicio | Sprint 12 encerrada; integracoes reais autorizadas aprovadas e disponiveis; origem de metricas e canais definidos; sem conflito documental. |
| Historias incluidas | Registro de metricas; agregacao por canal; distinicao entre metricas manuais e importadas; dashboards; documentacao de origem e auditoria. |
| Fora de escopo | Scraping sem autorizacao; APIs externas sem spec; decisoes editoriais irreversiveis automaticas; IA real sem custos e gates; Hardening/V1 Acceptance; novas integracoes reais. |
| Dependencias | Sprint 12 encerrada e liberada por decisao documental aprovada; base de integracao real autorizada; publicacao assistida ja definida. |
| Gate de conclusao | Metricas e aprendizado operacionais por canal, com procedencia clara, auditoria e recomendacoes assistidas coerentes com a base existente. |

## Sprint 14 - V1 Acceptance

| Campo | Valor |
| --- | --- |
| Numero | Sprint 14 |
| Nome | V1 Acceptance |
| Epic principal | E15 - Hardening V1.0 |
| Spec governante | `docs/specs/012-v1-acceptance.md` |
| Objetivo | Integrar, verificar, endurecer e decidir o aceite da V1.0 com evidencia operacional pelo frontend. |
| Estado | planned |
| Gate de inicio | Sprints 12 e 13 encerradas; spec 012 formalizada; pre-requisitos da V1.0 identificados; sem conflito documental. |
| Historias incluidas | Verificacao do fluxo ponta a ponta pelo frontend; integracao entre frontend, backend e persistencia; isolamento por canal; rastreabilidade; auditoria e custos; renderizacao e cortes; qualidade, conformidade e aprovacao humana; preparacao de publicacao assistida; metricas e recomendacoes quando ja implementadas; correcao de defeitos comprovados. |
| Fora de escopo | Grandes modulos novos; redefinicao de arquitetura; recriacao do frontend; substituicao do design system; funcionalidades de sprints posteriores; publicacao externa sem autorizacao; novos provedores sem spec; segredos em codigo, docs, commits ou logs; aceitacao baseada so em CLI; aceitacao mascarada por mocks. |
| Dependencias | Sprints 12 e 13 encerradas; V1.0 nao pode ser declarada aceita sem evidencia operacional integrada. |
| Gate de conclusao | Decisao binaria: `V1.0 aceita` ou `V1.0 nao aceita`; um operador deve conseguir executar, pelo frontend, o fluxo aplicavel definido no Documento Mestre. |

## Observacoes

- Esta pagina de planejamento nao substitui specs.
- Mudanca de escopo exige atualizacao documental antes de implementacao.
- Nao registrar conclusao de sprint sem evidencia concreta.
- Nao antecipar historias futuras fora da Sprint 12 sem atualizar a spec e o backlog.
- Referencias a fases posteriores permanecem downstream e nao alteram a formalizacao da Sprint 12.
