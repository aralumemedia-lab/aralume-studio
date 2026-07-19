# Sprint 23 - V1.0 Release Readiness e Hardening de Producao

## Identificacao

- Sprint: Sprint 23
- Epico governante: E15 - Hardening V1.0
- Spec: `docs/specs/024-sprint-23-v1-release-readiness.md`
- Branch: `codex/sprint-23-v1-release-readiness`
- Base autorizada: `61d313bdb35dd0228a2bf4f5af3454263f588155`
- Dependencia concluida: R14 formal, 18/18 `PASS`, `V1.0 ACCEPTED`
- Estado inicial: release, tag e deploy nao iniciados
- Proxima unidade autorizada: Sprint 24 - seguranca de entrada e isolamento multicanal. Implantacao pos-release permanece uma unidade posterior e separada.

## Objetivo

Decidir se a V1.0 esta preparada para uma implantacao produtiva separada, por meio de inventario de release, revisao de seguranca e configuracao, planos de backup/deploy/rollback, observabilidade, smoke tests e quality gates reproduziveis.

O resultado deve ser exatamente um destes:

- `READY_FOR_PRODUCTION_DEPLOYMENT`
- `READY_WITH_CONDITIONS`
- `NOT_READY`

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/ENVIRONMENT.md`
- `docs/specs/012-v1-acceptance.md`
- `docs/specs/023-sprint-22-v1-remediation-findings.md`
- `docs/acceptance/v1/V1_R14_REACCEPT_*.md`
- ADRs de provedores autorizados e metricas controladas
- Prompt autorizado da Sprint 23 anexado a execucao

O modelo normativo `PROMPT_5_RELEASE.md` foi incorporado em `docs/governance/PROMPT_5_RELEASE.md` a partir do material de governanca fornecido. Sua presenca corrige a lacuna documental, mas nao resolve os bloqueadores tecnicos nem autoriza release ou deploy.

## Historias incluidas

### H23.1 - Unidade e inventario da release

- Consolidar componentes, runtime, configuracoes, dependencias e integracoes da V1.0.
- Criar `docs/releases/1.0.0/` com release notes, planos e checklist.
- Preservar a rastreabilidade ao SHA funcional aceito e ao merge documental R14.

### H23.2 - Seguranca, dados e resiliencia

- Revisar segredos, autenticacao/autorizacao aplicavel, storage, paths, permissoes e integracoes externas autorizadas.
- Validar o modelo de persistencia atual, migrations/seed aplicaveis, backup e restauracao.
- Revisar dependencias e vulnerabilidades sem aceitar finding critico ou alto em aberto.
- Confirmar idempotencia e bloqueios de publicacao dos fluxos criticos.

### H23.3 - Implantacao, rollback e observabilidade

- Definir precondicoes, sequencia de implantacao e responsabilidades.
- Definir rollback tecnico e de dados, criterios objetivos de pausa e retorno.
- Definir health checks, logs, metricas, alertas e smoke tests pos-implantacao.

### H23.4 - Quality gates e decisao de readiness

- Executar todos os gates aplicaveis e registrar apenas resultados observados.
- Avaliar os diagnosticos TypeScript globais e os warnings conhecidos.
- Produzir uma decisao formal e riscos residuais para a Sprint 24.

## Escopo obrigatorio

- Documentacao da release V1.0.
- Inventario de configuracao sem valores secretos.
- Validacao do modelo de persistencia JSON atual e declaracao explicita de que nao ha banco relacional/migrations produtivas quando confirmado pelo codigo.
- Estrategia de backup/restauracao para dados e storage aplicaveis.
- Plano de deploy e rollback sem executa-los.
- Smoke test local ou de homologacao reproduzivel.
- Health, logs, metricas, alertas e observabilidade critica.
- Auditoria de dependencias, segredos e superficies de seguranca.
- Analise e, somente se segura e comportamentalmente neutra, correcao dos diagnosticos TypeScript globais.
- Runners criticos da V1, teardown, processos e portas.

## Fora de escopo

- Deploy produtivo.
- Tag definitiva ou GitHub Release.
- Publicacao externa real.
- Credenciais reais ou rotacao automatica de segredos.
- Novos provedores, funcionalidades ou contratos de produto.
- Refatoracao ampla, redesign ou alteracao de criterios V1.
- Rebase, squash, amend, force push ou reescrita de historico publicado.

## Contratos de producao a validar

- A configuracao obrigatoria falha de forma segura e sanitizada.
- Segredos nunca aparecem em resposta, log, documento, screenshot ou commit.
- Dados operacionais permanecem isolados por `channelId`.
- Storage rejeita paths absolutos, traversal, escape por link e referencias cross-channel.
- Render/cortes/publicacao sao idempotentes e deixam estado terminal auditavel.
- Conteudo bloqueado por qualidade, compliance ou aprovacao nao pode ser publicado.
- YouTube usa somente os dois escopos aprovados, exige destino descoberto/selecionado e aprovacao humana.
- Nenhum efeito externo ocorre durante os testes desta sprint.

## Banco, migrations e seed

O preflight deve confirmar a implementacao real. Se a V1 usar repositorios JSON atomicos, a release deve documentar essa arquitetura, validar schema/seed no boot e definir backup consistente de dados e storage. Se houver banco relacional ou migrations, todos os artefatos aplicaveis devem ser validados antes de readiness. A ausencia de migration nao pode ser mascarada como migration aprovada.

## Diagnosticos TypeScript

- Executar `npx tsc --noEmit` e registrar todos os diagnosticos.
- Corrigir somente erros com mudanca mecanica, tipagem mais precisa e zero mudanca funcional demonstravel.
- Nao usar casts amplos, `any`, `@ts-ignore`, exclusao de arquivos ou relaxamento de `tsconfig` para obter verde.
- Se algum erro permanecer, registrar arquivo, causa, impacto, risco e condicao explicita para producao.

## Documentos obrigatorios

```text
docs/releases/1.0.0/
├── RELEASE_NOTES.md
├── DEPLOYMENT_PLAN.md
├── ROLLBACK_PLAN.md
├── VALIDATION_CHECKLIST.md
└── POST_RELEASE_REPORT.md
```

`POST_RELEASE_REPORT.md` e apenas um template nesta sprint.

## Validacoes

- `git diff --check`
- lint
- frontend/global TypeScript aplicavel
- backend typecheck
- suite oficial completa
- testes adicionais de seguranca, auditoria e isolamento
- build
- auditoria de dependencias
- validacao de configuracao, persistencia, seed e migrations aplicaveis
- smoke test local/homologacao
- runners criticos da V1
- verificacao de teardown, processos e portas
- inspecao de segredos, `.env` e arquivos sensiveis

## Criterios de bloqueio

O status e `NOT_READY` quando houver vulnerabilidade critica/alta sem aceite formal, segredo exposto, persistencia ou recuperacao indefinida, ausencia de rollback, fluxo critico quebrado, observabilidade insuficiente, configuracao produtiva indefinida, dependencia obrigatoria indisponivel, teste critico falhando, divergencia documental material, risco TypeScript funcional ou ausencia de smoke test reproduzivel.

## Evidencia e Definition of Done

- Spec, roadmap, backlog e handoff alinhados.
- Cinco documentos da release criados e coerentes.
- Resultados de seguranca, dependencias, configuracao, persistencia e observabilidade registrados.
- Quality gates executados sem enfraquecimento.
- Decisao formal com riscos e condicoes explicitas.
- Nenhum deploy, tag, GitHub Release ou publicacao externa.
- Commit e PR exclusivos da Sprint 23; merge nao automatico quando houver condicao material.

## Resultado corrente da execucao

O resultado da Sprint 23 e `NOT_READY`. A aceitacao funcional da V1 permanece valida para `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`, mas a prontidao produtiva esta bloqueada pela ausencia de uma fronteira de autenticacao/autorizacao na API, topologia produtiva autenticada e configuracao obrigatoria indefinidas, health limitado a liveness, advisories de dependencias ainda sem decisao e 55 linhas de cobertura de seguranca diferidas. Os documentos em `docs/releases/1.0.0/` sao checklists/templates e nao autorizam deploy.
