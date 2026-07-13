# Spec 005 - Editorial Pipeline

## Status

Planejada.

## Objetivo

Definir a base deterministica do pipeline editorial da Aralume Studio: ideias, producao, pesquisa, fontes, evidencias de claims, roteiros, versoes de roteiro, planos visuais e cenas.

## Contexto

A Sprint 5 fecha a camada editorial que alimenta a operacao multicanal. O objetivo e registrar e consultar os artefatos do pipeline sem IA real, sem pesquisa web automatizada e sem geracao de midia.

O repositorio atual nao possui uma camada de banco ou migrations para este dominio. Portanto, a implementacao desta sprint deve seguir o padrao ja adotado no backend de Canais: repositorios encapsulados, validacao de entrada, endpoints HTTP e testes, com armazenamento deterministico controlado pelo processo.

## Pre-condicoes

- `AGENTS.md` lido.
- `docs/PROJECT_MASTER.md` lido.
- `docs/NEXT_SPRINTS.md` lido.
- `docs/CODEX_HANDOFF.md` lido.
- `docs/FRONTEND_API_CONTRACTS.md` lido.
- `docs/FRONTEND_DESIGN_SYSTEM.md` lido.
- `docs/specs/003-channels.md` concluida no `main`.
- `docs/specs/004-agent-office-workflows.md` definida.
- `main` limpo e alinhado ao `origin/main`.
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
- Endpoints minimos para leitura e mutacao controlada.
- Validacao com Zod.
- Repositorios encapsulados com persistencia deterministica em memoria.
- Documentacao e contratos.
- Testes de dominio, API e persistencia.
- Integracao minima das rotas frontend `/ideas`, `/research`, `/scripts` e `/production`.

## Fora de escopo

- IA real.
- LLM.
- Pesquisa web automatizada.
- Scraping.
- Geracao de imagem.
- Geracao de audio.
- Geracao de video.
- Publicacao.
- Migrations ou schema relacional sem uma fundacao de banco ja aprovada.
- Orquestracao multiagente nova.
- Conformidade completa.
- Aprovação humana completa.
- OAuth.
- Supabase.

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

Obrigatorio:

- `id`
- `channelId`
- `title`
- `summary`
- `status`
- `niche`
- `opportunityScore`
- `riskLevel`
- `source`
- `createdAt`
- `updatedAt`

Regras:

- nao pode existir sem `channelId`;
- deve ser listavel por canal;
- deve aceitar atualizacao apenas de campos permitidos;
- deve rejeitar `channelId` inexistente.

### ProductionItem

Obrigatorio:

- `id`
- `channelId`
- `contentId`
- `title`
- `status`
- `workflowRunId`
- `progressPercent`
- `costActualCents`
- `riskLevel`
- `nextAction`
- `lastActivityAt`

Regras:

- representa o estado operacional do conteudo no pipeline;
- deve permanecer coerente com o canal do conteudo;
- deve ser listavel por canal e por `contentId` quando aplicavel.

### ResearchSession

Obrigatorio:

- `id`
- `channelId`
- `contentId`
- `title`
- `status`
- `sourceCount`
- `claimCount`
- `confidenceScore`
- `riskLevel`
- `summary` quando disponivel
- `createdAt`
- `updatedAt`

Regras:

- deve pertencer a um canal;
- pode ser associada a uma ideia ou item de producao, conforme o contrato interno;
- deve ser listavel por canal e por conteudo.

### ResearchSource

Obrigatorio:

- `id`
- `channelId`
- `researchSessionId`
- `title`
- `url` quando presente
- `publisher` quando presente
- `accessedAt`
- `sourceType`
- `confidenceLevel`
- `freshnessRisk`
- `usageNotes`

Regras:

- deve pertencer a uma sessao valida;
- deve herdar o mesmo `channelId` da sessao;
- URL deve ser validada quando informada;
- nao deve haver coleta automatica de conteudo web.

### ClaimEvidence

Obrigatorio:

- `id`
- `channelId`
- `researchSessionId`
- `sourceId`
- `claim`
- `evidenceSummary`
- `informationType`
- `confidenceLevel`
- `riskLevel`

Regras:

- nao pode existir sem sessao;
- a fonte deve pertencer a mesma sessao e ao mesmo canal;
- o trecho salvo deve ser um resumo estruturado, nao copia integral;
- claims devem ser persistidos separadamente das fontes.

### Script

Obrigatorio:

- `id`
- `channelId`
- `contentId`
- `title`
- `status`
- `currentVersionId`
- `estimatedDurationSeconds`
- `hook`
- `promise`
- `cta`
- `riskLevel`
- `createdAt`
- `updatedAt`

Regras:

- deve ser listavel por canal;
- deve apontar para a versao atual de forma consistente;
- deve aceitar atualizacao controlada de campos permitidos;
- deve permitir criacao de nova versao sem sobrescrever historico.

### ScriptVersion

Obrigatorio:

- `id`
- `channelId`
- `scriptId`
- `versionNumber`
- `title`
- `narrationText`
- `sceneCount`
- `estimatedDurationSeconds`
- `changeSummary`
- `createdAt`

Regras:

- numero de versao deve ser incremental por roteiro;
- versoes anteriores nao podem ser sobrescritas;
- a versao deve pertencer ao mesmo canal do roteiro;
- o roteiro deve permanecer apontando para a versao atual.

### VisualPlan

Obrigatorio:

- `id`
- `channelId`
- `contentId`
- `scriptVersionId`
- `title`
- `status`
- `sceneCount`
- `estimatedDurationSeconds`
- `visualStyle`
- `createdAt`
- `updatedAt`

Regras:

- deve ser associado a um roteiro ou versao aprovada pelo dominio editorial;
- deve ser listavel por canal;
- nao deve gerar imagens.

### ScenePlan

Obrigatorio:

- `id`
- `channelId`
- `visualPlanId`
- `order`
- `title`
- `narrationExcerpt`
- `durationSeconds`
- `visualDescription`
- `assetRequirements`

Regras:

- `order` deve ser unica dentro do plano visual;
- `durationSeconds` deve ser positiva;
- o canal deve ser coerente com o plano visual;
- nao deve criar ativo real.

## Estados e contratos existentes

Os contratos TypeScript atuais ja definem os enums que esta sprint deve reutilizar:

- `ContentStatus`
- `WorkflowStatus`
- `RiskLevel`

Os status de roteiro, plano e item operacional devem continuar usando os enums ja aprovados no frontend, sem introduzir uma segunda familia de status.

## Relacoes obrigatorias

- `Channel` 1:N `ContentIdea`
- `Channel` 1:N `ProductionItem`
- `Channel` 1:N `ResearchSession`
- `Channel` 1:N `Script`
- `Channel` 1:N `VisualPlan`
- `ContentIdea` 1:N `ResearchSession`
- `ContentIdea` 1:N `Script`
- `ResearchSession` 1:N `ResearchSource`
- `ResearchSession` 1:N `ClaimEvidence`
- `ResearchSource` 1:N `ClaimEvidence`
- `Script` 1:N `ScriptVersion`
- `VisualPlan` 1:N `ScenePlan`

## Regras de `channelId`

Toda entidade operacional desta sprint deve carregar `channelId` quando aplicavel. O backend deve impedir:

- vincular ideia de um canal a pesquisa de outro;
- vincular fonte de um canal a sessao de outro;
- vincular evidencias de outro canal;
- vincular roteiro a item de producao de outro canal;
- vincular versao a roteiro de outro canal;
- vincular plano visual a roteiro de outro canal;
- vincular cena a plano visual de outro canal.

Esses casos precisam ser cobertos por teste.

## Endpoints minimos

Os endpoints abaixo sao o contrato alvo desta sprint. Listagem deve aceitar `channelId` e filtros coerentes quando aplicavel.

### Content ideas

- `GET /api/content-ideas`
- `POST /api/content-ideas`
- `GET /api/content-ideas/:id`
- `PATCH /api/content-ideas/:id`

### Production items

- `GET /api/production-items`
- `GET /api/production-items/:id`

### Research

- `GET /api/research-sessions`
- `POST /api/research-sessions`
- `GET /api/research-sessions/:id`
- `POST /api/research-sessions/:id/sources`
- `POST /api/research-sessions/:id/claims`

### Scripts

- `GET /api/scripts`
- `POST /api/scripts`
- `GET /api/scripts/:id`
- `PATCH /api/scripts/:id`
- `GET /api/scripts/:id/versions`
- `POST /api/scripts/:id/versions`

### Visual plans

- `GET /api/visual-plans`
- `POST /api/visual-plans`
- `GET /api/visual-plans/:id`
- `PATCH /api/visual-plans/:id`
- `POST /api/visual-plans/:id/scenes`

## Operacoes persistidas

Devem ser persistidas nesta sprint:

- criacao e atualizacao de ideia;
- criacao e consulta de sessao de pesquisa;
- registro de fonte;
- registro de evidencias de claim;
- criacao de roteiro;
- criacao de versao de roteiro;
- atualizacao controlada de roteiro;
- criacao de plano visual;
- criacao de cenas planejadas;
- geracao/atualizacao do item operacional de producao;
- listagens por canal e por relacao principal.

## Operacoes somente de leitura

Podem permanecer somente de leitura se a UI nao expuser mutacao aprovada:

- listagem de production items;
- leitura de roteiro;
- leitura de visual plan;
- leitura de script versions;
- leitura de scenes.

## Persistencia

O projeto nao possui schema relacional ou migrations para este dominio nesta baseline. Esta sprint deve:

- usar repositorios encapsulados e testaveis;
- manter armazenamento deterministico em memoria durante o processo;
- nao criar arquitetura paralela;
- nao criar migrations sem uma fundacao de banco aprovada;
- nao fingir persistencia externa.

Se uma futura sprint de banco for aprovada, estes repositorios poderao ser trocados por persistencia real sem alterar os handlers.

## Frontend minimo

A unidade minima demonstravel no frontend e:

- `/ideas` lista ideias reais do backend;
- `/research` lista sessoes e fontes associadas;
- `/scripts` lista roteiros e suas versoes;
- `/production` lista itens operacionais do pipeline;
- cada tela mostra loading, empty state e error state;
- areas ainda nao integradas permanecem marcadas como demo;
- nenhuma tela importa mocks crus diretamente.

## Telas dentro do escopo

- `/ideas`
- `/research`
- `/scripts`
- `/production`

## Telas que permanecem demo

- `dashboard` nas areas fora do pipeline editorial;
- `media-assets`
- `videos`
- `clips`
- `approvals`
- `publications`
- `metrics`
- `costs`
- `compliance`
- `administration`
- `audit-logs`

## Validacoes

- payload valido e invalido;
- recurso inexistente;
- filtro por `channelId`;
- erro de vinculo entre canais;
- status invalido;
- corpo vazio;
- identificador invalido;
- versao duplicada ou fora de sequencia;
- ordem de cena duplicada;
- URL invalida;
- resposta de sucesso com envelope aprovado;
- resposta de erro com envelope aprovado;
- isolamento entre dois canais.

## Critérios de aceite

- entidades do pipeline editorial existem;
- relacoes e isolamento por canal sao respeitados;
- endpoints minimos respondem;
- versoes de roteiro nao sobrescrevem historico;
- plano visual e cenas persistem no repositorio;
- frontend consome dados reais nas telas do escopo;
- loading, empty e error estao visiveis;
- areas demo continuam marcadas;
- tests e validacoes passam;
- nenhum segredo foi exposto.

## Definition of Done

- Spec 005 atualizada e coerente com o estado real do repo;
- backend editorial implementado com validacao e testes;
- frontend minimo integrado nas rotas do escopo;
- contratos documentados;
- smoke executado;
- working tree limpo;
- commit criado;
- PR aberta.

## Riscos

- A baseline do repo nao possui banco relacional ou migrations para este dominio.
- A persistencia desta sprint e process-local ate uma future foundation de banco existir.
- O frontend usa contratos ricos; qualquer divergencia de tipos quebra as telas consumindo `api-client`.
- Cross-channel rejection precisa ser testado explicitamente para evitar vazamento de estado.

## Proxima sprint recomendada

Sprint 6 - Approvals and Compliance.
