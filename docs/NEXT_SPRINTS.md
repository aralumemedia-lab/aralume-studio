# Next Sprints

## Sprint 3 concluida e integrada
- A Sprint 3 - Channels Domain Foundation foi concluida e integrada ao `main` via PR #8.
- O merge commit oficial e `6bf1bfec40cafaa7d2228f040745127e7ede9041`.
- O backend de Canais ja disponibiliza `GET /api/channels`, `POST /api/channels`, `GET /api/channels/:id`, `PATCH /api/channels/:id` e `GET /api/channels/:id/settings`.
- A tela `/channels` continua mockada no frontend; a integracao com a API real fica reservada para a Sprint 4, conforme `docs/specs/003-channels.md`.
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
- **Sprint 4 - Channels Frontend Integration**

## Motivo
- A fundacao backend de Canais ja esta integrada a `main`.
- A proxima sprint deve comecar por Spec Review e por uma spec propria antes da implementacao.
- A integracao da tela `/channels` deve consumir a API real entregue na Sprint 3, sem alterar o backend ja concluido.
- A tela `/channels` continua mockada ate a conclusao dessa integracao.

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
- A recomendacao anterior de Sprint 3 nao se aplica mais porque o PR #8 ja foi mergeado e a base de Canais esta integrada.
