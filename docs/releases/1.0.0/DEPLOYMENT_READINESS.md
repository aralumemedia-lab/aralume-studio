# Aralume Studio 1.0.0 — Deployment readiness

Status: **FAIL — no deployment is authorised**

## Evidence available

The candidate builds locally and exposes local liveness/readiness contracts.
Sprint 27 documents a disposable filesystem recovery drill and Sprint 28
documents a simulated production smoke flow. Neither is a deployment to a
defined environment.

## Missing mandatory inputs

- Named staging and production targets, DNS and TLS termination owner.
- Immutable artifact/image identifier and verified digest.
- Deployment manifest or equivalent executable topology.
- Approved secret-manager references and least-privilege storage/database
  permissions.
- Migration/state-init procedure for the target.
- Explicit change owner, deployment owner, pause criteria and observation
  window.
- Post-deploy smoke command set, alert access and acceptance record.

`DEPLOYMENT_PLAN.md` remains a historical template headed `BLOCKED — DO NOT
DEPLOY`; it cannot be executed as a release runbook in its current form.

## Required closure evidence

A separate operational unit must define the target and artifact flow, validate
it in a disposable representative environment, and record the exact commands,
responsible role, smoke checks and abort criteria. This assessment does not
perform any of those actions.
