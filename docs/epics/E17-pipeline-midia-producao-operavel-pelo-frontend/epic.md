# E17 - Pipeline Midia e Producao Operavel pelo Frontend

- Status: proposed / not started
- Epic name: Pipeline Midia e Producao Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Priority: P1
- Source of truth: `docs/PROJECT_MASTER.md`, `docs/NEXT_SPRINTS.md`, `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_REPORT.md`, `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`

## Context

Sprint 14 left the media and production path without a proven frontend-operated flow. The repo already has real media asset, render and clip modules, routes and tests, but the current UI still does not prove the operator journey from narration and assets to render and derived clips.

This epic starts after the editorial pipeline is made operable. It must not absorb approvals, compliance, publication, metrics, costs, dashboard or agent-office work.

## Problem

The operator can inspect media and production surfaces, but the repository does not yet prove that narration, assets, render jobs and clips are created, persisted, reloaded and isolated by channel through the frontend.

## Current capability classification

Labels used below: `implemented`, `partial`, `only backend`, `only mock`, `absent`, `existing, but not demonstrable`.

| Capability | Frontend state | Backend state | Contracts | Persistence | Audit | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Narracao / V1-07 | partial | implemented | implemented | existing, but not demonstrable | absent | seed exists but the operator command path is not fully proven |
| Ativos visuais / V1-08 | partial | implemented | implemented | existing, but not demonstrable | absent | list/detail exist but create/import proof is incomplete |
| Render controlado / V1-09 | partial | implemented | implemented | existing, but not demonstrable | absent | render job proof exists in backend tests, not in the full frontend journey |
| Corte derivado / V1-10 | partial | implemented | implemented | existing, but not demonstrable | absent | clip surface exists, but the full create/reload proof is missing |

## V1 criteria covered

- V1-07 - Narracao autorizada
- V1-08 - Ativos rastreaveis
- V1-09 - Render controlado
- V1-10 - Corte derivado

## Upstream dependency

- E16 - Pipeline Editorial Operavel pelo Frontend

The media and production flow depends on the editorial flow being operational enough to supply channel, script and visual-plan context.

## R14 items included

- R14-07 - Narracao autorizada
- R14-08 - Ativos visuais rastreaveis
- R14-09 - Render controlado
- R14-10 - Corte derivado

## Epic objective

Make the media and production pipeline operable through the frontend so an operator can:

1. Use the channel and editorial context from E16.
2. Register narration or a narration asset with provenance.
3. Register visual assets with provenance and integrity data.
4. Start a controlled render job.
5. Review render state and output.
6. Create a derived clip from the rendered video.
7. Reload the app.
8. Confirm persistence.
9. Confirm auditability.
10. Confirm channel isolation.

## Value

- Turns the media path from inspection-only into a usable operator flow.
- Preserves provenance across narration, assets, render and derived clips.
- Prepares the evidence needed for the final V1 reaccept gate.

## Scope

- Frontend entry points for media assets, videos and clips.
- Channel-scoped create, update, detail and state transitions.
- Navigation between narration, assets, render and clips.
- Reload verification for created records.
- Channel isolation checks.
- Audit trail requirements for mutating actions.

## Out of scope

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

- E16 completed.
- Existing media asset, render and clip backend routes, repository and validation rules.
- Existing API envelope and error contracts.
- Audit logging support in the platform.
- Browser E2E and screenshot coverage.

## Risks

- Mixed real and mock transport may still leak into shared app-shell code.
- Persistence is process-local in the current repository baseline.
- Clip creation has no dedicated frontend service layer in the current baseline.
- Cross-channel linking bugs can silently contaminate the flow if tests are incomplete.

## Indicators

- Number of narration or asset IDs created by the frontend and visible after reload.
- Number of render job IDs emitted by the frontend and visible after reload.
- Number of clip IDs created and queryable after reload.
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
- The frontend proves narration, asset, render and clip creation.
- Channel isolation is demonstrated.
- Audit evidence is present.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or scope creep is introduced.

## Final gate

READY FOR SPRINT PLANNING when the story bundle is complete, evidence exists on the same head and the epic can be split into small sprint-sized slices without changing scope.
