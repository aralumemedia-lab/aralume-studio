# Spec 012 - V1 Acceptance

## Status
Planejada.

## Objetivo
Definir os criterios minimos para considerar a Aralume Studio V1.0 pronta.

## Contexto
V1.0 nao significa plataforma totalmente autonoma. V1.0 significa uma base operacional coerente, segura, validada e demonstravel para fabrica editorial multicanal assistida por IA.

## Escopo da V1.0
- Frontend premium estavel.
- SDD institucionalizado.
- Backend foundation.
- Canais reais ou fundacao persistivel.
- Contratos frontend/backend coerentes.
- Escritorio de agentes representando estado operacional.
- Pipeline editorial basico.
- Aprovacao humana.
- Compliance e qualidade.
- Custos e modo operacional.
- Asset registry.
- Publicacao assistida preparada ou simulada.
- Documentacao de ambiente.
- Validacao tecnica reproduzivel.

## Fora de escopo da V1.0
- Autonomia total.
- Multiplos provedores reais integrados.
- Renderizacao massiva.
- Publicacao automatica sem humano.
- Billing comercial.
- Times ou equipes multiusuario completos.
- App mobile.
- Analytics avancado.
- IA sem controle de custo.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/001-environment-safe-migration.md`
- `docs/specs/002-backend-foundation.md`
- `docs/specs/003-channels.md`
- `docs/specs/004-agent-office-workflows.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/007-costs-operational-modes.md`
- `docs/specs/008-media-assets-storage.md`
- `docs/specs/009-rendering.md`
- `docs/specs/010-publication-assisted.md`
- `docs/specs/011-metrics-learning.md`

## Criterios tecnicos
- `main` limpo.
- `main = origin/main`.
- Lint sem warnings relevantes.
- Typecheck passando.
- Build passando.
- Testes existentes passando.
- Documentacao atualizada.
- Specs atualizadas.
- `.env.example` seguro.
- `.gitignore` protegendo segredos.
- Nenhum segredo exposto.
- PRs principais mergeados.
- Handoff atualizado.

## Criterios de produto
A V1.0 deve permitir demonstrar:
- Navegacao pelas telas principais.
- Selecao de canal.
- Visao operacional do dashboard.
- Visao de canais.
- Visao do escritorio de agentes.
- Visao do pipeline editorial.
- Visao de aprovacoes.
- Visao de custos.
- Visao de compliance.
- Visao de auditoria.
- Fluxo minimo de conteudo, mesmo que parcialmente simulado.

## Criterios de seguranca
- Nenhum `.env.local` versionado.
- Nenhum token em docs.
- Nenhum segredo em logs.
- OAuth real apenas se aprovado.
- Publicacao real apenas com aprovacao humana.
- IA real apenas com politica de custo.
- Midia real apenas com storage root validado.

## Criterios de documentacao
Devem estar atualizados:
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/*`

## Definition of Done V1.0
- Todos os criterios tecnicos passam.
- Fluxo principal pode ser demonstrado.
- Limitacoes documentadas.
- Riscos documentados.
- Proximos passos claros.
- Sem pendencia critica de seguranca.
- Sem dependencia invisivel de credenciais.
- Projeto pode ser retomado por outro engenheiro usando docs e specs.

## Proxima sprint recomendada
Consolidacao da fase correspondente ao estado do roadmap no momento da implementacao, com foco na execucao da proxima spec ativa.

