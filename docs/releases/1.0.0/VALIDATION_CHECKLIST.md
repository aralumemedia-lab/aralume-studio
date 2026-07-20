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
- [x] frontend/global `npx tsc --noEmit` — PASS, exit code 0, zero diagnostics on Sprint 25 code HEAD
- [x] official test suite
- [x] build
- [x] dependency audit captured
- [ ] production configuration validation
- [ ] backup/restore drill
- [ ] rollback drill
- [ ] authenticated ingress and API authorization test
- [ ] readiness/metrics/alerts test

### Historical Global TypeScript condition

The command returned exit code 2 with historical diagnostics on the Sprint 23
baseline. Sprint 25 corrected its 14 reproduced diagnostics without relaxing
strictness; the current code HEAD passes with zero diagnostics. This paragraph
is retained for chronology and is not the current gate result.

## Security and runtime gates

- [x] no real secret found by heuristic diff scan on code HEAD (0b8e5e2); 0 real high-confidence hits; known fixture `http-test-secret` classified as non-secret
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
the current code HEAD is `0b8e5e2`.
The current HEAD audit fails with two high advisories: `brace-expansion`
(`GHSA-3jxr-9vmj-r5cp`, fixed in 5.0.7) and `js-yaml`
(`GHSA-52cp-r559-cp3m`, affected range reported by Bun as `>=4.0.0 <4.3.0`).
Dependencies were intentionally not changed in the focused lifecycle review;
both advisories remain release blockers and are not treated as PASS.
The focused remediation adds HMAC challenge-response ownership proof, isolated
startup waiters, aggregated primary/teardown failures, event-based lifecycle
synchronization, total response-body cancellation, strict early-exit failure,
and single-use expiring identity challenges. The focused process suite is
20/20 and the official suite is 93/93; runners 15–21 and HMAC passed. The PR
remains draft for independent review of this final correction.
The release remains **NOT READY** because
production configuration/secrets, backup/restore, rollback, observability,
production topology/ingress, and the integral release-readiness evaluation are
outside this unit and still pending.
