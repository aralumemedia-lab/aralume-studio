# Aralume Studio 1.0.0 — Open blockers

Candidate: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`

| ID | Severity | Domain | Evidence | Impact | Closure condition |
| --- | --- | --- | --- | --- | --- |
| RLS-01 | BLOCKER | Deployment | No Docker/Compose/deployment manifest, environment target or immutable artifact is present; `DEPLOYMENT_PLAN.md` is a blocked template. | No reproducible or auditable deployment exists. | Define target, artifact digest, topology, execution sequence, smoke and abort criteria; validate in a representative disposable environment. |
| RLS-02 | BLOCKER | Governance | GitHub: `statusCheckRollup=[]`; no `.github/workflows`; main API reports unprotected; rulesets and CODEOWNERS absent. | No independent hosted enforcement of required release gates. | Establish hosted CI and branch/review protection under a separately approved governance unit. |
| RLS-03 | BLOCKER | Production configuration | Configuration code is fail-closed, but no target secret manager/reference, storage/database endpoint, access policy or owner is defined. | Production startup, authentication and persistence cannot be demonstrated safely. | Supply non-secret configuration references and validate the target through an approved operational procedure. |
| RLS-04 | BLOCKER | Traceability / recovery | `DEPLOYMENT_PLAN.md` and `ROLLBACK_PLAN.md` remain historical `BLOCKED/UNVALIDATED` templates despite later Sprint 27/28 evidence. | Operators lack one coherent executable source of truth. | Reconcile canonical plans without overstating local drills; include target-specific commands and roles. |
| RLS-05 | BLOCKER | Operations | Sprint 28 provides instrumentation but no monitoring system, alerts, retention, access or incident responsibility. | Failures may be undetected or unactionable in production. | Configure and verify collection, dashboards, alert routing and documented ownership. |
| RLS-06 | HIGH | Frontend reliability | Current Sprint 21 and HMAC browser runs emit React hydration-mismatch console errors involving `data-tsd-source` attributes. | SSR/client divergence may create UI inconsistency; production impact is unknown. | Reproduce against production preview, identify root cause and either fix or formally bound it with evidence. |
| RLS-07 | BLOCKER | Candidate verification | Runners 15–20 emitted completion artifacts in a batch whose supervisor timed out before per-run exit codes were recorded. | Full candidate E2E acceptance is not independently evidenced for this gate. | Re-run and retain per-run exit code, logs and artifact references at the candidate HEAD. |

No owner is inferred for these blockers. Their closure requires a separate,
approved remediation/operations unit.
