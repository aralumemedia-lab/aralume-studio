# Aralume Studio V1.0.0 — Open Blockers

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
