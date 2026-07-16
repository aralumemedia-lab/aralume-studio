# E17 - Tasks

## Contracts

- Reconcile media and clip payloads with the current `src/contracts/types.ts` models.
- Keep the API envelope and error codes unchanged.
- Confirm the clip placement contract before any implementation branch.
- Keep `src/services/api-client.ts` limited to real services for the epic surfaces.

## Frontend

- Implement the narration/asset actions on `/media-assets`.
- Implement the render start and state actions on `/videos`.
- Implement the clip creation action on `/clips`.
- Remove mock-only primary actions from the epic flow.
- Keep loading, empty, error and success states explicit.

## Backend

- Keep channel validation and cross-channel conflict rejection explicit.
- Keep render job and clip validation rules explicit.
- Keep the current repository abstraction stable for the epic.

## Persistence

- Verify that the media, render and clip repositories survive browser reloads inside the same process.
- Preserve render state and clip ordering across reloads.
- Do not add a database or migration layer in this epic.

## Audit

- Record create/update/render/clip events with requestId, channelId, entityType, entityId, actor and action.

## Tests

- Add or extend server HTTP tests for all four stories.
- Add or extend frontend route tests for loading, empty, error and success states.
- Add browser E2E coverage for create, reload, isolation, duplicate and invalid payload scenarios.
- Add screenshot coverage at all required viewports.

## Accessibility

- Ensure keyboard focus reaches every form control and primary action.
- Ensure table rows and detail panels remain readable with long values.
- Ensure the clip surface can be operated without pointer-only assumptions.

## QA visual

- Capture 1366x768, 1600x900, 1792x1024 and 1920x1080.
- Test sidebar expanded and collapsed.
- Test full lists, long text, empty states and invalid forms.
- Confirm no horizontal overflow.

## Documentation

- Update `docs/PRODUCT_BACKLOG.md`.
- Update `docs/NEXT_SPRINTS.md`.
- Update `docs/CODEX_HANDOFF.md`.
- Keep the epic docs in sync with the backlog and handoff.

## Security

- Do not add secrets.
- Do not edit `.env.local`.
- Do not add external integrations.
- Do not widen the scope to dashboard, agent office, approvals, compliance, publication, metrics or costs.
