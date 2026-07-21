# Aralume Studio V1.0.0 â€” Validation Checklist

Status: **NOT READY**

## Build and code gates

> The TypeScript failure below is the historical Sprint 23 baseline snapshot.
> Current Sprint 25 technical status is recorded in the section at the end of
> this document and in the linked Sprint 25 evidence; the historical checklist
> is preserved for chronology.

- [x] `git diff --check`
- [x] lint
- [x] backend typecheck
- [x] frontend/global `npx tsc --noEmit` â€” PASS, exit code 0, zero diagnostics on Sprint 25 code HEAD
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
the current code HEAD is `1d943dc`.
The current HEAD audit fails with two high advisories: `brace-expansion`
(`GHSA-3jxr-9vmj-r5cp`, fixed in 5.0.7) and `js-yaml`
(`GHSA-52cp-r559-cp3m`, affected range reported by Bun as `>=4.0.0 <4.3.0`).
Dependencies were intentionally not changed in the focused lifecycle review;
both advisories remain release blockers and are not treated as PASS.
The focused remediation adds HMAC challenge-response ownership proof, isolated
startup waiters, aggregated primary/teardown failures, event-based lifecycle
synchronization, total response-body cancellation, strict early-exit failure,
and server-issued, single-use expiring identity challenges. The focused process
suite is 20/20 and the official suite is 93/93; runners 15â€“21 and HMAC passed.
The challenge registry rejects unissued challenges and does not evict valid
records before TTL expiry. The PR remains draft for independent review of this
final correction.
The release remains **NOT READY** because
production configuration/secrets, backup/restore, rollback, observability,
production topology/ingress, and the integral release-readiness evaluation are
outside this unit and still pending.

## Current Sprint 26 dependency remediation

Sprint 26 / Spec 027 updated only the existing exact overrides for the two
transitive advisories. On the externally verified final branch head for PR #42,
the effective versions are
`brace-expansion@5.0.7` and `js-yaml@4.3.0`.

The documentary chronology for this unit is `cf772c1` followed by `c750cec`;
the checklist intentionally avoids self-referencing the final commit SHA.

- [x] `bun install --frozen-lockfile` â€” PASS, no lockfile changes
- [x] `bun audit` â€” PASS, zero vulnerabilities
- [x] minimatch/brace-expansion compatibility checks â€” PASS, including bounded input
- [x] YAML tooling checks â€” PASS for valid and malformed YAML handling
- [x] lint, backend check, global typecheck, official tests and build â€” PASS
- [x] lifecycle, identity/readiness, runners 15-21 and HMAC â€” PASS
- [x] secret scan â€” zero high-confidence hits; no real secret found
- [x] required ports free and no project orphan process after execution

This dependency unit does not authorize release. Productive configuration,
secrets, recovery/rollback, observability, topology/ingress, CI and final
release-readiness evaluation remain pending; release 1.0.0 remains **NOT READY**.

## Current Sprint 27 operational hardening

Sprint 27 / Spec 028 records the next operational unit after the dependency
remediation. Its evidence is intentionally tracked separately from the
historical release-readiness matrix because the runtime now enforces fail-closed
production-like configuration and uses a reproducible filesystem backup helper.

- [x] fail-closed staging/production configuration validation
- [x] production-like secret inventory recorded without real values
- [x] backup snapshot with checksum over JSON state and media storage
- [x] restore into a clean target and rejection of dirty targets
- [x] rollback replacement of the target state from the verified snapshot
- [x] canonical validation of `manifest.files` against snapshot contents
- [x] symlink/junction aliases rejected by canonical filesystem containment
- [x] focused negative cases for missing config, invalid URLs and tampered snapshots
- [x] lint, backend check, typecheck, official tests and build
- [x] frozen install and bun audit
- [x] lifecycle, identity/readiness, runners 15-21 and HMAC
- [x] secret scan and port/process verification

The current operational evidence is stored in
[`V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md).
The release remains **NOT READY** while broader production readiness work
continues in later units.

## Current Sprint 28 observability and readiness hardening

Sprint 28 / Spec 029 records the next operational unit after Sprint 27. Its
evidence is intentionally tracked separately because the runtime now exposes
distinct liveness, readiness and operational health endpoints, structured logs,
minimal metrics, graceful shutdown, and production-like ingress policy.

- [x] `/live`, `/ready`, `/health`, `/ops/health` and `/ops/metrics`
  contracts
- [x] structured logs with requestId correlation and sanitized actor/channel
  metadata
- [x] operational metrics with low cardinality and readiness snapshot
- [x] graceful shutdown with readiness withdrawal and listener closure
- [x] production-like ingress policy with host/origin/HTTPS checks
- [x] smoke prod simulation with startup, readiness, shutdown and recovery
- [x] lint, backend check, typecheck, official tests and build
- [x] frozen install and bun audit
- [x] runners 15-21 and HMAC
- [x] secret scan and port/process verification

The current operational evidence is stored in
[`V1_SPRINT28_OBSERVABILITY_READINESS_TOPOLOGY_INGRESS_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT28_OBSERVABILITY_READINESS_TOPOLOGY_INGRESS_EVIDENCE.md).
The release remains **NOT READY** while the final release-readiness review and
any remaining governance work continue in later units.
## Release 1.0.0 operational readiness remediation

The next normative unit is the release-level remediation described by
`docs/specs/030-release-1.0.0-operational-readiness-remediation.md`. It is not
Sprint 29.

- [ ] `docker build` or equivalent immutable artifact build for staging
- [ ] `docker compose config` for the staging topology
- [ ] hosted CI workflow definitions for the release gates
- [ ] `CODEOWNERS` with verifiable owners
- [ ] release configuration inventory and fail-closed startup evidence
- [ ] operational runbooks reconciled with real commands
- [ ] monitoring surfaces versioned and linked to owners or pending admin work
- [ ] consolidated browser / runner evidence for the release candidate

The release remains **NOT READY** until this remediation has been validated and
reviewed independently.

## Release 1.0.0 governance remote and promotion authorization

The next normative unit is the release-level governance remediation described
by `docs/specs/031-release-1.0.0-governance-remote.md`. It is not Sprint 29.

- [x] `main` branch protection with PR obligation, zero required human approvals, and required checks
- [x] `main-governance` ruleset active on `refs/heads/main`
- [x] protected `production` environment with promotion authorization executable for the single-maintainer model
- [x] explicit CODEOWNERS coverage for governance surfaces without a merge gate
- [x] repository evidence recorded in `GOVERNANCE_REMOTE_READINESS.md`

The release remains **NOT READY** until the later independent release-readiness
review is completed.

## Release 1.0.0 final readiness remediation

The next release-level remediation is described by
`docs/specs/032-release-1.0.0-final-readiness-remediation.md`. It closes the
three residual findings left by the final readiness review: canonical recovery
command, hydration mismatch elimination, and governance documentation alignment.

- [x] canonical recovery command documented and executable through `npm run recovery:validate` — PASS
- [x] browser acceptance regression fails on hydration mismatch and passes on the clean path — PASS
- [x] governance documentation aligned to the live single-maintainer remote state — PASS
- [x] final readiness remediation evidence recorded externally in the PR record and release docs — PASS

The release remains **NOT READY** until this remediation is validated and the
later independent release-readiness review is completed.
