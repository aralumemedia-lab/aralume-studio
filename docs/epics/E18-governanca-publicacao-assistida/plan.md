# E18 - Plan

## Decomposicao proposta

O E18 sera executado em duas fatias verticais; a Sprint 19 foi implementada nesta branch e a Sprint 20 permanece proposta:

| Fatia | Historias | Criterios | Dependencia | Gate |
| --- | --- | --- | --- | --- |
| Sprint 19 - Governanca e gates | H18.1, H18.2, H18.3 | V1-11..V1-13 | E17 integrado em main | implementada nesta branch; qualidade, compliance e decisao humana reais pelo frontend, com reload, isolamento, auditoria e E2E |
| Sprint 20 - Publicacao assistida | H18.4 | V1-14 | Sprint 19 aceita | readiness ou pacote de publicacao consultavel, sem auto-send, com reload, isolamento, auditoria e E2E |

Sprint 19 e a primeira sprint recomendada e esta implementada nesta branch, pendente de revisao/merge. Concluir uma sprint nao conclui automaticamente o E18.

## Frontend

- `/approvals`
  - Sprint 19: wire quality review, compliance review, approval creation and human decision states.
  - Keep blocked and history states channel-scoped.
- `/compliance`
  - Sprint 19: wire compliance review and blocked-state handling.
  - Keep detail and error states channel-scoped.
- `/publications`
  - Sprint 20: wire publication target and readiness or draft-package handling.
  - Keep draft, blocked and ready states explicit.
  - Exclude YouTube OAuth, connection, upload and any external send.
- Shell navigation
  - Preserve channel context and navigation between governance artifacts.

## Backend

- Keep the current governance and publication module shape.
- Add audit hooks for mutating governance actions; Sprint 19 now correlates governance mutations with the originating requestId.
- Keep blocked-state semantics explicit in tests.
- Keep the current repository abstraction stable for the epic.

## Contracts

- `src/contracts/types.ts`
- `src/contracts/api-contracts.ts`
- `src/services/api-client.ts`
- `src/services/approvals-api.ts`
- `src/services/quality-api.ts`
- `src/services/compliance-api.ts`
- `src/services/publications-api.ts`
- `src/services/http-client.ts`
- `server/src/modules/governance/governance.routes.ts`
- `server/src/modules/governance/governance.service.ts`
- `server/src/modules/publications/publications.routes.ts`
- `server/src/modules/publications/publications.service.ts`

## Persistence

- Use the existing repository abstraction for the governance and publication domains.
- Require browser reload persistence as the acceptance bar.
- Do not introduce a database or migration system in this epic.

## Audit

- Record quality, compliance, approval and publication events with channelId, actor, requestId and entity metadata.
- Make audit entries queryable in the same platform audit surface used by the repo.
- Propagate the requestId from the HTTP route into the service and audit repository; current response envelopes do not prove this by themselves.

## Error handling

- Use the shared API envelope and sanitized error codes.
- Keep 400, 404 and 409 cases explicit.
- Keep transport failures recoverable in the UI.

## Tests

- Server unit and HTTP tests for governance and publication flows.
- Service tests for the frontend API clients.
- Route tests for `/approvals`, `/compliance` and `/publications`.
- Browser E2E for create, reload, isolation, loading, empty, error and success states.
- Sprint 19 E2E must cover blocked quality/compliance and approval history; Sprint 20 E2E must cover readiness, no-auto-send and publication package reload.
- Screenshot QA at all required viewports.

## Accessibility

- Keyboard navigation for all input, table and detail interactions.
- Visible focus states for forms and actions.
- No overflow or truncation that blocks reading the selected artifact.

## QA visual

- 1366x768
- 1600x900
- 1792x1024
- 1920x1080
- Sidebar expanded
- Sidebar collapsed
- Full lists
- Long text values
- Empty states
- Error states
- Invalid forms
- Keyboard focus
- No horizontal overflow

## Risks

- Governance actions can still look real while some flows rely on read-only surfaces.
- Publication readiness can regress into a read-only summary if mutating actions are not tested.
- The repository is process-local, so restart durability is not part of this epic.
- H18.4 still requires requestId propagation validation; Sprint 19 closes the gap for governance mutations.
- Combining all four stories in one sprint would couple independent gates and make the publication E2E depend on unproven upstream decisions.

## Rollback

- Revert the documentation and any future feature branch that introduces the epic.
- No database migration rollback is needed because this epic does not introduce one.

## ADRs

- No new ADR is required to plan the epic if the existing route and contract topology is reused.
- If the publication or approval route topology changes, capture it before implementation.
- If H18.4 needs a new route to separate readiness from external publication, record that decision before implementation; do not broaden the route into OAuth or upload.
