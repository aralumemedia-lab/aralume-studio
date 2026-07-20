# V1.0.0 — Sprint 25 technical hardening evidence

Status: **TECHNICAL GATES PASS; RELEASE NOT_READY**

Date: 2026-07-20
Base: `15d113ad0181164af306e28a61aae5b0ec28bea5`
Branch: `codex/sprint-25-release-readiness-hardening`

This document records the limited Sprint 25 hardening unit. It does not authorize
a tag, release, deployment, or a new integral release-readiness assessment.

## Normative decision

The preflight read `AGENTS.md`, the SDD process, `PROJECT_MASTER`, roadmap,
backlog, handoff, Sprint 24 evidence, current release-readiness documents,
TypeScript/package configuration, lockfile, E2E runners, and
`e2e-process-utils.mjs`. The latest formalized unit was Sprint 24 / Spec 025;
the normative documents did not reserve Sprint 25 or Spec 026. This unit therefore
registered Sprint 25 / Spec 026 before implementation:

- Spec: [`026-sprint-25-release-readiness-hardening.md`](../../specs/026-sprint-25-release-readiness-hardening.md)
- Roadmap/backlog/handoff/master records: `docs/NEXT_SPRINTS.md`,
  `docs/PRODUCT_BACKLOG.md`, `docs/CODEX_HANDOFF.md`, and `docs/PROJECT_MASTER.md`.

## Preflight

| Check | Result |
|---|---|
| Git root | `C:/Users/carol/Documents/aralume-studio V2/aralume-studio` |
| HEAD, `main`, `origin/main` | all `15d113ad0181164af306e28a61aae5b0ec28bea5` |
| Divergence | `0/0` before branch creation |
| Initial working tree | clean before implementation; no staged, modified, or untracked files |
| Initial related PRs | none (`gh pr list --state open` returned `[]`) |
| Current worktree | one worktree, current branch shown above |
| Ports 3001, 4173, 8080 | no listeners before and after runner execution |
| Application processes | no application process was running in preflight; observed Node processes belonged to `./mcp/server.mjs` |

The local and remote branch inventories were collected during the initial
pre-implementation preflight. No historical branch was deleted.

## Current formalization state

The Sprint 25 implementation and its focused corrective follow-up were
formalized and published:

- implementation commit: `9e7017c233715ac693cf2eb933bcae9f939140db`;
- corrective commit: `22b7347cdb624f62f588c60550cb2d9538278945`;
- current HEAD: `22b7347cdb624f62f588c60550cb2d9538278945`;
- branch: `codex/sprint-25-release-readiness-hardening`;
- push: completed to `origin/codex/sprint-25-release-readiness-hardening`;
- pull request: [#41](https://github.com/aralumemedia-lab/aralume-studio/pull/41), open and draft;
- base: `15d113ad0181164af306e28a61aae5b0ec28bea5`;
- merge: not performed;
- tag, release, and deploy: not created or executed.

## Baseline and corrections

### TypeScript

Baseline `npx tsc --noEmit` reproduced 14 diagnostics, grouped by root cause:

- test fixtures asserted `RenderJob` fields that belong to the rendered
  `MediaAsset`, used invalid status literals, and had an optional duration;
  the test now reads the persisted output asset and uses the domain status union;
- the metrics fixture used a widened tuple; it now declares the tuple shape
  before mapping to `PerformanceMetric`;
- mock metrics omitted required publication identity fields; all four records now
  provide target, source, and idempotency identifiers;
- media-assets form payload/category inference widened to `string` and allowed an
  undefined title; the builder now returns `CreateMediaAssetInput`, validates the
  title, and returns `MediaAssetCategory`;
- production route used a possibly undefined active channel; the narrowed channel
  id is now required before creating a scene plan;
- the test suite imported `undici` without a declared package; `undici@7.28.0`
  is now a development dependency.

No `any`, suppression directive, double cast, strictness relaxation, file
exclusion, or tsconfig masking was used. Final result: `npx tsc --noEmit`
exit code 0 with zero diagnostics.

### Dependency advisories

The three original findings were transitively resolved with Bun overrides in
`package.json` and the corresponding lockfile entries:

| Package | Advisory / severity | Original → fixed | Main chain and execution domain | Residual |
|---|---|---|---|---|
| `@babel/core` | GHSA-4x5r-pxfx-6jf8 / CVE-2026-49356, low | `7.29.0` → `7.29.6` | TanStack router/start and Vite React build tooling; build/development | no known audit finding after resolution |
| `brace-expansion` | GHSA-jxxr-4gwj-5jf2 / CVE-2026-45149, moderate | `5.0.5` → `5.0.6` | `minimatch` via ESLint / typescript-eslint; lint/development | no known audit finding after resolution |
| `js-yaml` | GHSA-h67p-54hq-rp68 / CVE-2026-53550, moderate | `4.1.1` → `4.2.0` | ESLint eslintrc and TanStack start plugin; lint/build/development | no known audit finding after resolution |

`bun pm why` confirmed these are not direct application runtime dependencies.
`bun audit` now exits 0 with `No vulnerabilities found`. The override approach
keeps the direct dependency graph unchanged apart from the test-only `undici`
declaration and avoids broad package upgrades. Build, lint, and the full test
suite provide the compatibility coverage for the lockfile change.

### Service identity

Each E2E invocation now creates a cryptographically random `runId`, propagates it
to child processes as `ARALUME_E2E_RUN_ID`, and waits for all of the following:

1. the expected endpoint responds with JSON;
2. `ok === true`;
3. the exact expected service name is returned;
4. the exact current `runId` is returned;
5. the child process is still alive.

The backend includes the run id in `/health` only when explicitly supplied by the
test environment. Vite exposes `GET /__aralume/e2e-identity` only in test mode
with a run id, returning the fixed `aralume-web` identity. Runners 15–21 and the
HMAC runner use this identity gate instead of generic HTTP liveness. This rejects
an old server, another execution, the wrong service, or an unrelated process on
the expected port.

`node --test scripts/e2e-process-utils.test.mjs` covers the positive identity,
stale run id, wrong service, process exit, and teardown paths (8/8 passed).

Before the lifecycle correction, the fixed-delay test reproduced the race: the
targeted case passed 50/50 sequentially but failed 8/8 under eight-way
concurrency; the complete lifecycle file passed 20/20 sequential runs. The
corrective change replaces the 300 ms inference with an explicit child IPC
startup message followed by the child `close` event.

## Reproducible gates

Executed from the repository root on 2026-07-20:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS, exit 0, zero diagnostics |
| `bun audit` | PASS, exit 0, no vulnerabilities |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `npm test` | PASS, 92/92 tests |
| `npm run build` | PASS |
| `node --test scripts/e2e-process-utils.test.mjs` | PASS, 8/8 tests |
| `node scripts/sprint15-browser-e2e.mjs` through `sprint21-browser-e2e.mjs` | PASS, all exit 0 with identity-gated startup |
| `node scripts/sprint24-security-hmac-e2e.mjs` | PASS, exit 0; authorization, isolation, conflict, missing/invalid signature cases preserved |
| `git diff --check` | PASS |
| post-run ports 3001, 4173, 8080 | clear |

The runners generated local screenshot artifacts during execution; those
artifacts were restored to the clean baseline and are not part of this unit.

## GitHub governance residual

The PR has no hosted checks (`statusCheckRollup=[]`); the repository also has no
branch protection, rulesets, or CODEOWNERS. The technical gates in this document
were reproduced locally, but the missing CI/enforcement is a governance risk and
is not silently treated as a functional Sprint 25 correction. A separate unit
should establish CI and branch protection.

## Agent lifecycle

Four fresh read-only agents were created after the preflight and normative
decision, one each for TypeScript, dependencies, service identity, and
documentation/gates. All four returned reports, their findings were consolidated
before implementation/validation, and all four threads were closed. The tool
surface did not expose a thread-list operation, so pre-existing thread inventory
could not be independently enumerated; no known active legacy thread was reused
or left running.

## Residual blockers and explicit non-scope

This hardening unit removes the three known technical blockers, but the product
remains `NOT_READY`. Production configuration and secrets, backup/restore,
rollback, broad observability, production topology/ingress, the next integral
release-readiness evaluation, release, tag, and deploy remain pending and were
not implemented or authorized.
