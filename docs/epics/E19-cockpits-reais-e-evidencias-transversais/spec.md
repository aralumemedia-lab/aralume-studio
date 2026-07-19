# E19 - Specification

## Identification

- Epic ID: E19
- Epic name: Cockpits Reais e Evidencias Transversais
- Initiative: Remediacao da Operabilidade da V1
- Status: completed and integrated by PR #34
- Related technical items: R14-T01, R14-T02
- Upstream dependency: E16, E17, E18

## Actors

- Operador.
- Revisor tecnico.
- Product owner tecnico.

## Main flow

1. The operator opens `/dashboard` and sees real data for the active channel.
2. The operator opens `/agent-office` and sees real workflow, handoff and queue data.
3. The operator confirms that the main cockpit flows no longer import mock-api.
4. The operator reuses the same browser and screenshot sweep to validate the final acceptance.
5. The operator reloads the browser and confirms the records remain queryable.

## Alternate flows

- Empty state: no cockpit records exist yet for the selected channel.
- Validation error: missing channel or invalid API state.
- Transport failure: network, timeout or invalid envelope.
- Channel mismatch: the cockpit request uses the wrong channel.

## Validations

- `channelId` is required on every operational cockpit entity.
- Dashboard data must be channel-scoped.
- Agent-office data must be channel-scoped.
- Any cross-channel attempt must fail with a sanitized error response.

## States

- Loading.
- Empty.
- Error.
- Success.
- Partial when a specific section cannot be resolved but the rest of the page can still render.

## Channel isolation

- Every list query is filtered by the active channel.
- Reload must not leak records across channels.
- Any cross-channel attempt must fail with a sanitized conflict or not-found response.

## Messages

- Primary actions use real API messages, not mock toasts.
- Loading and empty states must be compact and recoverable.
- Sanitized errors must come from the shared API error helpers, not from raw transport exceptions.

## Audit

- Mutating cockpit actions must create audit entries when they exist.
- Audit entries must record actor, channelId, action, entityType, entityId, status, requestId and message.

## Inputs and outputs

### Inputs

- Dashboard summary payload.
- Agent-office snapshot payload.
- Workflow run payload.
- Handoff payload.

### Outputs

- Channel-scoped cockpit pages.
- Reusable E2E and screenshot evidence.
- Conflict and validation feedback.

## Relationships

- `Channel` 1:N `DashboardSummary`
- `Channel` 1:N `AgentOfficeSnapshot`
- `Channel` 1:N `WorkflowRun`
- `WorkflowRun` 1:N `AgentHandoff`

## Non-functional requirements

- Use the existing dense SaaS admin visual language.
- Keep keyboard navigation intact.
- Keep the frontend responsive at the required desktop widths.
- Avoid mock masking on the cockpit flows.
- Preserve channel context across navigation within the session.

## Acceptance criteria

- The dashboard surface uses real API data and no longer relies on the cockpit mock path.
- The agent-office surface uses real API data and no longer relies on the cockpit mock path.
- The reusable evidence harness exists for the final V1 reaccept.
- The browser evidence can be replayed on the same head.
- The cockpit surfaces show loading, empty, error and success states.
- The cockpit surfaces can be navigated without losing traceability.
