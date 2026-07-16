# E17 - Plan

## Frontend

- `/media-assets`
  - Wire narration and visual-asset create/update paths.
  - Keep list, detail and error states channel-scoped.
- `/videos`
  - Wire controlled render start and render state handling.
  - Keep output and error states channel-scoped.
- `/clips`
  - Wire clip creation from a rendered video.
  - Keep list, detail and invalid interval states explicit.
- Shell navigation
  - Preserve channel context and navigation between media artifacts.

## Backend

- Keep the current media, render and clip module shape.
- Add audit hooks for mutating media actions if any gap remains.
- Keep cross-channel rejection and interval validation explicit in tests.
- Keep the current repository abstraction stable for the epic.

## Contracts

- `src/contracts/types.ts`
- `src/contracts/api-contracts.ts`
- `src/services/api-client.ts`
- `src/services/media-assets-api.ts`
- `src/services/renders-api.ts`
- `src/routes/clips.tsx`
- `src/services/http-client.ts`

## Persistence

- Use the existing repository abstraction for the media and production domains.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic.

## Audit

- Record media create/update/render/clip events with channelId, actor, requestId and entity metadata.
- Make audit entries queryable in the same platform audit surface used by the repo.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Server unit and HTTP tests for media, render and clip flows.
- Service tests for the frontend API clients.
- Route tests for `/media-assets`, `/videos` and `/clips`.
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

- The media and production flow may still inherit mixed real/mocked transport from shared app-shell imports.
- Clip creation currently lacks a dedicated frontend service layer.
- The repository is process-local, so restart durability is not part of this epic.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan the epic if the existing route and contract topology is reused.
- If clip placement changes the route topology or contract shape, capture it before implementation.
