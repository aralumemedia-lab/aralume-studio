# Spec 005 - Editorial Pipeline

## Status
Planejada.

## Objetivo
Definir a base do pipeline editorial da Aralume Studio: ideias, producao, pesquisa, evidencias, roteiros e planos visuais.

## Pre-condicoes
- Canais implementados.
- Workflow base definido.
- Contratos frontend existentes.
- SDD ativo.

## Escopo
- `ContentIdea`.
- `ProductionItem`.
- `ResearchSession`.
- `ResearchSource`.
- `ClaimEvidence`.
- `Script`.
- `ScriptVersion`.
- `VisualPlan`.
- `ScenePlan`.
- Endpoints minimos.
- Persistencia se disponivel.
- Validacao.
- Documentacao.

## Fora de escopo
- IA real.
- Pesquisa web real automatica.
- Geracao de roteiro com LLM real.
- Geracao de imagem.
- Geracao de audio.
- Geracao de video.
- Publicacao.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/003-channels.md`
- `docs/specs/004-agent-office-workflows.md`

## Entidades principais
### ContentIdea
- `id`
- `channelId`
- `title`
- `summary`
- `status`
- `priority`
- `createdAt`
- `updatedAt`

### ResearchSession
- `id`
- `channelId`
- `contentIdeaId`
- `status`
- `summary`
- `createdAt`

### ResearchSource
- `id`
- `researchSessionId`
- `url`
- `title`
- `sourceType`
- `credibility`

### ClaimEvidence
- `id`
- `researchSessionId`
- `claim`
- `evidence`
- `sourceId`

### Script
- `id`
- `channelId`
- `contentIdeaId`
- `status`
- `currentVersionId`

### ScriptVersion
- `id`
- `scriptId`
- `version`
- `body`
- `createdAt`

## Regras obrigatorias
- Tudo deve possuir `channelId` quando aplicavel.
- Claims devem poder ser ligados a evidencias.
- Roteiros devem ter versionamento.
- Planos visuais devem ser separados do video renderizado.
- Conteudo nao deve avancar para publicacao sem aprovacao humana futura.

## Endpoints esperados
- `GET /api/ideas`
- `POST /api/ideas`
- `GET /api/research`
- `GET /api/research/:researchSessionId`
- `GET /api/scripts`
- `POST /api/scripts`
- `GET /api/scripts/:scriptId/versions`

## Validacoes
- Criar idea.
- Registrar pesquisa.
- Associar fontes e evidencias.
- Criar script e versoes.
- Verificar coerencia dos status.

## Critrios de aceite
- Entidades principais modeladas.
- Status coerentes.
- Validacao existe.
- Sem IA real.
- Sem chamadas externas.
- Documentacao atualizada.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 6 - Approvals and Compliance.

