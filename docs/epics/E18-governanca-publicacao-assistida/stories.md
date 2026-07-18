# E18 - Stories

## Sprint sequencing

- Sprint 19: H18.1, H18.2 and H18.3 merged by PR #32. This is the first vertical slice and establishes the governance gates.
- Sprint 20: H18.4 implemented on branch; review and merge pending. This slice started only after Sprint 19 was accepted and prepares publication without auto-send.
- Completing a sprint does not automatically complete E18.

## H18.1 - Qualidade tecnica operavel pelo frontend

- Actor: revisor tecnico
- Objective: inspect quality findings from the frontend and keep them queryable after reload.
- V1 criterion: V1-11
- R14 item: R14-11
- Planned slice: Sprint 19; merged by PR #32
- Dependencies: E17; quality-check contracts; review states
- Priority: P1
- Acceptance criteria:
  - The operator can review a quality finding from the governance surface.
  - The frontend can create or refresh the quality result through the real API path required by the contract.
  - The blocked or approved state remains visible after reload.
  - Invalid transitions are rejected.
  - The mutation creates an audit entry containing the originating requestId.
  - Cross-channel access returns a sanitized 404 or conflict and creates no partial record.
- Tests:
  - Server HTTP tests for quality-check flows.
  - Frontend route or panel tests for loading, empty, error and success states.
  - Browser E2E on the required viewports.
- Evidence:
  - Acceptance matrix row for V1-11.
  - Quality decision visible after reload.
  - Audit log entry and screenshot.
- DoR:
  - The quality gate rules are explicit.
  - The browser path is mapped.
- DoD:
  - The quality state persists through reload.
  - The channel isolation and audit evidence are visible.

## H18.1 status

- Sprint 19 status: merged by PR #32; quality mutation, requestId audit correlation and browser evidence are present.

## H18.2 - Conformidade e direitos operavel pelo frontend

- Sprint 19 status: merged by PR #32; blocked compliance, cross-channel rejection and browser evidence are present.

- Actor: compliance reviewer
- Objective: inspect compliance findings and block unsafe content from the frontend.
- V1 criterion: V1-12
- R14 item: R14-12
- Planned slice: Sprint 19; merged by PR #32
- Dependencies: H18.1; compliance contracts; blocked-state rules
- Priority: P1
- Acceptance criteria:
  - The operator can review a compliance finding from the governance surface.
  - The frontend can create or refresh the compliance result through the real API path required by the contract.
  - A blocked state prevents unsafe progression.
  - The result remains visible after reload.
  - Invalid or cross-channel findings are rejected.
  - The mutation creates an audit entry containing the originating requestId.
- Tests:
  - Server HTTP tests for compliance flows.
  - Frontend route or panel tests for loading, empty, error and success states.
  - Browser E2E with a blocked case.
- Evidence:
  - Acceptance matrix row for V1-12.
  - Compliance block visible after reload.
  - Audit log entry and screenshot.
- DoR:
  - The compliance gate rules are explicit.
  - The same-channel rule is explicit.
- DoD:
  - The compliance state persists through reload.
  - The blocked-state semantics are proven.

## H18.3 - Aprovacao humana operavel pelo frontend

- Actor: human approver
- Objective: approve, reject or request changes from the frontend and keep the decision history visible.
- V1 criterion: V1-13
- R14 item: R14-13
- Planned slice: Sprint 19; merged by PR #32
- Dependencies: H18.2; approval decision contracts; history preservation
- Priority: P1
- Acceptance criteria:
  - The operator can approve, reject or request changes.
  - The frontend can create or select the approval record required by the real decision flow.
  - The prior decision history remains immutable.
  - The current decision remains visible after reload.
  - Invalid transitions are rejected.
  - The mutation creates an audit entry containing the originating requestId.
  - Approval history is queryable from the same channel-scoped surface after reload.
- Tests:
  - Server unit and HTTP tests for approval decisions and conflicts.
  - Frontend route or panel tests for loading, empty, error and success states.
  - Browser E2E covering the decision history.
- Evidence:
  - Acceptance matrix row for V1-13.
  - Decision history visible in the UI.
  - Audit log entry and screenshot.
- DoR:
  - The approval decision model is stable.
  - The browser path is mapped.
- DoD:
  - The approval history survives reload.
  - The channel isolation and audit evidence are visible.

## H18.3 status

- Sprint 19 status: merged by PR #32; creation, decision, history, requestId audit correlation and browser evidence are present.

## H18.4 - Publicacao assistida operavel pelo frontend

- Actor: operator / publisher
- Objective: prepare a publication draft or readiness package without auto-send.
- V1 criterion: V1-14
- R14 item: R14-14
- Planned slice: Sprint 20; implementation in progress on branch, pending review and merge
- Dependencies: H18.3; publication target and readiness contracts; approval and compliance gates
- Priority: P1
- Acceptance criteria:
  - The operator can prepare a publication draft or readiness package.
  - Readiness and blocked states remain explicit.
  - The package remains visible after reload.
  - Auto-send external behavior is not triggered.
  - The mutation creates an audit entry containing the originating requestId.
  - Human confirmation is explicit and persisted with the prepared package.
  - Privacy and allowed metadata fields are editable and validated.
  - Cross-channel target, source and job references are rejected by the backend.
  - Invalid payloads do not create partial publication jobs.
- Tests:
  - Server HTTP tests for publication target and job flows.
  - Frontend route tests for loading, empty, error and success states.
  - Browser E2E for readiness and draft states.
  - Browser E2E proves reload, isolation, audit requestId and no external send.
- Evidence:
  - Acceptance matrix row for V1-14.
  - Publication readiness visible after reload.
  - Audit log entry and screenshot.
- DoR:
  - The publication readiness contract is stable.
  - The no-auto-send rule and explicit human confirmation are explicit.
- DoD:
  - The publication package survives reload.
  - The channel isolation and audit evidence are visible.
  - The E2E proves that no external provider call or auto-send occurs.
- Status: implemented on branch; not integrated until review and merge.
