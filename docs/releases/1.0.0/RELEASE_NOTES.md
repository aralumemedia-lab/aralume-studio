# Aralume Studio V1.0.0 — Release Notes

Status: **NOT READY FOR PRODUCTION DEPLOYMENT**

This release unit records the formally accepted V1 functional baseline (`d2b53c9e7bfe15c8116c07375ca4b604fce03e97`) and Sprint 23 hardening evidence. No tag, release, or deployment was created by Sprint 23.

## Included baseline

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
