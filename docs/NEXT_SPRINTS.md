# Next Sprints

## Sprint 4 concluida e integrada
- A Sprint 4 - Channels Frontend Integration foi concluida e integrada ao `main` via PR #10.
- O merge commit oficial e `3ee439ca7e0ae414a68a459ab9fcba650e076148`.
- O commit de implementacao foi `af17736ad40aa691b09f4677671a43f218095643`.
- A rota `/channels` agora consome a API real de Canais.
- O `ChannelProvider` agora usa a camada real de servico e nao importa `mockChannels`.
- O frontend de Canais usa `GET /api/channels`, `GET /api/channels/:id/settings` e `PATCH /api/channels/:id`.
- Pausar e ativar canais passaram a usar o backend real.
- Areas ainda nao integradas continuam explicitamente marcadas como demo quando aplicavel.
- A configuracao de proxy Vite para `/api` foi aplicada e validada no desenvolvimento local.
- As validacoes de lint, typecheck, build, backend check, testes, smoke integrado e QA visual foram executadas com sucesso.

## Sprint 3 concluida e integrada
- A Sprint 3 - Channels Domain Foundation foi concluida e integrada ao `main` via PR #8.
- O merge commit oficial e `6bf1bfec40cafaa7d2228f040745127e7ede9041`.
- O backend de Canais ja disponibiliza `GET /api/channels`, `POST /api/channels`, `GET /api/channels/:id`, `PATCH /api/channels/:id` e `GET /api/channels/:id/settings`.
- A persistencia adotada nesta sprint foi um repositorio substituivel em memoria, porque a Sprint 2 nao disponibilizou banco operacional.
- Nenhuma exclusao fisica foi implementada.

## Sprint 2 concluida e integrada
- A fundacao backend foi criada na branch `codex/sprint-2-backend-foundation` com Express, validacao de ambiente, logger simples, middlewares essenciais, `GET /health` e envelopes padrao.
- `docs/BACKEND_SETUP.md` foi adicionado para orientar a operacao local e os comandos de validacao.
- Os scripts backend foram adicionados sem alterar o dominio de Canais.
- O PR #6 foi mergeado em `main` por merge commit.
- O merge commit oficial e `20b7c503761840910d78ceec604d9f8de55c3e84`.
- `main` e `origin/main` estao alinhados nesse SHA, sem divergencia.

## Recomendacao atual
- **Sprint 5 - Editorial Pipeline**

## Motivo
- A fundacao backend de Canais ja esta integrada a `main`.
- A integracao da tela `/channels` foi concluida na Sprint 4 e nao esta mais pendente.
- A proxima sprint autorizada e a Sprint 5 - Editorial Pipeline, conforme `docs/specs/004-agent-office-workflows.md` e `docs/specs/005-editorial-pipeline.md`.
- A proxima implementacao deve comecar por Spec Review da spec 005 antes de qualquer alteracao funcional.

## Sprint 0.2 concluida
- A preparacao segura de variaveis de ambiente foi concluida.
- `.env.example`, `.gitignore`, `docs/ENVIRONMENT.md` e as specs de SDD/ambiente foram preparados sem expor valores reais.
- O inventario de variaveis do legado foi registrado apenas por nome, categoria e status.

## Recomendacao historica
- **Sprint 2 - Backend Foundation**

## Motivo
- O frontend esta visualmente estavel o suficiente para servir como contrato operacional.
- Lint, typecheck e build passaram.
- A base visual principal foi validada em dashboard, channels e agent office.
- Os screenshots de QA visual foram gerados localmente.
- A base segura de ambiente ficou pronta para receber migracao manual de credenciais.
- Nao ha dependencia de backend real para concluir esta etapa documental.

## Sprint 0.3 concluida
- A Sprint 0.3 foi preparada no PR #5 com as specs `docs/specs/002-backend-foundation.md` ate `docs/specs/012-v1-acceptance.md`.
- A etapa foi documental e nao introduziu backend, alteracao funcional de frontend, contrato novo ou mock novo.
- A proxima recomendacao daquela etapa permaneceu **Sprint 2 - Backend Foundation**.
- A execucao da Sprint 2 seguiu `docs/specs/002-backend-foundation.md`.
- O backend so deve comecar apos o PR #5 ser mergeado, o `main` permanecer limpo e as validacoes continuarem passando.

## Observacoes
- Se o time quiser formalizar QA visual automatizado no repo, a unica alternativa sensata antes do backend e uma Sprint 1B curta para Playwright e capturas reproduziveis.
- A recomendacao anterior de Sprint 4 nao se aplica mais porque o PR #10 ja foi mergeado e a integracao de Canais esta concluida.
