# Spec 007 - Costs and Operational Modes

## Status
Planejada.

## Objetivo
Definir controle de custos, orcamento, limites e modos operacionais da Aralume Studio.

## Contexto
A plataforma deve operar com limites de custo e impedir acoes caras sem configuracao explicita.

## Pre-condicoes
- Canais implementados.
- Handoff e pipeline basicos definidos.
- Variaveis de ambiente documentadas.
- Nenhuma IA real ativada sem controle de custos.

## Escopo
- `CostEntry`.
- `OperationalModePolicy`.
- Budget por canal.
- Status de custo.
- Limites operacionais.
- Documentacao.
- Endpoints de leitura.
- Simulacoes sem custo real.

## Fora de escopo
- Cobranca de usuarios.
- Gateway de pagamento.
- APIs pagas reais.
- IA real.
- Renderizacao de video real.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/003-channels.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/006-approvals-compliance.md`

## Entidades minimas
### CostEntry
- `id`
- `channelId`
- `provider`
- `operationType`
- `amount`
- `currency`
- `status`
- `createdAt`

### OperationalModePolicy
- `id`
- `channelId`
- `mode`
- `dailyBudget`
- `monthlyBudget`
- `allowPaidProviders`
- `requiresHumanApprovalAbove`
- `createdAt`
- `updatedAt`

## Modos operacionais sugeridos
- `manual`
- `assisted`
- `controlled_auto`
- `blocked`

## Regras obrigatorias
- Operacoes pagas futuras devem registrar custo.
- Operacoes acima de limite devem exigir aprovacao.
- Sem politica operacional, provedores pagos devem ficar bloqueados.
- Custos devem ser vinculados a `channelId`.

## Endpoints esperados
- `GET /api/costs`
- `GET /api/costs/:costEntryId`
- `GET /api/operational-modes`
- `PATCH /api/operational-modes/:policyId`

## Validacoes
- Registrar custo simulado.
- Ler politica operacional.
- Bloquear operacao fora da politica.
- Verificar limites diarios e mensais.

## Critérios de aceite
- Modelos definidos.
- Estados coerentes.
- Nenhum custo real gerado.
- Nenhuma API paga chamada.
- Documentacao atualizada.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 8 - Media Assets and Storage Registry.
