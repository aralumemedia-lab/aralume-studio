# Sprint 22 - Remediacao dos findings do reaceite V1

## Identificacao

- Sprint: Sprint 22
- Epico governante: E15 - Hardening V1.0
- Iniciativa: Remediacao da Operabilidade da V1
- Spec: esta especificacao
- Estado inicial: V1.0 permanece `NAO ACEITA`; `R14-REACCEPT` nao iniciado
- Objetivo: fechar findings materiais de auditoria, isolamento por canal e reproducibilidade E2E sem executar o novo aceite integral

## Escopo obrigatorio

1. Persistir o `requestId` no campo `AuditLog.requestId`; `metadata` nao e substituto.
2. Auditar criacao e alteracao de pautas, pesquisas, roteiros, versoes, planos visuais e cenas.
3. Exigir `channelId` ativo em leituras detalhadas de scripts, versoes, planos visuais e cenas.
4. Rejeitar acesso cross-channel com resposta sanitizada e regressao automatizada.
5. Criar o runner reproduzivel ausente da Sprint 15.
6. Corrigir o encerramento e o codigo de saida do runner da Sprint 17.
7. Corrigir timeout, assercoes e limpeza de processos do runner da Sprint 18.
8. Garantir teardown de servidores/processos em erro nos runners E2E das Sprints 15 a 21.
9. Reexecutar e registrar evidencias dos fluxos relacionados a V1-03 ate V1-10.
10. Manter a cobertura de regressao dos criterios ja integrados de V1-01, V1-02 e V1-11 a V1-18; a matriz formal somente muda no `R14-REACCEPT`.

## Fora de escopo

- Novo aceite integral V1; ele continua sendo o gate `R14-REACCEPT` posterior.
- Release, tag, deploy, publicacao externa, OAuth, novos provedores ou novos criterios.
- Alteracao da matriz historica de Sprint 14 ou sobrescrita de evidencias anteriores.
- Banco, migration, mudanca de persistencia, redesign ou refatoracao ampla.
- Mudanca funcional em E16-E19 fora dos findings listados.

## Regras de contrato

- Respostas de erro permanecem nos envelopes oficiais e sem stack trace, payload bruto, IDs de canal esperados ou segredos.
- Detalhes canal-scoped exigem `?channelId=<canal-ativo>`; ausencia ou canal invalido retorna validacao sanitizada, e canal divergente retorna `404 NOT_FOUND` generico.
- `AuditLog.requestId` deve ser igual ao `x-request-id`/`meta.requestId` da mutacao de origem.
- Auditoria de mutacao deve conter `channelId`, `entityType`, `entityId`, `actor`, `action`, `status`, `requestId` e mensagem sanitizada.

## Historias e criterios de aceite

### H22.1 - Auditoria editorial estruturada

- Todas as mutacoes de pauta, pesquisa/sessao/fonte/claim, roteiro, versao, plano visual e cena geram log consultavel.
- O `requestId` aparece em `AuditLog.requestId`, nunca somente em `metadata`.
- Testes cobrem criacao, alteracao, request correlation e ausencia de segredo.

### H22.2 - Isolamento de detalhes editoriais

- GET de script, versao, plano visual e cena exige `channelId` ativo.
- Mesmo canal retorna o recurso; canal divergente retorna `404` sanitizado; nenhum dado e exposto.
- Testes de HTTP cobrem ausencia, canal divergente e canal correto.

### H22.3 - Evidence runners reproduziveis

- Existe `scripts/sprint15-browser-e2e.mjs`.
- Runners Sprints 15-21 retornam `0` somente apos sucesso integral e `1` em falha.
- Teardown encerra filhos e descendentes mesmo quando assercao, timeout ou browser falha.
- O diretorio de evidencia pode ser sobrescrito por variavel de execucao; o default historico nao e usado nesta remediacao.

## Validacoes obrigatorias

- `git diff --check`
- `npm run lint`
- `npm run backend:check`
- `npm test`
- testes adicionais de auditoria e isolamento fora do script oficial
- `npm run build`
- runners E2E Sprint 15, 16, 17, 18, 19, 20 e 21
- verificacao de portas 3001/4173 e ausencia de processos orfaos

## Evidencia e encerramento

- Nova evidencia sera registrada em `docs/acceptance/v1/V1_SPRINT22_REMEDIATION_EVIDENCE.md` e nunca substituira os bundles historicos.
- A sprint nao executa `R14-REACCEPT`.
- Definition of Done: codigo, testes, runners, documentacao e evidencia no mesmo head; nenhum segredo; working tree limpo apos commit.
