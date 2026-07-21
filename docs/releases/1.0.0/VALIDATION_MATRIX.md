# Aralume Studio 1.0.0 — Validation matrix

Candidate: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`  
Assessment date: 2026-07-21

| Gate | Criterion / command | Result | Evidence / limitation |
| --- | --- | --- | --- |
| Repository | `git diff --check` | PASS | Exit 0 before documentation branch creation. |
| Install | `bun install --frozen-lockfile` | PASS | Bun 1.3.14; no changes. |
| Lint | `npm run lint` | PASS | Exit 0. |
| Backend types | `npm run backend:check` | PASS | Exit 0. |
| Global types | `npx tsc --noEmit` | PASS | Exit 0, zero diagnostics. |
| Tests | `npm test` | PASS | 102/102. |
| Build | `npm run build` | PASS | Exit 0. |
| Dependency audit | `bun audit` | PASS | Exit 0, zero vulnerabilities. |
| npm audit | `npm audit --omit=dev` | NOT_AVAILABLE | Exit 1 `ENOLOCK`; this repository deliberately has no `package-lock.json` and uses `bun.lock`. |
| Focused security/operations | env, recovery, observability, HTTP and auth tests | PASS | `node --import tsx --test ...`: 29/29. |
| Lifecycle | `node --test scripts/e2e-process-utils.test.mjs` | PASS | 20/20. |
| HMAC runner | `node scripts/sprint24-security-hmac-e2e.mjs` | PASS | Exit 0; unauthorized/cross-channel/role checks rejected. |
| Browser runner 21 | `node scripts/sprint21-browser-e2e.mjs` | PASS_WITH_WARNING | Exit 0; emitted React hydration-mismatch console errors. |
| Browser runners 15–20 | batch execution in this assessment | NOT_VERIFIED | Completion artifacts were emitted, but the supervising batch timed out before recording each final exit code. Do not infer PASS. |
| Recovery drill | `node --import tsx scripts/sprint27-backup-restore.mjs` | PASS | Verified backup, clean restore and rollback in isolated temp paths. |
| Secret scan | bounded high-confidence assignment scan excluding local/generated paths | PASS | No match. This is not a replacement for hosted secret scanning. |
| Ports/processes | 3001, 4173, 8080; project process query | PASS | No listener or project orphan after runs. |
| Functional acceptance | R14 V1-01..V1-18 | HISTORICAL_PASS | 18/18 at `d2b53c9`; requires consolidated candidate reaccept before `READY`. |
| Auth / channel isolation | signed bearer, role and channel scope | LOCAL_PASS / PROD_NOT_VERIFIED | Current auth tests pass; production secret/configuration and operator identity are not available. |
| Backup / restore | filesystem-backed recovery | LOCAL_PASS / PROD_NOT_VERIFIED | No production storage target or retention location. |
| Observability | instrumented health/logs/metrics/shutdown | LOCAL_PASS / PROD_NOT_VERIFIED | No dashboard, alerting, retention, access or owner evidence. |
| Deployment | target, artifact, ordered plan and smoke | FAIL | Target and immutable artifact are undefined; plan is not executable. |
| Remote governance | workflows, protection, rulesets, CODEOWNERS | FAIL | No workflows; main is unprotected; no rulesets or CODEOWNERS. |
| Documentation | release/deployment/rollback coherence | FAIL | Current plans retain stale Sprint 23 blockers and `UNVALIDATED` rollback status. |
