# E17 - Stories

## H17.1 - Narracao operavel pelo frontend

- Actor: operator / producer
- Objective: create or update a narration asset from the frontend and keep it channel-scoped after reload.
- V1 criterion: V1-07
- R14 item: R14-07
- Dependencies: E16; media asset contracts; provenance rules
- Priority: P1
- Acceptance criteria:
  - The operator can create or update narration metadata from the media surface.
  - The created narration appears again after reload.
  - The same-channel rule is preserved.
  - Invalid provenance is rejected.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for narration-related media asset flows.
  - Frontend route tests for loading, empty, error and success states.
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
  - Frontend route tests for loading, empty, error and success states.
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

## H17.3 - Render controlado pelo frontend

- Actor: producer / operator
- Objective: start and follow a controlled render job from the frontend and keep the result queryable.
- V1 criterion: V1-09
- R14 item: R14-09
- Dependencies: H17.2; render job contracts; media provenance
- Priority: P1
- Acceptance criteria:
  - The operator can start a render from `/videos`.
  - Render state transitions remain visible.
  - The resulting video or render output appears again after reload.
  - Invalid inputs, timeout and conflict cases are rejected.
  - The action creates an audit entry.
- Tests:
  - Server unit and HTTP tests for render job creation and failure modes.
  - Frontend route tests for loading, empty, error and success states.
  - Browser E2E covering render start and reload.
- Evidence:
  - Acceptance matrix row for V1-09.
  - Render job ID and output visible in the UI.
  - Audit logs and screenshots.
- DoR:
  - The render contract and states are stable.
  - The route placement is known.
- DoD:
  - The render job is queryable after reload.
  - The same-channel rule and audit evidence are visible.

## H17.4 - Corte derivado operavel pelo frontend

- Actor: editor / producer
- Objective: create a derived clip from a rendered video and keep the clip queryable after reload.
- V1 criterion: V1-10
- R14 item: R14-10
- Dependencies: H17.3; clip contracts; rendered video availability
- Priority: P1
- Acceptance criteria:
  - The operator can open the clip surface from the production flow.
  - The operator can create a clip from a rendered video using explicit intervals.
  - Duplicate or invalid intervals are rejected.
  - The created clip appears again after reload.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for clip creation and validation.
  - Frontend route or panel tests for loading, empty, error and success states.
  - Browser E2E for clip creation and reload.
- Evidence:
  - Acceptance matrix row for V1-10.
  - Clip ID visible in the browser and audit logs.
  - Screenshot of the clip detail or list state.
- DoR:
  - The clip contract and interval rules are explicit.
  - The browser path is mapped.
- DoD:
  - The clip persists through reload.
  - The channel isolation and audit evidence are visible.
