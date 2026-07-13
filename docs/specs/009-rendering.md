# Spec 009 - Rendering

## Status
Planejada.

## Objetivo
Definir a base de renderizacao controlada da Aralume Studio.

## Pre-condicoes
- Media asset registry implementado.
- Storage root validado.
- Custos e modo operacional definidos.
- Pipeline editorial definido.
- Aprovacao e conformidade definidas.

## Escopo
- `RenderJob`.
- Fila simples local ou simulacao controlada.
- Validacao de inputs.
- Status de renderizacao.
- Logs de renderizacao.
- Documentacao.
- Render demo apenas se explicitamente aprovado.

## Fora de escopo
- Renderizacao em producao sem gates.
- Arquivos fora do storage root.
- Upload externo.
- Publicacao.
- IA real sem spec.
- FFmpeg sem validacao de paths e inputs.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/008-media-assets-storage.md`

## Entidade minima
### RenderJob
- `id`
- `channelId`
- `inputAssetIds`
- `outputAssetId`
- `status`
- `renderProfile`
- `errorMessage`
- `startedAt`
- `completedAt`
- `createdAt`

## Regras obrigatorias
- Todo render job deve ter `channelId`.
- Todo input deve ser asset registrado.
- Todo output deve ser asset registrado.
- Path deve estar dentro do storage root.
- Falhas devem ser registradas.
- Renderizacao cara deve respeitar modo operacional e custos.

## Endpoints esperados
- `GET /api/renders`
- `GET /api/renders/:renderJobId`
- `POST /api/renders`
- `POST /api/renders/:renderJobId/cancel`

## Validacoes
- Validar lista de inputs.
- Validar asset de saida.
- Rejeitar path inseguro.
- Registrar erro de render.

## Critérios de aceite
- `RenderJob` definido.
- Validacao de inputs existe.
- Paths seguros.
- Sem publicacao.
- Sem chamada externa indevida.
- Documentacao atualizada.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 10 - Assisted Publication.
