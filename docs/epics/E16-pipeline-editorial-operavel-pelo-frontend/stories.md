# E16 - Stories

## H16.0 - Perfil editorial operavel pelo frontend

- Actor: editor / operador
- Objective: configure the channel editorial profile from the frontend and keep the settings after reload.
- V1 criterion: V1-02
- R14 item: R14-02
- Dependencies: active channel selection; channel settings contracts; upstream shell context
- Priority: P1
- Acceptance criteria:
  - The operator can open the channel profile surface from `/channels`.
  - The operator can update tone, language, format, audience and editorial rules.
  - The saved profile appears again after reload.
  - Invalid or cross-channel updates are rejected.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for channel settings update and cross-channel rejection.
  - Frontend route tests for loading, empty, error and success states.
  - Browser E2E on the required viewports.
- Evidence:
  - Acceptance matrix row for V1-02.
  - Updated profile visible after reload.
  - Audit log entry for the mutation.
- DoR:
  - The channel route and settings contract are already mapped.
  - The acceptance criteria are explicit.
  - The reload behavior is understood.
- DoD:
  - The saved channel profile persists through reload.
  - The same-channel rule and audit evidence are visible.

## H16.1 - Pautas operaveis pelo frontend

- Actor: editor / operador
- Objective: create and review content ideas from the frontend and keep them channel-scoped after reload.
- V1 criterion: V1-03
- R14 item: R14-03
- Dependencies: H16.0; editorial API contracts; active channel selection
- Priority: P1
- Acceptance criteria:
  - The operator can create a content idea from `/ideas`.
  - The created idea appears again after reload.
  - The list stays filtered to the active channel.
  - Validation and conflict errors are visible and sanitized.
  - The action creates an audit entry.
- Tests:
  - Server HTTP tests for create, update, reload and cross-channel rejection.
  - Frontend route tests for loading, empty, error and success states.
  - Browser E2E on the required viewports.
- Evidence:
  - Acceptance matrix row for V1-03.
  - New ID visible in the browser and in audit logs.
  - Screenshot of the list and detail state.
- DoR:
  - The route, API contract and error helpers are known.
  - The acceptance criteria are written.
  - The browser path is mapped.
- DoD:
  - The created item persists through reload.
  - The channel isolation and audit evidence are visible.

## H16.2 - Pesquisa, fontes e claims

- Actor: researcher / editor
- Objective: create a research session and register sources and claims for the same content item.
- V1 criterion: V1-04
- R14 item: R14-04
- Dependencies: H16.1; editorial session/source/claim contracts; URL validation
- Priority: P1
- Acceptance criteria:
  - The operator can create a research session from `/research`.
  - The operator can register at least one source.
  - The operator can register at least one claim against that source.
  - Invalid URLs and cross-channel links are rejected.
  - The records remain visible after reload.
  - An audit trail is recorded.
- Tests:
  - Server HTTP tests for session, source and claim create flows.
  - Frontend route tests for loading, empty, error and success states.
  - Browser E2E with a source and claim round-trip.
- Evidence:
  - Acceptance matrix row for V1-04.
  - Reload proof in the browser.
  - Audit log entries for the mutations.
- DoR:
  - The source and claim schemas are stable.
  - The same-channel rule is explicit.
  - The UI placement is known.
- DoD:
  - Session, source and claim are queryable after reload.
  - The channel filter and error handling are proven.

## H16.3 - Roteiro versionado

- Actor: roteirista / editor
- Objective: create a script and add a new version without overwriting history.
- V1 criterion: V1-05
- R14 item: R14-05
- Dependencies: H16.2; script and script-version contracts; monotonic versioning
- Priority: P1
- Acceptance criteria:
  - The operator can create a script from `/scripts`.
  - The operator can create a second version for the same script.
  - The previous version remains immutable.
  - The current version pointer changes to the latest version.
  - Duplicate or out-of-sequence version numbers are rejected.
  - The history remains visible after reload.
  - An audit entry is recorded.
- Tests:
  - Server unit and HTTP tests for version creation and duplicate conflicts.
  - Frontend route tests for script list and history states.
  - Browser E2E covering two versions and reload.
- Evidence:
  - Acceptance matrix row for V1-05.
  - Version history visible in the UI.
  - Audit logs and screenshots.
- DoR:
  - The script contract and version rules are stable.
  - The navigation from idea to script is defined.
- DoD:
  - The version history is preserved.
  - The current version is queryable and channel-scoped.

## H16.4 - Planejamento visual e cenas

- Actor: produtor / editor
- Objective: create a visual plan and ordered scenes from the frontend and keep them linked to the same content item.
- V1 criterion: V1-06
- R14 item: R14-06
- Dependencies: H16.3; visual-plan and scene contracts; the visual-planning placement decision
- Priority: P1
- Acceptance criteria:
  - The operator can open the visual-planning surface from the editorial flow.
  - The operator can create a visual plan linked to the same channel, content item and script version.
  - The operator can add scenes in explicit order.
  - Duplicate scene order and cross-channel links are rejected.
  - The plan and scenes remain visible after reload.
  - The flow creates audit evidence.
- Tests:
  - Server HTTP tests for visual plan and scene creation.
  - Frontend route or panel tests for loading, empty, error and success states.
  - Browser E2E for plan creation, scene ordering and reload.
- Evidence:
  - Acceptance matrix row for V1-06.
  - Browser proof of the visual-plan surface.
  - Scene ordering screenshot and audit logs.
- DoR:
  - The frontend location for visual planning is explicitly chosen.
  - The contract mapping is written.
  - The scene ordering rule is explicit.
- DoD:
  - Plan and scene records are persistently queryable.
  - The flow is channel-scoped and auditable.
