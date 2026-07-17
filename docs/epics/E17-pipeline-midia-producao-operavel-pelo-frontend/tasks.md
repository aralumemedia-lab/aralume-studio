# E17 - Tasks

## Sprint 17 execution status

- H17.1 and H17.2 tasks below were delivered by Sprint 17 and integrated through PR #28.
- H17.3 and H17.4 tasks are not included and remain pending.
- The browser procedure is `node scripts/sprint17-browser-e2e.mjs`; evidence is under `screenshots/sprint-17/`.

## Contracts

- Reconcile narration and visual-asset payloads with the current `src/contracts/types.ts` models.
- Keep the API envelope and error codes unchanged.
- Keep `src/services/api-client.ts` limited to real services for the epic surfaces.

## Frontend

- Implement narration create/update actions on `/media-assets`.
- Implement visual asset create/update actions on `/media-assets`.
- Remove mock-only primary actions from the epic flow.
- Keep loading, empty, error, success and validation/conflict states explicit.

## Backend

- Keep channel validation and cross-channel conflict rejection explicit.
- Keep the current repository abstraction stable for the slice.

## Persistence

- Verify that the media repository survives browser reloads inside the same process.
- Preserve asset ordering and details across reloads.
- Do not add a database or migration layer in this slice.

## Audit

- Record create/update and validation events with requestId, channelId, entityType, entityId, actor and action.

## Tests

- Add or extend server HTTP tests for the two stories.
- Add or extend frontend route tests for loading, empty, error, success and validation/conflict states.
- Add browser E2E coverage for create, reload, isolation and invalid payload scenarios.
- Add screenshot coverage at all required viewports.

## Accessibility

- Ensure keyboard focus reaches every form control and primary action.
- Ensure table rows and detail panels remain readable with long values.
- Ensure the media surface can be operated without pointer-only assumptions.

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
