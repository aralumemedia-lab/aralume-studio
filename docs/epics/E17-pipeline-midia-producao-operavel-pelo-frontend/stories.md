# E17 - Stories

## H17.1 - Narracao operavel pelo frontend

- Status: completed by Sprint 17 / PR #28
- Actor: operator / producer
- Objective: create or update narration metadata from the frontend and keep it channel-scoped after reload.
- V1 criterion: V1-07
- R14 item: R14-07
- Dependencies: E16; media asset contracts; provenance rules
- Priority: P1
- Acceptance criteria:
  - The operator can create or update narration metadata from the media surface.
  - The created narration appears again after reload.
  - The same-channel rule is preserved.
  - Invalid storage or invalid provenance is rejected.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for narration-related media asset flows.
  - Frontend route tests for loading, empty, error, success and validation/conflict states.
  - Browser E2E on the required viewports.
- Evidence:
  - Acceptance matrix row for V1-07.
  - Updated narration visible after reload.
  - Audit log entry and screenshot.
- DoR:
  - The media asset contract and provenance rules are known.
  - The browser path is mapped.
- DoD:
  - The narration record persists through reload.
  - The channel isolation and audit evidence are visible.

## H17.2 - Ativos visuais rastreaveis

- Status: completed by Sprint 17 / PR #28
- Actor: operator / producer
- Objective: register a visual asset with provenance and integrity data from the frontend.
- V1 criterion: V1-08
- R14 item: R14-08
- Dependencies: H17.1; media asset integrity rules; storage provenance rules
- Priority: P1
- Acceptance criteria:
  - The operator can register a visual asset from the media surface.
  - Provenance, license or prompt metadata and integrity data are stored.
  - The created asset appears again after reload.
  - Invalid storage or cross-channel references are rejected.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for media asset registration and validation.
  - Frontend route tests for loading, empty, error, success and validation/conflict states.
  - Browser E2E with a new asset round-trip.
- Evidence:
  - Acceptance matrix row for V1-08.
  - Asset ID visible in the UI and audit logs.
  - Screenshot of the list and detail state.
- DoR:
  - The asset contract and validation rules are stable.
  - The same-channel rule is explicit.
- DoD:
  - The asset persists through reload.
  - The channel filter and error handling are proven.

## Next slice

- H17.3 - Render controlado pelo frontend.
- H17.4 - Corte derivado operavel pelo frontend.
- Status: in progress in Sprint 18; not complete until the Sprint 18 gate passes.

## H17.3 - Render controlado pelo frontend

- V1 criterion: V1-09
- R14 item: R14-09
- Route: `/videos`
- Acceptance: real render creation, observable job/output state, sanitized failures, reload, idempotency, audit request correlation and channel isolation.

## H17.4 - Corte derivado operavel pelo frontend

- V1 criterion: V1-10
- R14 item: R14-10
- Route: `/clips`
- Acceptance: completed parent video selection, valid interval creation, duplicate/out-of-duration rejection, reload, file/output traceability, audit request correlation and channel isolation.
