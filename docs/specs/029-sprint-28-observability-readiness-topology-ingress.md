# Sprint 28 - Observabilidade, topologia e readiness produtivo

## Identification

- Spec ID: `029-sprint-28-observability-readiness-topology-ingress.md`
- Sprint number: Sprint 28
- Spec title: Observabilidade, topologia e readiness produtivo
- Status: normative draft for implementation
- Date: 2026-07-21
- Owner: Aralume Studio / Codex
- Linked ADR: TBD

## Epic

- Epic ID: E15 - Hardening V1.0
- Epic name: Hardening V1.0
- Epic objective: close the operational boundary of the product before any later release decision.
- Epic status: in progress

## Sprint objective

- Objective: deliver production-oriented readiness contracts, sanitized structured logging, minimal operational metrics, graceful shutdown, and documented ingress/topology requirements for the current runtime.
- Success condition: the backend exposes distinct liveness, readiness, and health surfaces; logs are structured and redacted; operational metrics are available; graceful shutdown is deterministic; topology and ingress constraints are documented and testable; the release remains `NOT_READY`.

## Context

- Problem being solved: the current runtime is functionally accepted, but production-readiness signals remain incomplete or implicit.
- Why this sprint exists now: the preceding hardening, dependency, configuration, and recovery units removed the main technical blockers; the remaining gap is operational readiness and deploy-facing topology.
- Historical context: Sprint 27 closed backup/restore/rollback and configuration fail-closed; this sprint covers the next normative readiness slice without authorizing release or deploy.

## Dependencies

- Upstream documents:
  - `docs/PROJECT_MASTER.md`
  - `docs/PRODUCT_BACKLOG.md`
  - `docs/NEXT_SPRINTS.md`
  - `docs/CODEX_HANDOFF.md`
  - `docs/acceptance/v1/V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md`
- Product dependencies:
  - current backend runtime and HTTP middleware;
  - sanitized request auditing/correlation;
  - storage configuration from the existing environment contract;
  - the release state that remains `NOT_READY`.
- Technical dependencies:
  - Express request lifecycle;
  - request ID middleware;
  - environment validation;
  - Node shutdown handling;
  - bounded request parsing and response serialization.
- Operational dependencies:
  - loopback and proxy-aware readiness smoke tests;
  - evidence review;
  - review of ingress, HTTPS, hosts, origins, and headers;
  - shell-based gates and repository-level validation.

## Histories included

- History ID: OR28.1
  - Type: backend
  - Description: distinct liveness, readiness, and operational health endpoints with sanitized status snapshots.
  - Acceptance criteria reference: readiness fails when the runtime is starting or shutting down; liveness stays process-oriented; health remains sanitized and compatible with the existing E2E handshake.
- History ID: OR28.2
  - Type: backend / observability
  - Description: structured logs with requestId correlation and sanitization of sensitive values.
  - Acceptance criteria reference: every request log is machine-readable, redacted, and correlated with the request context.
- History ID: OR28.3
  - Type: backend / observability
  - Description: minimal operational metrics for requests, latencies, readiness, dependency failures, and shutdown.
  - Acceptance criteria reference: metrics are available without high-cardinality labels.
- History ID: OR28.4
  - Type: backend
  - Description: graceful shutdown for SIGTERM/SIGINT with readiness withdrawal, listener close, and bounded cleanup.
  - Acceptance criteria reference: no new requests are accepted during shutdown and no orphaned process remains.
- History ID: OR28.5
  - Type: operational / topology
  - Description: documented production topology, ingress requirements, HTTPS, trusted proxy, host/origin controls, and body/timeouts limits.
  - Acceptance criteria reference: the documentation describes the production boundary and the enforced ingress assumptions.
- History ID: OR28.6
  - Type: validation / evidence
  - Description: simulated production smoke tests, negative cases, and evidence reproducible from the repository.
  - Acceptance criteria reference: the smoke proves readiness, failure-closed startup, shutdown, and sanitized operational output.

## Histories not included

- History ID or description: tag, release, deployment, or external infrastructure provisioning.
  - Reason for exclusion: these remain controlled by later units and explicit authorization.
- History ID or description: backup, restore, rollback, or storage recovery logic.
  - Reason for exclusion: those were closed in Sprint 27 and are not reopened here.
- History ID or description: CI hosted checks, branch protection, rulesets, or CODEOWNERS.
  - Reason for exclusion: those are governance-only concerns outside this sprint.
- History ID or description: unrelated product features or broad refactors.
  - Reason for exclusion: the sprint is limited to operational readiness and topology.

## Acceptance criteria by history

- History ID: OR28.1
  - Criterion 1: `/live` reports the process-oriented liveness state.
  - Criterion 2: `/ready` returns failure during startup and shutdown.
  - Criterion 3: `/health` remains sanitized and compatible with the existing runner identity flow.
  - Evidence expected: endpoint tests and smoke output.
- History ID: OR28.2
  - Criterion 1: request logs are structured.
  - Criterion 2: logs include requestId and sanitized actor/channel context.
  - Criterion 3: no token, secret, cookie, or signature is emitted.
  - Evidence expected: log assertions and captured samples.
- History ID: OR28.3
  - Criterion 1: the runtime exposes request and error counters.
  - Criterion 2: latency and readiness state are observable.
  - Criterion 3: cardinality stays bounded.
  - Evidence expected: metrics endpoint tests.
- History ID: OR28.4
  - Criterion 1: SIGTERM and SIGINT transition the runtime to shutting down.
  - Criterion 2: readiness is withdrawn immediately.
  - Criterion 3: listeners close cleanly within the shutdown timeout.
  - Evidence expected: shutdown smoke tests.
- History ID: OR28.5
  - Criterion 1: topology is documented with explicit trust boundaries.
  - Criterion 2: ingress requirements include HTTPS, proxy trust, host allowlist, origin allowlist, body limit, and timeout constraints.
  - Criterion 3: the document states which controls are enforced in runtime versus documented as deployment requirements.
  - Evidence expected: updated docs.
- History ID: OR28.6
  - Criterion 1: a simulated production run starts validly with safe configuration.
  - Criterion 2: invalid configuration fails before listeners open.
  - Criterion 3: smoke, negative cases, and shutdown leave no orphaned process.
  - Evidence expected: operational smoke evidence.

## Operational flow

- Entry condition: the repository main branch is ready for a new readiness-focused unit after Sprint 27.
- Main path: formalize the operational contract, implement the backend guards, validate with tests, document topology and ingress, and collect evidence.
- Exit condition: the feature branch is review-ready with reproducible readiness, logging, metrics, and shutdown proof.
- Failure path: invalid configuration, insecure ingress assumptions, or missing shutdown/readiness proofs keep the unit in draft and block merge.

## Contracts affected

- TypeScript types: runtime operational state, health/readiness/metrics snapshots, ingress policy, and structured log entries.
- API endpoints: `/health`, `/live`, `/ready`, and the operational metrics surface.
- Enums / statuses: readiness, liveness, and shutdown phases.
- UI contracts: none expected.

## Frontend

- Routes affected: none directly.
- Screens affected: none directly.
- Behavior expected: frontends can consume the documented readiness and health signals through the backend boundary.
- Empty / loading / error states: not applicable to this sprint.

## Backend

- Services or modules affected: app bootstrap, HTTP middleware, health handlers, operational runtime, ingress policy, and graceful shutdown.
- Persistence behavior: no new persistence layer is introduced.
- Validation behavior: production-like startup remains fail-closed; ingress and request-size constraints are enforced at the boundary.
- Auditing behavior: request correlation remains intact and logs are sanitized.

## Persistence

- Data model affected: none new.
- Storage behavior: existing storage contract is reused and validated as part of readiness.
- Restart behavior: readiness becomes true only after startup completes and becomes false again during shutdown.
- Idempotency behavior: the health and metrics surfaces are read-only.

## Audit

- Events to record: startup, shutdown, request completion, readiness failures, and operational dependency failures.
- Required metadata: timestamp, level, service, environment, requestId, actorId, channelId, route, status, duration, and error code when applicable.
- Redaction rules: secrets, cookies, signatures, tokens, and raw query strings must not appear in logs or evidence.

## Costs

- Cost events: none new.
- Cost limits: not applicable to this sprint.
- Cost evidence: not applicable to this sprint.

## Security and compliance

- Security constraints: fail-closed startup in production-like environments, HTTPS and trusted proxy requirements, host/origin allowlists, and sanitized diagnostics.
- Compliance gates: request correlation, redaction, and operational evidence.
- Secret handling: no secret values in logs, screenshots, or documentation.
- Access restrictions: operational detail remains sanitized and bounded.

## Out of scope

- Explicit exclusions: release, tag, deploy, CI hosted checks, backup/restore, rollback, and unrelated product features.
- Future work not included: broad observability platform integration, external metrics backends, and topology changes beyond documented requirements.

## Probable files

- Files expected to change:
  - `server/src/app.ts`
  - `server/src/index.ts`
  - `server/src/env.ts`
  - `server/src/http/middleware.ts`
  - `server/src/routes/health.ts`
  - new operational runtime and route modules
  - `server/test/*observability*.ts`
  - `docs/ENVIRONMENT.md`
  - `docs/BACKEND_SETUP.md`
  - `docs/PRODUCT_BACKLOG.md`
  - `docs/NEXT_SPRINTS.md`
  - `docs/PROJECT_MASTER.md`
  - `docs/acceptance/v1/V1_SPRINT28_OBSERVABILITY_READINESS_TOPOLOGY_INGRESS_EVIDENCE.md`
  - `docs/releases/1.0.0/RELEASE_NOTES.md`
  - `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`
- Files that should not change:
  - unrelated product modules;
  - dependency versions unless a gate reveals a regression;
  - release authorization state.

## Test strategy

- Unit tests: readiness snapshots, ingress guards, structured log serialization, metric counters, and shutdown state transitions.
- Integration tests: `/health`, `/live`, `/ready`, metrics surface, and production-like startup/shutdown behavior.
- UI tests: none.
- Regression tests: existing API tests, auth tests, and runner identity checks remain green.
- Validation commands: `git diff --check`, `npm run lint`, `npm run backend:check`, `npx tsc --noEmit`, `npm test`, `npm run build`, `bun install --frozen-lockfile`, `bun audit`, secret scan, runner scripts, and process/port checks.

## Evidence

- Required screenshots: none unless a smoke step produces a useful operational capture.
- Required logs: startup, readiness, shutdown, and sanitized request logs.
- Required reports: test summary, smoke summary, and operational topology summary.
- Required links: PR, evidence document, and updated validation checklist.

## Risks

- Risk: readiness may drift from the actual runtime if it is not tied to startup/shutdown state.
  - Why it matters: operators would see a false positive.
  - Mitigation: tie readiness to the same runtime state object used by startup and shutdown.
- Risk: ingress checks may be too strict for local development.
  - Why it matters: local validation can become noisy.
  - Mitigation: explicit environment-based policy with production-like fail-closed defaults.
- Risk: structured logs may leak raw request data if serialization is incomplete.
  - Why it matters: secrets or PII could reach logs.
  - Mitigation: explicit redaction and tests that assert absence of raw secrets.

## Definition of Ready

- Story linkage: linked to Sprint 28 only.
- Description: operational readiness is bounded and testable on the current backend runtime.
- Acceptance criteria: distinct liveness/readiness/health, structured logs, metrics, graceful shutdown, ingress requirements, and evidence.
- Dependencies: Sprint 27 validated, main clean, and repository gates available.
- Affected contracts: health/readiness/logging/metrics/shutdown/ingress.
- Expected evidence: tests, smoke output, docs, and reviewer-ready PR.
- Scope compatibility: no release, tag, or deploy.

## Definition of Done

- Implementation complete: backend runtime exposes and uses the new operational contracts.
- Criteria met: readiness/liveness separation, logs, metrics, shutdown, and ingress requirements are verified.
- Tests passed: all required gates pass.
- Documentation updated: backlog, next-sprints, project master, environment docs, backend setup, release notes, checklist, and evidence.
- Security reviewed: ingress, hosts, origins, and sanitization are validated.
- Audit reviewed: bun audit is recorded and any residual advisory is classified separately if present.
- Cost reviewed: no cost scope added.
- Evidence available: operational smoke and negative cases are recorded.
- Pending items recorded: release remains `NOT_READY`.

## Gate of the sprint

- Gate name: operational readiness gate
- Objective condition: the backend can be observed, validated, and shut down safely in a production-like configuration.
- Verification method: endpoint tests, smoke tests, logging assertions, and shutdown checks.
- Pass criteria: readiness, logging, metrics, ingress, and shutdown behavior are reproducible and sanitized.
- Block criteria: any fail-open configuration, unaudited ingress assumption, shutdown leak, or unsanitized operational surface.
