# Aralume Studio V1.0.0 — Deployment Readiness

Status: NOT READY

This file records the repository-local deployment readiness state required by
the release-remediation unit.

## Minimum expected controls

- immutable build artifact
- explicit target topology
- startup and shutdown commands
- health / readiness probes
- smoke check
- rollback path
- owner / operator contact

## Current state

The release requires the remediation unit in Spec 030 before the deployment
gate can be considered again.
