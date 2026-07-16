# E17 - Specification

## Identification

- Epic ID: E17
- Epic name: Pipeline Midia e Producao Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Status: proposed / not started
- Related criteria: V1-07, V1-08, V1-09, V1-10
- Upstream dependency: E16
- Related R14 items: R14-07, R14-08, R14-09, R14-10

## Actors

- Operador editorial.
- Produtor.
- Editor.
- Revisor tecnico.

## Main flow

1. The operator opens the media surface from the editorial flow.
2. The operator registers or updates a narration asset with provenance.
3. The operator registers a visual asset with provenance and integrity data.
4. The operator opens `/videos` and starts a controlled render job.
5. The operator checks the render state and output.
6. The operator opens `/clips` and creates a derived clip from the rendered video.
7. The operator reloads the browser and confirms the records remain queryable.
8. The operator confirms that the artifacts are visible only in the active channel.
9. The operator confirms that audit entries exist for the mutating actions.

## Alternate flows

- Empty state: no media, render or clip records exist yet for the selected channel.
- Validation error: missing fields, invalid interval, invalid provenance or invalid channel.
- Conflict: duplicate clip order, duplicate provenance reference or cross-channel link.
- Not found: the requested item does not exist.
- Backend unavailable: transport error, timeout or invalid envelope.

## Validations

- `channelId` is required on every operational media entity.
- Narration or asset provenance must be explicit.
- `RenderJob` requests must belong to the same channel and media context.
- `DerivedClip` requests must reference a valid rendered video and interval.
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

- Narration payload.
- Media asset payload.
- Render job payload.
- Derived clip payload.

### Outputs

- Channel-scoped list pages.
- Detail panels for the selected artifact.
- Reloadable persisted records.
- Audit log entries.
- Conflict and validation feedback.

## Relationships

- `Channel` 1:N `MediaAssetBase`
- `Channel` 1:N `NarrationAsset`
- `Channel` 1:N `VisualAsset`
- `Channel` 1:N `VideoAsset`
- `VideoAsset` 1:N `DerivedClip`

## Non-functional requirements

- Use the existing dense SaaS admin visual language.
- Keep keyboard navigation intact.
- Keep the frontend responsive at the required desktop widths.
- Avoid mock masking on the core flow.
- Preserve channel context across navigation within the session.
- Revalidate after create and update actions.

## Acceptance criteria

- A narration or narration asset can be created and listed again after reload.
- A visual asset can be registered and listed again after reload.
- A controlled render job can be started and queried again after reload.
- A derived clip can be created from a rendered video and queried again after reload.
- Every step is channel-scoped and auditable.
- The frontend shows loading, empty, error and success states for each capability.
- The frontend can navigate between the artifacts without losing traceability.
