# E18 - Specification

## Identification

- Epic ID: E18
- Epic name: Governanca e Publicacao Assistida pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Status: proposed / not started
- Related criteria: V1-11, V1-12, V1-13, V1-14
- Upstream dependency: E17
- Related R14 items: R14-11, R14-12, R14-13, R14-14

## Actors

- Revisor tecnico.
- Operador editorial.
- Editor.
- Revisor humano.

## Main flow

1. The operator opens the governance surface from the production flow.
2. The operator reviews quality findings for the active channel.
3. The operator reviews compliance findings for the active channel.
4. The operator makes or inspects a human approval decision.
5. The operator prepares a publication draft or readiness package.
6. The operator inspects blocked or ready states.
7. The operator reloads the browser and confirms the records remain queryable.
8. The operator confirms that the artifacts are visible only in the active channel.
9. The operator confirms that audit entries exist for the mutating actions.

## Alternate flows

- Empty state: no governance records exist yet for the selected channel.
- Validation error: missing fields, invalid decision or invalid channel.
- Conflict: duplicate decision, duplicate publication target or cross-channel link.
- Not found: the requested item does not exist.
- Backend unavailable: transport error, timeout or invalid envelope.

## Validations

- `channelId` is required on every operational governance entity.
- Quality and compliance findings must be channel-scoped.
- Approval decisions must preserve history and cannot silently overwrite it.
- Publication readiness must not auto-send external jobs.
- Lists and mutations must reject cross-channel references.

## States

- Loading.
- Empty.
- Error.
- Success.
- Conflict.
- Partial when a specific section cannot be resolved but the rest of the page can still render.

## Channel isolation

- Every list query is filtered by the active channel.
- Every create or update mutation writes the same channelId that comes from the selected context.
- Reload must not leak records across channels.
- Any cross-channel attempt must fail with a sanitized conflict or not-found response.

## Messages

- Primary actions use real API messages, not mock toasts.
- Loading and empty states must be compact and recoverable.
- Validation and conflict messages must be explicit enough for an operator to correct the payload.
- Sanitized errors must come from the shared API error helpers, not from raw transport exceptions.

## Audit

- Mutating actions must create audit entries.
- Audit entries must record actor, channelId, action, entityType, entityId, status, requestId and message.

## Inputs and outputs

### Inputs

- Quality check payload.
- Compliance check payload.
- Approval decision payload.
- Publication target or draft payload.

### Outputs

- Channel-scoped list pages.
- Detail panels for the selected artifact.
- Reloadable persisted records.
- Audit log entries.
- Conflict and validation feedback.

## Relationships

- `Channel` 1:N `QualityCheck`
- `Channel` 1:N `ComplianceCheck`
- `Channel` 1:N `HumanApproval`
- `Channel` 1:N `PublicationTarget`
- `PublicationTarget` 1:N `PublicationJob`

## Non-functional requirements

- Use the existing dense SaaS admin visual language.
- Keep keyboard navigation intact.
- Keep the frontend responsive at the required desktop widths.
- Avoid mock masking on the core flow.
- Preserve channel context across navigation within the session.
- Revalidate after create and update actions.

## Acceptance criteria

- A quality result can be reviewed and queried again after reload.
- A compliance result can be reviewed and queried again after reload.
- An approval decision can be made and its history can be queried again after reload.
- A publication draft or readiness package can be prepared and queried again after reload.
- Every step is channel-scoped and auditable.
- The frontend shows loading, empty, error and success states for each capability.
- The frontend can navigate between the artifacts without losing traceability.
