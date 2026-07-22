# Aralume Studio V1.0.0 â€” Release Notes

Status: **READY FOR FINAL REVIEW**

This release unit records the formally accepted V1 functional baseline (`d2b53c9e7bfe15c8116c07375ca4b604fce03e97`) and Sprint 23 hardening evidence. No tag, release, or deployment was created by Sprint 23.

## Included baseline

> The baseline and blocker statements in this section are historical Sprint 23
> release-readiness records. Sprint 25 resolution status is recorded separately
> below and does not authorize production release.

- V1.0 acceptance R14: 18/18 criteria passed.
- Sprint 22 remediation: audit request IDs, editorial audit coverage, channel isolation, and E2E runner corrections.
- Sprint 23 engineering gates: lint, backend check, official tests, and build passed; the global TypeScript check was recorded as FAIL with exit code 2 and 18 pre-existing diagnostics, and the dependency audit remains a blocking follow-up.

## Release blockers

- No inbound authentication/authorization boundary is implemented before protected API routers.
- Production topology, authenticated ingress, required environment variables, secret injection, backup/restore, and rollback execution are not reproducibly defined.
- `/health` is process-liveness only and does not establish storage, media-tool, or integration readiness.
- Security review retains deferred coverage for 55 ranked source rows; deferred is not safe/approved.
- Dependency audit reports 2 moderate and 1 low transitive advisories; remediation/waiver is not recorded.
- Global TypeScript check returns 18 pre-existing diagnostics on the accepted functional baseline; correction is required in a separate functional sprint/PR before production release.

V1 acceptance remains valid as a functional acceptance of the evaluated SHA. It is not a production deployment authorization.

## Sprint 25 technical hardening

Sprint 25 / Spec 026 corrected the 14 global TypeScript diagnostics, applied
selective dependency overrides, and added per-run service identity checks to E2E
startup. The historical audit passed after those overrides, but the current
advisory database reports unresolved affected versions of `brace-expansion` and
`js-yaml`; the release remains blocked and no audit PASS is claimed. The follow-up
remediation at validated code HEAD b8febec added nonce/IPC/PID/port association, cancelable
readiness fetches, deterministic early-handshake failure, per-execution registry
cleanup, and single-flight teardown. The focused lifecycle remediation further
adds HMAC challenge-response ownership proof, isolated startup waiters, aggregated
primary/teardown failures, and event-based termination synchronization. Reproducible evidence is available in
[`V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md).
The current code HEAD for the final focused correction is `1d943dc`. The
current `bun audit` result is
FAIL (exit 1) for high advisories `GHSA-3jxr-9vmj-r5cp` on
`brace-expansion@5.0.6` and `GHSA-52cp-r559-cp3m` on `js-yaml@4.2.0`.
No dependency change is included in the focused lifecycle review. The review
remediation now bounds response-body consumption with the readiness timeout,
rejects exit-0 children before the startup handshake, and issues/consumes
test-only identity challenges once with a short TTL, rejecting unissued and
cross-execution challenges. The process suite is 20/20, the
official suite is 93/93, body-timeout stress is 30/30, early-exit stress is
50/50 sequential plus 16/16 concurrent, replay stress is 50/50 sequential plus
20/20 concurrent, and runners 15â€“21 plus HMAC passed. The PR remains draft
pending independent focused review.

These corrections do not change the release decision: V1.0.0 remains **NOT READY
FOR PRODUCTION DEPLOYMENT** while the production and operational gates listed
above remain pending. No tag, release, or deploy was created.

## Sprint 26 dependency advisory remediation

Sprint 26 / Spec 027 applies the smallest compatible update to the existing
exact overrides: `brace-expansion` `5.0.6` to `5.0.7` and `js-yaml` `4.2.0` to
`4.3.0`. Both findings were transitive and used by lint/build tooling. The
package manifest and lockfile diff contains no unrelated dependency update and
the frozen install is reproducible.

`bun audit` now exits 0 with zero vulnerabilities. Compatibility checks for
minimatch/brace expansion and YAML parsing, lint, backend check, typecheck,
tests, build, lifecycle, identity/readiness and runners 15-21 plus HMAC passed.
No tag, release or deployment was created. The release remains **NOT READY**
pending productive configuration/secrets, recovery and rollback, observability,
topology/ingress and final release-readiness evaluation.

## Sprint 27 production configuration, backup/restore and rollback

Sprint 27 / Spec 028 tightens the runtime boundary for staging and production,
adds a fail-closed configuration schema, documents the secret inventory, and
introduces a reproducible filesystem backup/restore/rollback helper for the
current JSON state and media storage layout. The implementation is paired with a
real execution script and focused tests that validate backup creation, checksum
verification, clean restore, rollback replacement, and the rejection of dirty
targets or tampered snapshots.

The operational evidence for this unit is recorded in
[`V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md).
The release remains **NOT READY** because the broader production evaluation,
including later operational hardening and governance gates, is still pending.

## Sprint 28 observability, topology and readiness productive hardening

Sprint 28 / Spec 029 extends the runtime with distinct liveness, readiness and
health contracts, structured sanitized logs, minimal operational metrics,
graceful shutdown, and strict ingress policy for staging and production while
remaining permissive for local runner execution. The operational evidence for
this unit is recorded in
[`V1_SPRINT28_OBSERVABILITY_READINESS_TOPOLOGY_INGRESS_EVIDENCE.md`](../../acceptance/v1/V1_SPRINT28_OBSERVABILITY_READINESS_TOPOLOGY_INGRESS_EVIDENCE.md).
The release remains **NOT READY** because the final readiness evaluation and
any remaining governance work are still pending.
## Release 1.0.0 operational readiness remediation

The next release-level unit is governed by
`docs/specs/030-release-1.0.0-operational-readiness-remediation.md`. It does
not invent a new sprint number. The unit is dedicated to the blockers recorded
in the release assessment PR #45: deployment artifact and rollback evidence,
hosted CI and owner controls, production configuration and secrets inventory,
executive runbooks, monitoring ownership, and consolidated browser / runner
evidence.

`RLS-06` hydration triage remains a separate risk unless a later unit absorbs
it explicitly. The release remains **NOT READY** until the remediation is
validated and reviewed independently.

## Release 1.0.0 governance remote and promotion authorization

The next release-level unit is governed by
`docs/specs/031-release-1.0.0-governance-remote.md`. It does not invent a new
sprint number. The unit closes the remote governance blockers that were still
open after the operational remediation:

- `main` branch protection with PR obligation, zero required human approvals,
  required checks and conversation resolution;
- an active `main-governance` ruleset;
- a protected `production` environment for promotion authorization usable by
  the single-maintainer model;
- explicit CODEOWNERS coverage for release-governance surfaces without a merge gate.

The evidence for this unit is recorded in
[`GOVERNANCE_REMOTE_READINESS.md`](./GOVERNANCE_REMOTE_READINESS.md). The
release remained **NOT READY** until the later independent release-readiness
review was executed.

## Release 1.0.0 final readiness remediation

The next release-level unit is governed by
`docs/specs/032-release-1.0.0-final-readiness-remediation.md`. It closes the
last three findings from the final readiness review:

- canonical recovery command documentation and operator workflow;
- hydration mismatch removal and browser regression;
- governance documentation alignment to the live remote state.

The evidence for this unit is recorded in
[`FINAL_READINESS_REMEDIATION.md`](./FINAL_READINESS_REMEDIATION.md). The
release remained **NOT READY** until that remediation was validated and the
later independent release-readiness review was executed.

## Release 1.0.0 gate closure

The final documentation reconciliation preserved the historical blocker
records, formalized the promotion path, and closed the active gate to
`READY_FOR_FINAL_REVIEW`.

The later independent release-readiness review remains mandatory before any
`READY_FOR_RELEASE` verdict.
