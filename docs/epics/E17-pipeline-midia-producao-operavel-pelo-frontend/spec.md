# E17 - Specification

## Identification

- Epic ID: E17
- Epic name: Pipeline Midia e Producao Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Status: complete and integrated in `main` by PR #30
- Current sprint slice: Sprint 18
- Related criteria: V1-07, V1-08, V1-09, V1-10
- Upstream dependency: E16
- Related R14 items: R14-07, R14-08, R14-09, R14-10

## Actors

- Operador editorial.
- Produtor.
- Revisor tecnico.

## Main flow

1. The operator opens the media surface from the editorial flow.
2. The operator creates or updates a narration asset with provenance and integrity data.
3. The operator registers a visual asset with provenance, license or prompt metadata, and integrity data.
4. The operator reloads the browser and confirms the records remain queryable.
5. The operator confirms that the artifacts are visible only in the active channel.
6. The operator confirms that audit entries exist for the mutating actions.

## Alternate flows

- Empty state: no media records exist yet for the selected channel.
- Validation error: missing fields, invalid storage or invalid provenance.
- Conflict: cross-channel link or invalid metadata combination.
- Not found: the requested item does not exist.
- Backend unavailable: transport error, timeout or invalid envelope.

## Validations

- `channelId` is required on every operational media entity.
- Narration metadata must include a valid storage path and provenance.
- Visual asset metadata must include provenance plus either a usable license or a prompt, depending on the asset type.
- Integrity data must remain consistent with the stored asset metadata.
- Lists and mutations must reject cross-channel references.

## States

- Loading.
- Empty.
- Error.
- Success.
- Validation / conflict.

## Channel isolation

- Every list query is filtered by the active channel.
- Every create or update mutation writes the same `channelId` that comes from the selected context.
- Reload must not leak records across channels.
- Any cross-channel attempt must fail with a sanitized not-found, validation or conflict response.

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

- Narration metadata payload.
- Visual asset payload.

### Outputs

- Channel-scoped media registry pages.
- Detail panels for the selected artifact.
- Reloadable persisted records.
- Audit log entries.
- Validation and conflict feedback.

## Relationships

- `Channel` 1:N `MediaAssetBase`
- `Channel` 1:N `NarrationAsset`
- `Channel` 1:N `VisualAsset`

## Non-functional requirements

- Use the existing dense SaaS admin visual language.
- Keep keyboard navigation intact.
- Keep the frontend responsive at the required desktop widths.
- Avoid mock masking on the core flow.
- Preserve channel context across navigation within the session.

## Acceptance criteria

- A narration asset can be created or updated and listed again after reload.
- A visual asset can be registered and listed again after reload.
- Every step is channel-scoped and auditable.
- The frontend shows loading, empty, error, success and validation/conflict states for the media surface.
- The frontend can navigate between the artifacts without losing traceability.

## Sprint 18 slice

- H17.3 is governed by `docs/specs/019-sprint-18-render-derived-clips.md` and `/videos`.
- H17.4 is governed by `docs/specs/019-sprint-18-render-derived-clips.md` and `/clips`.
- H17.3 and H17.4 passed the Sprint 18 gate on the same head; E17 is complete on the sprint branch and is not yet integrated into `main`.
- V1-09 and V1-10 have new implementation evidence, but the formal V1 Acceptance was not rerun and V1.0 remains `NAO ACEITA`.
