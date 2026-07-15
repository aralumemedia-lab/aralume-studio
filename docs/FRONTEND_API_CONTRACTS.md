# Aralume — Contratos de API do Frontend

Este documento é o contrato que o futuro backend (Codex) deve seguir. O frontend consome `src/services/api-client.ts`, que concentra o transporte compartilhado e ainda mistura alguns endpoints mockados com os contratos já migrados para HTTP real. Substituir mais rotas por HTTP real não deve exigir mudanças em telas ou tipos.

## Regras gerais

- IDs: `string`.
- Datas: ISO 8601 (`string`).
- Dinheiro: inteiros em centavos, campos com sufixo `Cents`.
- Duração: segundos, campos com sufixo `Seconds`.
- Convenção: `camelCase` em toda a superfície do frontend.
- Dados operacionais SEMPRE têm `channelId` quando pertencem a um canal.
- Consultas e mutações de `MediaAssetBase`, `VideoAsset` e `DerivedClip` exigem `channelId` explicito.
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
- `MediaAssetBase`, `NarrationAsset`, `VisualAsset`, `VideoAsset`, `DerivedClip`, `RenderJob`, `RenderLogEntry`, `RenderType`, `MediaAssetUsage`, `MediaAssetStorageValidation`, `MediaAssetIntegrityValidation`
- `QualityCheck`, `ComplianceCheck`, `HumanApproval`
- `PublicationTarget`, `PublicationJob`
- `PerformanceMetric`, `CostEntry`, `CostSummary`, `CostBreakdown`, `OperationalModePolicy`, `OperationalModeDecision`, `OperationalModeSnapshot`, `AuditLog`
- Auxiliares de tela: `DashboardSummary`, `AgentOfficeSnapshot`, `ProductionItem`

## Relacionamentos-chave

- `Channel` 1:N `ChannelSettings, EditorialRules, WorkflowRun, AgentRun, ContentIdea, ResearchSession, Script, VisualPlan, MediaAssetBase, VideoAsset, DerivedClip, RenderJob, HumanApproval, PublicationTarget, PublicationJob, PerformanceMetric, CostEntry, AuditLog`.
- `WorkflowRun` 1:N `WorkflowStep, AgentRun, AgentHandoff`.
- `ContentIdea` 1:N `ResearchSession, Script`.
- `Script` 1:N `ScriptVersion`; `VisualPlan` 1:N `ScenePlan`.
- `VideoAsset` 1:N `DerivedClip`.
- `RenderJob` 1:1 `VideoAsset` quando a renderizacao principal conclui com sucesso e registra a saida.
- `RenderJob` 1:1 `DerivedClip` quando o job executa um corte derivado controlado.
- `Content` (idea) 1:N `HumanApproval, ComplianceCheck, QualityCheck`.
- `PublicationTarget` inclui `readinessStatus`, `readinessReason`, `readinessReasons`, `latestPublicationJobId`, `sourceContentId` e `sourceVideoAssetId`.
- `PublicationJob` inclui `publicationTargetId`, `sourceVideoAssetId`, `idempotencyKey`, `approvalId`, `complianceCheckId`, `blockedReason`, `errorCode` e `errorMessage`.
- As listagens de `PublicationTarget` e `PublicationJob` sao sempre canal-scoped e exigem `channelId`.

## Endpoints

Os endpoints de Canais abaixo já estão disponíveis no backend entregue na Sprint 3. Os endpoints editoriais abaixo são o contrato alvo da Sprint 5.

Todos aceitam `?channelId=<id>` quando aplicável e retornam `ApiSuccess`/`ApiListSuccess`.

| Método | Path                                           | Retorno                         |
| ------ | ---------------------------------------------- | ------------------------------- |
| GET    | /api/dashboard/summary                         | `DashboardSummary`              |
| GET    | /api/channels                                  | `Channel[]`                     |
| POST   | /api/channels                                  | `Channel`                       |
| GET    | /api/channels/:id                              | `Channel`                       |
| PATCH  | /api/channels/:id                              | `Channel`                       |
| GET    | /api/channels/:id/settings                     | `ChannelSettings`               |
| GET    | /api/agents                                    | `AgentDefinition[]`             |
| GET    | /api/agent-office/snapshot                     | `AgentOfficeSnapshot`           |
| GET    | /api/workflows                                 | `WorkflowRun[]`                 |
| GET    | /api/workflows/:id                             | `WorkflowRun`                   |
| GET    | /api/production-items                          | `ProductionItem[]`              |
| GET    | /api/production-items/:id                      | `ProductionItem`                |
| GET    | /api/content-ideas                             | `ContentIdea[]`                 |
| POST   | /api/content-ideas                             | `ContentIdea`                   |
| GET    | /api/content-ideas/:id                         | `ContentIdea`                   |
| PATCH  | /api/content-ideas/:id                         | `ContentIdea`                   |
| GET    | /api/research-sessions                         | `ResearchSession[]`             |
| POST   | /api/research-sessions                         | `ResearchSession`               |
| GET    | /api/research-sessions/:id                     | `ResearchSession`               |
| POST   | /api/research-sessions/:id/sources             | `ResearchSource`                |
| POST   | /api/research-sessions/:id/claims              | `ClaimEvidence`                 |
| GET    | /api/scripts                                   | `Script[]`                      |
| POST   | /api/scripts                                   | `Script`                        |
| GET    | /api/scripts/:id                               | `Script`                        |
| PATCH  | /api/scripts/:id                               | `Script`                        |
| GET    | /api/scripts/:id/versions                      | `ScriptVersion[]`               |
| POST   | /api/scripts/:id/versions                      | `ScriptVersion`                 |
| GET    | /api/visual-plans                              | `VisualPlan[]`                  |
| POST   | /api/visual-plans                              | `VisualPlan`                    |
| GET    | /api/visual-plans/:id                          | `VisualPlan`                    |
| PATCH  | /api/visual-plans/:id                          | `VisualPlan`                    |
| POST   | /api/visual-plans/:id/scenes                   | `ScenePlan`                     |
| GET    | /api/media-assets                              | `MediaAssetBase[]`              |
| POST   | /api/media-assets                              | `MediaAssetBase`                |
| GET    | /api/media-assets/:id                          | `MediaAssetBase`                |
| PATCH  | /api/media-assets/:id                          | `MediaAssetBase`                |
| POST   | /api/media-assets/validate-storage             | `MediaAssetStorageValidation`   |
| POST   | /api/media-assets/:id/validate-integrity       | `MediaAssetIntegrityValidation` |
| GET    | /api/media-assets/:id/usages                   | `MediaAssetUsage[]`             |
| GET    | /api/renders                                   | `RenderJob[]`                   |
| POST   | /api/renders                                   | `RenderJob`                     |
| GET    | /api/renders/:id                               | `RenderJob`                     |
| GET    | /api/videos                                    | `VideoAsset[]`                  |
| GET    | /api/clips                                     | `DerivedClip[]`                 |
| POST   | /api/clips                                     | `DerivedClip`                   |
| GET    | /api/clips/:id                                 | `DerivedClip`                   |
| GET    | /api/clips/:id/file                            | `void`                          |
| GET    | /api/approvals                                 | `HumanApproval[]`               |
| POST   | /api/approvals/:id/approve                     | `HumanApproval`                 |
| POST   | /api/approvals/:id/reject                      | `HumanApproval`                 |
| POST   | /api/approvals/:id/request-changes             | `HumanApproval`                 |
| GET    | /api/publication-targets                       | `PublicationTarget[]`           |
| POST   | /api/publication-targets                       | `PublicationTarget`             |
| GET    | /api/publications                              | `PublicationJob[]`              |
| POST   | /api/publications                              | `PublicationJob`                |
| POST   | /api/publications/:publicationJobId/reschedule | `PublicationJob`                |
| GET    | /api/metrics                                   | `PerformanceMetric[]`           |
| GET    | /api/costs                                     | `CostEntry[]`                   |
| POST   | /api/costs                                     | `CostEntry`                     |
| GET    | /api/costs/:id                                 | `CostEntry`                     |
| GET    | /api/costs/summary                             | `CostSummary`                   |
| GET    | /api/costs/breakdown                           | `CostBreakdown`                 |
| GET    | /api/operational-modes                         | `OperationalModeSnapshot`       |
| PATCH  | /api/operational-modes/global                  | `OperationalModePolicy`         |
| PATCH  | /api/operational-modes/channels/:channelId     | `OperationalModePolicy`         |
| POST   | /api/operational-modes/evaluate                | `OperationalModeDecision`       |
| GET    | /api/compliance                                | `ComplianceCheck[]`             |
| GET    | /api/audit-logs                                | `AuditLog[]`                    |

### Sprint 12 — YouTube autorizado

Esta é a única integração externa aprovada para E13. Os endpoints são canal-scoped
e não retornam tokens, client secrets, authorization codes ou headers do provedor.

| Método | Path                                                   | Retorno                  |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | `/api/integrations/youtube/oauth/start?channelId=<id>` | `OAuthStartResponse`     |
| GET    | `/api/integrations/youtube/oauth/callback`             | redirect HTML seguro     |
| GET    | `/api/integrations/youtube/connection?channelId=<id>`  | `YouTubeConnectionState` |
| GET    | `/api/integrations/youtube/channels?channelId=<id>`    | `YouTubeChannel[]`       |
| POST   | `/api/integrations/youtube/selection`                  | `YouTubeConnectionState` |
| GET    | `/api/integrations/youtube/readiness?channelId=<id>`   | `YouTubeReadiness`       |
| POST   | `/api/integrations/youtube/revoke`                     | `YouTubeConnectionState` |
| POST   | `/api/publications/:publicationJobId/upload`           | `YouTubeUploadResult`    |
| GET    | `/api/publications/:publicationJobId/upload`           | `YouTubeUploadResult`    |

O início OAuth recebe `channelId` e retorna somente uma URL Google e a expiração do
state. O callback aceita `code`, `state` ou erro OAuth, rejeita state inválido,
expirado ou reutilizado e redireciona apenas para a origem configurada. A seleção
recebe `channelId` e `youtubeChannelId`; o upload recebe `channelId` e identifica o
job pela URL. O resultado expõe apenas `publicationJobId`, `youtubeVideoId`,
`youtubeChannelId`, status, timestamps e erro normalizado. Durante uma tentativa
em andamento, o job fica persistido como `pending`; uma nova tentativa e
bloqueada ate a reconciliacao do resultado, evitando upload duplicado apos
concorrencia ou reinicio do processo.

## Rotas do frontend

`/dashboard`, `/channels`, `/agent-office`, `/production`, `/ideas`, `/research`, `/scripts`, `/media-assets`, `/videos`, `/clips`, `/approvals`, `/publications`, `/metrics`, `/costs`, `/compliance`, `/administration`, `/audit-logs`. `/` redireciona para `/dashboard`.

## Renderizacao controlada

O fluxo controlado de video usa a API real abaixo e nao aceita caminhos arbitrarios do cliente.

- `POST /api/renders`
- `GET /api/renders?channelId=<id>`
- `GET /api/renders/:id`
- `GET /api/videos?channelId=<id>`

`POST /api/renders` recebe `channelId`, `inputAssetIds`, `renderProfile`, `idempotencyKey` e, quando aplicavel, `contentId` e `workflowRunId`.
O frontend da rota `/videos` usa essa superficie para listar jobs, iniciar renders controlados e mostrar o ativo de video resultante no canal ativo.

## Cortes derivados controlados

O fluxo de cortes derivados usa a API real abaixo e nao aceita caminhos arbitrarios do cliente.

- `GET /api/clips?channelId=<id>`
- `GET /api/clips?channelId=<id>&parentVideoId=<id>`
- `POST /api/clips`
- `GET /api/clips/:id`
- `GET /api/clips/:id/file`

`POST /api/clips` recebe `channelId`, `parentVideoId`, `startSeconds`, `endSeconds`, `idempotencyKey` e, quando aplicavel, `targetPlatform`, `title`, `hook` e `description`.
O frontend da rota `/clips` usa essa superficie para listar cortes, iniciar cortes derivados e mostrar o ativo de video resultante vinculado ao video principal.

## Integração futura

1. Continuar migrando os endpoints restantes de `src/services/mock-api.ts` para `fetch` real preservando as assinaturas.
2. Manter os tipos em `contracts/types.ts` e enums em `contracts/status.ts` como fonte da verdade.
3. Nenhuma tela importa mocks diretamente — a troca não requer alterações em `src/routes/*`.
