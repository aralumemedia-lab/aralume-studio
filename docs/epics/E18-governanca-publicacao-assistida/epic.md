# E18 - Governanca e Publicacao Assistida pelo Frontend

- Status: proposed / not started
- Epic name: Governanca e Publicacao Assistida pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Priority: P1
- Source of truth: `docs/PROJECT_MASTER.md`, `docs/NEXT_SPRINTS.md`, `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_REPORT.md`, `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`

## Context

Sprint 14 showed that the governance path exists in contracts and backend code, but the frontend has not yet proved the full operator journey across quality, compliance, human approval and publication readiness.

This epic starts after the media and production path is made operable. It must not absorb metrics, costs, dashboard or agent-office work.

## Problem

The operator can inspect governance-related surfaces, but the repository does not yet prove that quality, compliance, approval and publication readiness are enforced and queryable through the frontend.

## Current capability classification

Labels used below: `implemented`, `partial`, `only backend`, `only mock`, `absent`, `existing, but not demonstrable`.

| Capability | Frontend state | Backend state | Contracts | Persistence | Audit | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Qualidade / V1-11 | partial | implemented | implemented | existing, but not demonstrable | absent | backend rule coverage exists, but the full frontend gate is not proven |
| Conformidade / V1-12 | partial | implemented | implemented | existing, but not demonstrable | absent | alert surfaces exist, but the negative gate is not proven |
| Aprovacao humana / V1-13 | partial | implemented | implemented | existing, but not demonstrable | absent | approval actions exist, but no end-to-end decision proof |
| Publicacao assistida / V1-14 | partial | implemented | implemented | existing, but not demonstrable | absent | publication surfaces exist, but readiness and job proof are incomplete |

## V1 criteria covered

- V1-11 - Qualidade tecnica
- V1-12 - Conformidade e direitos
- V1-13 - Aprovacao humana
- V1-14 - Publicacao assistida

## Upstream dependency

- E17 - Pipeline Midia e Producao Operavel pelo Frontend

The governance flow depends on media, render and clip artifacts being available for review and publication readiness.

## R14 items included

- R14-11 - Qualidade
- R14-12 - Conformidade
- R14-13 - Aprovacao humana
- R14-14 - Publicacao assistida

## Epic objective

Make the governance and publication pipeline operable through the frontend so an operator can:

1. Review quality findings.
2. Review compliance findings.
3. Make or inspect a human approval decision.
4. Prepare a publication job or draft package.
5. Inspect readiness and blocked states.
6. Reload the app.
7. Confirm persistence.
8. Confirm auditability.
9. Confirm channel isolation.

## Value

- Converts the final control surfaces from inspection-only into a usable operator flow.
- Preserves the blocking semantics required before publication.
- Prepares the evidence needed for the final V1 reaccept gate.

## Scope

- Frontend entry points for approvals, compliance and publications.
- Channel-scoped list, create, update and detail states.
- Navigation between governance artifacts.
- Reload verification for the created records.
- Channel isolation checks.
- Audit trail requirements for mutating actions.

## Out of scope

- Media asset registration.
- Render jobs.
- Derived clips.
- Metrics.
- Costs.
- Dashboard.
- Agent Office.
- New auth or OAuth work.
- New database or migration system.
- Release work.
- A new V1 acceptance run.

## Dependencies

- E17 completed.
- Existing governance and publication backend routes, repository and validation rules.
- Existing API envelope and error contracts.
- Audit logging support in the platform.
- Browser E2E and screenshot coverage.

## Risks

- Governance actions can still look real while some flows rely on read-only surfaces.
- Publication readiness can regress into a read-only summary if mutating actions are not tested.
- Process-local persistence remains the baseline.
- Cross-channel linking bugs can silently contaminate the flow if tests are incomplete.

## Indicators

- Number of blocked or approved governance decisions visible after reload.
- Number of publication jobs or draft packages visible after reload.
- Number of audit entries emitted for governance mutations.
- Browser E2E and screenshot pass rate on the required viewports.

## Definition of Ready

- The story bundle is written and linked to the failed criteria.
- Scope and out-of-scope are explicit.
- Contracts are mapped to the current repo.
- Audit and persistence behavior are stated.
- Visual QA is planned.

## Definition of Done

- The included stories are accepted on the same head.
- The frontend proves quality, compliance, approval and publication readiness.
- Channel isolation is demonstrated.
- Audit evidence is present.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or scope creep is introduced.

## Final gate

READY FOR SPRINT PLANNING when the story bundle is complete, evidence exists on the same head and the epic can be split into small sprint-sized slices without changing scope.
