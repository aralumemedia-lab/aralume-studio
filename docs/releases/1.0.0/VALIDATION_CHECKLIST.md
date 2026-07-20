# Aralume Studio V1.0.0 — Validation Checklist

Status: **NOT READY**

## Build and code gates

> The TypeScript failure below is the historical Sprint 23 baseline snapshot.
> Current Sprint 25 technical status is recorded in the section at the end of
> this document and in the linked Sprint 25 evidence; the historical checklist
> is preserved for chronology.

- [x] `git diff --check`
- [x] lint
- [x] backend typecheck
- [ ] frontend/global `npx tsc --noEmit` — FAIL, exit code 2, 18 pre-existing diagnostics; branch output exactly matches `origin/main`
- [x] official test suite
- [x] build
- [x] dependency audit captured
- [ ] production configuration validation
- [ ] backup/restore drill
- [ ] rollback drill
- [ ] authenticated ingress and API authorization test
- [ ] readiness/metrics/alerts test

### Global TypeScript condition

The command `npx tsc --noEmit` returns exit code 2 with 18 diagnostics on both the Sprint 23 branch and `origin/main`. The errors affect test fixtures, mocks, and frontend typing; they were not introduced or aggravated by this documentation PR. They must be corrected in a separate functional sprint and PR before production release. No risk acceptance is recorded here.

## Security and runtime gates

- [x] no real secret found by heuristic diff scan on current review HEAD (c99a6dc); 0 high-confidence hits, known fixtures: none in changed files
- [x] local anonymous HTTP probe captured
- [ ] close 55 deferred security worklist rows
- [ ] resolve or formally accept dependency advisories
- [ ] verify filesystem permissions and storage isolation in production topology
- [ ] verify external integration credentials and redirect policy
- [x] verify no orphaned processes and required ports after smoke execution (Sprint 25 result; see canonical evidence; historical Sprint 23 rows remain preserved above)

## V1 functional preservation

The R14 evidence remains the governing functional acceptance: V1-01 through V1-18 are accepted at the functional SHA. This checklist does not supersede or overwrite that historical matrix.

## Current Sprint 25 technical status

The Sprint 25 hardening evidence is recorded in
[`V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md).
The global TypeScript gate now passes with zero diagnostics. The historical
Sprint 25 audit passed after fixed-version overrides; the current review HEAD
audit limitation is recorded below. The E2E runners validate
the exact service, nonce, IPC-confirmed process identity, and per-run identity.
The lifecycle and registry stress evidence is recorded in the Sprint 25 evidence;
the current review HEAD is `c99a6dcf89865c0bf737572c2e2e2662bb5e7644`.
The current HEAD audit fails with two high advisories: `brace-expansion`
(`GHSA-3jxr-9vmj-r5cp`, fixed in 5.0.7) and `js-yaml`
(`GHSA-52cp-r559-cp3m`, affected range reported by Bun as `>=4.0.0 <4.3.0`).
Dependencies were intentionally not changed in the focused lifecycle review;
both advisories remain release blockers and are not treated as PASS.
The focused remediation adds HMAC challenge-response ownership proof, isolated
startup waiters, aggregated primary/teardown failures, and event-based lifecycle
synchronization; its final code and documentation SHAs are recorded in the PR
metadata and canonical evidence.
The current independent review also reproduced a pending HTTP response-body
timeout and an exit-0-before-handshake false success; the PR remains draft until
those direct lifecycle regressions are fixed. It also found that the test-only
identity endpoints accept a replayed challenge without TTL or server-side
consumption; the challenge replay/expiry criterion remains open.
The release remains **NOT READY** because
production configuration/secrets, backup/restore, rollback, observability,
production topology/ingress, and the integral release-readiness evaluation are
outside this unit and still pending.
