# E16 - Acceptance

## Sprint 15 scope

- This acceptance section is read as the first slice of E16.
- H16.0, H16.1 and H16.2 are the included stories for Sprint 15.
- H16.3 and H16.4 remain pending and are not part of this sprint gate.

## Positive scenarios

- Create a content idea from `/ideas` and see it again after reload.
- Configure the channel editorial profile from `/channels` and see it again after reload.
- Create a research session from `/research` and register sources and claims.
- Create a script from `/scripts` and add a second version without losing the first.
- Create a visual plan and order scenes from the editorial flow.
- Filter each surface by channel and keep the records isolated.

## Negative scenarios

- Missing required fields return a validation error.
- Invalid profile values are rejected.
- Invalid URLs in research sources are rejected.
- Cross-channel references are rejected.
- Duplicate script version numbers are rejected.
- Duplicate scene order numbers are rejected.
- Unknown IDs return not found.

## Channel isolation

- A record created in one channel is not visible in another channel filter.
- A profile update in one channel does not alter another channel.
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
- The UI must show the current version for a script.
- The UI must show the ordered scene list for a visual plan.

## Persistence

- Reloading the browser must keep the created records visible as long as the backend process remains alive.
- The acceptance does not require a new database or restart durability.

## Audit

- Every mutating editorial action must leave a queryable audit record.
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
- Current Sprint 15 browser evidence:
  - `screenshots/sprint-15/channels-1366-expanded.png`
  - `screenshots/sprint-15/channels-1366-collapsed.png`
  - `screenshots/sprint-15/ideas-1600-success.png`
  - `screenshots/sprint-15/ideas-1366-invalid.png`
  - `screenshots/sprint-15/research-1792-success.png`
  - `screenshots/sprint-15/research-1920-reload.png`
  - `screenshots/sprint-15/research-1600-empty-channel-b.png`
- Route-level test output.
- Server test output.
- Audit log output.
- Reload proof in the browser.

## Epic gate

READY FOR SPRINT PLANNING only when:

1. The five stories are individually accepted.
2. The frontend no longer masks the primary editorial actions behind mocks.
3. The backend returns persisted and queryable artifacts for the same channel.
4. Audit evidence is present for the mutating actions.
5. The visual-plan placement is explicit and proven.
6. The traceability matrix covers each criterion and dependency.
