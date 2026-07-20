# V1.0.0 — Sprint 25 technical hardening evidence

Status: **FOCUSED LIFECYCLE REVIEW BLOCKED; RELEASE NOT_READY; AUDIT FOLLOW-UP REQUIRED**

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

| Check                       | Result                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Git root                    | `C:/Users/carol/Documents/aralume-studio V2/aralume-studio`                                             |
| HEAD, `main`, `origin/main` | all `15d113ad0181164af306e28a61aae5b0ec28bea5`                                                          |
| Divergence                  | `0/0` before branch creation                                                                            |
| Initial working tree        | clean before implementation; no staged, modified, or untracked files                                    |
| Initial related PRs         | none (`gh pr list --state open` returned `[]`)                                                          |
| Current worktree            | one worktree, current branch shown above                                                                |
| Ports 3001, 4173, 8080      | no listeners before and after runner execution                                                          |
| Application processes       | no application process was running in preflight; observed Node processes belonged to `./mcp/server.mjs` |

The local and remote branch inventories were collected during the initial
pre-implementation preflight. No historical branch was deleted.

## Current formalization state

The Sprint 25 implementation and its focused lifecycle/traceability remediation
were formalized and published:

- implementation commit: `9e7017c233715ac693cf2eb933bcae9f939140db`;
- corrective commit: `22b7347cdb624f62f588c60550cb2d9538278945`;
- F-01--F-06 remediation code commit: `b8febec`;
- validated code HEAD for the gates below: `b8febec`;
- focused F-02/F-07/F-08 remediation commit: `176f3f694656d66a3b999ef6757e5cc166cfebe3`;
- focused test and regression coverage commit: `28155fac96b5f2f4a3731214c195c7fec9989d62`;
- focused documentation commits: `a0a358f`, `78fb9db`, and `c99a6dcf89865c0bf737572c2e2e2662bb5e7644`;
- current review HEAD: `c99a6dcf89865c0bf737572c2e2e2662bb5e7644`;
- branch: `codex/sprint-25-release-readiness-hardening`;
- push: completed to `origin/codex/sprint-25-release-readiness-hardening`;
- pull request: [#41](https://github.com/aralumemedia-lab/aralume-studio/pull/41), open and draft;
- base: `15d113ad0181164af306e28a61aae5b0ec28bea5`;
- merge: not performed;
- tag, release, and deploy: not created or executed.

The earlier documentary updates were normal commits after the implementation
and test commits. The current review was executed on the exact final branch
HEAD `c99a6dcf89865c0bf737572c2e2e2662bb5e7644`; this SHA includes the final
documentation alignment. The PR remains open and draft; no merge, tag, release,
or deploy has occurred.

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

| Package           | Advisory / severity                            | Original → fixed    | Main chain and execution domain                                       | Residual                                |
| ----------------- | ---------------------------------------------- | ------------------- | --------------------------------------------------------------------- | --------------------------------------- |
| `@babel/core`     | GHSA-4x5r-pxfx-6jf8 / CVE-2026-49356, low      | `7.29.0` → `7.29.6` | TanStack router/start and Vite React build tooling; build/development | no known audit finding after resolution |
| `brace-expansion` | GHSA-jxxr-4gwj-5jf2 / CVE-2026-45149, moderate | `5.0.5` → `5.0.6`   | `minimatch` via ESLint / typescript-eslint; lint/development          | no known audit finding after resolution |
| `js-yaml`         | GHSA-h67p-54hq-rp68 / CVE-2026-53550, moderate | `4.1.1` → `4.2.0`   | ESLint eslintrc and TanStack start plugin; lint/build/development     | no known audit finding after resolution |

`bun pm why` confirmed these are not direct application runtime dependencies.
The historical Sprint 25 audit passed after the selective overrides. On the
current review HEAD, `bun audit` fails with two high-severity advisories:
`brace-expansion` `GHSA-3jxr-9vmj-r5cp` and `js-yaml` `GHSA-52cp-r559-cp3m`.
The base lockfile already contained affected versions (`brace-expansion` 1.1.14
and `js-yaml` 4.1.1); this PR moved them to 5.0.6 and 4.2.0, respectively, but
both remain within the currently affected ranges. No dependency changes were
authorized in the focused lifecycle remediation. These advisories are not
introduced by the lifecycle changes, but they remain release blockers and are
not a false PASS.
The override approach
keeps the direct dependency graph unchanged apart from the test-only `undici`
declaration and avoids broad package upgrades. Build, lint, and the full test
suite provide the compatibility coverage for the lockfile change.

### Service identity and lifecycle remediation

Each E2E invocation now creates a cryptographically random `runId`, propagates it
to child processes as `ARALUME_E2E_RUN_ID`, and waits for all of the following:

1. the expected endpoint responds with JSON;
2. `ok === true`;
3. the exact expected service name is returned;
4. the exact current `runId` is returned;
5. the endpoint returns an IPC-confirmed startup nonce;
6. the endpoint returns an IPC-confirmed PID from the spawned process or its
   tsx descendant;
7. the endpoint returns the requested port;
8. the confirmed process is still alive after the response is read.

The backend includes run id, nonce, PID, and port in the health response only
when ARALUME_ENV=test and both test identity values are present. Vite exposes its
identity endpoint only in test mode. Runners 15–21 and the HMAC runner use this
identity gate instead of generic HTTP liveness. A server that is alive on the
port but did not confirm the nonce over IPC is rejected. Production responses do
not expose this test identity mechanism.

The lifecycle utility now uses an AsyncLocalStorage context per execution, one
close promise per process, single-flight teardown, cleanup after close, and an
AbortController per readiness fetch attempt. Startup observes message, error,
exit, close, and a bounded timeout; exit before handshake cannot leave a pending
promise. The focused remediation adds a per-process HMAC challenge-response
proof, a correlation id for the startup handshake, independent waiter timeouts,
aggregation of primary and teardown failures, and event-based lifecycle tests
without fixed-delay synchronization. The focused lifecycle suite passed 18/18.

The obsolete fixed-delay inference was removed. Reproductions passed 50/50
critical sequential executions, 8/8 concurrent executions, and 20/20 complete
lifecycle suites. Focused remediation stress passed 50/50 false associations,
50/50 waiter pairs, 20/20 waiter triplets, 50/50 primary-plus-teardown error
cases, 100/100 event-based lifecycle cases, and 16/16 concurrent lifecycle
cases. Additional stress passed 20/20 HTTP timeout cases, 20/20 early-handshake
cases, and 50/50 registry pairs.

## Current independent review findings

The focused review was executed on `c99a6dcf89865c0bf737572c2e2e2662bb5e7644`.
The following direct lifecycle regressions were reproduced and block merge:

- `scripts/e2e-process-utils.mjs:428-435`: the readiness timeout aborts the
  request only until `fetch()` resolves. A response that sends headers and a
  partial JSON body leaves `response.json()` pending beyond the declared 150 ms
  timeout (`BODY_TIMEOUT_RESULT=still-pending-after-500ms`).
- `scripts/e2e-process-utils.mjs:189-237,534-538`: a child that exits with code
  0 before the startup handshake records `startupError`, but `failureFor()` and
  `runE2E()` do not report it. The coordinator reproduced
  `EARLY_EXIT_STATUS=0` with no error report.
- `server/src/routes/health.ts:16-29` and `vite.config.ts:24-32`: the test-only
  endpoints accept a previously valid challenge indefinitely. The verifier
  generates a fresh challenge for each attempt, but the service has no
  server-side consumed-challenge set or TTL. Reuse after 1.2 seconds was
  accepted. This is a direct Spec 026 challenge replay/expiry criterion failure
  and remains scoped to the test/E2E identity mechanism.

These findings are not resolved by documentation. The PR must remain draft until
the implementation makes the response body cancellable, treats every child
that exits before handshake as a failure, and rejects expired or reused
challenges in the test-only identity endpoints.

## Reproducible gates

Executed from the repository root on 2026-07-20:

| Command                                                                    | Result                                                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npx tsc --noEmit`                                                         | PASS, exit 0, zero diagnostics                                                                                                                                                       |
| `bun audit`                                                                | FAIL, exit 1: 2 high advisories — `brace-expansion` `>=3.0.0 <5.0.7` (`GHSA-3jxr-9vmj-r5cp`) and `js-yaml` `>=4.0.0 <4.3.0` (`GHSA-52cp-r559-cp3m`); no dependency changes in focused remediation |
| `npm run lint`                                                             | PASS                                                                                                                                                                                 |
| `npm run backend:check`                                                    | PASS                                                                                                                                                                                 |
| `npm test`                                                                 | PASS, 92/92 tests                                                                                                                                                                    |
| `npm run build`                                                            | PASS                                                                                                                                                                                 |
| `bun install --frozen-lockfile`                                            | PASS, no lockfile changes                                                                                                                                                            |
| `node --test scripts/e2e-process-utils.test.mjs`                           | PASS, 18/18 tests                                                                                                                                                                    |
| focused lifecycle stress                                                   | PASS, 50 false associations; 50 waiter pairs; 20 waiter triplets; 50 primary-plus-teardown errors; 100 sequential event-based cases; 16 concurrent event-based cases; 20 full suites |
| prior lifecycle stress                                                     | PASS, 50 sequential; 8 concurrent; 20 timeout; 20 early handshake; 50 registry pairs; 20 false association                                                                           |
| `node scripts/sprint15-browser-e2e.mjs` through `sprint21-browser-e2e.mjs` | PASS, all exit 0 with identity-gated startup                                                                                                                                         |
| `node scripts/sprint24-security-hmac-e2e.mjs`                              | PASS, exit 0; authorization, isolation, conflict, missing/invalid signature cases preserved                                                                                          |
| heuristic secret scan of added diff                                        | PASS, high-confidence private-key/API-key/token patterns; 0 hits; known fixtures: none in changed files; no real secret found; current review HEAD `c99a6dc`                           |
| `git diff --check`                                                         | PASS                                                                                                                                                                                 |
| post-run ports 3001, 4173, 8080                                            | clear                                                                                                                                                                                |
| post-run project processes                                                 | clear; no orphaned runner/backend/frontend process                                                                                                                                   |

The runners generated local screenshot artifacts during execution; those
artifacts were restored to the clean baseline and are not part of this unit.

## GitHub governance residual

The PR has no hosted checks (`statusCheckRollup=[]`); the repository also has no
branch protection, rulesets, or CODEOWNERS. The technical gates in this document
were reproduced locally, but the missing CI/enforcement is a governance risk and
is not silently treated as a functional Sprint 25 correction. A separate unit
should establish CI and branch protection. This remediation did not create or
claim any hosted check.

## Agent lifecycle

The original Sprint 25 unit used four fresh read-only agents for TypeScript,
dependencies, service identity, and documentation/gates; all four were closed.
This remediation created three fresh read-only agents for lifecycle,
process/endpoint association, and evidence. The current independent review
created four fresh read-only agents for challenge-response, lifecycle,
stress/runners, and documentation/advisories. Their reports were collected or
interrupted after the coordinator reproduced the decisive findings; all four
were closed. No subagent edited files, committed, pushed, changed the PR, or
merged.

## Residual blockers and explicit non-scope

This hardening unit corrected the previously reported TypeScript and initial
lifecycle findings, but the current independent review found two direct
lifecycle regressions and the product remains `NOT_READY`. The current
`brace-expansion` and `js-yaml` audit advisories are explicitly not remediated in
this focused unit and remain separate release blockers. Production
configuration and secrets, backup/restore,
rollback, broad observability, production topology/ingress, the next integral
release-readiness evaluation, release, tag, and deploy remain pending and were
not implemented or authorized.
