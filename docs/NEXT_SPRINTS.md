# Next Sprints

## Sprint 3 implementada na branch
- A Sprint 3 - Channels Domain Foundation foi implementada na branch `codex/sprint-3-channels-domain-foundation`.
- O backend de Canais ja disponibiliza `GET /api/channels`, `POST /api/channels`, `GET /api/channels/:id`, `PATCH /api/channels/:id` e `GET /api/channels/:id/settings`.
- A tela `/channels` permanece mockada nesta sprint; a integracao frontend fica reservada para a Sprint 4, conforme `docs/specs/003-channels.md`.
- A persistencia adotada nesta sprint foi um repositorio substituivel em memoria, porque a Sprint 2 nao disponibilizou banco operacional.
- Nenhuma exclusao fisica foi implementada.
- O merge para `main` ainda esta pendente.

## Sprint 2 concluida e integrada
- A fundacao backend foi criada na branch `codex/sprint-2-backend-foundation` com Express, validacao de ambiente, logger simples, middlewares essenciais, `GET /health` e envelopes padrao.
- `docs/BACKEND_SETUP.md` foi adicionado para orientar a operacao local e os comandos de validacao.
- Os scripts backend foram adicionados sem alterar o dominio de Canais.
- O PR #6 foi mergeado em `main` por merge commit.
- O merge commit oficial e `20b7c503761840910d78ceec604d9f8de55c3e84`.
- `main` e `origin/main` estao alinhados nesse SHA, sem divergencia.

## Recomendacao atual
- **Sprint 3 - Channels Domain Foundation**

## Motivo
- A fundacao backend ja esta integrada a `main`.
- A nova sprint deve seguir `docs/specs/003-channels.md` como spec normativa.
- A implementacao do dominio de Canais deve ocorrer antes da integracao da tela `/channels`, que esta reservada para a Sprint 4 conforme a spec 003.
- A pendencia ambiental registrada da rodada anterior e que o Bun nao estava disponivel naquela sessao; ele deve ser verificado novamente no preflight da implementacao da Sprint 3.

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
- A recomendacao anterior de Sprint 2 nao se aplica mais porque o PR #6 ja foi mergeado e a base backend esta integrada.
