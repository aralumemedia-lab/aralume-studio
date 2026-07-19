# Sprint 23 — V1.0 Release Readiness Evidence

Status: **NOT READY FOR PRODUCTION DEPLOYMENT**

Execution unit: Sprint 23, E15, [spec 024](../../specs/024-sprint-23-v1-release-readiness.md)

Functional baseline: `d2b53c9e7bfe15c8116c07375ca4b604fce03e97` — V1.0 remains formally accepted at 18/18 criteria. This document does not authorize a release, tag, deployment, publication, or provider action.

## Repository and scope

- Readiness branch: `codex/sprint-23-v1-release-readiness`.
- Starting functional baseline: `61d313bdb35dd0228a2bf4f5af3454263f588155`.
- No production endpoint, real secret, deployment manifest, or approved recovery target was supplied. The normative `PROMPT_5_RELEASE` model is now incorporated at `docs/governance/PROMPT_5_RELEASE.md`.
- The security scan reviewed immutable revision `61d313bdb35dd0228a2bf4f5af3454263f588155`; its canonical report and ledgers are retained in the local Codex scan artifact directory and were not copied into product source.
- No historical acceptance matrix or evidence directory was overwritten.

## Quality gates

| Gate | Result |
| --- | --- |
| `git diff --check` | PASS |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | FAIL — exit code 2; 18 diagnostics (branch and `origin/main`) |
| `npm run backend:check` | PASS |
| `npm test` | PASS — 78/78 |
| Targeted audit, isolation, media, render, publication and YouTube tests | PASS — 21/21 |
| `npm run build` | PASS; non-blocking Vite/Nitro warnings only |
| Isolated `/health` smoke on ephemeral loopback port | PASS — HTTP 200, `ok: true`, sanitized service/environment payload |
| `bun audit` | BLOCKING FOLLOW-UP — 3 transitive advisories: 2 moderate, 1 low |
| Secret-pattern inspection | No hardcoded secret pattern found |

The reviewed documentation PR contains no type corrections. The 18 diagnostics are pre-existing in `origin/main`; the branch and baseline outputs are exactly equivalent, so this PR neither introduces nor aggravates them.

### Global TypeScript diagnostics

Command executed: `npx tsc --noEmit`.

| State | Exit code | Diagnostics | Comparison |
| --- | ---: | ---: | --- |
| `codex/sprint-23-v1-release-readiness` at `a7766bb56eb8a8bef2bc239fde5737f8b94def95` | 2 | 18 | Reproduced |
| `origin/main` at `61d313bdb35dd0228a2bf4f5af3454263f588155` | 2 | 18 | Exactly equivalent |

Affected files and categories:

| File | Count | Category |
| --- | ---: | --- |
| `server/test/clips.test.ts` | 6 | Test fixture status/RenderJob typing and missing `undici` declarations |
| `server/test/editorial.test.ts` | 4 | Test input includes `channelId` absent from `ScenePlanCreateInput` |
| `server/test/metrics.test.ts` | 1 | Test fixture tuple inference incompatible with `PerformanceMetric` |
| `src/mocks/mock-metrics.ts` | 4 | Mock `PublicationJob` missing required fields |
| `src/routes/media-assets.tsx` | 2 | Frontend payload `category`/`title` typing |
| `src/routes/production.tsx` | 1 | Frontend optional visual-plan value typing |

Technical impact: the global TypeScript contract is not clean at the reviewed functional baseline. The diagnostics are outside the documentary scope of this PR, but they remain a residual engineering risk and a release-readiness blocker.

Production condition: all 18 diagnostics must be corrected and validated in a separate functional sprint and PR before productive release. No risk acceptance is created by this document update.

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
5. Treat the incorporated `PROMPT_5_RELEASE` model as governance only; it does not substitute for technical remediation or production evidence.

## Operational closure

After the E2E runs, ports `3001`, `4173`, and `8080` were checked and no active listener remained. No orphan `node`, `bun`, `tsx`, `vite`, `ffmpeg`, or `ffprobe` process attributable to the runners remained. No deploy, tag, GitHub Release, merge, or external publication was executed.

## Decision

`NOT_READY`. The functional V1 acceptance remains valid, but the production readiness gate is not satisfied. Do not begin a production deployment unit until the blockers above are remediated, evidenced, and independently reviewed.
