# E19 - Tasks

## Contracts

- Sprint 21 contract decision: use real backend cockpit projections over existing repositories; do not expose frontend mock data.

- Reconcile cockpit payloads with the current `src/contracts/types.ts` models.
- Keep the API envelope and error codes unchanged.
- Confirm the cockpit data contracts before any implementation branch.
- Keep `src/services/api-client.ts` limited to real services for the cockpit surfaces.

## Frontend

- Replace the dashboard mock path with real API consumption.
- Replace the agent-office mock path with real API consumption.
- Add the reusable evidence sweep for the final reaccept.
- Keep loading, empty, error and success states explicit.

## Backend

- Keep channel validation and cross-channel conflict rejection explicit.
- Keep cockpit snapshot and workflow rules explicit.
- Keep the current repository abstraction stable for the epic.

## Persistence

- Verify that the cockpit repositories survive browser reloads inside the same process.
- Preserve workflow and handoff ordering across reloads.
- Do not add a database or migration layer in this epic.

## Audit

- No cockpit mutation is in scope. Preserve the existing audit query surface; any future mutation must record requestId, channelId, entityType, entityId, actor and action.

## Tests

- Add or extend route and service tests for dashboard and agent-office.
- Add browser E2E coverage for reload, isolation, loading, empty, error and success scenarios.
- Add screenshot coverage at all required viewports.
- Add the reusable evidence replay for the final acceptance.

## Accessibility

- Ensure keyboard focus reaches every form control and primary action.
- Ensure table rows and detail panels remain readable with long values.
- Ensure the cockpit surfaces can be operated without pointer-only assumptions.

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
- Do not widen the scope beyond cockpit realness and evidence infrastructure.
