# Sprint Spec 022 - Sprint 21: Cockpits Reais e Evidencias Transversais

## Identification

- Sprint: Sprint 21
- Epic: E19 - Cockpits Reais e Evidencias Transversais
- Stories: H19.1, H19.2, H19.3
- Technical items: R14-T01, R14-T02
- Status: completed and integrated by PR #34
- Baseline: `main = origin/main = 2b47cf25e2c74f576ef58bc54620ea645d1c00bf`
- Upstream dependency: E16, E17 and E18 completed in `main`

## Decision

The E19 bundle fits one vertical sprint. Dashboard and agent-office are coupled to the same channel-scoped operational projection, while the evidence harness must exercise both surfaces on the same controlled backend process. The implementation must replace the mock-api main path without changing the official V1 Acceptance matrix or starting `R14-REACCEPT`.

## Objective

Make `/dashboard` and `/agent-office` query real backend endpoints, preserve the existing visual language, and produce reusable browser evidence for the future V1 reaccept.

## Included

- `GET /api/dashboard/summary` with real channel-scoped aggregates from existing repositories.
- `GET /api/agents` with the operational agent catalog used by the real snapshot.
- `GET /api/agent-office/snapshot` with channel-scoped workflows, agent runs and handoff projections derived from persisted production records.
- `GET /api/workflows` with channel-scoped workflow projections.
- Real frontend API clients replacing cockpit imports from `mock-api.ts`.
- Loading, empty, error and success states on both cockpit routes.
- Same-process reload and channel isolation.
- Reproducible browser E2E, screenshots and evidence manifest.

## Out of scope

- New cockpit mutations or external actions.
- New database, migrations, auth, OAuth or integrations.
- Changes to E16, E17 or E18 feature behavior.
- `R14-REACCEPT`, new V1 Acceptance, release, tag or deploy.

## Operational projection rule

The frontend must receive API data only. The backend may project cockpit records from existing persisted repositories, including editorial production items, costs, governance, publications, metrics and audit logs. Static agent definitions are catalog metadata; workflow, agent-run and handoff values must be derived from channel-scoped production records and must not come from frontend mocks.

## Acceptance gate

- Dashboard and agent-office main flows no longer import or call `mock-api.ts`.
- All cockpit responses use the standard API envelopes and include request metadata.
- Invalid or unknown channel queries return sanitized `400` or `404` responses.
- Channel A data is not visible through channel B queries or reloads.
- Both routes expose loading, empty, error and success states.
- The browser runner reproduces the same data bootstrap and screenshot matrix on the same head.
- No cockpit mutation is introduced; therefore no new audit event is required by this sprint.
- E19 is complete in `main`; `R14-REACCEPT` remains downstream and has not started.

## Evidence

- Reproducible runner: `node scripts/sprint21-browser-e2e.mjs`.
- Evidence manifest: `docs/acceptance/v1/V1_SPRINT21_EVIDENCE.md`.
- Screenshots: `screenshots/sprint-21/`.
- The runner is read-only for cockpit APIs; audit evidence is therefore limited to the existing queryable audit surface. No new cockpit mutation is claimed.

## Definition of Ready

- E16, E17 and E18 are integrated in `main`.
- Real repository inputs and projection fields are mapped.
- Endpoint and frontend client contracts are defined.
- Controlled channels and empty/error scenarios are reproducible.
- Required viewport and screenshot names are defined.

## Definition of Done

- H19.1, H19.2 and H19.3 pass on the same head.
- Backend, frontend, browser and visual evidence pass.
- Mock imports are absent from the dashboard and agent-office main paths.
- Reload, isolation and error evidence is reusable for `R14-REACCEPT`.
- E19 is documented as implemented and integrated by PR #34; no V1 reaccept was executed.
