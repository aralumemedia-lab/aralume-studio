# Aralume Studio V1.0.0 - Release Gate Closure

## Normative identification

- Unit: Release 1.0.0 release gate closure
- Spec: `docs/specs/033-release-1.0.0-release-gate-closure.md`
- Candidate: `a6faad3bd7d4e188e57071ac3a58b3375f282e3b`
- Governing remote state: branch protection, ruleset, production environment,
  and CODEOWNERS as validated in the governance remediations
- Decision recommendation: `READY_FOR_FINAL_REVIEW`

## Summary

The functional candidate and the full release readiness evidence set are now
aligned. The historical `NOT READY` state is preserved in the prior assessment
artifacts, but the active normative state for this unit is that the release
gate has been closed and is ready for an independent final review.

This document does not approve the release. It records the closure of the
historical blockers, the executable promotion path, and the remaining step:
one later independent review must still emit `READY_FOR_RELEASE` before any tag
or deploy.

## Closed blocker inventory

| ID | Severity | Origin | Closure | Evidence | Candidate / PR | Current state | Residual risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RLS-01 | BLOCKER | deployment / artifact | immutable artifact, staging topology, smoke and rollback evidence recorded | `docs/releases/1.0.0/DEPLOYMENT_PLAN.md`, `docs/releases/1.0.0/DEPLOYMENT_READINESS.md`, release smoke / recovery evidence | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | deploy still requires separate authorization |
| RLS-02 | BLOCKER | governance / CI | hosted workflows, branch protection, ruleset and CODEOWNERS in place | `.github/workflows/*`, `.github/CODEOWNERS`, remote snapshots, `docs/releases/1.0.0/GOVERNANCE_REMOTE_READINESS.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | no broad bypass; single-maintainer model remains a documented constraint |
| RLS-03 | BLOCKER | configuration / secrets | production-like configuration inventory and fail-closed startup documented and validated | `.env.example`, `server/src/env.ts`, `docs/releases/1.0.0/DEPLOYMENT_READINESS.md`, `docs/releases/1.0.0/RELEASE_NOTES.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | promotion still requires formal review of the final candidate |
| RLS-04 | BLOCKER | operations / runbooks | recovery, rollback, deployment, and monitoring commands reconciled to executable scripts | `docs/runbooks/*`, `docs/releases/1.0.0/ROLLBACK_READINESS.md`, `npm run recovery:validate` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | runbooks remain subject to future operational drift control |
| RLS-05 | BLOCKER | observability / ownership | dashboards, alerts, and owner mapping versioned and linked | `observability/*`, `docs/releases/1.0.0/OBSERVABILITY_READINESS.md`, `docs/releases/1.0.0/RELEASE_NOTES.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | ongoing ownership remains organizational, not a code blocker |
| RLS-06 | HIGH | frontend / hydration | hydration mismatch eliminated and regression coverage passes | `npm run release:browser`, browser acceptance logs, final remediation evidence | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | warnings remaining are non-blocking and not hydration mismatches |
| RLS-07 | BLOCKER | evidence / reacceptance | browser and runner evidence consolidated with commands, codes, logs, and cleanup | `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | evidence remains tied to the reviewed candidate only |

## Promotion path

- candidate artifact: `a6faad3bd7d4e188e57071ac3a58b3375f282e3b`
- environment: GitHub `production`
- required checks: `gates`, `security`, `smoke`
- required branch policy: pull request only, conversations resolved, force push
  disabled, deletion disabled, ruleset active, no broad bypass
- rollback path: documented in the release rollback and recovery evidence
- smoke path: documented by the release smoke and browser acceptance evidence
- responsible operator: the single verifiable maintainer in this repository

## Current gate state

The historical blockers are closed, and the release gate is now
`READY_FOR_FINAL_REVIEW`.

The gate is not yet `READY_FOR_RELEASE`; that status is reserved for the later
independent review that must validate this closure unit without self-approval.
