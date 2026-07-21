# Aralume Studio V1.0.0 - Final Release Readiness Review

Status: NOT READY

## Candidate evaluated

- Commit: `d6bac872f5bcc99b3cba38ce925832007474fa12`
- Base: `main`
- PR history: PR #47 merged

## Executive summary

The candidate is technically strong and the hosted checks passed, but the
release is still not ready for production promotion.

The evaluation found three material blockers:

1. the rollback runbook documents a command that does not execute as written;
2. the browser acceptance preview emits reproducible hydration mismatch errors;
3. the governance readiness documentation is still inconsistent with the live
   branch protection state.

The deployment / rollback documentation also still marks the release as not
ready, which is consistent with the blockers above and with the final verdict.

## Preflight

| Check | Result |
| --- | --- |
| Git root | repository root confirmed |
| Branch | `codex/release-1.0.0-final-readiness-review` |
| HEAD | `d6bac872f5bcc99b3cba38ce925832007474fa12` |
| `main` | aligned with `origin/main` |
| Divergence | `0/0` |
| Working tree before this review | clean |
| PRs related to release | PR #45 remains historical and draft; PR #47 is merged |
| Branch protection | required checks `gates`, `security`, `smoke` active |
| Ruleset | `main-governance` active |
| Production environment | present and protected |

## Gate matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Functional regression suite | PASS | `npm test` = 102/102 |
| Build | PASS | `npm run build` |
| TypeScript | PASS | `npx tsc --noEmit`, `npm run backend:check` |
| Lint | PASS | `npm run lint` |
| Frozen install | PASS | `bun install --frozen-lockfile` |
| Dependency audit | PASS | `bun audit` reported no vulnerabilities |
| Secret scan | PASS | `npm run secret:scan` reported zero real hits |
| Smoke | PASS | `npm run release:smoke` |
| Browser acceptance | PASS with material console errors | `npm run release:browser` |
| Runners 15-21 and HMAC | PASS | official runner scripts exited 0 |
| Recovery helper | PASS via `node --import tsx` / FAIL as documented | documented command `node scripts/sprint27-backup-restore.mjs` fails with `ERR_MODULE_NOT_FOUND` |
| Ports | PASS | `3001`, `4173`, `8080` free after execution |
| Orphan processes | PASS | project-related preview / build children cleared |
| Deploy readiness | NOT READY | deployment plan and rollback plan remain blocked / unvalidated |

## Findings

### F-01 - Rollback helper command is not executable as documented

- Severity: HIGH
- Domain: operations / recovery
- Evidence:
  - `docs/runbooks/rollback.md:22` documents `node scripts/sprint27-backup-restore.mjs`
  - direct execution of that command fails with `ERR_MODULE_NOT_FOUND`
  - the helper only succeeds when executed as `node --import tsx scripts/sprint27-backup-restore.mjs`
- Impact: the documented rollback / recovery path is not executable as written
- Closure condition: the runbook and evidence must converge on a command that works in the documented execution mode

### F-02 - Browser acceptance reports reproducible hydration mismatch errors

- Severity: BLOCKER
- Domain: frontend / release readiness
- Evidence:
  - `npm run release:browser`
  - console errors show hydration mismatches in the clean preview
  - source references observed in the logs:
    - `src/routes/__root.tsx:115-123`
    - `src/routes/channels.tsx:148-160`
- Impact: the release browser acceptance path still emits material console errors in preview, which is not acceptable for production readiness
- Closure condition: reproduce in clean preview, identify the concrete cause, and eliminate the hydration mismatch

### F-03 - Governance readiness documentation is stale relative to live branch protection

- Severity: MEDIUM
- Domain: governance / documentation
- Evidence:
  - `docs/releases/1.0.0/GOVERNANCE_REMOTE_READINESS.md:31-33` still states one required review and required code owner review
  - live GitHub branch protection for `main` has zero required approvals and no required code owner review
- Impact: the release documentation does not match the executable governance state
- Closure condition: refresh the governance readiness documentation so it matches the live repository controls

## Residual risks

- single-maintainer concentration remains an organizational risk
- release / deploy promotion is still blocked by unresolved readiness gaps
- operational documentation must be reconciled with the executable commands

## Go / No-Go

No-go. The candidate is not ready for release promotion.

## Evidence summary

- hosted checks: `gates`, `security`, `smoke` all passed on PR #47
- release smoke: passed
- browser acceptance: passed with material hydration mismatch warnings/errors
- recovery helper: operationally valid when invoked with `tsx`, but the documented command is incorrect
- deployment readiness docs: still blocked / not ready

## Recommendation

Perform a focused remediation for the recovery helper command, the hydration
mismatch, and the governance documentation mismatch, then rerun this final
readiness review on the new candidate.

