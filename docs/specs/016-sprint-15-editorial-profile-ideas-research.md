# Sprint Spec 016 - Sprint 15: Editorial Profile, Ideas and Research

## 1. Identification

- Spec ID: 016
- Sprint number: 15
- Spec title: Editorial Profile, Ideas and Research
- Status: planned / not started
- Date: 2026-07-15
- Owner: Codex
- Linked ADR: none

## 2. Epic

- Epic ID: E16
- Epic name: Pipeline Editorial Operavel pelo Frontend
- Epic objective: make the editorial pipeline operable through the frontend so the operator can configure the channel profile, create ideas, create research sessions, register sources and claims, and reload the app with the same channel-scoped data.
- Epic status: proposed / not started

## 3. Sprint objective

- Objective: deliver the first functional slice of E16 with H16.0, H16.1 and H16.2.
- Success condition: the operator can update the editorial profile, create a content idea, create a research session, register a source and a claim, reload the browser, and see the same records and audit trail for the active channel.

## 4. Context

- Problem being solved: the current repository shows editorial lists and partial actions, but it still does not prove the full channel-scoped path from profile setup to research evidence through the frontend.
- Why this sprint exists now: Sprint 14 ended with V1.0 NAO ACEITA and the first remediation sprint must close the upstream editorial gaps before the remaining E16 stories can be planned.
- Historical context: the earlier roadmap used a generic "Sprint proposta A" label; this sprint formalizes the first executable slice as Sprint 15.

## 5. Dependencies

- Upstream documents: `AGENTS.md`, `docs/PROJECT_MASTER.md`, `docs/PRODUCT_BACKLOG.md`, `docs/NEXT_SPRINTS.md`, `docs/CODEX_HANDOFF.md`, `docs/FRONTEND_API_CONTRACTS.md`, `docs/FRONTEND_DESIGN_SYSTEM.md`, `docs/specs/000-sdd-process.md`, `docs/specs/012-v1-acceptance.md`.
- Product dependencies: active channel context, existing editorial lists, and the audit surface.
- Technical dependencies: channel profile read/update endpoints, content idea mutations, research session/source/claim endpoints, and channel-scoped reload behavior.
- Operational dependencies: browser E2E, screenshots, and the shared API envelope.

## 6. Histories included

- H16.0 - Perfil editorial operavel pelo frontend
- H16.1 - Pautas operaveis pelo frontend
- H16.2 - Pesquisa, fontes e claims

## 7. Histories not included

- H16.3 - Roteiro versionado
- H16.4 - Planejamento visual e cenas

Reason for exclusion: these stories belong to the next E16 slice and are intentionally left out of Sprint 15.

## 8. Acceptance criteria by history

### H16.0

- The operator can update tone, language, format, audience and editorial rules from `/channels`.
- The saved profile remains visible after browser reload within the same backend process.
- Cross-channel updates are rejected.
- The mutation emits an audit entry with requestId, channelId, actor, action, entity and status.

### H16.1

- The operator can create and update a content idea from `/ideas`.
- The created or updated idea remains visible after browser reload within the same backend process.
- The list remains filtered to the active channel.
- Validation and conflict errors are sanitized.
- The primary action is no longer a mock toast.
- The mutation emits an audit entry with requestId, channelId, actor, action, entity and status.

### H16.2

- The operator can create a research session linked to the selected idea and channel.
- The operator can register at least one source and at least one claim.
- The source URL is validated when provided.
- Cross-channel links are rejected.
- The created records remain visible after browser reload within the same backend process.
- The mutations emit audit entries with requestId, channelId, actor, action, entity and status.

## 9. Operational flow

- Entry condition: the operator has selected a channel in the shell.
- Main path: open `/channels`, update the editorial profile, open `/ideas`, create or update a content idea, open `/research`, create a session, add a source, add a claim, reload the browser, confirm the records and confirm the audit trail.
- Exit condition: the three included histories are demonstrable with persisted data and channel isolation.
- Failure path: validation, conflict, not-found or cross-channel errors are shown in sanitized form and the UI remains recoverable.

## 10. Contracts affected

- TypeScript types: `Channel`, `ChannelSettings`, `EditorialRules`, `ContentIdea`, `ResearchSession`, `ResearchSource`, `ClaimEvidence`.
- API endpoints: `GET /api/channels/:id/profile`, `PATCH /api/channels/:id/profile`, `GET/POST /api/content-ideas`, `PATCH /api/content-ideas/:id`, `GET/POST /api/research-sessions`, `GET /api/research-sessions/:id/sources`, `GET /api/research-sessions/:id/claims`, `POST /api/research-sessions/:id/sources`, `POST /api/research-sessions/:id/claims`.
- Enums / statuses: channel status, content status, workflow status, risk level.
- UI contracts: `/channels`, `/ideas`, `/research`.

## 11. Frontend

- Routes affected: `/channels`, `/ideas`, `/research`.
- Screens affected: editorial profile card, idea creation and edit surface, research session and evidence surface.
- Behavior expected: real API mutations, reloadable state, channel-scoped lists, sanitized errors, loading, empty, error and success states.
- Empty / loading / error states: all three surfaces must keep these states visible and recoverable.

## 12. Backend

- Services or modules affected: channels service, editorial service, channel routes, editorial routes, audit service wiring.
- Persistence behavior: update the in-memory repositories for the active process and keep the state queryable after browser reload.
- Validation behavior: reject invalid payloads, invalid URLs, duplicate records and cross-channel links.
- Auditing behavior: record mutating actions with requestId, channelId, actor, action, entity, status and sanitized metadata.

## 13. Persistence

- Data model affected: channel bundle profile, content ideas, research sessions, research sources and claim evidence.
- Storage behavior: reuse the existing repository abstraction; no database or migration system is introduced.
- Restart behavior: persistence is not promised across backend restarts.
- Idempotency behavior: the sprint must not introduce a new idempotency contract beyond the current repository behavior unless required by an existing endpoint.

## 14. Audit

- Events to record: channel profile update, content idea create/update, research session create, research source create, claim evidence create.
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

- H16.3 - Roteiro versionado.
- H16.4 - Planejamento visual e cenas.
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
- `src/routes/channels.tsx`
- `src/routes/ideas.tsx`
- `src/routes/research.tsx`
- `src/services/channels-api.ts`
- `src/services/editorial-api.ts`
- `src/services/research-api.ts`
- `src/services/api-client.ts`
- `server/src/modules/channels/*`
- `server/src/modules/editorial/*`
- `server/test/channels.test.ts`
- `server/test/editorial.test.ts`
- `src/services/channels-api.test.ts`
- `src/services/editorial-api.test.ts`
- `src/tests/channels-route.test.ts`
- `src/tests/editorial-route-integrations.test.ts`

## 19. Test strategy

- Unit tests: backend service logic for profile, ideas and research mutations.
- Integration tests: HTTP endpoints for profile, ideas and research create/list flows.
- UI tests: route source tests and API client tests.
- Regression tests: cross-channel rejection, sanitized validation errors and reloadable state.
- Validation commands: `git diff --check`, `npm run lint`, `npm run backend:check`, `npm test`, `npm run build`.

## 20. Evidence

- Required screenshots: 1366x768, 1600x900, 1792x1024, 1920x1080, sidebar expanded and collapsed, empty state, invalid form state and success state.
- Required logs: browser reload proof, audit logs and backend test output.
- Required reports: updated Sprint 15 documentation and traceability.
- Required links: the draft PR and the relevant acceptance documents.

## 21. Risks

- Risk: the editorial profile is still partially modeled across channel fields, settings and rules.
- Why it matters: a split contract can produce a UI that looks complete but does not persist the intended profile.
- Mitigation: expose one explicit profile mutation and test the read-back path.
- Risk: the research list lacks a direct read path today.
- Why it matters: without it, reload proof is weak and the operator cannot verify sources or claims.
- Mitigation: add list endpoints for sources and claims before wiring the UI.
- Risk: the repository is process-local.
- Why it matters: restart durability must not be promised in documentation.
- Mitigation: keep the acceptance bound to browser reload within the same running backend process.

## 22. Definition of Ready

- Story linkage: H16.0, H16.1 and H16.2 are linked to V1-02, V1-03 and V1-04.
- Description: the sprint scope is explicit and limited to the editorial profile, ideas and research.
- Acceptance criteria: reload, isolation and audit expectations are written.
- Dependencies: the channel context, API envelope and audit support are explicit.
- Affected contracts: profile, ideas and research APIs are mapped.
- Expected evidence: browser screenshots, reload proof, route tests and backend tests.
- Scope compatibility: the sprint does not include H16.3 or H16.4.

## 23. Definition of Done

- Implementation complete: the included frontend and backend flows are functional on the same head.
- Criteria met: H16.0, H16.1 and H16.2 are demonstrable with reload and isolation.
- Tests passed: unit, integration, UI and browser validations passed.
- Documentation updated: roadmap, backlog, handoff and sprint docs are consistent.
- Security reviewed: no secrets or raw payloads were introduced.
- Audit reviewed: mutating actions emit the required audit entries.
- Cost reviewed: no cost-bearing scope was introduced.
- Evidence available: screenshots, logs and reload proof are attached or referenced.
- Pending items recorded: H16.3 and H16.4 remain pending by design.

## 24. Gate of the sprint

- Gate name: Sprint 15 ready for merge and draft PR.
- Objective condition: H16.0, H16.1 and H16.2 are implemented, tested and evidenced without starting H16.3 or H16.4.
- Verification method: backend tests, frontend route tests, browser E2E and screenshot sweep.
- Pass criteria: the included records persist through reload, remain channel-scoped and emit audit logs.
- Block criteria: mock primary actions, missing reload proof, missing audit logs, cross-channel leaks or any promise of restart durability.
