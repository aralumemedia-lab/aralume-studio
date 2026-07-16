# E19 - Acceptance

## Positive scenarios

- Open `/dashboard` and see real operational data for the active channel.
- Open `/agent-office` and see real workflow and handoff data for the active channel.
- Rerun the browser sweep with the same bootstrap data.
- Rerun the screenshot matrix at the required viewports.
- Filter each cockpit by channel and keep the records isolated.

## Negative scenarios

- Missing required fields return a validation error.
- Cross-channel references are rejected.
- Unknown IDs return not found.
- Transport and timeout failures are recoverable.

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

- The UI must show the cockpit data with the active channel context.
- The UI must show the reusable evidence bundle is ready for replay.

## Persistence

- Reloading the browser must keep the created records visible as long as the backend process remains alive.
- The acceptance does not require a new database or restart durability.

## Audit

- Any cockpit mutation must leave a queryable audit record.
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
- Audit log output when applicable.
- Reusable replay evidence for R14-REACCEPT.

## Epic gate

READY FOR SPRINT PLANNING only when:

1. The three stories are individually accepted.
2. Dashboard and agent-office no longer mask the main flow behind mocks.
3. The reusable evidence harness exists for the final reaccept.
4. The cockpit surfaces are persisted and queryable for the same channel.
5. The traceability matrix covers each technical item and dependency.
