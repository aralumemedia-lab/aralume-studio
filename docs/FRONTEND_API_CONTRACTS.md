# Aralume — Contratos de API do Frontend

Este documento é o contrato que o futuro backend (Codex) deve seguir. O frontend consome `src/services/api-client.ts`, que hoje reexporta `mock-api.ts`. Substituir por HTTP real não deve exigir mudanças em telas ou tipos.

## Regras gerais

- IDs: `string`.
- Datas: ISO 8601 (`string`).
- Dinheiro: inteiros em centavos, campos com sufixo `Cents`.
- Duração: segundos, campos com sufixo `Seconds`.
- Convenção: `camelCase` em toda a superfície do frontend.
- Dados operacionais SEMPRE têm `channelId` quando pertencem a um canal.
- Status são enums fechados em `src/contracts/status.ts`.
- `src/services/api-client.ts` concentra o transporte HTTP compartilhado e usa `VITE_ARALUME_API_BASE_URL` apenas como configuracao publica opcional, com `/api` como base relativa segura por padrao.

## Envelope de resposta

```ts
type ApiSuccess<T> = { data: T; meta: ApiMeta };
type ApiListSuccess<T> = { data: T[]; meta: ApiMeta };
type ApiError = { error: { code: ApiErrorCode; message: string; details?: object }; meta: ApiMeta };
type ApiMeta = {
  requestId: string;
  generatedAt: string;
  page?: number;
  pageSize?: number;
  total?: number;
};
```

Códigos de erro: `VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | CONFLICT | RATE_LIMITED | INTERNAL_ERROR | OPERATION_BLOCKED | BUDGET_EXCEEDED | COMPLIANCE_BLOCKED`.

## Tipos principais

Definidos em `src/contracts/types.ts`. Não renomear campos.

- `Channel`, `ChannelSettings`, `EditorialRules`
- `AgentDefinition`, `AgentRun`, `AgentHandoff`, `AgentPhase`
- `WorkflowRun`, `WorkflowStep`
- `ContentIdea`, `ResearchSession`, `ResearchSource`, `ClaimEvidence`
- `Script`, `ScriptVersion`, `VisualPlan`, `ScenePlan`
- `MediaAssetBase`, `NarrationAsset`, `VisualAsset`, `VideoAsset`, `DerivedClip`
- `QualityCheck`, `ComplianceCheck`, `HumanApproval`
- `PublicationTarget`, `PublicationJob`
- `PerformanceMetric`, `CostEntry`, `CostSummary`, `CostBreakdown`, `OperationalModePolicy`, `OperationalModeDecision`, `OperationalModeSnapshot`, `AuditLog`
- Auxiliares de tela: `DashboardSummary`, `AgentOfficeSnapshot`, `ProductionItem`

## Relacionamentos-chave

- `Channel` 1:N `ChannelSettings, EditorialRules, WorkflowRun, AgentRun, ContentIdea, ResearchSession, Script, VisualPlan, VideoAsset, DerivedClip, HumanApproval, PublicationTarget, PublicationJob, PerformanceMetric, CostEntry, AuditLog`.
- `WorkflowRun` 1:N `WorkflowStep, AgentRun, AgentHandoff`.
- `ContentIdea` 1:N `ResearchSession, Script`.
- `Script` 1:N `ScriptVersion`; `VisualPlan` 1:N `ScenePlan`.
- `VideoAsset` 1:N `DerivedClip`.
- `Content` (idea) 1:N `HumanApproval, ComplianceCheck, QualityCheck`.

## Endpoints

Os endpoints de Canais abaixo já estão disponíveis no backend entregue na Sprint 3. Os endpoints editoriais abaixo são o contrato alvo da Sprint 5.

Todos aceitam `?channelId=<id>` quando aplicável e retornam `ApiSuccess`/`ApiListSuccess`.

| Método | Path                                       | Retorno                   |
| ------ | ------------------------------------------ | ------------------------- |
| GET    | /api/dashboard/summary                     | `DashboardSummary`        |
| GET    | /api/channels                              | `Channel[]`               |
| POST   | /api/channels                              | `Channel`                 |
| GET    | /api/channels/:id                          | `Channel`                 |
| PATCH  | /api/channels/:id                          | `Channel`                 |
| GET    | /api/channels/:id/settings                 | `ChannelSettings`         |
| GET    | /api/agents                                | `AgentDefinition[]`       |
| GET    | /api/agent-office/snapshot                 | `AgentOfficeSnapshot`     |
| GET    | /api/workflows                             | `WorkflowRun[]`           |
| GET    | /api/workflows/:id                         | `WorkflowRun`             |
| GET    | /api/production-items                      | `ProductionItem[]`        |
| GET    | /api/production-items/:id                  | `ProductionItem`          |
| GET    | /api/content-ideas                         | `ContentIdea[]`           |
| POST   | /api/content-ideas                         | `ContentIdea`             |
| GET    | /api/content-ideas/:id                     | `ContentIdea`             |
| PATCH  | /api/content-ideas/:id                     | `ContentIdea`             |
| GET    | /api/research-sessions                     | `ResearchSession[]`       |
| POST   | /api/research-sessions                     | `ResearchSession`         |
| GET    | /api/research-sessions/:id                 | `ResearchSession`         |
| POST   | /api/research-sessions/:id/sources         | `ResearchSource`          |
| POST   | /api/research-sessions/:id/claims          | `ClaimEvidence`           |
| GET    | /api/scripts                               | `Script[]`                |
| POST   | /api/scripts                               | `Script`                  |
| GET    | /api/scripts/:id                           | `Script`                  |
| PATCH  | /api/scripts/:id                           | `Script`                  |
| GET    | /api/scripts/:id/versions                  | `ScriptVersion[]`         |
| POST   | /api/scripts/:id/versions                  | `ScriptVersion`           |
| GET    | /api/visual-plans                          | `VisualPlan[]`            |
| POST   | /api/visual-plans                          | `VisualPlan`              |
| GET    | /api/visual-plans/:id                      | `VisualPlan`              |
| PATCH  | /api/visual-plans/:id                      | `VisualPlan`              |
| POST   | /api/visual-plans/:id/scenes               | `ScenePlan`               |
| GET    | /api/media-assets                          | `MediaAssetBase[]`        |
| GET    | /api/videos                                | `VideoAsset[]`            |
| GET    | /api/clips                                 | `DerivedClip[]`           |
| GET    | /api/approvals                             | `HumanApproval[]`         |
| POST   | /api/approvals/:id/approve                 | `HumanApproval`           |
| POST   | /api/approvals/:id/reject                  | `HumanApproval`           |
| POST   | /api/approvals/:id/request-changes         | `HumanApproval`           |
| GET    | /api/publications                          | `PublicationJob[]`        |
| GET    | /api/metrics                               | `PerformanceMetric[]`     |
| GET    | /api/costs                                 | `CostEntry[]`             |
| POST   | /api/costs                                 | `CostEntry`               |
| GET    | /api/costs/:id                             | `CostEntry`               |
| GET    | /api/costs/summary                         | `CostSummary`             |
| GET    | /api/costs/breakdown                       | `CostBreakdown`           |
| GET    | /api/operational-modes                     | `OperationalModeSnapshot` |
| PATCH  | /api/operational-modes/global              | `OperationalModePolicy`   |
| PATCH  | /api/operational-modes/channels/:channelId | `OperationalModePolicy`   |
| POST   | /api/operational-modes/evaluate            | `OperationalModeDecision` |
| GET    | /api/compliance                            | `ComplianceCheck[]`       |
| GET    | /api/audit-logs                            | `AuditLog[]`              |

## Rotas do frontend

`/dashboard`, `/channels`, `/agent-office`, `/production`, `/ideas`, `/research`, `/scripts`, `/media-assets`, `/videos`, `/clips`, `/approvals`, `/publications`, `/metrics`, `/costs`, `/compliance`, `/administration`, `/audit-logs`. `/` redireciona para `/dashboard`.

## Integração futura

1. Substituir o corpo de `src/services/mock-api.ts` (ou reapontar `api-client.ts`) por `fetch` real preservando as assinaturas.
2. Manter os tipos em `contracts/types.ts` e enums em `contracts/status.ts` como fonte da verdade.
3. Nenhuma tela importa mocks diretamente — a troca não requer alterações em `src/routes/*`.
