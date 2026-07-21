# Aralume Studio V1.0.0 — Operational Readiness Remediation

This document records the release-level remediation unit that follows Sprint 28.
It is not a new sprint and it does not authorize release, tag, or deploy.

## Purpose

Close the release-readiness blockers captured in PR #45 by adding repository-local
governance, deployment, configuration, operational, monitoring, and evidence
artifacts that can be verified independently later.

## Blockers in scope

- RLS-01 deployment artifact, staging topology, smoke, rollback
- RLS-02 hosted CI, CODEOWNERS, and branch-control requirements
- RLS-03 production-like configuration and secret inventory
- RLS-04 executable runbooks
- RLS-05 monitoring, dashboards, alerting, and ownership
- RLS-07 consolidated browser / runner evidence

## Residual risk

- RLS-06 hydration triage remains a separate risk until a dedicated unit classifies
  it or a follow-up fix proves it non-blocking.

## Evidence expected

- workflow files under `.github/workflows`
- `CODEOWNERS`
- deployment / rollback readiness docs
- runbooks for configuration, deployment, rollback, monitoring, and incident response
- versioned monitoring surfaces
- release validation matrix and blocker inventory

## Release decision

The release remains `NOT_READY` until this remediation is validated and a later
independent release-readiness review confirms the full gate set.
