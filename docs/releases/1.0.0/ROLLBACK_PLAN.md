# Aralume Studio V1.0.0 — Rollback Plan

Rollback status: **UNVALIDATED — RELEASE BLOCKER**

## Trigger conditions

- Authentication or channel-isolation regression.
- Corrupted or incomplete state write/restore.
- Publication, render, storage, or readiness failure outside the approved recovery budget.
- Missing or exposed secret, unexpected external publication, or alert indicating data-integrity loss.

## Required procedure

1. Stop new publication and render admission at the edge.
2. Preserve request, audit, metrics, and process evidence.
3. Quiesce the application and confirm no render/upload process remains active.
4. Restore the last verified application artifact and the last verified state/media backup.
5. Run health/readiness, authorization, channel-isolation, storage-integrity, and smoke checks.
6. Reopen traffic only after owner approval and record the rollback report.

The exact artifact digest, backup location, restore command, RTO/RPO, owner, and rollback drill result must be filled before deployment. No rollback drill was executed in Sprint 23.
