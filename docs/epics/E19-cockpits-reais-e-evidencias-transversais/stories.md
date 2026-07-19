# E19 - Stories

## H19.1 - Dashboard real

- Sprint: Sprint 21
- Status: implemented on branch; pending review and merge

- Actor: operator
- Objective: open `/dashboard` and see real channel-scoped operational data instead of mock-api output.
- Technical item: R14-T01
- Dependencies: E18; dashboard summary, costs, audit and workflow data contracts
- Priority: P0
- Acceptance criteria:
  - The dashboard uses real API data in the main flow.
  - The dashboard keeps loading, empty, error and success states.
  - The dashboard stays channel-scoped.
  - The main flow no longer depends on mock-api for dashboard data.
  - The surface is covered by browser and screenshot evidence.
- Tests:
  - Dashboard route tests to be added or extended.
  - Service tests for the dashboard API client to be added or extended.
  - Browser E2E on the required viewports.
- Evidence:
  - Dashboard screenshot at the required viewports.
  - Evidence that the main flow no longer imports mock-api.
  - Reload proof for the same channel.
- DoR:
  - The cockpit data contracts are mapped.
  - The evidence harness requirement is explicit.
- DoD:
  - The dashboard persists through reload.
  - The channel isolation and evidence are visible.

## H19.2 - Escritorio de agentes real

- Sprint: Sprint 21
- Status: implemented on branch; pending review and merge

- Actor: operator
- Objective: open `/agent-office` and see real workflow, handoff and queue data instead of mock-api output.
- Technical item: R14-T02
- Dependencies: H19.1; workflow, handoff and agent snapshot contracts
- Priority: P0
- Acceptance criteria:
  - The agent-office uses real API data in the main flow.
  - The agent-office keeps loading, empty, error and success states.
  - The agent-office stays channel-scoped.
  - The main flow no longer depends on mock-api for agent-office data.
  - The surface is covered by browser and screenshot evidence.
- Tests:
  - Agent-office route tests to be added or extended.
  - Service tests for the agent-office API client to be added or extended.
  - Browser E2E on the required viewports.
- Evidence:
  - Agent-office screenshot at the required viewports.
  - Evidence that the main flow no longer imports mock-api.
  - Reload proof for the same channel.
- DoR:
  - The cockpit data contracts are mapped.
  - The evidence harness requirement is explicit.
- DoD:
  - The agent-office persists through reload.
  - The channel isolation and evidence are visible.

## H19.3 - Evidencia transversal para o reaccept

- Sprint: Sprint 21
- Status: implemented on branch; pending review and merge

- Actor: product owner tecnico / revisor tecnico
- Objective: reuse the same browser sweep, screenshots and data bootstrap for the final V1 reaccept.
- Technical item: supports R14-REACCEPT
- Dependencies: H19.1; H19.2; browser E2E harness; reproducible test data
- Priority: P0
- Acceptance criteria:
  - The browser sweep can be rerun with reproducible data.
  - The screenshot matrix covers the required viewports and sidebar states.
  - The evidence bundle can be reused for the final acceptance review.
  - The harness keeps loading, empty, error and success states explicit.
- Tests:
  - Browser E2E and screenshot sweep.
  - Reproducible data bootstrap checks.
  - Final acceptance evidence replay.
- Evidence:
  - Reusable screenshot bundle.
  - Reusable route sweep evidence.
  - Stable data bootstrap for the final gate.
- DoR:
  - The required viewports and states are explicit.
  - The replay rules are explicit.
- DoD:
  - The evidence bundle is reusable for R14-REACCEPT.
  - The same sweep can be replayed on the same head.
