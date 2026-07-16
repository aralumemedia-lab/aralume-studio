# E17 - Risks

| Risk | Evidence | Impact | Mitigation |
| --- | --- | --- | --- |
| Mixed transport still exists in shared app-shell code | `src/services/api-client.ts` still routes some unrelated surfaces through `mock-api.ts`. | The media flow can look real while still leaking mock dependencies. | Keep the scope constrained and verify imports explicitly in tests. |
| Clip service coverage is thinner than media/render coverage | There is a clip backend module, but the frontend service layer is not as mature as the other surfaces. | Clip creation could remain backend-only. | Make clip creation a dedicated story with browser evidence. |
| Process-local persistence is not restart durable | The current baseline does not add a database for this epic. | Reload after process restart remains unproven. | Accept only same-process reload persistence in this epic and document the limit. |
| Visual regression can hide state loss | Media surfaces are dense and can overflow with long values. | A small layout defect can hide missing data. | Require screenshots at all mandated viewports and explicit empty/error states. |
