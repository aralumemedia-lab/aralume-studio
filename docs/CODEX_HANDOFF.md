# Codex Handoff - Sprint 12

## Estado atual

- Sprint 11 - Publicacao Assistida foi concluida e integrada ao `main` via PR #19.
- O merge commit oficial da Sprint 11 e `966e5bef50446f81701cedd861689b3e07b14a7d`.
- A Fase 12 do roadmap materializou-se na Sprint 11 e esta encerrada.
- A proxima sprint formal e a Sprint 12 - Integracoes Reais Autorizadas.
- A Sprint 12 governa o E13 e a lista fechada de integracoes aprovadas consta do ADR 002.
- A spec normativa da Sprint 12 e `docs/specs/015-authorized-real-integrations.md`.
- A V1.0 ainda nao pode ser declarada aceita porque as Sprints 13 e 14 ainda nao foram executadas.

## Baseline esperada

- `main` limpo.
- `main` alinhado com `origin/main`.
- Nenhum outro worktree ativo.
- Nenhum arquivo staged, modified, deleted, renamed ou untracked.
- Normalizacao documental mergeada antes de iniciar a implementacao.

## Branch sugerida

- `codex/sprint-12-integracoes-reais-autorizadas`

## Sprint formal

- Sprint 12 - Integracoes Reais Autorizadas.
- Epic principal: E13 - Integracoes Reais Autorizadas.
- Spec governante: `docs/specs/015-authorized-real-integrations.md`.

## Objetivo

Habilitar integracoes reais autorizadas, seguras, auditaveis e isoladas por canal, sem antecipar metricas, aprendizado ou V1 Acceptance.

## Bloqueio critico

Antes de criar branch funcional ou editar codigo, confirme que a documentacao oficial define explicitamente os provedores ou plataformas do E13. A lista aprovada para esta sprint e fechada no ADR 002. Nao implemente abstracoes genericas, OAuth hipotetico ou contratos inventados.

## Emenda arquitetural 2026-07-15

O conflito documental entre `youtube.upload` e `channels.list?mine=true` foi resolvido
no ADR 002 e na spec 015 com a decisão **`ADOPT_ADDITIONAL_READ_SCOPE`**:

- `youtube.upload` é exclusivo para upload;
- `youtube.readonly` é exclusivo para descoberta/verificação dos canais da conta;
- o escopo amplo `youtube` e Analytics continuam proibidos;
- conexões antigas sem o escopo de leitura exigem reautorização;
- seleção por ID informado apenas pelo frontend é proibida.

A decisão é documental. O código atual ainda solicita somente `youtube.upload` e,
portanto, permanece pendente de correção antes da conclusão da Sprint 12.

## Evidência real do bloqueio

Em 2026-07-15, OAuth real foi concluído e auditado, mas a listagem de canais falhou
com `YOUTUBE_CHANNELS_UNAVAILABLE`. A YouTube Data API v3 estava habilitada. Nenhum
upload foi executado; a autorização foi revogada remotamente e localmente; o
readiness permaneceu bloqueado; nenhum segredo apareceu no repositório ou logs.

## Historias incluidas

- Autorizacao humana documentada quando houver efeito externo.
- Estado de integracao por canal.
- Armazenamento seguro de tokens e segredos.
- Revogacao auditavel.
- Estados de erro operacionais.
- Isolamento por canal.
- Integracao aprovada: YouTube Data API com OAuth 2.0 Google.
- Descoberta server-side e reautorizacao do conjunto de escopos aprovado.

## Escopo

- Fluxo de autorizacao para integracoes reais.
- Estados de conexao, autorizacao, expiracao, revogacao e erro.
- Armazenamento seguro de segredos e tokens.
- Auditoria das decisoes relevantes.
- Conformidade e aprovacao humana quando houver efeito externo.
- Contratos afetados no frontend e no backend futuro apenas na extensao necessaria para a integracao autorizada.

## Fora de escopo

- Metricas e aprendizado.
- V1 Acceptance.
- Grandes modulos novos.
- Redefinicao de arquitetura.
- Recriacao do frontend.
- Substituicao do design system.
- Funcionalidades de sprints posteriores.
- Publicacao externa sem autorizacao.
- TikTok, Instagram e LinkedIn.
- Qualquer arquitetura generica hipotetica para contornar a ausencia de definicao aprovada.
- Destino YouTube baseado somente em identificador manual não verificado.
- Segredos em codigo, docs, commits ou logs.
- Aceitacao baseada apenas em CLI.
- Mascarar ausencia de integracao com mocks.

## Documentos obrigatorios

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/011-publication-assisted.md`
- `docs/specs/012-v1-acceptance.md`
- `docs/specs/014-metrics-learning.md`
- `docs/specs/015-authorized-real-integrations.md`
- `docs/architecture/adrs/002-e13-approved-providers.md`

## Validacoes exigidas

- Confirmar que `main` esta limpa e alinhada com `origin/main`.
- Confirmar que a normalizacao documental foi mergeada antes de qualquer implementacao.
- Executar `git diff --check`.
- Executar `git status --short`.
- Executar os comandos normais do repositorio que sejam aplicaveis ao escopo documental.
- Se houver alteracao de frontend, incluir validacao visual pertinente.
- Se a conclusao da sprint for negativa, registrar bloqueios com evidencia reproduzivel.

## Riscos conhecidos

- Confundir Fase 12 historica com Sprint 12 de execucao.
- Tratar Publicacao Assistida como trabalho ainda aberto quando ela ja foi encerrada.
- Aceitar V1.0 sem evidencias operacionais integradas.
- Mascarar integracoes ausentes com mocks ou fluxo apenas por CLI.
- Antecipar Sprint 13 ou Sprint 14.

## Definition of Done

- A decisao final da Sprint 12 e `DONE`, `DONE_WITH_LIMITATIONS` ou `BLOCKED`, sem declarar aceite da V1.0.
- A conclusao exige evidencia de execucao do fluxo aplicavel pelo frontend quando houver interface correspondente.
- Mocks comprovam comportamento controlado, mas nao substituem validacao real quando credenciais seguras estiverem disponiveis.
- Qualquer decisao negativa deve listar bloqueios, severidade, evidencia e proximo trabalho necessario.
- A documentacao deve permanecer coerente entre Documento Mestre, roadmap, backlog, handoff e spec.
- A lista de integracoes aprovada para E13 e fechada e deve ser mantida como YouTube apenas, salvo nova decisao formal.
- O gate E13 só pode ser promovido após implementação corretiva de H12.5, nova autorização com os dois escopos, seleção server-side, upload privado/não listado, idempotência e revogação reais.

## Proibicoes

- Nao reiniciar esta correcao documental.
- Nao antecipar Sprints 13 ou 14.
- Nao implementar produto fora da spec.
- Nao declarar aceite sem evidencia.
- Nao publicar externamente sem autorizacao.
- Nao solicitar ou registrar segredos.
- Nao iniciar implementacao enquanto os provedores ou plataformas do E13 nao estiverem explicitamente aprovados.
- Nao antecipar TikTok, Instagram ou LinkedIn sem nova decisao formal.
