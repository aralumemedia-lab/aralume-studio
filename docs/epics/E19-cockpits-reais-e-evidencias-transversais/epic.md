# E19 - Cockpits Reais e Evidencias Transversais

- Status: implementation in progress on branch; pending review and merge
- Epic name: Cockpits Reais e Evidencias Transversais
- Initiative: Remediacao da Operabilidade da V1
- Priority: P0
- Source of truth: `docs/PROJECT_MASTER.md`, `docs/NEXT_SPRINTS.md`, `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_REPORT.md`, `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`

## Context

The dashboard and agent-office surfaces still rely on shared mock-api exports in the current baseline. The final V1 reaccept gate also needs reusable browser evidence, reproducible data and stable visual proof at the required viewports.

This is not a generic QA epic. It exists because R14-T01 and R14-T02 expose a cross-cutting infrastructure need that must be solved before R14-REACCEPT can be trusted.

## Problem

The operator cannot yet rely on dashboard and agent-office as real operational cockpits, and the repository still lacks a dedicated evidence harness that makes the final acceptance repeatable across the required surfaces.

## Current capability classification

Labels used below: `implemented`, `partial`, `only backend`, `only mock`, `absent`, `existing, but not demonstrable`.

| Capability | Frontend state | Backend state | Contracts | Persistence | Audit | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard real / R14-T01 | implementation in Sprint 21 | real repository projection | implemented | same-process reload | existing read-only audit data | API and browser evidence pending review |
| Agent Office real / R14-T02 | implementation in Sprint 21 | real repository projection | implemented | same-process reload | no new mutation in this sprint | API and browser evidence pending review |
| Evidence harness | implementation in Sprint 21 | n/a | reusable runner contract | controlled process | n/a | screenshot and replay evidence pending review |

## V1 criteria covered

- Not a product criterion block. This epic is a technical prerequisite for the final acceptance gate.

## Upstream dependency

- E16 - Pipeline Editorial Operavel pelo Frontend
- E17 - Pipeline Midia e Producao Operavel pelo Frontend
- E18 - Governanca e Publicacao Assistida pelo Frontend

## R14 items included

- R14-T01 - Dashboard real
- R14-T02 - Escritorio de Agentes real

## Epic objective

Make the operational cockpits real and make the acceptance evidence reusable so an operator can:

1. Open `/dashboard` and see real channel-scoped data.
2. Open `/agent-office` and see real workflow and handoff data.
3. Verify that the main flow no longer imports mock-api in those surfaces.
4. Reuse the same browser and screenshot evidence for the final reaccept gate.
5. Reload the app.
6. Confirm persistence and channel isolation.

## Value

- Removes the final shared mock surfaces that would otherwise undermine trust in the V1 reaccept.
- Gives the final acceptance a reusable evidence layer instead of a one-off manual sweep.
- Makes the operational cockpit states visible across the required viewports.

## Scope

- Frontend entry points for dashboard and agent-office.
- Channel-scoped list and detail states.
- Replacement of mock-api imports in the main flows.
- Shared browser E2E and screenshot evidence for the V1 reaccept.
- Channel isolation checks.
- Audit trail expectations where the surface mutates state.

## Out of scope

- New product features outside dashboard, agent-office and evidence infrastructure.
- Media, render, clips, approvals, compliance, publication, metrics and costs feature work beyond what is required to replace the cockpit mocks.
- New auth or OAuth work.
- New database or migration system.
- Release work.

## Dependencies

- E16, E17 and E18 completed.
- Real dashboard, agent-office and workflow-related backend endpoints or adapters.
- Existing API envelope and error contracts.
- Browser E2E and screenshot coverage.
- Reproducible test data for the final acceptance sweep.

## Risks

- Mock leakage from shared `api-client.ts` imports can keep the surfaces looking real while staying fake.
- There are no dedicated dashboard or agent-office route tests in the current baseline.
- Reproducible evidence can drift if the test data bootstrap is not stable.
- Visual regression can hide a mock or a missing state at one viewport while passing another.

## Indicators

- Number of dashboard and agent-office screenshots captured at the required viewports.
- Number of mock-api imports removed from the main cockpit flows.
- Number of browser E2E cases reused by the final V1 reaccept.
- Number of channel-isolation attempts rejected on the cockpit surfaces.

## Definition of Ready

- The story bundle is written and linked to the technical need.
- Scope and out-of-scope are explicit.
- The cockpit surfaces are mapped to the current repo.
- The evidence harness requirement is explicit.
- Visual QA and browser repetition are planned.

## Definition of Done

- The included stories are accepted on the same head.
- Dashboard and agent-office use real API paths in the main flow.
- The reusable evidence harness exists for the final reaccept gate.
- Channel isolation is demonstrated.
- The required tests and screenshots pass.
- Documentation stays aligned with backlog, next-sprint planning and handoff.
- No secrets, release or scope creep is introduced.

## Final gate

READY FOR SPRINT PLANNING when the story bundle is complete, evidence exists on the same head and the epic can be split into small sprint-sized slices without changing scope.
