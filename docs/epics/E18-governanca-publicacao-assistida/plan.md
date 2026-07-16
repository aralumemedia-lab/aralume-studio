# E18 - Plan

## Frontend

- `/approvals`
  - Wire quality review, compliance review and human approval states.
  - Keep blocked and history states channel-scoped.
- `/compliance`
  - Wire compliance review and blocked-state handling.
  - Keep detail and error states channel-scoped.
- `/publications`
  - Wire publication target and readiness handling.
  - Keep draft, blocked and ready states explicit.
- Shell navigation
  - Preserve channel context and navigation between governance artifacts.

## Backend

- Keep the current governance and publication module shape.
- Add audit hooks for mutating governance actions if any gap remains.
- Keep blocked-state semantics explicit in tests.
- Keep the current repository abstraction stable for the epic.

## Contracts

- `src/contracts/types.ts`
- `src/contracts/api-contracts.ts`
- `src/services/api-client.ts`
- `src/services/publications-api.ts`
- `src/services/http-client.ts`

## Persistence

- Use the existing repository abstraction for the governance and publication domains.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic.

## Audit

- Record quality, compliance, approval and publication events with channelId, actor, requestId and entity metadata.
- Make audit entries queryable in the same platform audit surface used by the repo.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Server unit and HTTP tests for governance and publication flows.
- Service tests for the frontend API clients.
- Route tests for `/approvals`, `/compliance` and `/publications`.
- Browser E2E for create, reload, isolation, loading, empty, error and success states.
- Screenshot QA at all required viewports.

## Accessibility

- Keyboard navigation for all input, table and detail interactions.
- Visible focus states for forms and actions.
- No overflow or truncation that blocks reading the selected artifact.

## QA visual

- 1366x768
- 1600x900
- 1792x1024
- 1920x1080
- Sidebar expanded
- Sidebar collapsed
- Full lists
- Long text values
- Empty states
- Error states
- Invalid forms
- Keyboard focus
- No horizontal overflow

## Risks

- Governance actions can still look real while some flows rely on read-only surfaces.
- Publication readiness can regress into a read-only summary if mutating actions are not tested.
- The repository is process-local, so restart durability is not part of this epic.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan the epic if the existing route and contract topology is reused.
- If the publication or approval route topology changes, capture it before implementation.
