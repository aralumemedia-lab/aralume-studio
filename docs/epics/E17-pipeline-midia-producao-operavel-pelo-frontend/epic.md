# E17 - Pipeline Midia e Producao Operavel pelo Frontend

- Status: complete on Sprint 18 head; pending PR integration
- Epic name: Pipeline Midia e Producao Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Priority: P1
- Source of truth: `docs/PROJECT_MASTER.md`, `docs/NEXT_SPRINTS.md`, `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_REPORT.md`, `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`

## Context

Sprint 16 closed the editorial pipeline. Sprint 17 proved the media registry path for narration and visual assets. Sprint 18 now proves controlled render and derived clips through the frontend using the existing backend modules.

## Problem

Before Sprint 17, the operator could inspect media surfaces but the repository did not prove the media path through the frontend. Sprint 17 closed the narration and asset gap; Sprint 18 addresses the remaining render and clip evidence gap for H17.3 and H17.4.

## Current capability classification

Labels used below: `implemented`, `partial`, `only backend`, `only mock`, `absent`, `existing, but not demonstrable`.

| Capability | Frontend state | Backend state | Contracts | Persistence | Audit | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Narracao / V1-07 | implemented | implemented | implemented | implemented for reload in the same process | implemented | create/update, reload, audit and isolation proven by Sprint 17 E2E |
| Ativos visuais / V1-08 | implemented | implemented | implemented | implemented for reload in the same process | implemented | create/update, provenance, integrity, reload and isolation proven by Sprint 17 E2E |
| Render controlado / V1-09 | implemented | implemented | implemented | same-process reload proven | implemented with requestId correlation | Sprint 18 frontend/E2E and screenshots |
| Corte derivado / V1-10 | implemented | implemented | implemented | same-process reload proven | implemented with requestId correlation | Sprint 18 frontend/E2E and screenshots |

## V1 criteria covered in this sprint slice

- V1-07 - Narracao autorizada
- V1-08 - Ativos rastreaveis
- V1-09 - Render controlado
- V1-10 - Corte derivado

## Upstream dependency

- E16 - Pipeline Editorial Operavel pelo Frontend

The media flow depends on the editorial flow being operational enough to supply channel and content context.

## R14 items included

- R14-07 - Narracao autorizada
- R14-08 - Ativos visuais rastreaveis
- R14-09 - Render controlado
- R14-10 - Corte derivado

## Epic objective

Make the first media slice operable through the frontend so an operator can:

1. Use the channel context from E16.
2. Create or update narration metadata.
3. Register visual assets with provenance and integrity data.
4. Reload the app.
5. Confirm persistence.
6. Confirm auditability.
7. Confirm channel isolation.

## Value

- Turns the media registry from inspection-only into a usable operator flow.
- Preserves provenance and integrity across narration and visual assets.
- Prepares the second E17 slice for render and clips without mixing scope.

## Scope

- Frontend entry point for media assets.
- Channel-scoped create, update, detail and state transitions.
- Reload verification for created records.
- Channel isolation checks.
- Audit trail requirements for mutating actions.
- Controlled render from registered channel assets through `/videos`.
- Derived clips from completed rendered videos through `/clips`.
- Interval, idempotency, output-file and provenance traceability.

## Out of scope

- Quality, compliance, approval and publication.
- Metrics.
- Costs.
- Dashboard.
- Agent Office.
- New auth or OAuth work.
- New database or migration system.
- Release work.
- A new V1 acceptance run.

## Dependencies

- E16 completed.
- Existing media asset backend routes, repository and validation rules.
- Existing API envelope and error contracts.
- Audit logging support in the platform.
- Browser E2E and screenshot coverage.

## Risks

- Mixed real and mock transport may still leak into shared app-shell code.
- Persistence is process-local in the current repository baseline.
- Cross-channel linking bugs can silently contaminate the flow if tests are incomplete.

## Indicators

- Number of narration or asset IDs created by the frontend and visible after reload.
- Number of audit entries emitted for media mutations.
- Browser E2E and screenshot pass rate on the required viewports.

## Definition of Ready

- The story bundle is written and linked to the failed criteria.
- Scope and out-of-scope are explicit.
- Contracts are mapped to the current repo.
- Audit and persistence behavior are stated.
- Visual QA is planned.

## Definition of Done

- The included stories are accepted on the same head.
- The frontend proves narration and visual asset creation/update.
- Channel isolation is demonstrated.
- Audit evidence is present.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or scope creep is introduced.

## Sprint 18 gate

Sprint 18 evidence is complete on the sprint branch. E17 is closed on that head, pending its PR integration into `main`; H17.3 and H17.4 are not started in a later sprint.
