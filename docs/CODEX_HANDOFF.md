# Codex Handoff - Sprint 13

## Estado atual

- Sprint 11 foi encerrada no PR #19.
- Sprint 12 - Integracoes Reais Autorizadas foi encerrada e mergeada no PR #22,
  commit `6690008aa92749415838f97f10a4b407301f2233`.
- A validacao real da S12 comprovou OAuth autorizado, descoberta e selecao
  server-side, upload privado/nao listado, consulta, replay idempotente,
  isolamento e revogacao; a policy foi restaurada.
- A Sprint 13 pertence ao E14 e e governada por `docs/specs/014-metrics-learning.md`.
- A Sprint 13 foi encerrada no PR #23, merge commit
  `9b89d1be04e7a6e319efb9a957282097c4854f31`.
- A Sprint 14/V1 Acceptance foi concluida em branch isolada para validacao, sem release ou deploy.
- O resultado foi `V1.0 NÃƒÆ’O ACEITA`: 5 `PASS`, 5 `FAIL` e 8 `NOT PROVEN`; matriz, relatÃƒÂ³rio, evidÃƒÂªncias, limitaÃƒÂ§ÃƒÂµes e remediaÃƒÂ§ÃƒÂ£o estÃƒÂ£o documentados.

## Baseline e branch

- Branch inicial: `main`.
- SHA inicial: `6690008aa92749415838f97f10a4b407301f2233`.
- `main` e `origin/main` alinhadas, divergencia `0 0`.
- Working tree limpo e sem worktrees adicionais.
- Branch de trabalho: `codex/sprint-13-metrics-learning` (PR #23 mergeada e branch
  removida no encerramento).

## Objetivo e gate

Registrar metricas por canal, consultar/agregar os dados e gerar recomendacoes
editoriais deterministicas, explicaveis e auditaveis.

Gate: metricas geram recomendacao editorial por canal.

## Historias

- H14.1 - Registro controlado de metricas por conteudo.
- H14.2 - Consulta e agregacao canal-scoped.
- H14.3 - Aprendizado editorial assistido.
- H14.4 - Dashboard operacional de metricas e recomendacoes.

## Decisoes operacionais

- Origem desta Sprint: registro controlado pela API, com `manual`, `imported`,
  `demo` e `fixture` explicitamente identificados.
- YouTube Analytics nao sera conectado; nenhum escopo OAuth novo sera solicitado.
- Metricas aprovadas: views, reach, average watch seconds, completion rate,
  shares, saves, comments e followers gained. Receita nao entra.
- Persistencia: repository JSON atomico existente em
  `ARALUME_ASSET_STORAGE_ROOT`, arquivo `metrics.json`.
- Idempotencia: `channelId + idempotencyKey`, replay identico e conflito para
  payload divergente.
- Analise: regra local `metrics-learning-v1`, sem IA externa, com evidencias,
  baseline, confianca e limitacoes.
- Recomendacoes nunca alteram regras editoriais automaticamente.
- Custos externos: zero nesta fatia; policy operacional nao sera alterada.

## Contratos

- `POST /api/metrics`
- `GET /api/metrics`
- `GET /api/metrics/:metricId`
- `GET /api/metrics/summary`

Todos exigem `channelId` quando aplicavel, envelopes oficiais, requestId, validacao
de referencias e erros sanitizados.

## Fora de escopo

Scraping, Analytics/OAuth novo, novos provedores, IA externa, receita, aplicacao
automatica de recomendacoes, banco/migration SQL, hardening, V1 Acceptance,
recriacao do frontend e limpeza administrativa da S12.

## Evidencias esperadas

- Testes de dominio e HTTP para registro, origem, valores, referencias, idempotencia,
  persistencia, filtros, agregacao, recomendacao, insuficiencia e isolamento.
- `/metrics` sem import de mocks e consumindo API real.
- Validacao de reload, auditoria sanitizada e ausencia de segredos.
- QA visual em 1366x768, 1600x900, 1792x1024 e 1920x1080, incluindo sidebar,
  estados vazios, parciais, erro e recomendacao.
- Quality gates do package.json, `git diff --check` e PR #23 mergeada.

## Sprint 14 - encerramento documental

- Branch: `codex/sprint-14-v1-acceptance`.
- Base: `d78959a47a2bafbb343408d703eafafec8c6df59`.
- PR: #24; commit-base do aceite e das evidÃƒÂªncias: `22388e7`.
- O head vigente da PR deve ser consultado diretamente no GitHub; correÃƒÂ§ÃƒÂµes documentais posteriores foram feitas na mesma PR.
- Merge ainda pendente de nova revisÃƒÂ£o; release permanece bloqueada e remediaÃƒÂ§ÃƒÂµes nÃƒÂ£o foram iniciadas.
- Gates tecnicos: lint, typecheck, 64 testes, build e `git diff --check` aprovados.
- Veredito de revisÃƒÂ£o documental: `APPROVE_WITH_NOTES`, condicionado ÃƒÂ  revisÃƒÂ£o/aprovaÃƒÂ§ÃƒÂ£o objetiva no GitHub.
- Bloqueio principal: o frontend ainda possui fluxos obrigatorios ausentes ou mockados.
- Backlog de remediaÃƒÂ§ÃƒÂ£o: seÃƒÂ§ÃƒÂ£o "Remediacao pos-Sprint 14 (atualizada apos Sprint 15)" em `docs/PRODUCT_BACKLOG.md`.
- Nenhuma release, tag, deploy, publicaÃƒÂ§ÃƒÂ£o externa ou implementaÃƒÂ§ÃƒÂ£o de remediaÃƒÂ§ÃƒÂ£o foi iniciada.

## Riscos

- Dados controlados nao podem parecer producao: origem deve ser exibida.
- Canal, conteudo, publicacao, video, cache e auditoria devem permanecer isolados.
- Dados insuficientes nao podem resultar em recomendacao falsa.
- A regra nao demonstra causalidade; deve comunicar sinal e limitacoes.

## Handoff - E16

- Estado: definicao documental do primeiro epico de remediacao da V1 concluida.
- Nota: bloco historico da proposta inicial do E16; a remediacao funcional do E16 foi concluida nas Sprints 15 e 16 e o epic ficou fechado.
- Epic: E16 - Pipeline Editorial Operavel pelo Frontend.
- Iniciativa: Remediacao da Operabilidade da V1.
- CritÃƒÂ©rios V1: V1-03, V1-04, V1-05, V1-06; V1-02 apenas como dependencia.
- Itens R14: R14-03, R14-04, R14-05, R14-06; R14-02 como dependencia upstream.
- Historias: H16.0, H16.1, H16.2, H16.3, H16.4.
- Sequencia proposta: Sprint 15 e Sprint 16, ambas concluídas.
- Gate futuro: reaceite da V1 somente apos evidencias, contratos e testes E2E dos epicos remanescentes.
- Nao iniciado: nenhuma historia fora de E16 foi implementada, nenhuma sprint nova foi iniciada, nenhum release foi preparado.

## Handoff - Remediacao V1

- Estado: planejamento documental consolidado para a remediacao da V1.
- Epic 1: E16 - Pipeline Editorial Operavel pelo Frontend.
- Epic 2: E17 - Pipeline Midia e Producao Operavel pelo Frontend.
- Epic 3: E18 - Governanca e Publicacao Assistida pelo Frontend.
- Epic 4: E19 - Cockpits Reais e Evidencias Transversais.
- CritÃƒÂ©rios V1: V1-02..V1-14, com R14-02..R14-14.
- Itens tecnicos: R14-T01 e R14-T02.
- Sequencia vigente: Sprint 17, Sprint 18, Sprint 19, Sprint 20, Sprint 21, e depois R14-REACCEPT.
- Sprint 20 foi revisada e integrada em `main` pela PR #33. E17 esta integrado pela PR #30 e Sprint 19 pela PR #32.
- Gate final: R14-REACCEPT somente apos E16, E17, E18 e E19 evidenciados no mesmo head.
- Sprint 19 foi mergeada pela PR #32 e Sprint 20 pela PR #33: H18.1 a H18.4 estao integradas; E19, `R14-REACCEPT`, release, tag e deploy permanecem fora desta execucao.
- Sprint 21 formalizou H19.1, H19.2 e H19.3 em uma fatia vertical unica e foi mergeada pela PR #34; E19 esta concluido em `main`.
- Sprint 21 implementou os endpoints reais de cockpit, removeu o caminho `mock-api` do Dashboard e do Escritorio de Agentes, e gerou `docs/acceptance/v1/V1_SPRINT21_EVIDENCE.md` com o runner `node scripts/sprint21-browser-e2e.mjs`.

## Sprint 15 - formalizacao documental

- Epic: E16 - Pipeline Editorial Operavel pelo Frontend.
- Spec normativa: `docs/specs/016-sprint-15-editorial-profile-ideas-research.md`.
- Estado: completed.
- Historias: H16.0, H16.1 e H16.2.
- Resultado: H16.0, H16.1 e H16.2 entregues no head da PR #26; H16.3 e H16.4 foram concluídas na Sprint 16.
- Itens R14: R14-02, R14-03 e R14-04.
- Sequencia: primeira fatia funcional do E16 entregue; H16.3 e H16.4 foram concluídas na fatia seguinte do mesmo epic.
- Gate futuro: reaceite da V1 somente apos E16, E17, E18 e E19 evidenciados no mesmo head.
- Pendente: nenhuma historia de E16 permanece pendente.

## Sprint 17 - formalizacao documental

- Epic: E17 - Pipeline Midia e Producao Operavel pelo Frontend.
- Spec normativa: `docs/specs/018-sprint-17-narration-media-assets.md`.
- Estado: completed pela PR #28.
- Historias: H17.1 e H17.2.
- Resultado: H17.1 e H17.2 integradas em `main` pela PR #28; H17.3 e H17.4 foram integradas em `main` pela PR #30.
- Itens R14: R14-07 e R14-08.
- Sequencia: primeira fatia funcional do E17, sem render nem cortes.
- Gate futuro: reaceite da V1 somente apos E16, E17, E18 e E19 evidenciados no mesmo head.
- Pendente: `R14-REACCEPT` continua pendente; E19 foi concluido pela PR #34.
- Evidencia reproduzivel: `node scripts/sprint17-browser-e2e.mjs` e `screenshots/sprint-17/`.
- Produto: E17 completo e integrado em `main` pela PR #30; V1.0 continua `NAO ACEITA`; nenhum reaceite ou release executado.

## Sprint 18 - formalizacao e execucao

- Epic: E17 - Pipeline Midia e Producao Operavel pelo Frontend.
- Spec normativa: `docs/specs/019-sprint-18-render-derived-clips.md`.
- Estado: completed and integrated by PR #30.
- Historias: H17.3 e H17.4.
- Criterios V1: V1-09 e V1-10.
- Itens R14: R14-09 e R14-10.
- Escopo: render controlado em `/videos`, videos resultantes, cortes derivados em `/clips`, intervalos, auditoria correlacionada, reload e isolamento.
- Pendente por escopo: E18, E19, `R14-REACCEPT`, release, tag e deploy.
- Gate comprovado no mesmo head: 68 testes, lint, backend check, build, E2E browser, screenshots, reload, auditoria correlacionada e isolamento por canal.
- V1-09 e V1-10 possuem evidencia nova; nao houve novo V1 Acceptance. E18 e E19 seguem como proximos epicos, e `R14-REACCEPT` permanece final.

## E18 - Sprint 19 e Sprint 20 integradas

- Estado: concluido; Sprint 19 integrada pela PR #32 e Sprint 20 integrada pela PR #33.
- Primeira fatia recomendada: Sprint 19, spec `docs/specs/020-sprint-19-governance-gates.md`, com H18.1, H18.2 e H18.3 para V1-11, V1-12 e V1-13.
- Segunda fatia: Sprint 20, spec `docs/specs/021-sprint-20-assisted-publication.md`, com H18.4 para V1-14.
- Sprint 19 estabelece qualidade, compliance e decisao humana; Sprint 20 prepara readiness ou pacote de publicacao sem auto-send.
- Dependencia: Sprint 20 iniciou somente apos o gate da Sprint 19. E18 foi fechado apos a revisao e merge das duas fatias.
- Sprint 19 fecha a propagacao de `requestId` para as mutacoes de quality, compliance e approval; Sprint 20 propaga o mesmo requisito nas mutacoes de publicacao.
- Limite: OAuth, conexao e upload YouTube nao pertencem a H18.4; E19, `R14-REACCEPT`, release, tag e deploy permanecem fora.
- H18.1 a H18.4 estao integradas em `main`; V1.0 permanece `NAO ACEITA` e nenhum reaceite foi executado.

## Handoff - Sprint 22

- Epico governante: E15 - Hardening V1.0.
- Spec: `docs/specs/023-sprint-22-v1-remediation-findings.md`.
- Branch: `codex/sprint-22-v1-remediation-findings`.
- Objetivo: remediar findings materiais do reaceite sem executar o `R14-REACCEPT`.
- Findings: requestId deve ser gravado em `AuditLog.requestId`; mutacoes editoriais devem ser auditadas; detalhes de script, versao, plano visual e cena devem validar o canal ativo; cross-channel deve ser rejeitado com resposta sanitizada; runners E2E 15-21 devem ser reproduziveis, retornar codigo correto e limpar processos.
- Evidencia nova: `docs/acceptance/v1/V1_SPRINT22_REMEDIATION_EVIDENCE.md`.
- Nao alterar: matriz historica da Sprint 14, bundles historicos, criterios ja integrados de V1-01/V1-02/V1-11..V1-18, `.env.local`, release, tag, deploy ou historico Git publicado.
- Validacao de saida: gates tecnicos, testes adicionais de auditoria/isolamento, runners Sprint 15-21, portas/processos sem orfaos e working tree limpo.
- Proximo passo apos esta unidade: revisao independente e decisao explicita sobre iniciar o `R14-REACCEPT`; esta unidade nao o executa.

## Handoff - R14 aceito e Sprint 23

- R14 formal concluido: `V1.0 ACCEPTED`, 18/18 `PASS`.
- SHA funcional avaliado: `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`.
- PR documental #37 integrada pelo merge commit `61d313bdb35dd0228a2bf4f5af3454263f588155`.
- Sprint atual: Sprint 23 - V1.0 Release Readiness e Hardening de Producao.
- Epico: E15 - Hardening V1.0.
- Spec: `docs/specs/024-sprint-23-v1-release-readiness.md`.
- Branch: `codex/sprint-23-v1-release-readiness`.
- Entrega: inventario de release, seguranca/configuracao, backup/restore, deploy/rollback, observabilidade, gates e decisao de readiness.
- Limite: nao executar deploy, tag, GitHub Release ou publicacao externa; Sprint 24 e unidade separada.
- Modelo normativo incorporado: `docs/governance/PROMPT_5_RELEASE.md`; sua presenca formaliza o processo e nao resolve os bloqueadores tecnicos de readiness.

## Handoff - Sprint 24 - Seguranca de entrada e isolamento multicanal

- Estado: formalizada; implementacao iniciada somente apos Spec Review e preflight limpo.
- Epico governante: E15 - Hardening V1.0.
- Spec: `docs/specs/025-sprint-24-security-isolation.md`.
- Branch: `codex/sprint-24-production-security-isolation`.
- Dependencia: PR #38 integrada em `main`; R14 permanece `V1.0 ACCEPTED` e readiness da release permanece `NOT_READY`.
- Historias: H24.1 autenticacao inbound fail-closed; H24.2 autorizacao e isolamento; H24.3 protecao de midia; H24.4 limites de upload/importacao; H24.5 auditoria e evidencias negativas.
- Contrato de identidade: principal derivado de token assinado e validado no backend; identidade, papel e canal nao sao aceitos como autoridade livre do cliente.
- Bypass: somente harness de testes local explicitamente habilitado, fora de producao; nenhum fallback permissivo no entrypoint produtivo.
- Fora de escopo: backup/restore, rollback, topologia, ingress, deploy, release, tag, novos fluxos editoriais e correcao ampla dos diagnosticos TypeScript globais.
- Gate: endpoints operacionais fail-closed, isolamento e midia negativos reproduziveis, limites aplicados, auditoria sanitizada, testes e build aprovados, sem regressao dos fluxos R14.
- Evidencia: `docs/acceptance/v1/V1_SPRINT24_SECURITY_ISOLATION_EVIDENCE.md`; contagens e baselines devem ser reproduzidos no HEAD final, com runners 15-21, evidencias HMAC, portas livres e nenhum processo orfao.
- Estado de handoff: `READY_FOR_REVIEW`; a revisao independente deve ocorrer antes de qualquer merge. A release continua `NOT_READY`, sem release, tag ou deploy.
## Regra operacional - execucao controlada com subagentes

Subagentes devem ser considerados somente quando produzirem ganho real de
cobertura, independencia, paralelismo ou reducao de risco. Tarefas simples,
lineares ou fortemente acopladas podem usar um unico agente. Quando houver
subagentes, o coordenador e responsavel pelo preflight, escopo, decisoes,
consolidacao, reproducao de findings `BLOCKER` e `HIGH`, revisao do diff e
veredito final.

Cada subagente recebe escopo isolado e nao sobreposto. Revisores operam em
somente leitura e nao podem alterar arquivos, fazer commit, push, merge,
release, tag ou deploy. Cada arquivo de implementacao tem um proprietario
unico; implementacoes paralelas usam worktrees isoladas e alteracoes
concorrentes no mesmo arquivo exigem coordenacao explicita. Findings duplicados
sao consolidados, opinioes sem reproducao, impacto e evidencia nao sao
findings, e nenhum agente aprova a propria implementacao.

Revisao tecnica independente nao substitui aprovacao humana formal nem as
regras do GitHub, branch protection, rulesets, CODEOWNERS ou required reviews.
O coordenador registra conflitos, decisoes descartadas, limitacoes, comandos,
evidencias, agentes, escopos, modo de execucao, worktrees e findings
consolidados. O ADR 004 define os casos favoraveis, desfavoraveis e o fluxo
completo. Commit, PR, merge, release e deploy permanecem sob as regras
existentes.

## Definition of Done

H14.1-H14.4 implementadas, documentacao coerente, testes adicionais passando sem
reduzir os 56 existentes, persistencia e isolamento demonstrados, QA visual feito,
PR #23 revisada e mergeada por merge commit. Sprint 14 foi concluida com veredito negativo documentado; novo V1 Acceptance serÃƒÂ¡ necessÃƒÂ¡rio apÃƒÂ³s a remediaÃƒÂ§ÃƒÂ£o.
