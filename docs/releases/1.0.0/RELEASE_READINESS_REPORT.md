# Aralume Studio 1.0.0 — Integral release-readiness assessment

Date: 2026-07-21

Candidate commit: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`

Assessment status: **NOT_READY**

## Executive decision

The candidate is functionally accepted at the historical R14 gate and the
current local engineering gates pass. It is not authorised for production:
the production target, executable deployment plan, operational ownership and
remote delivery controls have not been demonstrated. Existing release plans
also contain historical statements that conflict with later Sprint 27 and 28
evidence.

No tag, GitHub release, deployment, publication or infrastructure change was
performed by this assessment.

## Baseline

- Git root: `C:/Users/carol/Documents/aralume-studio V2/aralume-studio`
- Candidate and `main` at assessment start: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`
- `main` and `origin/main`: aligned (`0/0`) at assessment start.
- PR #44: merged; merge commit `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`.
- Hosted checks: `statusCheckRollup=[]`; no workflow, branch protection,
  ruleset or CODEOWNERS was found.
- Release/environment target: not defined in repository evidence.

## Evidence and methodology

This is a read-only assessment of the code candidate plus reproducible local
commands. Historical evidence was used only where it identifies its evaluated
commit; it was not treated as proof of a production deployment.

The authoritative command results and gate classification are in
[VALIDATION_MATRIX.md](VALIDATION_MATRIX.md). Scope and component traceability
are in [RELEASE_SCOPE.md](RELEASE_SCOPE.md). Open release blockers are in
[OPEN_BLOCKERS.md](OPEN_BLOCKERS.md).

## Findings summary

- **BLOCKER RLS-01:** no defined production environment, immutable artifact or
  executable deployment sequence.
- **BLOCKER RLS-02:** no hosted CI, required checks, branch protection,
  rulesets or CODEOWNERS.
- **BLOCKER RLS-03:** no demonstrated production secret injection, configured
  storage/database target, or named operational ownership.
- **BLOCKER RLS-04:** deployment and rollback documents conflict materially
  with the later recovery/readiness evidence and remain non-executable.
- **BLOCKER RLS-05:** monitoring, alert routing and incident ownership are not
  configured or evidenced; Sprint 28 supplies instrumentation, not production
  monitoring.
- **HIGH RLS-06:** browser runners emit reproducible React hydration-mismatch
  console errors. They require triage against a production preview before a
  release gate can pass.
- **NOT_VERIFIED RLS-07:** a current-candidate full frontend/browser reaccept
  has no consolidated exit-code evidence for runners 15–20 in this assessment.
  Their batch produced completion artifacts before its supervising shell timed
  out, but that is not recorded as a PASS here.

## Functional and technical result

R14 records 18/18 functional criteria as accepted at
`d2b53c9e7bfe15c8116c07375ca4b604fce03e97`. Current code checks passed:
lint, backend typecheck, global TypeScript, 102 tests, build, frozen Bun
installation and Bun audit. Focused environment, authentication, HTTP,
observability and recovery tests passed (29/29), as did lifecycle tests
(20/20), the HMAC runner, the Sprint 21 browser runner and the isolated
filesystem recovery drill.

These results support code quality; they do not satisfy the missing production
and governance gates above.

## Next objective

Run a remediation unit for the open blockers without publishing the release:
define the target topology and artifact flow, establish hosted CI/protection,
assign operational ownership and alerting, reconcile release runbooks, and
triage the hydration errors. Re-run this assessment only after that evidence is
available.
