# Aralume Studio V1.0.0 — Open Blockers

## Current state

No material blockers are open for the candidate `a6faad3bd7d4e188e57071ac3a58b3375f282e3b`.
The historically open items are preserved below as closed records.

## Verified closed items

| ID | Severity | Domain | Closure | Evidence | Candidate / PR | Current state | Residual risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RLS-01 | BLOCKER | deployment / artifact | reproducible artifact, staging topology, smoke, and rollback evidence recorded | `docs/releases/1.0.0/DEPLOYMENT_PLAN.md`, `docs/releases/1.0.0/DEPLOYMENT_READINESS.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | promotion still requires the later independent `READY_FOR_RELEASE` review |
| RLS-02 | BLOCKER | governance / CI | hosted workflows and owner controls are present and enforced | `.github/workflows/*`, `.github/CODEOWNERS`, remote snapshots, `docs/releases/1.0.0/GOVERNANCE_REMOTE_READINESS.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | single-maintainer governance remains an organizational constraint |
| RLS-03 | BLOCKER | configuration / secrets | production-like configuration inventory and fail-closed startup evidence are explicit | `.env.example`, `server/src/env.ts`, `docs/releases/1.0.0/DEPLOYMENT_READINESS.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | none material for current gate closure |
| RLS-04 | BLOCKER | operations / runbooks | runbooks map to real commands and real exit conditions | `docs/runbooks/*`, `docs/releases/1.0.0/ROLLBACK_READINESS.md`, `npm run recovery:validate` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | operational drift still needs future monitoring |
| RLS-05 | BLOCKER | observability / ownership | dashboards, alerts, and owner mapping versioned and linked | `observability/*`, `docs/releases/1.0.0/OBSERVABILITY_READINESS.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | ownership remains organizational |
| RLS-06 | HIGH | frontend / hydration | hydration triage was reproduced, removed, and regression covered | `npm run release:browser`, browser acceptance logs, `docs/releases/1.0.0/FINAL_READINESS_REMEDIATION.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | non-blocking TanStack Router warnings remain non-material |
| RLS-07 | BLOCKER | evidence / reacceptance | browser and runner evidence consolidated into one reproducible matrix | `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`, `docs/releases/1.0.0/RELEASE_GATE_CLOSURE.md` | `a6faad3bd7d4e188e57071ac3a58b3375f282e3b` | VERIFIED_CLOSED | evidence is candidate-specific and externally referenced |

## Historical blocker snapshot

The original blocker definitions are preserved below for chronology. They are
not the active gate state.

## RLS-01

- Severity: BLOCKER
- Domain: deployment / artifact
- Description: a reproducible artifact and staging topology are not yet documented in a reviewable form.
- Closure condition: buildable artifact, smoke evidence, and rollback simulation recorded.

## RLS-02

- Severity: BLOCKER
- Domain: governance / CI
- Description: hosted workflows and owner controls must be present and enforced.
- Closure condition: workflow files, CODEOWNERS, and branch-control configuration exist.

## RLS-03

- Severity: BLOCKER
- Domain: configuration / secrets
- Description: production-like configuration inventory and fail-closed startup evidence must be explicit.
- Closure condition: env matrix, example template, and startup validation are coherent.

## RLS-04

- Severity: BLOCKER
- Domain: operations / runbooks
- Description: runbooks must map to real commands and real exit conditions.
- Closure condition: deployment, rollback, configuration, and monitoring procedures are executable.

## RLS-05

- Severity: BLOCKER
- Domain: observability / ownership
- Description: dashboards, alerts, and owners must be versioned and testable.
- Closure condition: monitoring surfaces exist and are linked to owners or documented dependencies.

## RLS-06

- Severity: HIGH
- Domain: frontend / hydration
- Description: hydration triage remains a separate risk until explicitly classified.
- Closure condition: a dedicated triage or fix unit reproduces and classifies the issue.

## RLS-07

- Severity: BLOCKER
- Domain: evidence / reacceptance
- Description: browser and runner evidence must be consolidated into one reproducible matrix.
- Closure condition: a single report records the required commands, exit codes, and artifacts.
