# E18 - Risks

| Risk | Evidence | Impact | Mitigation |
| --- | --- | --- | --- |
| Governance can drift back into read-only inspection | The acceptance matrix still marks V1-11..V1-14 as not proven. | The flow may look complete while decisions remain unproven. | Require mutating actions and reload proof for each story. |
| Publication readiness may silently imply auto-send | The spec explicitly forbids external auto-send. | The plan could accidentally cross into release behavior. | Keep the no-auto-send rule in scope and test it explicitly. |
| Process-local persistence is not restart durable | The current baseline does not add a database for this epic. | Reload after process restart remains unproven. | Accept only same-process reload persistence in this epic and document the limit. |
| Visual regression can hide state loss | Governance surfaces are dense and can overflow with long values. | A layout defect can hide missing data. | Require screenshots at all mandated viewports and explicit empty/error states. |
