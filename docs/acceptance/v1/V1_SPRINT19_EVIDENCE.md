# Sprint 19 Evidence

This is supplemental implementation evidence only. It does not execute or replace a V1 Acceptance. V1.0 remains `NAO ACEITA`.

## Traceability

| Criterion | R14 | Story | Evidence |
| --- | --- | --- | --- |
| V1-11 | R14-11 | H18.1 | Real frontend quality mutation, passed result, cross-channel conflict, reload and correlated audit in `scripts/sprint19-browser-e2e.mjs`; HTTP regression in `server/test/governance.test.ts`. |
| V1-12 | R14-12 | H18.2 | Real frontend compliance mutation, blocked visual-plan case, cross-channel conflict, reload and correlated audit in the Sprint 19 runner. |
| V1-13 | R14-13 | H18.3 | Real frontend approval creation, human decision, history after reload, channel isolation and correlated audit in the Sprint 19 runner. |

## Artifacts

- Browser runner: `node scripts/sprint19-browser-e2e.mjs`.
- Screenshots: `screenshots/sprint-19/approvals-1366-expanded.png`, `approvals-1366-collapsed.png`, `approvals-1600-success.png`, `approvals-1600-conflict.png`, `approvals-1792-reload.png`, `approvals-1920-isolation.png`, `compliance-1600-blocked.png`.
- Backend regression: 68/68 tests passed in the targeted governance run; the full suite remains the final gate.
- Audit fields verified: top-level `requestId`, `channelId`, actor, action, entity ID, status and sanitized message.
- Persistence boundary: same-process browser reload; restart durability remains out of scope.

## Status rule

The evidence is attached to the Sprint 19 branch and is pending review/merge. Formal V1 matrix statuses remain unchanged until `R14-REACCEPT` runs with new evidence on its final head.
