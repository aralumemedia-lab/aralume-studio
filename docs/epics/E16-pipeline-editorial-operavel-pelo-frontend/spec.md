# E16 - Specification

## Identification

- Epic ID: E16
- Epic name: Pipeline Editorial Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Status: proposed / not started
- Related criteria: V1-03, V1-04, V1-05, V1-06
- Upstream dependency: V1-02
- Related R14 items: R14-03, R14-04, R14-05, R14-06

## Actors

- Operador editorial.
- Editor.
- Pesquisador.
- Roteirista.
- Produtor.
- Revisor tecnico.

## Main flow

1. The operator selects a channel from the existing shell context.
2. The operator opens `/ideas` and creates or updates a content idea.
3. The operator opens `/research` and creates a research session for the idea.
4. The operator registers sources for the session.
5. The operator registers claim evidence linked to a source.
6. The operator opens `/scripts` and creates a script for the same content item.
7. The operator creates a second script version and keeps the first version immutable.
8. The operator reviews the script history after reload.
9. The operator reaches the visual-planning surface from the production area.
10. The operator creates a visual plan linked to the same content item and script version.
11. The operator adds scenes in explicit order.
12. The operator reloads the browser and confirms the records remain queryable.
13. The operator confirms that the artifacts are visible only in the active channel.
14. The operator confirms that audit entries exist for the mutating actions.

## Alternate flows

- Empty state: no records exist yet for the selected channel.
- Validation error: missing fields, invalid URL, invalid channel or invalid order.
- Conflict: duplicate version number, duplicate scene order or cross-channel link.
- Not found: the requested item does not exist.
- Backend unavailable: transport error, timeout or invalid envelope.
- Channel mismatch: the user tries to link artifacts from different channels.

## Validations

- `channelId` is required on every operational editorial entity.
- `ResearchSource.url`, when present, must be a valid URL.
- `ClaimEvidence.sourceId` must belong to the same session and channel.
- `ScriptVersion.versionNumber` must be monotonic and cannot overwrite history.
- `ScenePlan.order` must be a positive integer and unique per visual plan.
- `VisualPlan.scriptVersionId` must belong to the same channel and content item.
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
- Audit messages must not expose secrets or raw transport payloads.

## Inputs and outputs

### Inputs

- Content idea payload.
- Research session payload.
- Research source payload.
- Claim evidence payload.
- Script payload.
- Script version payload.
- Visual plan payload.
- Scene plan payload.

### Outputs

- Channel-scoped list pages.
- Detail panels for the selected artifact.
- Reloadable persisted records.
- Audit log entries.
- Conflict and validation feedback.

## Relationships

- `Channel` 1:N `ContentIdea`
- `Channel` 1:N `ResearchSession`
- `Channel` 1:N `ResearchSource`
- `Channel` 1:N `ClaimEvidence`
- `Channel` 1:N `Script`
- `Script` 1:N `ScriptVersion`
- `Channel` 1:N `VisualPlan`
- `VisualPlan` 1:N `ScenePlan`

## Non-functional requirements

- Use the existing dense SaaS admin visual language.
- Keep keyboard navigation intact.
- Keep the frontend responsive at the required desktop widths.
- Avoid mock masking on the core flow.
- Preserve channel context across navigation within the session.
- Revalidate after create and update actions.

## Acceptance criteria

- A content idea can be created and listed again after reload.
- A research session can be created and linked to a content idea.
- A source can be registered against the session and validated.
- A claim can be registered against the source and validated.
- A script can be created and versioned without overwriting history.
- A visual plan and ordered scenes can be created and queried again.
- Every step is channel-scoped and auditable.
- The frontend shows loading, empty, error and success states for each capability.
- The frontend can navigate between the artifacts without losing traceability.
