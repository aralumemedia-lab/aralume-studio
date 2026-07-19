# Matriz de Reaceite Formal R14 — V1.0

Data da execução: 2026-07-19
Spec governante: [`docs/specs/012-v1-acceptance.md`](../../specs/012-v1-acceptance.md)
Unidade de remediação: Sprint 22 / E15 / [`023-sprint-22-v1-remediation-findings.md`](../../specs/023-sprint-22-v1-remediation-findings.md)
SHA funcional avaliado: `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`
Evidências novas: [`screenshots/r14-reaccept-20260719-d2b53c9`](../../../screenshots/r14-reaccept-20260719-d2b53c9)

Resultado: **18/18 PASS — V1.0 ACCEPTED**.

| Critério | Resultado | Evidência reproduzível |
|---|---|---|
| V1-01 Contexto de canal | PASS | Runners E2E 15–21; seletor de canal e isolamento em `screenshots/r14-reaccept-20260719-d2b53c9` |
| V1-02 Perfil editorial | PASS | `supplemental/v1-02-channel-profile.png`; reload persistido; `supplemental/v1-02-channel-profile-isolation.png` |
| V1-03 Pautas | PASS | Runner Sprint 15: criação, alteração, reload e auditoria |
| V1-04 Pesquisas, fontes e claims | PASS | Runner Sprint 15: sessão, fonte, claim, reload e isolamento |
| V1-05 Roteiro versionado | PASS | Runner Sprint 16: roteiro, versão, reload e isolamento |
| V1-06 Plano visual e cenas | PASS | Runner Sprint 16: plano, cenas, conflitos, reload e isolamento |
| V1-07 Narração autorizada | PASS | Runner Sprint 17: criação, alteração, reload e auditoria |
| V1-08 Ativos visuais rastreáveis | PASS | Runner Sprint 17: ativos, validações, reload e isolamento |
| V1-09 Render | PASS | Runner Sprint 18: render real iniciado e concluído pelo frontend |
| V1-10 Corte derivado | PASS | Runner Sprint 18: intervalo baseado na duração real, conflito/idempotência e criação real |
| V1-11 Quality check | PASS | Runner Sprint 19: check, persistência, reload e isolamento |
| V1-12 Compliance check | PASS | Runner Sprint 19: check, persistência, reload e isolamento |
| V1-13 Aprovação humana | PASS | Runner Sprint 19: aprovação, decisão, histórico e isolamento |
| V1-14 Publicação assistida | PASS | Runner Sprint 20: preparação, reload, conflito, isolamento e ausência de requests externos |
| V1-15 Custos | PASS | `supplemental/v1-15-costs.png`: totais, detalhamento por etapa e canal |
| V1-16 Métricas persistidas | PASS | `supplemental/v1-16-metrics-v1-17-recommendation.png`: métricas reais persistidas e tabela por canal |
| V1-17 Recomendação determinística | PASS | `supplemental/v1-16-metrics-v1-17-recommendation.png`: regra, racional, confiança e evidências |
| V1-18 Histórico operacional completo | PASS | Runner Sprint 21 e `supplemental/v1-18-audit-history.png`: histórico frontend com requestId direto |

## Condições transversais

- Auditoria: `AuditLog.requestId` aparece no campo próprio, com `metadata` sem substituí-lo.
- Escopo: leituras detalhadas e mutações respeitam `channelId`; tentativa cross-channel é rejeitada e sanitizada.
- Frontend: operações de criação/alteração foram executadas pelos runners e pela prova suplementar, sem chamadas externas não autorizadas.
- Teardown: cada runner terminou com código `0`; verificação pós-run confirmou zero processos órfãos e zero listeners em 3001, 4173 e 8080.
- Asserções: não foram removidas ou enfraquecidas.
- Critérios previamente aprovados V1-01, V1-02 e V1-11–V1-18 foram reexecutados ou receberam prova frontend suplementar explícita.

## Limitações não bloqueantes

`npx tsc --noEmit` global continua falhando com 18 diagnósticos preexistentes, reproduzidos no baseline `origin/main`, sem introdução ou agravamento pela remediação e sem impacto nos arquivos/contratos funcionais alterados. Lint, backend typecheck, suíte oficial, testes adicionais e build passam.

Os runners emitem warnings conhecidos de hydration mismatch/code-split e mensagens de saída de filhos durante o teardown Windows; os runners retornam `0` e a checagem posterior confirma ausência de órfãos. Esses warnings não produziram `pageerror`, falha de rede ou falha funcional.
