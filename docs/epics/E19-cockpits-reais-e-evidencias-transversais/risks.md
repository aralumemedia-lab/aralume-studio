# E19 - Risks

| Risk | Evidence | Impact | Mitigation |
| --- | --- | --- | --- |
| Mock leakage from shared `api-client.ts` | The current main flow still reexports cockpit data from `mock-api.ts`. | The cockpits can look operational while staying fake. | Remove the mock dependency and lock it down with tests. |
| No dedicated cockpit route tests exist | `src/tests/dashboard-route.test.ts` and `src/tests/agent-office-route.test.ts` do not exist in the current baseline. | The surfaces can regress without detection. | Add route tests and reuse them in the final evidence harness. |
| Evidence bootstrap can drift | The final acceptance needs repeatable browser evidence. | R14-REACCEPT can become non-reproducible. | Add a stable data bootstrap and a reusable sweep. |
| Visual regression can hide missing states | Cockpit surfaces are dense and can overflow. | A small layout defect can hide missing data. | Require screenshots at all mandated viewports and explicit empty/error states. |
