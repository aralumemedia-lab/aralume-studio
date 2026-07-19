# V1 Sprint 21 Evidence - E19

This supplemental bundle records Sprint 21 evidence for E19. It does not change the official V1 Acceptance matrix and does not execute `R14-REACCEPT`.

## Head and procedure

- Branch: `codex/sprint-21-real-cockpits-e-evidencias-transversais`
- Integrated by PR #34 with merge commit `0a7a79e93a5fdf5c8262e09b8828110cdca227f1`
- Baseline: `main = origin/main = 2b47cf25e2c74f576ef58bc54620ea645d1c00bf`
- Runner: `node scripts/sprint21-browser-e2e.mjs`
- Backend: `tsx server/src/index.ts`, `ARALUME_ENV=test`, temporary process-local storage
- Frontend: `vite dev --host 127.0.0.1 --port 4173`
- Channels: `ch_historia` (A) and `ch_negocios` (B)
- Cockpit mutations: none; the sweep observed zero non-GET API requests
- External requests: none

## Results

- `GET /api/dashboard/summary`, `/api/agents`, `/api/agent-office/snapshot` and `/api/workflows` returned standard envelopes.
- Dashboard and Agent Office data came from backend repository projections and remained channel-scoped.
- Reload was exercised on both surfaces while the backend process remained alive.
- Empty state was exercised with `ch_negocios`; transport error was exercised by aborting the cockpit request in the browser runner.
- Direct API isolation checks found no `ch_historia` workflows in the `ch_negocios` snapshot.
- No browser `pageerror`, external request or cockpit mutation was observed.
- The runner terminated both child processes on Windows with `taskkill /t /f`.

## Screenshots

The runner generated the following local evidence under `screenshots/sprint-21/`:

- Dashboard: `1366x768` expanded/collapsed, `1600x900` success/empty/error, `1792x1024` reload.
- Agent Office: `1366x768` expanded/collapsed, `1600x900` success/empty/error, `1792x1024` reload, `1920x1080` isolation.

The existing application shell emits hydration and code-splitting console warnings during Vite development. They are not browser page errors and are not introduced by the Sprint 21 cockpit changes.

## V1 traceability reuse

| V1 criteria  | Reusable evidence relationship                                               |
| ------------ | ---------------------------------------------------------------------------- |
| V1-01        | E19 cockpit/channel context and the future reaccept route sweep              |
| V1-02..V1-06 | E16 evidence bundles plus Sprint 21 cockpit context and reload harness       |
| V1-07..V1-10 | E17 evidence bundles plus Sprint 21 cockpit context and reload harness       |
| V1-11..V1-14 | E18 evidence bundles plus Sprint 21 cockpit context and reload harness       |
| V1-15..V1-18 | Existing V1 evidence index and the reusable Sprint 21 browser/visual harness |

This table is a reuse map, not a new PASS decision. All official V1 statuses remain unchanged and `V1.0 NAO ACEITA` remains vigente.
