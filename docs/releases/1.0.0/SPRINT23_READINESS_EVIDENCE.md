# Sprint 23 — V1.0 Release Readiness Evidence

Status: **NOT READY FOR PRODUCTION DEPLOYMENT**

Execution unit: Sprint 23, E15, [spec 024](../../specs/024-sprint-23-v1-release-readiness.md)

Functional baseline: `d2b53c9e7bfe15c8116c07375ca4b604fce03e97` — V1.0 remains formally accepted at 18/18 criteria. This document does not authorize a release, tag, deployment, publication, or provider action.

## Repository and scope

- Readiness branch: `codex/sprint-23-v1-release-readiness`.
- Starting functional baseline: `61d313bdb35dd0228a2bf4f5af3454263f588155`.
- No production endpoint, real secret, deployment manifest, `PROMPT_5_RELEASE`, or approved recovery target was supplied.
- The security scan reviewed immutable revision `61d313bdb35dd0228a2bf4f5af3454263f588155`; its canonical report and ledgers are retained in the local Codex scan artifact directory and were not copied into product source.
- No historical acceptance matrix or evidence directory was overwritten.

## Quality gates

| Gate | Result |
| --- | --- |
| `git diff --check` | PASS |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS after safe mechanical type corrections; no diagnostics remain |
| `npm run backend:check` | PASS |
| `npm test` | PASS — 78/78 |
| Targeted audit, isolation, media, render, publication and YouTube tests | PASS — 21/21 |
| `npm run build` | PASS; non-blocking Vite/Nitro warnings only |
| Isolated `/health` smoke on ephemeral loopback port | PASS — HTTP 200, `ok: true`, sanitized service/environment payload |
| `bun audit` | BLOCKING FOLLOW-UP — 3 transitive advisories: 2 moderate, 1 low |
| Secret-pattern inspection | No hardcoded secret pattern found |

The type corrections are limited to a missing input type field, test fixture typing, mock required fields, and UI payload/category typing. They do not add product behavior or weaken assertions.

## E2E runners

The frontend-driven runners completed with exit code 0:

| Runner | Result |
| --- | --- |
| Sprint 15 | PASS — exit 0 |
| Sprint 16 | PASS — exit 0 |
| Sprint 17 | PASS — exit 0 |
| Sprint 18 | PASS — exit 0 |
| Sprint 19 | PASS — exit 0 |
| Sprint 20 | PASS — exit 0 |
| Sprint 21 | PASS — exit 0 |

The runner teardown terminated its child backend/frontend trees after each execution. Browser console warnings about existing hydration/source-map metadata were non-fatal and did not alter runner assertions.

## Security review

The repository-wide Codex Security review produced 42 reportable candidate findings across these root-control families:

- High: missing inbound authentication/authorization before protected API routers, including channel, editorial, governance, media, render, audit and publication paths.
- High: editorial operations that omit or bypass channel scope.
- High: governance and audit-integrity paths without a trusted caller identity.
- High: unauthenticated media reads/downloads and render initiation.
- Medium: synchronous whole-file media import hashing without a configured byte bound.

55 ranked worklist rows remain explicitly deferred because delegated high-impact reconciliation did not complete. Deferred rows are not classified as safe. The review also identified a production-boundary gap: loopback binding is not an application authorization control, `/health` is liveness-only, and the repository does not define authenticated ingress, mandatory production configuration, secret injection, backup/restore, rollback, or readiness evidence.

## Release blockers

1. Implement and validate a fail-closed authenticated principal and channel/object authorization boundary.
2. Resolve the 55 deferred security rows with discovery, validation and attack-path receipts.
3. Define and test production configuration, secret injection, readiness, observability, backup/restore, and rollback without exposing secret values.
4. Disposition the two moderate and one low transitive dependency advisories reported by `bun audit`.
5. Provide or formally close the missing `PROMPT_5_RELEASE` artifact.

## Operational closure

After the E2E runs, ports `3001`, `4173`, and `8080` were checked and no active listener remained. No orphan `node`, `bun`, `tsx`, `vite`, `ffmpeg`, or `ffprobe` process attributable to the runners remained. No deploy, tag, GitHub Release, merge, or external publication was executed.

## Decision

`NOT_READY`. The functional V1 acceptance remains valid, but the production readiness gate is not satisfied. Do not begin a production deployment unit until the blockers above are remediated, evidenced, and independently reviewed.
