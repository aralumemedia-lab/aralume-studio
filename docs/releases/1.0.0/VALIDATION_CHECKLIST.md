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

- [x] no real secret found by heuristic diff scan on validated Sprint 25 code (b8febec); 0 high-confidence hits, known fixtures: none in changed files
- [x] local anonymous HTTP probe captured
- [ ] close 55 deferred security worklist rows
- [ ] resolve or formally accept dependency advisories
- [ ] verify filesystem permissions and storage isolation in production topology
- [ ] verify external integration credentials and redirect policy
- [ ] verify no orphaned processes and required ports after smoke execution

## V1 functional preservation

The R14 evidence remains the governing functional acceptance: V1-01 through V1-18 are accepted at the functional SHA. This checklist does not supersede or overwrite that historical matrix.

## Current Sprint 25 technical status

The Sprint 25 hardening evidence is recorded in
[`V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md).
The global TypeScript gate now passes with zero diagnostics, `bun audit` reports
no vulnerabilities after fixed-version overrides, and the E2E runners validate
the exact service, nonce, IPC-confirmed process identity, and per-run identity.
The lifecycle and registry stress evidence is recorded in the Sprint 25 evidence.
The release remains **NOT READY** because
production configuration/secrets, backup/restore, rollback, observability,
production topology/ingress, and the integral release-readiness evaluation are
outside this unit and still pending.
