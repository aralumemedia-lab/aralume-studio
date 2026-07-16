# E16 - Pipeline Editorial Operavel pelo Frontend

- Status: completed
- Epic name: Pipeline Editorial Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Priority: P1
- Source of truth: `docs/PROJECT_MASTER.md`, `docs/NEXT_SPRINTS.md`, `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_REPORT.md`, `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`

## Context

Sprint 14 closed with `V1.0 NAO ACEITA`. The matrix still shows the editorial pipeline gaps concentrated on V1-02 to V1-06. The repository already has real backend/editorial routes, real frontend routes for `/channels`, `/ideas`, `/research`, `/scripts`, and an editorial contract layer, but the current frontend does not yet prove the complete operator flow from channel profile setup to visual plan and scene planning.

The first remediation epic must make the editorial pipeline operable by the frontend without expanding into media, render, clips, approvals, publication, metrics, costs, dashboard or agent-office work.

## Sprint 15 slice

- Included now: H16.0, H16.1, H16.2, H16.3 and H16.4.
- Sprint 15 delivered the upstream slice of E16.
- Sprint 16 delivered the remaining slice of E16 and closes the epic.
- E16 is complete on the current head.

## Problem

An operator can browse the editorial pipeline today, but the repository does not yet prove the whole flow as a frontend-operated, channel-scoped, auditable path with reload verification and traceability across artifacts.

## Current capability classification

Labels used below: `implemented`, `partial`, `only backend`, `only mock`, `absent`, `existing, but not demonstrable`.

| Capability | Frontend state | Backend state | Contracts | Persistence | Audit | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Perfil editorial / V1-02 | implemented | implemented | implemented | implemented | implemented | implemented |
| Pauta / V1-03 | implemented | implemented | implemented | implemented | implemented | implemented |
| Pesquisa / V1-04 | implemented | implemented | implemented | implemented | implemented | implemented |
| Fontes / V1-04 | implemented | implemented | implemented | implemented | implemented | implemented |
| Claims / V1-04 | implemented | implemented | implemented | implemented | implemented | implemented |
| Roteiro / V1-05 | partial | implemented | implemented | existing, but not demonstrable | absent | list and read paths exist; creation path still not proven in frontend |
| Versoes / V1-05 | only backend | implemented | implemented | existing, but not demonstrable | absent | backend versioning is tested; frontend history flow is incomplete |
| Plano visual / V1-06 | absent | implemented | implemented | existing, but not demonstrable | absent | no dedicated frontend operable surface proved |
| Cenas / V1-06 | only backend | implemented | implemented | existing, but not demonstrable | absent | backend scene support exists; frontend command path not proven |
| Navegacao e rastreabilidade | partial | implemented | implemented | existing, but not demonstrable | absent | route linkage exists, but the full operator journey is not proven |

## V1 criteria covered

- V1-03 - Pauta
- V1-04 - Pesquisa e fontes
- V1-05 - Roteiro versionado
- V1-06 - Planejamento visual
- V1-02 - Perfil editorial

## Upstream dependency

- V1-02 - Perfil editorial

V1-02 is a dependency on the channel surface and is treated here as an inseparable prerequisite for the editorial flow.

## R14 items included

- R14-02 - Perfil editorial
- R14-03 - Criacao de pauta
- R14-04 - Pesquisa, fontes e claims
- R14-05 - Roteiro versionado
- R14-06 - Plano visual e cenas

## Epic objective

Make the editorial pipeline operable through the frontend so an operator can:

1. Select a channel.
2. Configure the channel editorial profile.
3. Create a content idea.
4. Create a research session.
5. Register sources.
6. Register claims.
7. Create a script.
8. Create a new script version.
9. Review history.
10. Create a visual plan.
11. Add and order scenes.
12. Reload the app.
13. Confirm persistence.
14. Confirm auditability.
15. Confirm channel isolation.

## Value

- Converts the editorial path from read-only or partly mocked surfaces into a usable operator flow.
- Reduces the risk of false acceptance by proving the exact artifacts in the frontend.
- Keeps traceability between channel, idea, research, script, version, visual plan and scene artifacts.
- Closes the upstream profile gap that all editorial artifacts depend on.

## Scope

- Frontend entry points for the channel editorial profile, ideas, research, scripts and the visual-planning surface.
- Channel-scoped list, create, update and detail states.
- Navigation between the editorial artifacts.
- Reload verification for the created records.
- Channel isolation checks.
- Audit trail requirements for mutating actions.

## Out of scope

- Media asset registration.
- Render jobs.
- Derived clips.
- Quality gates.
- Compliance gates.
- Human approval.
- Publication.
- Metrics.
- Costs.
- Dashboard.
- Agent Office.
- New auth or OAuth work.
- New database or migration system.
- Release work.
- A new V1 acceptance run.

## Dependencies

- The channel selector and active channel context already in the shell.
- Existing editorial backend routes, repository and validation rules.
- Existing API envelope and error contracts.
- Audit logging support in the platform.
- Browser E2E and screenshot coverage.
- The visual-plan frontend placement decision.

## Risks

- Mixed real and mock transport still exists elsewhere in the repo.
- The current frontend has no dedicated visual-plan route today.
- Editorial audit hooks are not present in the current editorial service.
- Persistence is process-local in the current repository baseline.
- Cross-channel linking bugs can silently contaminate the editorial flow if tests are incomplete.
- The channel profile must be included before the rest of the editorial flow can be treated as operable.

## Indicators

- Number of editorial IDs created by the frontend and visible after reload.
- Number of audit entries emitted for editorial mutations.
- Number of cross-channel attempts rejected.
- Number of surfaces that import no mock API directly.
- Browser E2E and screenshot pass rate on the required viewports.

## Definition of Ready

- The story bundle is written and linked to the failed criteria.
- Scope and out-of-scope are explicit.
- Contracts are mapped to the current repo.
- Audit and persistence behavior are stated.
- Visual QA is planned.
- No ambiguity remains about the first four editorial capabilities.

## Definition of Done

- The included stories are accepted on the same head.
- The frontend proves creation, reload and traceability.
- Channel isolation is demonstrated.
- Audit evidence is present.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or implementation scope creep is introduced.

## Final gate

Sprint 15 is already delivered on the current head; E16 remains open until H16.3 and H16.4 are implemented and evidenced on the next slice.
