# Sprint Spec 019 - Sprint 18: Render and Derived Clips

## 1. Identification

- Spec ID: 019
- Sprint number: 18
- Spec title: Render and Derived Clips
- Status: in progress
- Date: 2026-07-17
- Owner: Codex
- Epic: E17 - Pipeline Midia e Producao Operavel pelo Frontend
- Initiative: Remediacao da Operabilidade da V1
- Related criteria: V1-09, V1-10
- Related R14 items: R14-09, R14-10
- Upstream dependency: Sprint 17 / H17.1 and H17.2 completed

## 2. Objective

Close the second functional slice of E17 by proving controlled rendering and derived clips through the real frontend surfaces `/videos` and `/clips`.

The proof crosses the frontend, API client, backend router/service/repository, authorized storage, cost policy, audit log and browser evidence. Existing render and clip modules are reused and corrected only where this acceptance contract requires it.

## 3. Included histories

### H17.3 - Render controlado pelo frontend

- Start a controlled render from `/videos` using channel-scoped registered assets.
- Expose job state, output, normalized errors and reloadable result.
- Preserve idempotency, cost policy, storage safety and audit correlation.

### H17.4 - Corte derivado operavel pelo frontend

- Select a completed video in `/clips` for the active channel.
- Submit a valid interval and create a derived clip through the real API.
- Preserve parent video, render job, interval, provenance, output file and channel scope after reload.

## 4. Out of scope

- E18, E19 and `R14-REACCEPT`.
- New media generation, external integrations, AI, narration or asset registration.
- Quality, compliance, approval, publication, dashboard or agent office.
- New database, migrations, release, tag, deploy or restart-durability promise.

## 5. Existing contracts and surfaces

- Frontend routes: `/videos`, `/clips`.
- Render API: `GET/POST /api/renders`, `GET /api/renders/:id`.
- Video API: `GET /api/videos?channelId=`.
- Clip API: `GET/POST /api/clips`, `GET /api/clips/:id`, `GET /api/clips/:id/file`.
- Contracts: `RenderJob`, `VideoAsset`, `DerivedClip`, `RenderStatus`, shared success/error envelopes.
- Backend modules: `server/src/modules/renders/*`, `server/src/modules/media-assets/*`.
- Persistence: existing repositories and authorized storage root; browser reload is required, backend restart durability is not a product promise for this sprint.

## 6. Operational flow

1. Select channel A.
2. Select valid channel-scoped source assets.
3. Start a controlled render from `/videos`.
4. Observe pending feedback and the resulting queued, running, completed, blocked or failed state supported by the contract.
5. Reload and confirm the render job and output video remain queryable.
6. Open `/clips` and select the completed output video.
7. Submit a valid interval and create a derived clip.
8. Reload and confirm the clip, parent video, render job, interval and file.
9. Submit invalid, duplicate and out-of-duration intervals and confirm sanitized feedback.
10. Query audit logs and correlate mutating events with the HTTP `requestId`.
11. Select channel B and confirm that channel A jobs, videos and clips are not visible or addressable.

## 7. Validation and errors

- Source assets and parent videos must belong to the active channel.
- Render input asset IDs must be unique, available, licensed/usable and storage-safe.
- Controlled clips require a parent video, `startSeconds < endSeconds`, and an end within the parent duration.
- Idempotency replay returns the original job; a changed payload with the same key returns `409`.
- Cross-channel or unknown resources return sanitized `404` responses.
- Invalid payloads and intervals return sanitized `400` responses with actionable validation details.
- Operational policy, budget, engine unavailability, timeout and process failure remain normalized as blocked or failed job states.

## 8. Audit

Every render and clip mutation must persist an audit event containing `requestId`, `channelId`, actor, action, entity type, entity ID, status, sanitized message and timestamp. The browser E2E must verify request correlation for creation and terminal success/failure events.

## 9. Test and evidence strategy

- Backend unit/service tests for valid render, state transitions, timeout, process failure, policy block, idempotency, clip intervals and cross-channel access.
- HTTP tests for envelopes, status codes, request correlation, reload/repository recovery and output file access.
- Frontend API tests for render and clip clients, including sanitized 400/404/409 errors.
- Route tests for `/videos` and `/clips`, including loading, empty, error, success and conflict states.
- Browser E2E using controlled fixtures and real backend routes, with process teardown on Windows.
- Screenshots at 1366x768, 1600x900, 1792x1024 and 1920x1080, with expanded/collapsed sidebar, loading, success, error, conflict, reload and isolation evidence.

## 10. Definition of Ready

- H17.3 and H17.4 are linked to V1-09/V1-10 and R14-09/R14-10.
- Existing contracts and endpoints are mapped.
- Backend render and clip modules are available for reuse.
- Acceptance, audit, isolation and evidence requirements are explicit.
- No scope dependency on E18, E19 or a new persistence system remains.

## 11. Definition of Done

- Both stories are demonstrated through their frontend routes on the same head.
- Render output and derived clip survive browser reload while the backend process remains alive.
- Invalid, duplicate, cross-channel and operational failure paths are covered.
- Audit events correlate to HTTP request IDs.
- All tests, E2E and screenshots pass.
- Documentation and traceability are updated.
- E17 is marked complete only after this gate passes; V1.0 remains `NAO ACEITA` until formal reacceptance.

## 12. Sprint gate

- Gate: Sprint 18 accepted and E17 complete.
- Pass condition: H17.3 and H17.4 have real frontend evidence for render, output, clip, reload, audit and channel isolation.
- Block condition: mock primary action, missing output/file, uncorrelated audit, cross-channel leak, unsanitized failure, missing browser evidence or any restart-durability promise.
