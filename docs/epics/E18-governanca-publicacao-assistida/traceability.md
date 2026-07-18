# E18 - Traceability

| Criterion V1 | R14 | Story | Proposed sprint | Acceptance | Task | Contract | Component | Endpoint | Test | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1-11 Technical quality | R14-11 | H18.1 | Sprint 19 | Quality reviewed and visible after reload | Implement quality gate and preserve result | `QualityCheck`, `GET/POST /api/quality-checks` | `/approvals`, `/compliance` | `GET/POST /api/quality-checks` | `server/test/governance.test.ts`, `src/tests/editorial-route-integrations.test.ts`, `scripts/sprint19-browser-e2e.mjs` | `screenshots/sprint-19/approvals-1600-success.png`, `approvals-1600-conflict.png`, audit requestId; formal V1 status remains NOT PROVEN |
| V1-12 Compliance and rights | R14-12 | H18.2 | Sprint 19 | Compliance reviewed and blocked when necessary | Implement compliance gate and preserve block | `ComplianceCheck`, `GET/POST /api/compliance-checks` | `/compliance`, `/approvals` | `GET/POST /api/compliance-checks` | `server/test/governance.test.ts`, `src/tests/editorial-route-integrations.test.ts`, `scripts/sprint19-browser-e2e.mjs` | `screenshots/sprint-19/compliance-1600-blocked.png`, audit requestId; formal V1 status remains NOT PROVEN |
| V1-13 Human approval | R14-13 | H18.3 | Sprint 19 | Human decision persisted and visible after reload | Implement human decision with immutable history | `HumanApproval`, approval endpoints | `/approvals` | `POST /api/approvals`, decision endpoints, `GET /api/approvals/:id/history` | `server/test/governance.test.ts`, `src/tests/editorial-route-integrations.test.ts`, `scripts/sprint19-browser-e2e.mjs` | `screenshots/sprint-19/approvals-1600-success.png`, `approvals-1792-reload.png`, `approvals-1920-isolation.png`, audit requestId; formal V1 status remains NOT PROVEN |
| V1-14 Assisted publication | R14-14 | H18.4 | Sprint 20 | Human-confirmed draft/package visible after reload | Implement readiness and package without auto-send | `PublicationTarget`, `PublicationJob`, `privacyStatus`, allowed `metadata`, `humanConfirmed`, `POST /api/publications` | `/publications` | `POST /api/publications`, `GET /api/publications`, `GET /api/publication-targets` | `server/test/publications.test.ts`, `src/services/publications-api.test.ts`, `src/tests/publications-route.test.ts`, `scripts/sprint20-browser-e2e.mjs` | `screenshots/sprint-20/`; formal V1-14 status remains pending reaccept |

## Dependency note

- E17 is integrated in `main` and must remain complete before E18 starts because governance depends on media, render and clip artifacts.
- Sprint 19 passed and merged before Sprint 20 started; Sprint 20 must pass review and merge before E18 is complete.
- E19 and `R14-REACCEPT` remain downstream of E18.
