# Spec 008 - Media Assets and Storage Registry

## Status
Planejada.

## Objetivo
Definir o registro de ativos de midia da Aralume Studio: narracoes, imagens, videos, arquivos derivados e metadados.

## Contexto
Antes de renderizacao real, a plataforma precisa controlar onde os arquivos vivem, a qual canal pertencem e qual e sua origem.

## Pre-condicoes
- Canais implementados.
- Pipeline editorial definido.
- Custos e modo operacional definidos.
- Politica de storage documentada.

## Escopo
- `MediaAssetBase`.
- `NarrationAsset`.
- `VisualAsset`.
- `VideoAsset`.
- `DerivedClip`.
- Registry de storage.
- Validacao de paths.
- Metadados.
- Endpoints de leitura.
- Documentacao.

## Fora de escopo
- Midia real com IA.
- Renderizacao real.
- Publicacao.
- Upload para storage externo sem spec.
- Aceitar path fora do storage root.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/007-costs-operational-modes.md`

## Entidades minimas
### MediaAssetBase
- `id`
- `channelId`
- `type`
- `status`
- `storagePath`
- `mimeType`
- `sizeBytes`
- `source`
- `createdAt`

### NarrationAsset
- `id`
- `mediaAssetId`
- `voice`
- `durationSeconds`

### VisualAsset
- `id`
- `mediaAssetId`
- `width`
- `height`
- `prompt`

### VideoAsset
- `id`
- `mediaAssetId`
- `durationSeconds`
- `width`
- `height`

### DerivedClip
- `id`
- `channelId`
- `sourceVideoAssetId`
- `startSeconds`
- `endSeconds`
- `status`

## Regras obrigatorias
- Todo asset operacional deve ter `channelId`.
- Todo arquivo deve ficar dentro de `storageRoot` controlado.
- Paths externos nao devem ser processados.
- Origem do asset deve ser registrada.
- Assets derivados devem preservar relacao com asset original.

## Endpoints esperados
- `GET /api/media-assets`
- `GET /api/media-assets/:mediaAssetId`
- `GET /api/videos`
- `GET /api/clips`

## Validacoes
- Registrar asset.
- Validar `storagePath`.
- Rejeitar path externo.
- Ler relacao entre origem e derivado.

## Critrios de aceite
- Registry definido.
- Validacao de storage root existe.
- Nenhum arquivo fora do storage root e aceito.
- Sem geracao real de midia.
- Documentacao atualizada.
- Validacoes passam.

## Proxima sprint recomendada
Sprint 9 - Rendering.

