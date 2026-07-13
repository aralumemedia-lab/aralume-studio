# Spec 010 - Assisted Publication

## Status
Planejada.

## Objetivo
Definir publicacao assistida em plataformas externas, comecando por YouTube quando aprovado.

## Contexto
Publicacao real deve ser sempre controlada por OAuth autorizado, aprovacao humana, conformidade e logs de auditoria.

## Pre-condicoes
- Canais implementados.
- Video/renderizacao disponivel.
- Aprovacao humana implementada.
- Compliance implementado.
- Env seguro documentado.
- OAuth explicitamente aprovado.

## Escopo
- `PublicationTarget`.
- `PublicationJob`.
- Status de publicacao.
- Preparacao de payload.
- Agendamento assistido.
- Documentacao.
- OAuth apenas se houver spec especifica e aprovacao.

## Fora de escopo
- Publicacao automatica sem aprovacao.
- Credenciais reais sem autorizacao.
- Automacao de browser para publicacao.
- Armazenamento inseguro de refresh token.
- Publicacao de conteudo bloqueado.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/008-media-assets-storage.md`
- `docs/specs/009-rendering.md`

## Entidades minimas
### PublicationTarget
- `id`
- `channelId`
- `platform`
- `status`
- `displayName`
- `createdAt`
- `updatedAt`

### PublicationJob
- `id`
- `channelId`
- `targetId`
- `videoAssetId`
- `status`
- `scheduledAt`
- `publishedAt`
- `errorMessage`
- `createdAt`

## Regras obrigatorias
- Publicacao depende de aprovacao humana.
- Publicacao depende de compliance aprovado.
- Token expirado bloqueia publicacao.
- Falhas devem ser auditaveis.
- Nenhum segredo deve ser exposto.

## Endpoints esperados
- `GET /api/publication-targets`
- `POST /api/publication-targets`
- `GET /api/publications`
- `POST /api/publications`
- `POST /api/publications/:publicationJobId/reschedule`

## Validacoes
- Preparar payload.
- Bloquear sem aprovacao.
- Bloquear sem compliance.
- Bloquear sem credencial valida.

## Critérios de aceite
- Entidades definidas.
- Fluxo assistido documentado.
- Sem publicacao real se nao aprovada.
- Nenhum segredo exposto.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 11 - Metrics and Editorial Learning.
