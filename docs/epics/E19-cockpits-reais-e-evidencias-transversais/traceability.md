# E19 - Traceability

| Technical item | R14 | Historia | Aceite | Tarefa | Contrato | Componente | Endpoint | Teste | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard real | R14-T01 | H19.1 | Dashboard usa dados reais e nao mock api no fluxo principal | Remover mock-api do caminho principal do dashboard | `DashboardSummary`, `WorkflowRun`, cockpit APIs | `/dashboard` | `GET /api/dashboard/summary`, `GET /api/workflows` | `dashboard route tests to be added`, `src/services/api-client.ts` import guard, browser E2E | `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`, screenshots, replay evidence |
| Escritorio de Agentes real | R14-T02 | H19.2 | Agent-office usa dados reais e nao mock api no fluxo principal | Remover mock-api do caminho principal do agent-office | `AgentOfficeSnapshot`, workflow and handoff APIs | `/agent-office` | `GET /api/agent-office/snapshot`, `GET /api/workflows` | `agent-office route tests to be added`, `src/services/api-client.ts` import guard, browser E2E | `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`, screenshots, replay evidence |
| Evidencia transversal | R14-REACCEPT | final gate | Bundle de evidencia reutilizavel para o reaccept | Construir sweep de browser, screenshots e dados reproduziveis | reusable evidence bundle | browser sweep | n/a | reusable browser E2E, screenshot matrix, data bootstrap checks | `docs/acceptance/v1/V1_EVIDENCE_INDEX.md`, `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md` |

## Dependency note

- E19 only starts after E16, E17 and E18 because the cockpit evidence needs the product surfaces already stabilized.
