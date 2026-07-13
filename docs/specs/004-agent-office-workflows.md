# Spec 004 - Agent Office and Workflow Runs

## Status
Planejada.

## Objetivo
Definir e implementar a base operacional do Escritorio de Agentes e dos workflow runs.

## Contexto
O Escritorio de Agentes deve representar estado operacional real dos agentes, handoffs, etapas de workflow, bloqueios e aprovacoes pendentes. Nao e apenas uma tela decorativa.

## Pre-condicoes
- Backend foundation concluido.
- Dominio de canais disponivel.
- `channelId` definido como regra operacional.
- Frontend `/agent-office` estabilizado.
- Contratos existentes revisados.

## Escopo
- `AgentDefinition`.
- `WorkflowRun`.
- `WorkflowStep`.
- `AgentRun`.
- `AgentHandoff`.
- Estados operacionais.
- Endpoints de leitura.
- Mocks persistiveis ou persistencia real se banco disponivel.
- Documentacao.

## Fora de escopo
- Agentes de IA reais.
- Chamadas LLM.
- Automacao real.
- Renderizacao de video.
- Publicacao.
- Filas distribuidas complexas sem spec.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/002-backend-foundation.md`
- `docs/specs/003-channels.md`

## Entidades minimas
### AgentDefinition
- `id`
- `channelId`
- `name`
- `role`
- `status`
- `description`
- `createdAt`
- `updatedAt`

### WorkflowRun
- `id`
- `channelId`
- `type`
- `status`
- `currentStep`
- `startedAt`
- `completedAt`
- `blockedReason`

### WorkflowStep
- `id`
- `workflowRunId`
- `agentId`
- `name`
- `status`
- `startedAt`
- `completedAt`

### AgentHandoff
- `id`
- `workflowRunId`
- `fromAgentId`
- `toAgentId`
- `status`
- `payloadSummary`
- `createdAt`

## Regras obrigatorias
- Todo workflow operacional deve ter `channelId`.
- Estados devem respeitar contratos existentes.
- Handoff deve ser auditavel.
- Bloqueios devem ser explicitos.
- Aprovacao humana futura deve ser conectavel.

## Endpoints esperados
- `GET /api/agent-office/summary`
- `GET /api/agents`
- `GET /api/workflows`
- `GET /api/workflows/:workflowRunId`
- `GET /api/workflows/:workflowRunId/steps`

## Validacoes
- Listar estado do escritorio.
- Ler workflow run por id.
- Validar transicoes de estado.
- Garantir que bloqueios aparecam de forma explicita.

## Critrios de aceite
- Entidades ou contratos definidos.
- Endpoints minimos de leitura criados.
- Estados coerentes com frontend.
- Sem IA real.
- Sem automacao externa.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 5 - Editorial Pipeline.

