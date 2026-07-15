# Codex Handoff - Sprint 12

## Estado atual

- Sprint 11 - Publicacao Assistida foi concluida e integrada ao `main` via PR #19.
- O merge commit oficial da Sprint 11 e `966e5bef50446f81701cedd861689b3e07b14a7d`.
- A Fase 12 do roadmap materializou-se na Sprint 11 e esta encerrada.
- A Sprint 12 e a proxima sprint formal de execucao.
- A Sprint 12 governa o gate de Hardening/V1 Acceptance da V1.0.
- A spec normativa da Sprint 12 e `docs/specs/012-v1-acceptance.md`.
- A V1.0 ainda nao pode ser declarada aceita porque os gates de Integracoes Reais Autorizadas e Metricas e Aprendizado permanecem planejados.

## Baseline esperada

- `main` limpo.
- `main` alinhado com `origin/main`.
- Nenhum outro worktree ativo.
- Nenhum arquivo staged, modified, deleted, renamed ou untracked.
- Normalizacao documental mergeada antes de iniciar a implementacao.

## Sprint formal

- Sprint 12 - V1 Acceptance.
- Epic principal: E15 - Hardening V1.0.
- Spec governante: `docs/specs/012-v1-acceptance.md`.

## Objetivo

Integrar, verificar, endurecer e decidir o aceite da V1.0 com evidência operacional pelo frontend.

## Escopo

- Verificar o fluxo ponta a ponta pelo frontend.
- Validar integracao entre frontend, backend e persistencia.
- Validar isolamento por canal.
- Validar rastreabilidade, auditoria e custos.
- Validar renderizacao e cortes.
- Validar qualidade, conformidade e aprovacao humana.
- Validar preparacao de publicacao assistida.
- Validar metricas e recomendacoes quando esses requisitos ja estiverem implementados.
- Corrigir defeitos que bloqueiem o aceite.
- Produzir evidencias de aceite ou rejeicao.

## Fora de escopo

- Grandes modulos novos.
- Redefinicao de arquitetura.
- Recriacao do frontend.
- Substituicao do design system.
- Funcionalidades de sprints posteriores.
- Publicacao externa sem autorizacao.
- Novos provedores sem spec.
- Segredos em codigo, docs, commits ou logs.
- Aceitacao baseada apenas em CLI.
- Aceitacao mascarada por mocks.
- Declaracao de aceite sem evidencia reproduzivel.

## Documentos obrigatorios

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/009-rendering.md`
- `docs/specs/010-derived-clips.md`
- `docs/specs/011-publication-assisted.md`
- `docs/specs/012-v1-acceptance.md`
- `docs/specs/013-channels-frontend-integration.md`
- `docs/specs/014-metrics-learning.md`

## Validacoes exigidas

- Confirmar que `main` esta limpa e alinhada com `origin/main`.
- Confirmar que a normalizacao documental foi mergeada antes de qualquer implementacao.
- Executar `git diff --check`.
- Executar `git status --short`.
- Executar os comandos normais do repositorio que sejam aplicaveis ao escopo.
- Se houver alteracao de frontend, incluir a validacao visual pertinente.
- Se a conclusao da sprint for negativa, registrar os bloqueios com evidencia reproduzivel.

## Riscos conhecidos

- Confundir Fase 12 historica com Sprint 12 de execucao.
- Tratar Publicacao Assistida como trabalho ainda aberto quando ela ja foi encerrada.
- Aceitar V1.0 sem evidencias operacionais integradas.
- Mascarar integrações ausentes com mocks ou fluxo apenas por CLI.
- Antecipar Sprint 13 ou posteriores.

## Definition of Done

- A decisão final da Sprint 12 e binaria: `V1.0 aceita` ou `V1.0 nao aceita`.
- A aceitacao exige evidencia de execucao do fluxo aplicavel pelo frontend.
- Qualquer decisao negativa deve listar bloqueios, severidade, evidencia e proximo trabalho necessario.
- A documentação deve permanecer coerente entre Documento Mestre, roadmap, backlog, handoff e spec.

## Proibições

- Não reiniciar esta correção documental.
- Não antecipar sprints posteriores.
- Não implementar produto fora da spec.
- Não declarar aceite sem evidência.
- Não publicar externamente sem autorização.
- Não solicitar ou registrar segredos.
