# E18 - Acceptance

## Positive scenarios

- Review a quality result and see it again after reload.
- Review a compliance result and see it again after reload.
- Make or inspect an approval decision and see the history again after reload.
- Prepare a publication draft or readiness package and see it again after reload.
- Filter each surface by channel and keep the records isolated.

## Negative scenarios

- Missing required fields return a validation error.
- Invalid decisions or blocked-state transitions are rejected.
- Cross-channel references are rejected.
- Duplicate decisions or publication targets are rejected.
- Unknown IDs return not found.

## Channel isolation

- A record created in one channel is not visible in another channel filter.
- A cross-channel mutation fails and does not create a partial record.
- Reload preserves the active channel-scoped view.

## Loading

- Each surface must show a loading state before its data arrives.
- A retry path must be available when the API is unavailable.

## Empty

- Each surface must explain what is missing and what the operator should do next.

## Error

- The UI must show sanitized backend errors.
- Transport, timeout and envelope errors must be recoverable.

## Success

- The UI must show the created or updated artifact.
- The UI must show the current decision or readiness state.

## Persistence

- Reloading the browser must keep the created records visible as long as the backend process remains alive.
- The acceptance does not require a new database or restart durability.

## Audit

- Every mutating governance action must leave a queryable audit record.
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

- Browser screenshots for the required viewports.
- Route-level test output.
- Server test output.
- Audit log output.
- Reload proof in the browser.

## Epic gate

READY FOR SPRINT PLANNING only when:

1. The four stories are individually accepted.
2. The frontend no longer masks the primary governance actions behind mocks.
3. The backend returns persisted and queryable artifacts for the same channel.
4. Audit evidence is present for the mutating actions.
5. The publication readiness flow is explicit and proven.
6. The traceability matrix covers each criterion and dependency.
