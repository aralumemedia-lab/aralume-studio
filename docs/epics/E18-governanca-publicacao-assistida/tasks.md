# E18 - Tasks

## Sequenciamento

- Sprint 19 implementada nesta branch: contratos, frontend, backend, auditoria, testes e evidencias de H18.1-H18.3; PR/revisao pendentes.
- Sprint 20 proposta: contratos, frontend, backend, auditoria, testes e evidencias de H18.4.
- Tarefas de H18.1-H18.3 executadas na branch; H18.4 permanece nao iniciada.

## Contracts

- Reconcile governance and publication payloads with the current `src/contracts/types.ts` models.
- Keep the API envelope and error codes unchanged.
- Confirm the publication readiness contract before any implementation branch.
- Keep `src/services/api-client.ts` limited to real services for the epic surfaces.
- Confirm the separation between readiness/draft package and external provider actions; do not include YouTube OAuth, connection or upload.

## Frontend

- Implement the quality, compliance and approval actions on the governance surfaces.
- Sprint 20: implement the publication readiness and draft-package actions on `/publications`.
- Remove mock-only primary actions from the epic flow.
- Keep loading, empty, error and success states explicit.

## Backend

- Keep channel validation and cross-channel conflict rejection explicit.
- Keep approval history and publication readiness rules explicit.
- Keep the current repository abstraction stable for the epic.
- Propagate the HTTP requestId from routes through services into every governance/publication audit mutation.

## Persistence

- Verify that the governance and publication repositories survive browser reloads inside the same process.
- Preserve decision history and readiness states across reloads.
- Do not add a database or migration layer in this epic.

## Audit

- Record quality/compliance/approval/publication events with requestId, channelId, entityType, entityId, actor and action.

## Tests

- Server HTTP tests for H18.1-H18.3 were extended in Sprint 19; H18.4 remains planned for Sprint 20.
- Add or extend frontend route tests for loading, empty, error, conflict and success states.
- Browser E2E coverage for Sprint 19 covers create, decision, reload, isolation, invalid payload and requestId audit scenarios via `scripts/sprint19-browser-e2e.mjs`.
- Add screenshot coverage at all required viewports.

## Accessibility

- Ensure keyboard focus reaches every form control and primary action.
- Ensure table rows and detail panels remain readable with long values.
- Ensure the governance surfaces can be operated without pointer-only assumptions.

## QA visual

- Capture 1366x768, 1600x900, 1792x1024 and 1920x1080.
- Test sidebar expanded and collapsed.
- Test full lists, long text, empty states and invalid forms.
- Confirm no horizontal overflow.

## Documentation

- Update `docs/PRODUCT_BACKLOG.md`.
- Update `docs/NEXT_SPRINTS.md`.
- Update `docs/CODEX_HANDOFF.md`.
- Keep the epic docs in sync with the backlog and handoff.

## Security

- Do not add secrets.
- Do not edit `.env.local`.
- Do not add external integrations.
- Do not widen the scope to dashboard, agent office, media, render, clips, metrics or costs.
