# Next Sprints

## Sprint 2 concluida
- A fundacao backend foi criada em `server/` com Express, validacao de ambiente, logger simples, middlewares essenciais, `GET /health` e envelopes padrao.
- `docs/BACKEND_SETUP.md` foi adicionado para orientar a operacao local e os comandos de validacao.
- Os scripts backend foram adicionados sem alterar o dominio de Canais.

## Recomendacao atual
- **Sprint 3 - Channels Domain Foundation**

## Motivo
- A fundacao backend esta pronta para receber o primeiro dominio real.
- O dominio de Canais continua fora de escopo nesta sprint.
- A proximidade com o contrato de frontend agora pode evoluir com a base HTTP ja estabilizada.

## Sprint 0.2 concluida
- A preparacao segura de variaveis de ambiente foi concluida.
- `.env.example`, `.gitignore`, `docs/ENVIRONMENT.md` e as specs de SDD/ambiente foram preparados sem expor valores reais.
- O inventario de variaveis do legado foi registrado apenas por nome, categoria e status.

## Recomendacao atual
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
- A proxima recomendacao permanece **Sprint 2 - Backend Foundation**.
- A execucao da Sprint 2 deve seguir `docs/specs/002-backend-foundation.md`.
- O backend so deve comecar apos o PR #5 ser mergeado, o `main` permanecer limpo e as validacoes continuarem passando.

## Observacoes
- Se o time quiser formalizar QA visual automatizado no repositorio, a unica alternativa sensata antes do backend e uma Sprint 1B curta para Playwright e capturas reproduziveis.
- A recomendacao de Sprint 2 so vale se `main` seguir limpo, a documentacao de ambiente estiver pronta e as validacoes continuarem passando.
