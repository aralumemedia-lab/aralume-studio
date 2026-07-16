# E16 - Plan

## Frontend

- `/ideas`
  - Wire the create/update path for content ideas.
  - Keep list, detail and error states channel-scoped.
  - Remove mock toasts from the primary editorial actions.
- `/channels`
  - Wire the editorial profile update path for the selected channel.
  - Keep settings and validation states channel-scoped.
- `/research`
  - Wire session creation, source creation and claim creation.
  - Keep the current list/detail pattern and validation feedback.
- `/scripts`
  - Wire script creation and version creation.
  - Expose version history as a first-class operator action.
- `/production`
  - Add the visual-plan entry point or detail surface here.
  - Keep the visual-plan and scene flow reachable from the editorial pipeline.
- Shell navigation
  - Preserve the channel context and navigation between editorial artifacts.

## Backend

- Keep the current editorial router/service/repository shape.
- Add the audit hook required by the epic for mutating editorial actions.
- Keep cross-channel rejection and version monotonicity explicit in tests.
- Keep the current in-memory repository model for this epic; restart durability is out of scope.

## Contracts

- `src/contracts/types.ts`
- `src/contracts/api-contracts.ts`
- `src/services/api-client.ts`
- `src/services/editorial-api.ts`
- `src/services/research-api.ts`
- `src/services/scripts-api.ts`
- `src/services/visual-plans-api.ts`
- `src/services/http-client.ts`

## Persistence

- Use the existing repository abstraction for the editorial domain.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic.

## Audit

- Record editorial create/update events with channelId, actor, requestId and entity metadata.
- Make audit entries queryable in the same platform audit surface used by the repo.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Server unit and HTTP tests for editorial flows.
- Service tests for the frontend API clients.
- Route tests for `/ideas`, `/research`, `/scripts` and the visual-plan placement.
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

- The editor flow may still inherit mixed real/mocked transport from other areas if imports are not constrained.
- Visual-planning placement in the frontend is currently undecided.
- Audit hooks are not present in the editorial service today.
- The repository is process-local, so restart durability is not part of this epic.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan the epic if the existing route and contract topology is reused.
- If the visual-plan placement changes the route topology or contract shape, capture it before implementation.
