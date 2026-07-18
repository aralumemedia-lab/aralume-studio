# E18 - Governanca e Publicacao Assistida pelo Frontend

- Status: partial; Sprint 19 merged; Sprint 20 implemented on branch and pending review/merge
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
| Qualidade / V1-11 | real create/review action implemented on branch | implemented | implemented | same-process reload | requestId correlated in Sprint 19 mutations | success, blocked, conflict and reload evidence produced |
| Conformidade / V1-12 | real create/review action implemented on branch | implemented | implemented | same-process reload | requestId correlated in Sprint 19 mutations | success, blocked, conflict and reload evidence produced |
| Aprovacao humana / V1-13 | create, decision and history implemented on branch | implemented | implemented | same-process reload | requestId correlated in Sprint 19 mutations | decision, history, isolation and reload evidence produced |
| Publicacao assistida / V1-14 | real assisted package flow implemented on branch | implemented | implemented with explicit confirmation and allowed metadata | same-process reload | requestId propagated to publication mutations on branch | pending review/merge evidence; external YouTube actions remain outside this epic |

## Decomposicao aprovada

O E18 nao cabe com seguranca em uma unica sprint vertical. A primeira fatia recomendada e a Sprint 19, por ser a dependencia dos gates que bloqueiam a publicacao.

| Sprint proposta | Historias | Criterios V1 | Itens R14 | Objetivo |
| --- | --- | --- | --- | --- |
| Sprint 19 | H18.1, H18.2, H18.3 | V1-11, V1-12, V1-13 | R14-11, R14-12, R14-13 | Tornar qualidade, compliance e decisao humana operaveis, auditaveis e demonstraveis pelo frontend |
| Sprint 20 | H18.4 | V1-14 | R14-14 | Preparar publicacao assistida e readiness sem auto-send, apos os gates da Sprint 19 |

Sprint 19 foi integrada em `main`. Sprint 20 foi implementada nesta branch e aguarda revisao/merge. O E18 somente podera ser marcado como concluido depois dos gates das duas fatias.

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
- Audit logging support in the platform, including propagation of `requestId` from HTTP mutations into audit entries; Sprint 19 closes this requirement for H18.1-H18.3.
- Browser E2E and screenshot coverage.

## Risks

- Governance actions can still look real while quality and compliance remain read-only in the frontend.
- H18.4 publication mutations now propagate the same request correlation on this branch; review and browser evidence remain pending.
- Publication readiness can regress into a read-only summary if mutating actions are not tested.
- The current publication surface also contains YouTube connection and upload actions that are outside the assisted, no-auto-send scope.
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

- Sprint 19 must be reviewed and merged; Sprint 20 must then pass its own gate. The epic is only complete after both gates pass.
- The frontend proves quality, compliance, approval and publication readiness.
- Channel isolation is demonstrated.
- Audit evidence is present.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or scope creep is introduced.

## Final gate

READY FOR SPRINT PLANNING when both slice bundles are complete, dependencies are explicit, and the first slice can start without implementing publication or external integrations.
