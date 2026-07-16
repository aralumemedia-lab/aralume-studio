# E16 - Tasks

## Contracts

- Reconcile editorial payloads with the current `src/contracts/types.ts` models.
- Keep the API envelope and error codes unchanged.
- Confirm the visual-plan placement contract before any implementation branch.
- Confirm the channel profile contract and reload behavior before any implementation branch.
- Keep `src/services/api-client.ts` limited to real services for the epic surfaces.

## Frontend

- Implement the create and update actions on `/ideas`.
- Implement the channel profile update action on `/channels`.
- Implement the research session, source and claim actions on `/research`.
- Implement script creation and version creation on `/scripts`.
- Expose the visual-planning surface from the production area.
- Remove mock-only primary actions from the epic flow.
- Keep loading, empty, error and success states explicit.

## Backend

- Add editorial audit hooks for mutating actions.
- Keep channel validation and cross-channel conflict rejection explicit.
- Keep script version monotonicity and visual scene ordering rules explicit.
- Keep the current repository abstraction stable for the epic.

## Persistence

- Verify that the editorial repository survives browser reloads inside the same process.
- Preserve version history and scene ordering across reloads.
- Do not add a database or migration layer in this epic.

## Audit

- Record create/update events for content ideas, research sessions, sources, claims, scripts, versions, visual plans and scenes.
- Include requestId, channelId, entityType, entityId, actor and action in the audit evidence.

## Tests

- Add or extend server HTTP tests for all four stories.
- Add or extend server HTTP tests for the channel profile story.
- Add or extend frontend route tests for loading, empty, error and success states.
- Add browser E2E coverage for create, reload, isolation, duplicate and invalid payload scenarios.
- Add screenshot coverage at all required viewports.

## Accessibility

- Ensure keyboard focus reaches every form control and primary action.
- Ensure table rows and detail panels remain readable with long values.
- Ensure the visual-plan surface can be operated without pointer-only assumptions.

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
- Do not widen the scope to dashboard, agent office, media, render, clips, approvals, compliance, publication, metrics or costs.
