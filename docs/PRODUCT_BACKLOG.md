# Product Backlog

Este backlog e um indice de planejamento. As specs continuam sendo os contratos
normativos das sprints.

## Catalogo de epicos

| ID | Epico | Objetivo | Status | Gate | Dependencias |
| --- | --- | --- | --- | --- | --- |
| E10 | Renderizacao Controlada | Entregar renderizacao de video controlada e auditavel. | completed | Video curto de teste com logs, custo e validacao. | - |
| E11 | Cortes Derivados Controlados | Entregar cortes persistentes e vinculados ao video principal. | completed | Pelo menos um corte valido vinculado. | - |
| E12 | Publicacao Assistida | Preparar publicacao com aprovacao, compliance e sem envio automatico. | completed | Pacote pronto sem envio externo automatico. | E10, E11 |
| E13 | Integracoes Reais Autorizadas | Conectar provedores com governanca, autorizacao e seguranca. | completed | Integracao oficial sem segredo e com destino server-side comprovado. | E12; ADR 002; PR #22 |
| E14 | Metricas e Aprendizado | Fechar o ciclo com metricas por canal e recomendacoes assistidas. | completed | Metricas geram recomendacao editorial por canal. | E13 concluido; PR #23 mergeada |
| E15 | Hardening V1.0 | Consolidar a base operacional demonstravel para V1.0. | planned | Demonstracao ponta a ponta e decisao binaria. | E13 e E14 concluidos |

## Sprints formalizadas

| Sprint | Nome | Epico | Spec | Estado | Observacao |
| --- | --- | --- | --- | --- | --- |
| S11 | Publicacao Assistida | E12 | `docs/specs/011-publication-assisted.md` | completed | PR #19 mergeado. |
| S12 | Integracoes Reais Autorizadas | E13 | `docs/specs/015-authorized-real-integrations.md` | completed | PR #22; validacao real concluida em 2026-07-15. |
| S13 | Metricas e Aprendizado | E14 | `docs/specs/014-metrics-learning.md` | completed | PR #23 mergeada por merge commit `9b89d1be04e7a6e319efb9a957282097c4854f31`. |
| S14 | V1 Acceptance | E15 | `docs/specs/012-v1-acceptance.md` | planned | Posterior a S13; nao iniciar nesta execucao. |

## Historias da Sprint 11

H11.1 catalogo de alvos e readiness; H11.2 job e estados; H11.3 payload e
agendamento; H11.4 aprovacao e compliance. Todas completed conforme Spec 011 e PR #19.

## Historias da Sprint 12

H12.1 estado YouTube por canal; H12.2 OAuth e revogacao; H12.3 descoberta e
selecao explicita; H12.4 upload autorizado; H12.5 reautorizacao/migracao de
escopos; H12.6 VideoAsset oficial para validacao real. Todas encerradas no PR #22.

## Historias da Sprint 13

### H14.1 - Registro controlado de metricas por conteudo

Registrar snapshots por canal, conteudo, plataforma e janela com origem, validade,
timestamps e idempotencia; rejeitar canal divergente e replay conflitante.

### H14.2 - Consulta e agregacao canal-scoped

Consultar por canal, periodo, conteudo e plataforma e consolidar totais, medias e
variacoes sem cruzar canais.

### H14.3 - Aprendizado editorial assistido

Gerar recomendacao deterministica, versionada, explicavel, evidenciada e revisavel
por humano; dados insuficientes nao geram afirmacao positiva.

### H14.4 - Dashboard operacional de metricas e recomendacoes

Substituir mocks de `/metrics` por API real, mostrando origem, estado, KPIs,
desempenho, tendencia, recomendacao e evidencias em todos os estados obrigatorios.

## Historias nao incluidas em S13

Analytics/OAuth novo, scraping, novos provedores, IA externa, receita/monetizacao,
aplicacao automatica de recomendacoes, migrations SQL, hardening e V1 Acceptance.

## Observacoes

- Nao usar story points.
- Nao renumerar historias anteriores.
- Mudanca de escopo exige atualizar a Spec 014, o roadmap operacional e este backlog.
- ADR 002 continua aprovando somente YouTube para E13; Analytics permanece futuro.
- A Sprint 14 nao e iniciada nesta execucao.
