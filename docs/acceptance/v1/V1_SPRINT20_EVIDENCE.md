# Sprint 20 Evidence

This is supplemental implementation evidence only. It does not execute or replace a V1 Acceptance. V1.0 remains `NAO ACEITA`.

## Traceability

| Criterion | R14 | Story | Evidence |
| --- | --- | --- | --- |
| V1-14 | R14-14 | H18.4 | Real frontend preparation of a channel-scoped publication package with explicit human confirmation, allowed privacy/metadata fields, reload, conflict handling, cross-channel backend rejection and correlated audit. |

## Artifacts

- Browser runner: `node scripts/sprint20-browser-e2e.mjs`.
- Screenshots: `screenshots/sprint-20/publications-1366-expanded.png`, `publications-1366-collapsed.png`, `publications-1600-success.png`, `publications-1600-invalid.png`, `publications-1600-conflict.png`, `publications-1792-reload.png`, `publications-1920-isolation.png`.
- Backend regression: full suite passed with 70 tests, 0 failures, 0 skipped and 0 todo.
- HTTP cases: valid preparation `201`, invalid human confirmation `400`, cross-channel source/target `404`, idempotency conflict `409`.
- Audit fields verified: top-level `requestId`, `channelId`, actor, action, entity ID, status and sanitized message.
- No external provider or upload request observed by the browser runner.
- Persistence boundary: same-process browser reload; restart durability remains out of scope.

## Status rule

The evidence is attached to the Sprint 20 implementation branch and remains pending review/merge. Formal V1 matrix statuses remain unchanged until `R14-REACCEPT` runs with new evidence on its final head.
