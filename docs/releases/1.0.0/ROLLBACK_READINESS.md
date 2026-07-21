# Aralume Studio 1.0.0 — Rollback readiness

Status: **FAIL for production deployment**

## What is proven

`node --import tsx scripts/sprint27-backup-restore.mjs` passed in an isolated
temporary filesystem. It creates and verifies an `aralume.recovery.v1`
snapshot, rejects a dirty restore target, restores cleanly and rolls a modified
target back to the verified snapshot. Focused recovery tests also pass.

## What is not proven

- A previous production artifact/image and its digest.
- A target backup location, retention, encryption and access policy.
- Database/storage rollback in a real target topology.
- A migration rollback/forward-only decision for the actual target.
- Recovery objectives, named operational owner, communications or a live smoke
  procedure after rollback.

`ROLLBACK_PLAN.md` still declares `UNVALIDATED — RELEASE BLOCKER`, while later
Sprint 27 evidence proves a limited filesystem drill. This is a material
documentation conflict, not an implicit clearance.

## Required closure evidence

Reconcile the canonical rollback plan with the Sprint 27 scope, identify the
actual target and prior artifact, then conduct a disposable target drill:
candidate deployment → smoke → rollback → prior-version smoke. No real rollback
is performed by this assessment.
