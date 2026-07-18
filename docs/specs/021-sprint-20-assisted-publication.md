# Sprint Spec 021 - Sprint 20: Assisted Publication

## Identification

- Sprint: Sprint 20 (proposed)
- Epic: E18 - Governanca e Publicacao Assistida pelo Frontend
- Story: H18.4
- Criterion: V1-14
- R14: R14-14
- Status: proposed / not started
- Upstream: Sprint 19 governance gates integrated in `main`

## Decision

H18.4 remains a single V1 traceability story but is delivered as an independent vertical slice because readiness and publication packages depend on the completed quality, compliance and approval gates.

## Objective

Make publication readiness and assisted package preparation operational through `/publications` without sending content to an external platform.

## Included

- Create or update a channel-scoped publication target when the current contract requires it.
- Resolve source video or derived clip from the active channel.
- Evaluate readiness from target, source, quality, compliance and human approval state.
- Show ready, warning and blocked states with actionable reasons.
- Prepare a publication draft or package through the real API.
- Query the resulting job after reload.
- Preserve channel isolation, audit correlation and traceability to the source artifact.

## Out of scope

- YouTube OAuth, connection, channel selection or upload.
- External publication or automatic send.
- New integrations, credentials, release, tag, deploy, database or migrations.
- E19 and R14-REACCEPT.

## Main flow

1. Select channel A.
2. Select an approved, compliant rendered video or derived clip.
3. Select or create the channel-scoped publication target.
4. Inspect readiness and blocking reasons.
5. Prepare a publication package through the real API.
6. Confirm the package and job state in the frontend.
7. Reload and confirm persistence and source linkage.
8. Inspect audit entries correlated to the mutation request.
9. Select channel B and confirm isolation.
10. Attempt a blocked, invalid or cross-channel preparation and confirm sanitized feedback.

## Contracts and endpoints

- `PublicationTarget`, `GET/POST /api/publication-targets`.
- `PublicationJob`, `GET/POST /api/publications`.
- Existing readiness and source-linkage contracts.
- Shared API envelopes and sanitized error helpers.

## Acceptance gate

- A valid package is prepared from an approved and compliant channel-scoped source.
- Missing approval, blocked compliance, blocked readiness and invalid source states prevent preparation.
- The package/job and source linkage remain queryable after reload in the same process.
- Cross-channel target, source and job access is rejected by the backend and hidden by the frontend.
- Audit records include `requestId`, `channelId`, actor, action, entity and status.
- No external upload request is made by the assisted publication flow.
- Browser E2E and required screenshots prove ready, blocked, error, reload and isolation states.

## Definition of Ready

- Sprint 19 governance gates are integrated and their states are queryable.
- The no-auto-send rule is explicit in the UI, contract and E2E.
- Source video, clip, target and approval fixtures are defined for both channels.
- External YouTube mutations are excluded from the test runner and acceptance flow.

## Definition of Done

- H18.4 passes on the same head with backend, frontend and browser evidence.
- Publication readiness and package preparation are real API mutations.
- Reload, isolation, audit and no-auto-send evidence is reusable for V1-14.
- E18 may be marked complete only after this gate and Sprint 19 are integrated.
