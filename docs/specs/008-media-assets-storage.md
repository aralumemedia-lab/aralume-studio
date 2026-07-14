# Spec 008 - Media Assets and Storage Registry

## Status

Approved for implementation.

## Purpose

Provide the safe registry, storage rules, and operational UI needed to track media assets used by Aralume Studio before any real rendering pipeline exists.

## Product Problem

The platform already produces content, scripts, plans, approvals, and costs, but it still lacks a governed registry for media assets. Without it, teams cannot reliably answer:

- which assets exist for a channel;
- where an asset is stored;
- whether the asset belongs to the current channel;
- whether the asset is usable;
- whether its origin, provenance, checksum, and license are known;
- whether a path is safe and inside the authorized storage root.

This sprint closes that gap without generating media, rendering media, or integrating external providers.

## Scope

This sprint includes:

- media asset registry;
- storage root governance;
- internal URI model;
- safe relative path handling;
- integrity metadata;
- origin and provenance metadata;
- license and usage metadata;
- channel isolation;
- links to content and workflow artifacts when present;
- read and validation endpoints;
- frontend service integration;
- media assets screens and supporting route views;
- tests, documentation, and visual QA.

## Out of Scope

This sprint does not include:

- real image, audio, or video generation;
- real TTS;
- real rendering;
- FFmpeg;
- publishing;
- downloads from external providers;
- uploads to external object storage;
- OAuth;
- transcoding;
- editing tools;
- advanced media player features;
- Sprint 9 rendering jobs.

## Source Docs

The following documents are the sources of truth for this sprint:

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/007-costs-operational-modes.md`
- `docs/specs/008-media-assets-storage.md`

If the roadmap or handoff diverge from the summary of this sprint, the current repository docs prevail.

## Domain Contracts

Reuse the existing domain naming wherever possible. Do not duplicate concepts that already exist under another approved name.

### MediaAssetBase

Base registry entry for any operational media asset.

Required fields for operational assets:

- `id`
- `channelId`
- `type`
- `category`
- `name`
- `description`
- `mimeType`
- `extension`
- `sizeBytes`
- `checksum`
- `internalUri`
- `storagePath`
- `origin`
- `provenance`
- `licenseStatus`
- `licenseName` or equivalent approved license field when known
- `status`
- `riskLevel`
- `costActualCents`
- `createdAt`
- `updatedAt`

Optional fields when applicable:

- `contentId`
- `workflowRunId`
- `scriptId`
- `scenePlanId`
- `stepId`
- `providerName`
- `modelName`
- `prompt`
- `thumbnailUri`
- `technicalMetadata`
- `usageSummary`
- `sourceAssetId`
- `notes`

### MediaAsset Types

The registry may classify assets using approved categories such as:

- narration;
- audio;
- image;
- video;
- intermediate video;
- thumbnail;
- soundtrack;
- sound effect;
- subtitle;
- caption;
- auxiliary media file;
- brand asset;
- other approved type from the spec.

### Related Assets

Specialized views may reuse the existing concepts:

- `NarrationAsset`;
- `VisualAsset`;
- `VideoAsset`;
- `DerivedClip`.

Do not create duplicate types if the current contracts already cover the same concept.

### Origin and Provenance

Each asset must record:

- whether it was created internally;
- whether it was generated;
- whether it was uploaded by an operator;
- whether it was provided by a channel;
- whether it is licensed;
- whether it is public domain;
- whether it came from an external source approved by policy;
- whether the origin is unknown;
- whether the origin is prohibited or not authorized.

Assets with insufficient origin or provenance data cannot be marked usable.

### License

Each asset must record one of the following approved states:

- license known;
- license not applicable;
- license pending;
- right of use confirmed;
- right of use unconfirmed;
- restricted;
- attribution required.

The registry must also preserve source and evidence when known.

### Status

Operational statuses must cover the lifecycle required by this sprint:

- `available`;
- `pending`;
- `blocked`;
- `invalid`;
- `corrupted`;
- `missing`;
- `replaced`;
- `archived`.

The exact enum may be narrower if the repository already has an approved shared status type, but the behavior above must be representable.

### Risk

Media assets use the existing `RiskLevel` contract.

### Cost

Media-related costs must remain integer cents and use the `*Cents` naming convention used by Sprint 7.

## Storage Root

The storage adapter must operate only within an authorized root.

### Configuration

- Use a dedicated storage root configuration value if one already exists in the environment pattern.
- If a new env var is required, prefer a single explicit variable such as `ARALUME_ASSET_STORAGE_ROOT`.
- The default for local development must be safe and deterministic.
- The storage root must never be exposed as a public contract field.

### Organization

Paths must be organized by:

- channel;
- asset type or category;
- asset id or another stable approved identifier.

### Path Rules

The adapter must:

- use relative paths in public contracts;
- normalize paths before resolution;
- reject any path that escapes the root;
- reject empty or ambiguous segments;
- reject absolute paths from the client;
- reject drive-prefixed paths;
- reject UNC paths;
- reject traversal segments such as `..`;
- reject separators or encodings that attempt to escape the root;
- reject any symlink, junction, or special path resolution that leaves the root when the runtime can resolve it safely;
- handle missing files explicitly;
- handle missing directories explicitly;
- define temporary file behavior if temporary files are used at all;
- define cleanup behavior for temp artifacts if they are created.

### Rejection Behavior

Paths outside the root must fail validation in the backend or domain layer, not only in the frontend.

## Internal URI

The registry must distinguish internal URIs from public URLs.

### Format

The internal URI must be a stable, private identifier resolved by the backend. A recommended format is:

- `aralume://media-assets/<channelId>/<assetId>`

The exact format may differ if the repository already uses a valid internal pattern, but it must be documented and deterministic.

### Rules

- Only the backend/domain may produce or resolve internal URIs.
- Internal URIs must resolve only within the asset's own channel.
- A URI from another channel must not resolve.
- Invalid URIs must be rejected with a deterministic error.
- External URLs must not be accepted as internal URIs.

### Difference from External URL

- `internalUri` is private, backend-resolved, and channel-scoped.
- An external URL, if ever stored, is a separate non-authoritative reference and must not be confused with the registry URI.

## Integrity

Every operational asset must record integrity metadata.

### Checksum

- Use `sha256` unless the repository already has a stronger approved checksum contract.
- Compute the checksum when the asset is registered or when the stored file is validated.
- Store the checksum as a stable lowercase hex string.

### Integrity Rules

- If checksum mismatches the stored file, the asset must not be marked usable.
- If file size mismatches, the asset must not be marked usable.
- Missing files must be reported explicitly.
- Corrupted files must be reported explicitly.
- Replaced assets must keep auditability and provenance.
- Revalidation must be possible.
- Duplicate detection may use checksum only within the same channel and only under the approved access policy.

## Channel Isolation

Every operation on a media asset must require explicit `channelId`.

The implementation must ensure that:

- one channel cannot list another channel's assets;
- one channel cannot read another channel's asset;
- one channel cannot update another channel's asset;
- one channel cannot bind another channel's asset to content;
- one channel cannot resolve another channel's internal URI;
- one channel cannot use checksum discovery to infer another channel's asset.

Cross-channel access must fail deterministically and must be audited.

## Content and Workflow Links

The registry may link assets to:

- content;
- workflow runs;
- scripts;
- visual plans;
- scene plans;
- workflow steps;
- derived clips when the existing contract already models them.

Links must remain optional where the asset lifecycle does not require them.

## Audit

The domain must emit auditable events for:

- asset registration;
- asset validation;
- metadata update;
- status change;
- content binding;
- path rejection;
- origin rejection;
- license rejection;
- checksum mismatch;
- cross-channel access attempt;
- mark usable;
- mark blocked;
- mark corrupted;
- mark missing;
- mark replaced.

Audit payloads must not include binary content or secrets.

## API

The backend should expose read and validation endpoints consistent with the existing server patterns.

Expected capabilities include:

- list media assets by channel;
- get one asset by channel and asset id;
- create or register an asset record when supported by the repository architecture;
- update permitted metadata only;
- validate storage reference;
- validate integrity;
- link asset to content or workflow when supported;
- list usages for an asset;
- read video and clip views using the same channel-safe model.

The exact path names must follow the repository's existing HTTP conventions.

### HTTP Rules

- `400` for invalid input;
- `403` when policy blocks a permitted-authenticated request;
- `404` for missing or inaccessible-by-channel resources;
- `409` for domain conflicts such as checksum or state conflicts;
- no stack traces in API responses;
- no physical path leakage in payloads;
- deterministic response envelopes.

## Frontend

The existing `/media-assets` screen must consume the real API created by this sprint.

The view should show, at minimum:

- type;
- name;
- origin;
- license;
- internal URI in safe form;
- MIME type;
- size;
- checksum summary;
- status;
- risk;
- cost;
- linked content;
- linked workflow or step;
- provider;
- model;
- prompt summary or safe reference when applicable;
- created at;
- updated at.

The screen must support:

- channel filter;
- type filter;
- status filter;
- risk filter;
- search;
- selection;
- detail panel;
- empty state;
- loading state;
- error state;
- blocked asset state;
- pending license state;
- invalid integrity state;
- unknown origin state.

The existing Lovable frontend patterns must be preserved.

## Tests

Required test coverage includes:

- backend domain and HTTP tests for channel isolation;
- backend tests for path traversal rejection;
- backend tests for root escape rejection;
- backend tests for checksum and size validation;
- backend tests for origin and license rejection;
- frontend service tests;
- route integration tests for the media assets screen;
- visual QA for the changed screens.

## Acceptance Criteria

The sprint is accepted only when all of the following are demonstrated:

- every operational asset has an identified origin;
- every operational asset has a valid internal URI;
- every operational asset has a `channelId`;
- a channel cannot automatically reuse or inspect another channel's assets;
- files or paths outside the authorized storage root are rejected;
- path traversal attempts are rejected;
- integrity metadata is recorded;
- origin, provenance, and license are traceable;
- unauthorized or invalid assets cannot be marked usable;
- frontend and backend contracts are compatible;
- the media assets screen consumes the real sprint backend;
- build, typecheck, lint, and tests pass;
- visual QA for the changed screens is approved.

## Definition of Done

The sprint is done when:

- the spec is implemented in code;
- the contract docs are updated only where needed;
- tests are green;
- visual QA evidence is captured;
- a commit exists with the sprint changes;
- the branch is pushed;
- a pull request is open and ready for review;
- the sprint is not merged.

## Non-Goals

Do not add:

- new rendering engine logic;
- real media generation logic;
- external provider integrations;
- external storage uploads;
- object storage migration;
- secret-bearing asset metadata;
- binary fixtures in Git unless already required by an approved repository pattern.
