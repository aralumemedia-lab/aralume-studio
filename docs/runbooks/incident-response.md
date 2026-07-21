# Runbook — Incident Response

## Purpose

Preserve evidence, withdraw readiness, and recover without exposing secrets.

## Steps

1. Capture the failing request IDs, timestamps, and service logs.
2. Verify readiness has withdrawn.
3. Stop the disposable deployment or staging stack.
4. Re-run the smoke checks against the recovered stack.
5. Escalate unresolved issues to the release blocker inventory.

## Safety constraints

- do not paste secrets into tickets or logs
- do not treat a 200 response as sufficient if readiness / health are degraded
