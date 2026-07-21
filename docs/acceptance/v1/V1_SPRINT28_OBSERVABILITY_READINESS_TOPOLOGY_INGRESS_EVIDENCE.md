# V1.0.0 â€” Sprint 28 observability, topology and production readiness evidence

Status: **READY FOR REVIEW; RELEASE NOT_READY**

Date: 2026-07-21
Base: `0ee0cbc8454f8cc9c04c643acdd26815ffff9f16`
Branch: `codex/sprint-28-observability-readiness-topology-ingress`

This document records the operational Sprint 28 unit. It does not authorize a
tag, release, deployment, or a later integral release-readiness assessment.
The final documentary HEAD is recorded externally in the PR review record so
this versioned document does not need to self-reference its own commit SHA.

## Normative decision

The preflight reviewed `AGENTS.md`, the SDD process, `PROJECT_MASTER`, roadmap,
backlog, handoff, the current release-readiness documents, environment policy,
backend setup, and the runtime entry points. Sprint 28 / Spec 029 was
registered before implementation:

- Spec: [`029-sprint-28-observability-readiness-topology-ingress.md`](../../specs/029-sprint-28-observability-readiness-topology-ingress.md)
- Backlog: `docs/PRODUCT_BACKLOG.md`
- Release notes and checklist: `docs/releases/1.0.0/RELEASE_NOTES.md` and `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`

## Functional code head validated

The runtime and test changes validated for this unit were exercised from the
current branch tip before the documentary publication step. The final
documentary HEAD is recorded externally in the PR review record to avoid a
self-referential commit loop in versioned evidence.

## Operational scope

Sprint 28 added:

- distinct `/live`, `/ready`, `/health`, `/ops/health`, and `/ops/metrics`
  contracts;
- structured JSON request/startup/shutdown logs with `requestId` correlation;
- minimal operational counters and readiness snapshots;
- graceful shutdown with readiness withdrawal and listener closure;
- strict host/origin/HTTPS handling for staging and production, while leaving
  local test execution permissive;
- simulated production smoke tests that validate startup, readiness withdrawal,
  dependency failure handling, and recovery.

## Preflight

| Check | Result |
| --- | --- |
| Git root | `C:/Users/carol/Documents/aralume-studio V2/aralume-studio` |
| Initial branch / base | `codex/sprint-28-observability-readiness-topology-ingress` from `0ee0cbc8454f8cc9c04c643acdd26815ffff9f16` |
| Initial main / origin/main | aligned before implementation |
| Initial working tree | clean before implementation |
| Initial related PRs | none before branch creation |
| Port check | `3001`, `4173`, and `8080` were free before and after the runner execution |
| Process check | no project orphan processes before or after execution |

## Health, readiness and liveness

The runtime now exposes:

- `/live` for process liveness;
- `/ready` for application readiness;
- `/health` for sanitized operational health;
- `/ops/health` for the detailed operational snapshot;
- `/ops/metrics` for minimal operational counters.

Readiness now reflects configuration load, dependency probes, storage
availability, active shutdown state, and build identity. Liveness stays local to
the process and does not wait on slow external dependencies.

## Logs

The request logger now emits structured JSON records with:

- timestamp;
- level;
- service;
- environment;
- requestId;
- actorId when available and sanitized;
- channelId when available;
- route;
- status;
- duration;
- version/build identity.

The operational logs verified in this unit did not expose secrets, cookies, or
signatures. Startup and shutdown logs were also verified.

## Metrics

The operational metrics snapshot tracks:

- total requests;
- active requests;
- readiness state;
- dependency failures;
- ingress rejections;
- shutdown state;
- build identity;
- environment;
- start time;
- topology metadata.

The counters are intentionally low-cardinality and do not use `requestId` as a
label.

## Shutdown

Graceful shutdown now:

- reacts to `SIGTERM` and `SIGINT`;
- withdraws readiness immediately;
- stops accepting new requests;
- waits for in-flight work within a bounded timeout;
- closes listeners and tracked sockets;
- completes with sanitized logs;
- leaves no orphaned project processes.

## Topology and ingress

The implementation documents a production topology consisting of:

- frontend;
- backend;
- storage;
- proxy/ingress;
- TLS and host/origin policy;
- environment-specific secrets and limits;
- metrics and logs.

Ingress validation is strict in staging and production, including host,
origin, HTTPS and rate-limit checks. Local test execution stays permissive so
the runner suite can exercise the application end to end without production
headers.

## Smoke productive simulation

The simulated production smoke checks validated:

- startup with production-like configuration;
- configuration failure before listener open;
- liveness and readiness endpoints;
- readiness withdrawal on shutdown;
- request logging with `requestId`;
- sanitized failure responses;
- absence of secrets in the emitted evidence.

## Test evidence

| Command | Result |
| --- | --- |
| `npm test` | PASS, 102/102 |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `bun install --frozen-lockfile` | PASS, no changes |
| `bun audit` | PASS, zero vulnerabilities |
| runners 15â€“21 and HMAC | PASS |
| secret scan of changed diff | PASS, zero high-confidence hits; no real secret found |
| `git diff --check` | PASS |
| ports 3001, 4173, 8080 | free after execution |
| project orphan processes | none after execution |

## Negative cases validated

- missing production-like configuration rejects startup before listeners open;
- invalid production-like host, origin or protocol requests are rejected;
- readiness withdraws during shutdown;
- body limits reject oversized requests before route completion;
- health output stays sanitized;
- operational metrics remain low-cardinality.

## Residual risk

This unit proves the readiness and operational observability contracts for the
current runtime. It does not authorize release or deployment. Release 1.0.0
remains **NOT READY** while the final release-readiness review and any
subsequent operational work remain pending.
