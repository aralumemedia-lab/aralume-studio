# E19 - Plan

## Frontend

- `/dashboard`
  - Replace cockpit mock imports with real API data.
  - Keep list, detail and error states channel-scoped.
- `/agent-office`
  - Replace cockpit mock imports with real API data.
  - Keep snapshot, queue and handoff states channel-scoped.
- Browser evidence
  - Make the dashboard and agent-office evidence reusable for the final reaccept.

## Backend

- Keep the current operational cockpit module shape.
- Add or confirm backend paths for dashboard summary, agent-office snapshot and workflow data.
- Keep cross-channel rejection explicit in tests.

## Contracts

- `src/services/api-client.ts`
- `src/services/http-client.ts`
- `src/contracts/types.ts`
- `src/contracts/api-contracts.ts`

## Persistence

- Use the existing repository abstraction for the cockpit domains.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic.

## Audit

- Record cockpit mutations with requestId, channelId, entityType, entityId, actor and action when they exist.
- Make audit entries queryable in the same platform audit surface used by the repo.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Add or extend route and service tests for dashboard and agent-office.
- Add browser E2E coverage for create, reload, isolation, loading, empty, error and success states.
- Add screenshot coverage at all required viewports.
- Add the reusable evidence sweep for the final acceptance.

## Accessibility

- Keyboard navigation for all visible cockpit controls and detail surfaces.
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

- Mock leakage in `api-client.ts` can keep the surfaces fake even if the pages look real.
- There are no dedicated cockpit route tests in the current baseline.
- Reproducible evidence can drift if the bootstrap data is not stable.
- Visual regression can hide a missing state at one viewport while passing another.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan the epic if the existing route and contract topology is reused.
- If the cockpit topology changes, capture it before implementation.
