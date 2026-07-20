# Aralume Studio V1.0.0 — Release Notes

Status: **NOT READY FOR PRODUCTION DEPLOYMENT**

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
The current code HEAD for the final focused correction is `0b8e5e2`. The
current `bun audit` result is
FAIL (exit 1) for high advisories `GHSA-3jxr-9vmj-r5cp` on
`brace-expansion@5.0.6` and `GHSA-52cp-r559-cp3m` on `js-yaml@4.2.0`.
No dependency change is included in the focused lifecycle review. The review
remediation now bounds response-body consumption with the readiness timeout,
rejects exit-0 children before the startup handshake, and consumes test-only
identity challenges once with a short TTL. The process suite is 20/20, the
official suite is 93/93, body-timeout stress is 30/30, early-exit stress is
50/50 sequential plus 16/16 concurrent, replay stress is 50/50 sequential plus
20/20 concurrent, and runners 15–21 plus HMAC passed. The PR remains draft
pending independent focused review.

These corrections do not change the release decision: V1.0.0 remains **NOT READY
FOR PRODUCTION DEPLOYMENT** while the production and operational gates listed
above remain pending. No tag, release, or deploy was created.
