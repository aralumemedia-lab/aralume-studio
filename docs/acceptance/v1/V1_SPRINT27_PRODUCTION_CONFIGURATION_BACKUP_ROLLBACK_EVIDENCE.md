# V1.0.0 — Sprint 27 production configuration, backup/restore and rollback evidence

Status: **READY FOR REVIEW; RELEASE NOT_READY**

Date: 2026-07-21
Base: `c734d8f0d1f68c20cc254d2e58833c90a1c9a751`
Branch: `codex/sprint-27-production-configuration-backup-rollback`

This document records the operational Sprint 27 unit. It does not authorize a
tag, release, deployment, or a later integral release-readiness assessment.
The final documentary HEAD is recorded externally in the PR review record so
this versioned document does not need to self-reference its own commit SHA.

## Normative decision

The preflight reviewed `AGENTS.md`, the SDD process, `PROJECT_MASTER`, roadmap,
backlog, handoff, the current release-readiness documents, environment policy,
backend setup, and the existing runtime/runtime-storage code paths. Sprint 27 /
Spec 028 was registered before implementation:

- Spec: [`028-sprint-27-production-configuration-backup-rollback.md`](../../specs/028-sprint-27-production-configuration-backup-rollback.md)
- Backlog: `docs/PRODUCT_BACKLOG.md`
- Release notes and checklist: `docs/releases/1.0.0/RELEASE_NOTES.md` and `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`

## Functional code head validated

The implementation commit that introduced the fail-closed production
configuration, backup/restore/rollback helpers, tests, and the operational
evidence script is `874c86e` and serves as the functional code head for this
unit. That code head was validated before the follow-up documentation
publication.

## Preflight

| Check | Result |
| --- | --- |
| Git root | `C:/Users/carol/Documents/aralume-studio V2/aralume-studio` |
| Initial branch / base | `codex/sprint-27-production-configuration-backup-rollback` from `c734d8f0d1f68c20cc254d2e58833c90a1c9a751` |
| Initial main / origin/main | aligned before implementation |
| Initial working tree | clean before implementation |
| Initial related PRs | none before branch creation |
| Port check | `3001`, `4173`, and `8080` were free before and after the runner execution |
| Process check | no project orphan processes before or after execution |

## Production configuration

The runtime now treats staging and production as fail-closed environments.
Validation occurs before listeners open. The applied policy is:

- `ARALUME_AUTH_SIGNING_SECRET` is required in staging and production;
- `ARALUME_ASSET_STORAGE_ROOT` is required in staging and production and must be absolute;
- `ARALUME_AUTH_TEST_BYPASS`, `ARALUME_E2E_*`, and `TEST_DATABASE_URL` are rejected in production-like environments;
- malformed `DATABASE_URL` or `ARALUME_YOUTUBE_REDIRECT_URI` values fail fast when supplied;
- safe defaults remain available in development and test.

The tracked environment template now contains placeholders only.

## Secret inventory

| Name | Purpose | Consumer | Environment | Format / validation | Rotation / revocation |
| --- | --- | --- | --- | --- | --- |
| `ARALUME_AUTH_SIGNING_SECRET` | Auth signature key | Backend auth middleware | staging / production | string, minimum 32 chars, no fallback in production-like envs | replace on compromise; revoke by redeploy with a new value |
| `ARALUME_PUBLICATION_TOKEN_SECRET` | Publication token sealing | YouTube/publication flow | current runtime / future integrations | string, validated only when used | replace on compromise; revoke by redeploy |
| `ARALUME_YOUTUBE_CLIENT_SECRET` | OAuth client secret | YouTube integration | current runtime / future integrations | string | rotate via provider and redeploy |
| `DATABASE_URL` | Backend database connection | Backend config layer | current and future runtime | valid URL when supplied | rotate with database credentials |
| `TEST_DATABASE_URL` | Test-only database connection | Test tooling | test only | valid URL when supplied; rejected in production-like envs | disposable |
| `ARALUME_AUTH_TEST_BYPASS` | Local test auth bypass flag | Test bootstrap only | test only | `"true"` / `"false"`; rejected in production-like envs | not a secret; remove after test use |

## Backup, restore and rollback

The runtime state surface is the current filesystem persistence layout:

- JSON state under `.aralume-state/`;
- media/storage artifacts under the configured asset storage root.

The recovery helper snapshots the storage root into a timestamped directory,
stores a manifest with schema, checksum, file count, and per-file hashes, and
restores only after manifest verification.

### Real execution script

`scripts/sprint27-backup-restore.mjs` was executed against isolated temp
directories to produce operational evidence. The script:

1. created representative JSON state and media files;
2. created a backup snapshot;
3. verified the manifest checksum;
4. rejected restore into a dirty target;
5. restored into a clean target;
6. performed rollback by replacing the modified target with the verified snapshot.

Observed summary:

| Field | Result |
| --- | --- |
| Schema | `aralume.recovery.v1` |
| Snapshot file count | `3` |
| Total bytes | `222` |
| Checksum | `77d8a9d1b146f6f1b28a75440ad00463ad7cc64a09007303e32f5ec972dd9b7d` |
| Execution duration | `55 ms` |
| Restore target | clean restore succeeded after rejecting the dirty target |
| Rollback target | modified target returned to the verified snapshot content |

## Test evidence

| Command | Result |
| --- | --- |
| `node --import tsx --test server/test/env.test.ts server/test/recovery.test.ts` | PASS, 6/6 |
| `npm test` | PASS, 96/96 |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `bun install --frozen-lockfile` | PASS, no changes |
| `bun audit` | PASS, zero vulnerabilities |
| runners 15–21 and HMAC | PASS |
| secret scan of changed non-doc diff | PASS, zero real secret patterns found |
| `git diff --check` | PASS |
| ports 3001, 4173, 8080 | free after execution |
| project orphan processes | none after execution |

## Negative cases validated

- missing production-like secret or storage root rejects startup before listeners open;
- relative storage root is rejected;
- production-like test-only controls are rejected;
- invalid URL-like configuration is rejected when supplied;
- dirty restore target is rejected;
- tampered snapshot checksum is rejected;
- nested backup roots are rejected.

## Residual risk

This unit proves the fail-closed configuration, backup, restore, and rollback
paths for the current filesystem-backed runtime. It does not authorize release
or deployment. Release 1.0.0 remains **NOT_READY** while later operational and
governance units remain pending.
