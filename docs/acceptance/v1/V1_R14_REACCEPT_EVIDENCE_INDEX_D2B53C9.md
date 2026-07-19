# Índice de evidências R14 — V1.0

## Artefatos novos

- Matriz: [`V1_R14_REACCEPT_MATRIX_D2B53C9.md`](V1_R14_REACCEPT_MATRIX_D2B53C9.md)
- Comandos e resultados: [`V1_R14_REACCEPT_COMMANDS_D2B53C9.md`](V1_R14_REACCEPT_COMMANDS_D2B53C9.md)
- Diretório E2E e frontend: [`screenshots/r14-reaccept-20260719-d2b53c9`](../../../screenshots/r14-reaccept-20260719-d2b53c9)

## Evidência por sprint

| Sprint | Runner | Evidência |
|---|---|---|
| 15 | `scripts/sprint15-browser-e2e.mjs` | 3 PNGs no diretório R14; pauta, pesquisa, fonte, claim, reload, auditoria e isolamento |
| 16 | `scripts/sprint16-browser-e2e.mjs` | 8 PNGs; roteiro, versão, plano visual, cenas, conflitos, reload e isolamento |
| 17 | `scripts/sprint17-browser-e2e.mjs` | 6 PNGs; narração, ativos visuais, validações, reload, auditoria e isolamento |
| 18 | `scripts/sprint18-browser-e2e.mjs` | 11 PNGs; render, vídeo, duração real, corte, conflito/idempotência, reload e isolamento |
| 19 | `scripts/sprint19-browser-e2e.mjs` | 7 PNGs; qualidade, compliance, aprovação, histórico e isolamento |
| 20 | `scripts/sprint20-browser-e2e.mjs` | 7 PNGs; publicação assistida, reload, conflito, isolamento e ausência de requests externos |
| 21 | `scripts/sprint21-browser-e2e.mjs` | 14 PNGs; dashboard, Agent Office, estados vazio/erro/sucesso, reload e isolamento |

## Evidência suplementar frontend

- `supplemental/v1-02-channel-profile.png`: perfil editorial salvo pelo formulário real, toast de sucesso e auditoria visível.
- `supplemental/v1-02-channel-profile-isolation.png`: troca para Aralume Curiosidades; o valor exclusivo salvo em Aralume Historia não aparece.
- `supplemental/v1-15-costs.png`: custos agregados e entradas detalhadas isoladas por canal.
- `supplemental/v1-16-metrics-v1-17-recommendation.png`: métricas persistidas, regra `metrics-learning-v1`, racional, confiança e evidências.
- `supplemental/v1-18-audit-history.png`: histórico frontend com evento de perfil e `requestId` no campo próprio.

## Evidência histórica consultada

Foram lidos, sem sobrescrita: `V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md`, `V1_KNOWN_LIMITATIONS.md`, `V1_SPRINT19_EVIDENCE.md`, `V1_SPRINT20_EVIDENCE.md`, `V1_SPRINT21_EVIDENCE.md` e `V1_SPRINT22_REMEDIATION_EVIDENCE.md`.
