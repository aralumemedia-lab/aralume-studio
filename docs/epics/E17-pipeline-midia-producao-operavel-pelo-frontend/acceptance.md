# E17 - Acceptance

## Positive scenarios

- Create or update a narration asset from the media surface and see it again after reload.
- Register a visual asset with provenance and integrity data.
- Filter the surface by channel and keep the records isolated.

## Negative scenarios

- Missing required fields return a validation error.
- Invalid provenance or storage metadata is rejected.
- Cross-channel references are rejected.
- Unknown IDs return not found.

## Channel isolation

- A record created in one channel is not visible in another channel filter.
- A cross-channel mutation fails and does not create a partial record.
- Reload preserves the active channel-scoped view.

## Loading

- The surface must show a loading state before its data arrives.
- A retry path must be available when the API is unavailable.

## Empty

- The surface must explain what is missing and what the operator should do next.

## Error

- The UI must show sanitized backend errors.
- Transport, timeout and envelope errors must be recoverable.

## Success

- The UI must show the created or updated artifact.

## Persistence

- Reloading the browser must keep the created records visible as long as the backend process remains alive.
- The acceptance does not require a new database or restart durability.

## Audit

- Every mutating media action must leave a queryable audit record.
- The audit record must include channelId, entity type, entity ID and request metadata.

## Accessibility

- Keyboard navigation works on all inputs, selects, buttons and detail surfaces.
- Focus is visible.
- Long values do not block the operator from reading the selected artifact.

## Responsiveness

- The flow must remain usable at 1366x768, 1600x900, 1792x1024 and 1920x1080.
- Sidebar expanded and collapsed states must not create overflow.
- Long names, full lists and detail panes must remain readable.

## Evidence

- Browser screenshots at `screenshots/sprint-17/` for all required viewports.
- Reproducible flow: `node scripts/sprint17-browser-e2e.mjs`.
- Route-level and API client test output from `npm test`.
- Server persistence, audit and isolation coverage in `server/test/media-assets.test.ts`.
- Reload and channel-isolation proof in the browser runner.

## Sprint 17 gate

READY FOR PR REVIEW only when:

1. The two stories are individually accepted.
2. The frontend no longer masks the primary media actions behind mocks.
3. The backend returns persisted and queryable artifacts for the same channel.
4. Audit evidence is present for the mutating actions.
5. The traceability matrix covers each criterion and dependency.

Historical Sprint 17 result: satisfied for H17.1 and H17.2; H17.3 and H17.4 were pending at that head and are covered by the Sprint 18 gate below.

## Sprint 18 acceptance

- `/videos` creates a real controlled render from channel-scoped source assets and exposes the persisted job/output state.
- `/clips` creates a real derived clip from a completed channel-scoped video and preserves interval/provenance linkage.
- Invalid, duplicate, out-of-duration, cross-channel, timeout, process-failure and policy-blocked paths are sanitized and tested.
- Reload preserves the job, video and clip while the backend process remains alive.
- Render and clip mutation audits include the originating HTTP `requestId`.
- Browser evidence covers 1366x768, 1600x900, 1792x1024 and 1920x1080, sidebar states, loading, success, error, conflict, reload and isolation.
- E17 is complete on the Sprint 18 head after all Sprint 18 criteria were proven; V1.0 remains `NAO ACEITA`.

## Sprint 18 gate result

- H17.3: passed through `/videos` with real render, output, reload, conflict, audit correlation and channel isolation.
- H17.4: passed through `/clips` with real clip, interval validation, conflict, reload, file output, audit correlation and channel isolation.
- `node scripts/sprint18-browser-e2e.mjs`: passed with controlled temporary storage/policy fixtures and no orphaned processes.
- Formal V1 Acceptance was not executed; the new evidence is staged for the future reaccept gate.
