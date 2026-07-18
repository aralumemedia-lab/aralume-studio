# Sprint Spec 020 - Sprint 19: Governance Gates

## Identification

- Sprint: Sprint 19
- Epic: E18 - Governanca e Publicacao Assistida pelo Frontend
- Stories: H18.1, H18.2 and H18.3
- Criteria: V1-11, V1-12 and V1-13
- R14: R14-11, R14-12 and R14-13
- Status: implemented on branch; pending review and merge
- Upstream: E17 integrated in `main`

## Decision

E18 is split into two vertical slices. Sprint 19 closes the governance gates and human decision path before assisted publication is planned for Sprint 20.

## Objective

Make quality, compliance and human approval operational through the frontend, with channel isolation, same-process reload persistence, audit evidence and browser proof.

## Included

- Review and creation of quality checks through the real governance API.
- Review and creation of compliance checks through the real governance API.
- Creation of an approval request from a valid channel-scoped artifact.
- Approve, reject and request changes from `/approvals`.
- Immutable decision history and invalid-transition handling.
- Sanitized loading, empty, error, success, blocked and conflict states.
- Audit events correlated to the originating HTTP `requestId`.
- Browser reload and isolation between two channels.
- Sprint 19 evidence runner: `node scripts/sprint19-browser-e2e.mjs`.
- Visual evidence: `screenshots/sprint-19/`.

## Out of scope

- Publication target or publication package implementation from H18.4.
- YouTube OAuth, upload or external publication.
- E19, R14-REACCEPT, release, tag, deploy, database or migrations.

## Main flow

1. Select channel A.
2. Select a channel-scoped editorial or production artifact.
3. Run or create a quality check.
4. Run or create a compliance check.
5. Create an approval request.
6. Inspect quality, compliance and blocked states.
7. Approve, reject or request changes with a mandatory reason.
8. Reload and confirm the current decision and immutable history.
9. Inspect audit entries and their request correlation.
10. Select channel B and confirm that the records are not visible or addressable.

## Contracts and endpoints

- `QualityCheck`, `POST/GET /api/quality-checks`.
- `ComplianceCheck`, `POST/GET /api/compliance-checks`.
- `HumanApproval`, `POST/GET /api/approvals`.
- `POST /api/approvals/:id/approve`.
- `POST /api/approvals/:id/reject`.
- `POST /api/approvals/:id/request-changes`.
- `GET /api/approvals/:id/history`.
- Shared API envelopes and sanitized error helpers.

## Acceptance gate

- Quality and compliance results are created or refreshed through real frontend actions.
- A blocked quality or compliance result prevents approval.
- A valid human decision changes the current state and appends immutable history.
- Invalid transitions, missing fields, unknown IDs and cross-channel references return sanitized errors.
- Every mutation is auditable with `requestId`, `channelId`, actor, action, entity and status.
- The browser E2E proves create, decision, reload, isolation and audit correlation.
- Screenshots cover the required viewports and states without horizontal overflow.

## Implementation status

- H18.1, H18.2 and H18.3 are implemented on the Sprint 19 branch.
- The implementation uses real frontend mutations, same-process reload persistence, backend channel checks and audit entries with top-level `requestId`.
- No formal V1 Acceptance was executed; V1.0 remains `NAO ACEITA`.
- H18.4, E19, `R14-REACCEPT`, release, tag and deploy remain pending.

## Definition of Ready

- Governance mutation payloads and current API gaps are mapped.
- The audit request correlation approach is approved.
- Channel-scoped fixture entities and blocked cases are defined.
- No publication or external integration dependency remains in this slice.

## Definition of Done

- H18.1, H18.2 and H18.3 pass their individual implementation gates on this branch, pending PR review and merge.
- Backend, frontend and browser tests pass.
- Reload, isolation and audit evidence are persisted and queryable.
- H18.4 remains pending and E18 remains partial until Sprint 20 passes.
