# Spec 003 - Channels Domain Foundation

## Status

Concluida no `main` via PR #8 e merge commit `6bf1bfec40cafaa7d2228f040745127e7ede9041`.

## Objetivo

Implementar o primeiro dominio real da Aralume Studio: Canais.

## Contexto

Canais sao a base multicanal da plataforma. Toda operacao editorial, agente, conteudo, custo, publicacao e metricas deve se ligar a um `channelId` quando aplicavel.

## Pre-condicoes

- Backend foundation concluido.
- Ambiente seguro preparado.
- Contratos frontend existentes.
- `docs/FRONTEND_API_CONTRACTS.md` revisado.
- Spec review executado.

## Escopo

- Modelagem de `Channel`.
- Modelagem de configuracoes essenciais.
- Validacao com Zod.
- Endpoints REST ou padrao definido na fundacao.
- Persistencia se banco ja estiver disponivel.
- Mocks substituiveis se persistencia ainda estiver bloqueada.
- Testes minimos.
- Documentacao.

## Fora de escopo

- Producao editorial.
- Agentes reais.
- IA.
- Video.
- Publicacao.
- Metricas reais.
- Billing.
- Autenticacao real, salvo spec aprovada.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/001-environment-safe-migration.md`
- `docs/specs/002-backend-foundation.md`

## Entidade minima

### Channel

- `id`
- `name`
- `slug`
- `status`
- `timezone`
- `language`
- `createdAt`
- `updatedAt`

## Endpoints esperados

- `GET /api/channels`
- `POST /api/channels`
- `GET /api/channels/:id`
- `PATCH /api/channels/:id`
- `GET /api/channels/:id/settings`

## Contratos adotados nesta sprint

### POST /api/channels

- Request body: `name`, `slug`, `status`, `timezone`, `language`.
- Response: `Channel`.

### PATCH /api/channels/:id

- Request body: parcial de `name`, `slug`, `status`, `timezone`, `language`.
- O corpo nao pode ser vazio.
- Campos imutaveis permanecem sob controle do backend.
- Response: `Channel`.

### GET /api/channels/:id/settings

- Response: `ChannelSettings`.
- A leitura de settings usa o contrato ja aprovado no frontend.

## Estrategia de armazenamento

- A Sprint 3 usa um repositório substituível em memória porque a Sprint 2 nao disponibilizou persistencia operacional.
- O repositório deve permanecer encapsulado para troca futura por persistencia real sem alterar os handlers.

## Codigos de erro

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`

## Observacao

- `:id` representa o identificador do canal usado como `channelId` nas entidades operacionais.
- `EditorialRules` permanece como contrato do frontend para evolucoes futuras, mas nao possui endpoint proprio nesta sprint.

## Regras obrigatorias

- `channelId` e obrigatorio nas entidades operacionais futuras.
- Nao misturar politica global com politica por canal.
- Configuracoes de canal devem ser separadas da identidade global da plataforma.
- Nenhum dado operacional futuro deve nascer sem canal quando aplicavel.
- Slug deve ser unico e legivel.

## Validacoes

- Criar e listar canais.
- Buscar canal por id.
- Atualizar canal.
- Validar payloads de entrada.
- Verificar erro de validacao para dados invalidos.

## Critérios de aceite

- Dominio de canais existe.
- Validacao de entrada existe.
- Endpoints basicos existem.
- Contratos documentados.
- Nenhum segredo exposto.
- Frontend continua saudavel.

## Proxima sprint recomendada

Sprint 4 - Channels Frontend Integration. Antes da implementacao, esta sprint deve passar por Spec Review e por uma spec propria.
