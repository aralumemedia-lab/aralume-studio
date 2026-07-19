# Aralume Studio V1.0.0 — Deployment Plan

Decision gate: **BLOCKED — DO NOT DEPLOY**

This plan is a release-unit template and operational checklist. It was not executed in Sprint 23.

## Required pre-deployment conditions

1. Implement and test authenticated ingress plus API-side authorization derived from the authenticated principal; derive active channel scope server-side.
2. Define one production topology, bind policy, TLS/edge ownership, health/readiness contract, and operator access procedure.
3. Define and validate production environment names, secret-manager references, storage permissions, YouTube redirect/credentials, and token-encryption key rotation.
4. Produce a tested backup and restore record covering JSON state, media assets, audit records, and provider state references.
5. Produce a rollback record with the exact artifact, state-restoration point, owner, timeout, and abort criteria.
6. Close or explicitly risk-accept all deferred security worklist rows and resolve dependency advisories.

## Execution sequence after approval

- Freeze the approved commit and record its full SHA.
- Verify a clean checkout and reproducible build artifact digest.
- Create the production storage root with least-privilege permissions.
- Inject secrets from the approved secret manager; never place values in the repository or logs.
- Run migrations or state initialization in a backup-protected maintenance window.
- Start the backend behind the authenticated edge; verify readiness, metrics, logs, and alerts.
- Run the smoke checklist and critical V1 flows without publishing externally.
- Obtain explicit release approval, then enable external publication under the approved change window.

No step above authorizes a deployment during Sprint 23.
