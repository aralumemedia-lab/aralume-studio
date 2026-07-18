# E17 - Plan

## Frontend

- `/media-assets`
  - Wire narration create/update paths.
  - Wire visual asset create/update paths.
  - Keep list, detail and error states channel-scoped.
- `/videos`
  - Use the real render client and expose pending, terminal, error and conflict states.
- `/clips`
  - Select rendered videos, validate intervals and expose persisted clip details and file access.

## Backend

- Keep the current media asset module shape.
- Reuse the existing repository abstraction and audit hooks.
- Keep cross-channel rejection and storage validation explicit in tests.

## Contracts

- `src/contracts/types.ts`
- `src/services/api-client.ts`
- `src/services/media-assets-api.ts`
- `src/routes/media-assets.tsx`
- `server/src/modules/media-assets/*`
- `src/services/renders-api.ts`
- `src/tests/clips-route.test.ts`

## Persistence

- Use the existing repository abstraction for media assets.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic slice.

## Audit

- Record media asset create/update and validation events with channelId, actor, requestId and entity metadata.
- Propagate the HTTP requestId through render and clip mutation audits.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Server unit and HTTP tests for narration and visual-asset flows.
- Service tests for the frontend API client.
- Route tests for `/media-assets`.
- Browser E2E for create, reload, isolation, loading, empty, error and validation/conflict states.
- Screenshot QA at all required viewports.
- Sprint 18 E2E: `node scripts/sprint18-browser-e2e.mjs` with controlled render policy and temporary storage fixtures.

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

- The media flow may still inherit mixed real/mocked transport from shared app-shell imports.
- The repository is process-local, so restart durability is not part of this epic slice.
- Cross-channel contamination can hide behind a visually correct list if tests are thin.
- Browser process teardown and deterministic render policy must remain controlled by the runner.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic slice.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan this slice if the existing route and contract topology is reused.

## Sprint 18 implementation result

- H17.3 and H17.4 passed the same-head browser, HTTP, reload, audit and isolation gate.
- No database, migration, dependency or external integration was introduced.
- E17 is complete and integrated in `main` by PR #30.
