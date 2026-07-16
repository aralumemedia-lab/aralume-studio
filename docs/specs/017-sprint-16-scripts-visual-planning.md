# Sprint Spec 017 - Sprint 16: Scripts and Visual Planning

## 1. Identification

- Spec ID: 017
- Sprint number: 16
- Spec title: Scripts and Visual Planning
- Status: completed / delivered
- Date: 2026-07-16
- Owner: Codex
- Linked ADR: none

## 2. Epic

- Epic ID: E16
- Epic name: Pipeline Editorial Operavel pelo Frontend
- Epic objective: make the editorial pipeline fully operable through the frontend so the operator can create a script, version it, create a visual plan, add scenes, reload the app, and verify the same channel-scoped history and audit trail.
- Epic status: completed

## 3. Sprint objective

- Objective: deliver the final functional slice of E16 with H16.3 and H16.4.
- Success condition: the operator can create a script from an existing content idea, create a second script version without losing the first, create a visual plan from the editorial flow, add ordered scenes, reload the browser, and see the same records and audit trail for the active channel.

## 4. Context

- Problem being solved: the repository already proves profile, ideas, research, sources, and claims, but it still does not prove the complete frontend-operated path for script history and visual planning.
- Why this sprint exists now: Sprint 15 delivered the upstream slice, and Sprint 16 closes E16 without expanding into media production or governance.
- Placement decision: the visual-planning surface is exposed from `/production` because the repository already uses that route for the editorial production area and the contract set already maps `VisualPlan` and `ScenePlan` there.

## 5. Dependencies

- Upstream documents: `AGENTS.md`, `docs/PROJECT_MASTER.md`, `docs/PRODUCT_BACKLOG.md`, `docs/NEXT_SPRINTS.md`, `docs/CODEX_HANDOFF.md`, `docs/FRONTEND_API_CONTRACTS.md`, `docs/FRONTEND_DESIGN_SYSTEM.md`, `docs/specs/000-sdd-process.md`, `docs/specs/012-v1-acceptance.md`, `docs/specs/016-sprint-15-editorial-profile-ideas-research.md`.
- Product dependencies: active channel context, content ideas, research sessions, the existing audit surface, and the editorial route bundle.
- Technical dependencies: script create/list/version endpoints, visual plan and scene endpoints, reload behavior, and channel-scoped filtering.
- Operational dependencies: browser E2E, screenshots, and the shared API envelope.

## 6. Histories included

- H16.3 - Roteiro versionado
- H16.4 - Planejamento visual e cenas

## 7. Histories not included

- H16.0 - Perfil editorial operavel pelo frontend
- H16.1 - Pautas operaveis pelo frontend
- H16.2 - Pesquisa, fontes e claims

Reason for exclusion: those stories belong to the already-delivered Sprint 15 slice.

## 8. Acceptance criteria by history

### H16.3

- The operator can create a script from `/scripts` using the active channel and an existing content idea.
- The operator can create a second version for the same script.
- The first version remains immutable and queryable after the second version is created.
- Duplicate or out-of-sequence version numbers are rejected.
- Cross-channel script links are rejected.
- The script history remains visible after browser reload within the same backend process.
- The mutations emit audit entries with requestId, channelId, actor, action, entity and status.

### H16.4

- The operator can open the visual-planning surface from the editorial flow in `/production`.
- The operator can create a visual plan linked to the same channel, content idea and script version.
- The operator can add scenes in explicit order.
- Duplicate scene order and cross-channel links are rejected.
- The plan and scenes remain visible after browser reload within the same backend process.
- The mutations emit audit entries with requestId, channelId, actor, action, entity and status.

## 9. Operational flow

- Entry condition: the operator has selected a channel in the shell.
- Main path: open `/scripts`, create a script for an existing content idea, create version 2, confirm version 1 is preserved, open `/production`, create a visual plan for the same content item and script version, add scenes in order, reload the browser, and confirm the records and audit trail.
- Exit condition: the two included histories are demonstrable with persisted data and channel isolation.
- Failure path: validation, conflict, not-found or cross-channel errors are shown in sanitized form and the UI remains recoverable.

## 10. Contracts affected

- TypeScript types: `Script`, `ScriptVersion`, `VisualPlan`, `ScenePlan`, `ContentIdea`.
- API endpoints: `GET/POST /api/scripts`, `GET/PATCH /api/scripts/:id`, `GET/POST /api/scripts/:id/versions`, `GET/POST /api/visual-plans`, `GET/PATCH /api/visual-plans/:id`, `POST /api/visual-plans/:id/scenes`.
- UI contracts: `/scripts`, `/production`.

## 11. Frontend

- Routes affected: `/scripts`, `/production`.
- Screens affected: script list/history, script creation and versioning surface, production visual-planning surface, scene list and ordering surface.
- Behavior expected: real API mutations, reloadable state, channel-scoped lists, sanitized errors, loading, empty, error, success and conflict states.
- Empty / loading / error / conflict states: both surfaces must keep these states visible and recoverable.

## 12. Backend

- Services or modules affected: editorial service, editorial routes, audit service wiring.
- Persistence behavior: update the in-memory repositories for the active process and keep the state queryable after browser reload.
- Validation behavior: reject invalid payloads, duplicate version numbers, duplicate scene order numbers and cross-channel links.
- Auditing behavior: record mutating actions with requestId, channelId, actor, action, entity, status and sanitized metadata.

## 13. Persistence

- Data model affected: scripts, script versions, visual plans and scene plans.
- Storage behavior: reuse the existing repository abstraction; no database or migration system is introduced.
- Restart behavior: persistence is not promised across backend restarts.
- Idempotency behavior: the sprint must not introduce a new idempotency contract beyond the current repository behavior unless required by an existing endpoint.

## 14. Audit

- Events to record: script create, script update, script version create, visual plan create/update, scene plan create.
- Required metadata: requestId, channelId, actorType, actorName, action, entityType, entityId, status and sanitized message.
- Redaction rules: do not emit raw transport payloads, secrets or internal stack traces.

## 15. Costs

- Cost events: none.
- Cost limits: none.
- Cost evidence: none.

## 16. Security and compliance

- Security constraints: no secrets, no raw payload exposure, no cross-channel leaks.
- Compliance gates: none beyond the existing V1 acceptance rules.
- Secret handling: do not read or write `.env.local`.
- Access restrictions: preserve the existing channel-scoped operator flow.

## 17. Out of scope

- H16.0 - Perfil editorial operavel pelo frontend.
- H16.1 - Pautas operaveis pelo frontend.
- H16.2 - Pesquisa, fontes e claims.
- Media assets, narration, render, clips.
- Quality, compliance, approval and publication.
- Dashboard and Agent Office.
- New database, migrations, external integrations, release, tag or deploy.
- New V1 acceptance run.

## 18. Probable files

- `docs/PROJECT_MASTER.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/epics/E16-pipeline-editorial-operavel-pelo-frontend/*`
- `src/routes/scripts.tsx`
- `src/routes/production.tsx`
- `src/services/scripts-api.ts`
- `src/services/visual-plans-api.ts`
- `src/services/api-client.ts`
- `src/tests/editorial-route-integrations.test.ts`
- `src/services/editorial-api.test.ts`
- `server/src/modules/editorial/*`
- `server/test/editorial.test.ts`

## 19. Test strategy

- Unit tests: backend service logic for script versioning and visual-plan mutations.
- Integration tests: HTTP endpoints for script create/list/version flows and visual-plan create/list/scene flows.
- UI tests: route source tests and API client tests.
- Regression tests: cross-channel rejection, duplicate version rejection, duplicate scene order rejection and reloadable state.
- Validation commands: `git diff --check`, `npm run lint`, `npm run backend:check`, `npm test`, `npm run build`.

## 20. Evidence

- Required screenshots: 1366x768, 1600x900, 1792x1024, 1920x1080, sidebar expanded and collapsed, empty state, success state, error state, conflict state, ordered scenes, reload proof and channel isolation.
- Required logs: browser reload proof, audit logs and backend test output.
- Required reports: updated Sprint 16 documentation and traceability.
- Required links: the draft PR and the relevant acceptance documents.

## 21. Risks

- Risk: the script list may still look operational while creation/versioning remains partially exposed.
- Why it matters: a list-only surface can hide the absence of version history proof.
- Mitigation: drive the flow from creation through version 2 and reload, with backend tests for the first and second version.
- Risk: the visual-planning surface can be placed in the wrong route and still look plausible.
- Why it matters: route ambiguity breaks traceability and operator discoverability.
- Mitigation: document and use `/production` as the frontend location for visual planning.
- Risk: the repository is process-local.
- Why it matters: restart durability must not be promised in documentation.
- Mitigation: keep the acceptance bound to browser reload within the same running backend process.

## 22. Definition of Ready

- Story linkage: H16.3 and H16.4 are linked to V1-05 and V1-06.
- Description: the sprint scope is explicit and limited to script versioning and visual planning.
- Acceptance criteria: reload, isolation, version history, scene ordering and audit expectations are written.
- Dependencies: the channel context, API envelope and audit support are explicit.
- Affected contracts: script, script version, visual plan and scene APIs are mapped.
- Expected evidence: browser screenshots, reload proof, route tests and backend tests.
- Scope compatibility: the sprint does not include E17, E18 or E19.

## 23. Definition of Done

- Implementation complete: the included frontend and backend flows are functional on the same head.
- Criteria met: H16.3 and H16.4 are demonstrable with reload and isolation.
- Tests passed: unit, integration, UI and browser validations passed.
- Documentation updated: roadmap, backlog, handoff and sprint docs are consistent.
- Security reviewed: no secrets or raw payloads were introduced.
- Audit reviewed: mutating actions emit the required audit entries.
- Cost reviewed: no cost-bearing scope was introduced.
- Evidence available: screenshots, logs and reload proof are attached or referenced.
- Pending items recorded: E16 is completed and E17 remains the next epic.

## 24. Gate of the sprint

- Gate name: Sprint 16 completed E16 on the current head.
- Objective condition: H16.3 and H16.4 are implemented, tested and evidenced without starting E17, E18 or E19.
- Verification method: backend tests, frontend route tests, browser E2E and screenshot sweep.
- Pass criteria: the included records persist through reload, remain channel-scoped and emit audit logs.
- Block criteria: mock primary actions, missing reload proof, missing audit logs, cross-channel leaks or any promise of restart durability.
