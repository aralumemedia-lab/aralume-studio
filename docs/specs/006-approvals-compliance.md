# Spec 006 - Approvals and Compliance

## Status
Planejada.

## Objetivo
Definir o sistema de aprovacao humana, qualidade e conformidade da Aralume Studio.

## Contexto
Nenhum conteudo deve avancar para publicacao real sem aprovacao humana e checagens minimas de conformidade.

## Pre-condicoes
- Pipeline editorial definido.
- Canais existentes.
- Status globais documentados.
- Frontend `/approvals` e `/compliance` estabilizados.

## Escopo
- `HumanApproval`.
- `QualityCheck`.
- `ComplianceCheck`.
- Estados de aprovacao.
- Endpoints de leitura e decisao.
- Auditoria basica.
- Documentacao.

## Fora de escopo
- Publicacao real.
- Verificacao legal automatica real.
- IA real para compliance, salvo spec futura.
- Moderacao externa real.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/004-agent-office-workflows.md`
- `docs/specs/005-editorial-pipeline.md`

## Entidades minimas
### HumanApproval
- `id`
- `channelId`
- `targetType`
- `targetId`
- `status`
- `requestedBy`
- `reviewedBy`
- `decisionReason`
- `createdAt`
- `reviewedAt`

### QualityCheck
- `id`
- `channelId`
- `targetType`
- `targetId`
- `status`
- `findings`
- `createdAt`

### ComplianceCheck
- `id`
- `channelId`
- `targetType`
- `targetId`
- `status`
- `riskLevel`
- `findings`
- `createdAt`

## Regras obrigatorias
- Aprovacao humana deve ser explicita.
- Rejeicao registra motivo.
- Conteudo bloqueado nao avanca.
- Compliance e qualidade devem ser auditaveis.
- Futuras publicacoes dependem deste gate.

## Endpoints esperados
- `GET /api/approvals`
- `GET /api/approvals/:approvalId`
- `POST /api/approvals/:approvalId/approve`
- `POST /api/approvals/:approvalId/reject`
- `POST /api/approvals/:approvalId/request-changes`
- `GET /api/compliance`
- `GET /api/quality-checks`

## Validacoes
- Ler solicitacoes pendentes.
- Registrar decisao.
- Registrar motivo de rejeicao.
- Bloquear avancos indevidos.

## Critérios de aceite
- Entidades definidas.
- Endpoints minimos existem.
- Estados coerentes com frontend.
- Fluxo de aprovacao documentado.
- Sem publicacao real.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 7 - Costs and Operational Modes.
