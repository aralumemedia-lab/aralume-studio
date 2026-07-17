# Sprint Spec 018 - Sprint 17: Narration and Visual Assets

## 1. Identification

- Spec ID: 018
- Sprint number: 17
- Spec title: Narration and Visual Assets
- Status: implemented on sprint head / pending draft PR merge
- Date: 2026-07-17
- Owner: Codex
- Linked ADR: none

## 2. Epic

- Epic ID: E17
- Epic name: Pipeline Midia e Producao Operavel pelo Frontend
- Epic initiative: Remediacao da Operabilidade da V1
- Epic status: partial / in progress
- Epic objective: make the media pipeline operable through the frontend so the operator can create or update narration metadata and register visual assets with provenance, license or prompt data, integrity data, reloadable state and channel isolation.

## 3. Sprint objective

- Objective: deliver the first functional slice of E17 with H17.1 and H17.2.
- Success condition: the operator can open `/media-assets`, create or update narration metadata, register a visual asset, reload the browser, and see the same records, validations, audit trail and channel-scoped isolation for the active channel.

## 4. Context

- Problem addressed: after Sprint 16 closed the editorial pipeline, the repository did not prove the media path from narration and visual assets through the frontend; Sprint 17 supplies that proof for H17.1 and H17.2.
- Why this sprint exists now: E17 must start in a smaller slice than the full media-and-production epic so the narration and asset registry can be proven before render and clips.
- Division decision: Sprint 17 covers H17.1 and H17.2 only; H17.3 and H17.4 remain for the next E17 slice.
- Placement decision: the surface remains `/media-assets` because the repository already exposes the media registry there and the contract set already maps narration and visual assets to that route.

## 5. Dependencies

- Upstream documents: `AGENTS.md`, `docs/PROJECT_MASTER.md`, `docs/PRODUCT_BACKLOG.md`, `docs/NEXT_SPRINTS.md`, `docs/CODEX_HANDOFF.md`, `docs/FRONTEND_API_CONTRACTS.md`, `docs/FRONTEND_DESIGN_SYSTEM.md`, `docs/specs/000-sdd-process.md`, `docs/specs/012-v1-acceptance.md`, `docs/specs/016-sprint-15-editorial-profile-ideas-research.md`, `docs/specs/017-sprint-16-scripts-visual-planning.md`.
- Product dependencies: active channel context, existing media registry lists, the editorial context from E16, and the audit surface.
- Technical dependencies: media asset create/update endpoints, storage validation, integrity validation, reload behavior, and channel-scoped filtering.
- Operational dependencies: browser E2E, screenshots, and the shared API envelope.

## 6. Histories included

- H17.1 - Narracao operavel pelo frontend
- H17.2 - Ativos visuais rastreaveis

## 7. Histories not included

- H17.3 - Render controlado pelo frontend
- H17.4 - Corte derivado operavel pelo frontend

Reason for exclusion: these stories belong to the second E17 slice and are intentionally left out of Sprint 17.

## 8. Acceptance criteria by history

### H17.1

- The operator can create or update narration metadata from `/media-assets`.
- The created or updated narration remains visible after browser reload within the same backend process.
- The same-channel rule is preserved.
- Invalid storage or invalid provenance is rejected with sanitized feedback.
- The mutation emits an audit entry with requestId, channelId, actor, action, entity and status.

### H17.2

- The operator can register a visual asset from `/media-assets`.
- Provenance, license or prompt metadata, and integrity data are stored.
- The created asset remains visible after browser reload within the same backend process.
- Invalid storage or cross-channel references are rejected.
- The mutation emits an audit entry with requestId, channelId, actor, action, entity and status.

## 9. Operational flow

- Entry condition: the operator has selected a channel in the shell.
- Main path: open `/media-assets`, create or update a narration asset, register a visual asset, validate storage and integrity when needed, reload the browser, confirm the records and confirm the audit trail.
- Exit condition: the two included histories are demonstrable with persisted data and channel isolation.
- Failure path: validation, conflict, not-found or cross-channel errors are shown in sanitized form and the UI remains recoverable.

## 10. Contracts affected

- TypeScript types: `MediaAssetBase`, `MediaAssetCreateInput`, `MediaAssetPatchInput`, `StorageReferenceValidationInput`, `IntegrityValidationInput`, `MediaAssetUsage`, `MediaAssetFilters`, `MediaAssetStorageValidation`, `MediaAssetIntegrityValidation`.
- API endpoints: `GET/POST/PATCH /api/media-assets`, `POST /api/media-assets/validate-storage`, `POST /api/media-assets/:id/validate-integrity`, `GET /api/media-assets/:id`, `GET /api/media-assets/:id/usages`.
- UI contracts: `/media-assets`.

## 11. Frontend

- Routes affected: `/media-assets`.
- Screens affected: media list, narration editor, visual asset editor, asset detail and usage surface.
- Behavior expected: real API mutations, reloadable state, channel-scoped lists, sanitized errors, loading, empty, error, success and validation/conflict states.
- Empty / loading / error / conflict states: the media surface must keep these states visible and recoverable.

## 12. Backend

- Services or modules affected: media-assets service, media-assets routes, audit service wiring.
- Persistence behavior: update the in-memory repository for the active process and keep the state queryable after browser reload.
- Validation behavior: reject invalid payloads, invalid storage paths, incomplete integrity data and cross-channel links.
- Auditing behavior: record mutating actions with requestId, channelId, actor, action, entity, status and sanitized metadata.

## 13. Persistence

- Data model affected: narration assets, visual assets, media asset integrity and media asset usages.
- Storage behavior: reuse the existing repository abstraction; no database or migration system is introduced.
- Restart behavior: persistence is not promised across backend restarts.
- Idempotency behavior: the sprint must not introduce a new idempotency contract beyond the current repository behavior unless required by an existing endpoint.

## 14. Audit

- Events to record: media asset create, media asset update, storage validation, integrity validation.
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

- H17.3 - Render controlado pelo frontend.
- H17.4 - Corte derivado operavel pelo frontend.
- Quality, compliance, approval and publication.
- Dashboard and Agent Office.
- New database, migrations, external integrations, release, tag or deploy.
- New V1 acceptance run.

## 18. Probable files

- `docs/PROJECT_MASTER.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/epics/E17-pipeline-midia-producao-operavel-pelo-frontend/*`
- `src/routes/media-assets.tsx`
- `src/services/media-assets-api.ts`
- `src/services/api-client.ts`
- `src/tests/media-assets-route.test.ts`
- `src/services/media-assets-api.test.ts`
- `server/src/modules/media-assets/*`
- `server/test/media-assets.test.ts`
- `scripts/sprint17-browser-e2e.mjs`
- `screenshots/sprint-17/*`

## 19. Test strategy

- Unit tests: backend service logic for narration and visual-asset create/update flows.
- Integration tests: HTTP endpoints for media asset create/list/detail/update and validation flows.
- UI tests: route source tests and API client tests.
- Regression tests: cross-channel rejection, invalid storage rejection, reloadable state and audit evidence.
- Validation commands: `git diff --check`, `npm run lint`, `npm run backend:check`, `npm test`, `npm run build`.

## 20. Evidence

- Required screenshots: 1366x768, 1600x900, 1792x1024, 1920x1080, sidebar expanded and collapsed, empty state, success state, error state, reload proof and channel isolation.
- Required logs: browser reload proof, audit logs and backend test output.
- Required reports: updated Sprint 17 documentation and traceability.
- Required links: the draft PR and the relevant acceptance documents.

## 21. Risks

- Risk: the media registry can still look operational while the main action is a mock.
- Why it matters: a list-only surface can hide the absence of create/update proof.
- Mitigation: drive the flow from create/update through reload, with backend tests for both narration and visual assets.
- Risk: the repository is process-local.
- Why it matters: restart durability must not be promised in documentation.
- Mitigation: keep the acceptance bound to browser reload within the same running backend process.
- Risk: cross-channel links can be silently accepted if the frontend skips explicit checks.
- Why it matters: the registry would appear healthy while mixing channel state.
- Mitigation: require backend rejection tests and browser isolation checks.

## 22. Definition of Ready

- Story linkage: H17.1 and H17.2 are linked to V1-07 and V1-08.
- Description: the sprint scope is explicit and limited to narration and visual assets.
- Acceptance criteria: reload, isolation, validation and audit expectations are written.
- Dependencies: the channel context, API envelope and audit support are explicit.
- Affected contracts: media asset APIs are mapped.
- Expected evidence: browser screenshots, reload proof, route tests and backend tests.
- Scope compatibility: the sprint does not include H17.3 or H17.4.

## 23. Definition of Done

- Implementation complete: the included frontend and backend flows are functional on the same head.
- Criteria met: H17.1 and H17.2 are demonstrable with reload and isolation.
- Tests passed: unit, integration, UI and browser validations passed.
- Documentation updated: roadmap, backlog, handoff and sprint docs are consistent.
- Security reviewed: no secrets or raw payloads were introduced.
- Audit reviewed: mutating actions emit the required audit entries.
- Cost reviewed: no cost-bearing scope was introduced.
- Evidence available: screenshots, logs and reload proof are attached or referenced.
- Pending items recorded: H17.3 and H17.4 remain pending by design.

## 24. Gate of the sprint

- Gate name: Sprint 17 accepted and mergeable.
- Objective condition: H17.1 and H17.2 are implemented, tested and evidenced without starting H17.3 or H17.4.
- Verification method: backend tests, frontend route tests, browser E2E and screenshot sweep.
- Pass criteria: the included records persist through reload, remain channel-scoped and emit audit logs.
- Block criteria: mock primary actions, missing reload proof, missing audit logs, cross-channel leaks or any promise of restart durability.
- Current result: gate satisfied on the Sprint 17 head; integration into `main` remains pending PR review and merge.
- Product status: V1.0 remains `NAO ACEITA`; this sprint does not execute `R14-REACCEPT`.
