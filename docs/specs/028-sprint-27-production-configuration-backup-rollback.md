# Sprint 27 - Configuracao produtiva, backup/restore e rollback

## Identificacao normativa

- Sprint: Sprint 27
- Spec: `docs/specs/028-sprint-27-production-configuration-backup-rollback.md`
- Epic governante: E15 - Hardening V1.0
- Base: `c734d8f0d1f68c20cc254d2e58833c90a1c9a751`
- Branch: `codex/sprint-27-production-configuration-backup-rollback`
- Decisao: a Sprint 26 / Spec 027 fechou a remediacao de advisories e nao reservava uma unidade posterior. A Sprint 27 / Spec 028 e, portanto, a proxima unidade normativa registrada antes da implementacao.
- Estado da release: V1.0 permanece funcionalmente aceita; release 1.0.0 permanece `NOT_READY`.

## Objetivo

Implementar configuracao produtiva fail-closed para o runtime atual, inventario de secrets, backup reproduzivel, restore real em ambiente limpo, rollback de aplicacao e do estado persistido por arquivo, e evidencia operacional baseada em execucao real.

Esta unidade nao autoriza release, tag ou deploy.

## Contexto tecnico atual

O runtime atual usa um modelo misto de durabilidade:

- configuracao de ambiente e segredos via `server/src/env.ts`;
- JSON persistido em `.aralume-state/` sob `ARALUME_ASSET_STORAGE_ROOT`;
- artefatos de midia e renderizacao no storage autorizado;
- dominios de Canais, Editorial e Governanca ainda em memoria;
- `/health` continua sendo liveness e identidade de teste, nao readiness produtiva.

Esta sprint trata o modelo atual de persistencia e storage. Ela nao introduz um banco relacional novo, migrations produtivas ou um provedor externo de backup.

## Historias incluidas

### RC27.1 - Configuracao produtiva fail-closed

- Definir esquema tipado por ambiente: `development`, `test`, `staging` e `production`.
- Em producao, falhar antes de abrir listeners quando configuracao obrigatoria estiver ausente ou invalida.
- Rejeitar configuracao de teste, bypass de teste e segredos/test fixtures em producao.
- Sanitizar mensagens de erro.
- Preservar defaults seguros apenas fora de producao.

### RC27.2 - Inventario e protecao de secrets

- Inventariar variaveis e segredos por finalidade, consumidor, ambiente, formato, rotacao e revogacao.
- Garantir que segredos reais nao aparecam em Git, logs, erros, screenshots ou evidencia.
- Registrar classificacao de variaveis de teste, legado, futura integracao e producao.
- Executar secret scan e registrar resultado.

### RC27.3 - Backup reproduzivel

- Definir e implementar backup consistente para os JSON persistidos e para o storage de midia/rede do runtime atual.
- Registrar timestamp, versao e schema do backup.
- Calcular checksum verificavel.
- Falhar explicitamente em falhas de leitura/escrita ou checksum.
- Nao sobrescrever backup valido silenciosamente.
- Validar canonicamente `manifest.files` contra o conteudo real do snapshot, com paths relativos normalizados, sem duplicidade e com checksums por arquivo.

### RC27.4 - Restore e rollback

- Restaurar em ambiente limpo e isolado a partir de um backup verificado.
- Rejeitar backup corrompido, checksum divergente e schema incompativel.
- Definir rollback de aplicacao e rollback do estado persistido como recuperacao suportada pelo backup.
- Diferenciar rollback, restore de desastre e correcao forward.
- Rejeitar aliases de filesystem, symlinks e junctions no backup e no restore por identidade canonica real, em Windows e POSIX.

### RC27.5 - Evidencia e gates

- Reexecutar os gates tecnicos e operacionais relacionados.
- Documentar estados inicial e final, comandos, resultados, riscos residuais e limitacoes.
- Registrar o HEAD funcional validado na evidencia, sem autorreferencia estavel do SHA do proprio commit documental.

## Fora de escopo

- Release, tag, deploy ou alteracao de topologia produtiva.
- CI hospedado, branch protection, rulesets ou CODEOWNERS.
- Observabilidade ampla ou novas integracoes externas.
- Banco relacional novo, migrations produtivas novas ou provider externo de backup.
- Novos fluxos editoriais, front-end funcional novo ou remediacao fora da area operacional descrita acima.

## Decisoes tecnicas

- Producoes devem falhar closed quando configuracao obrigatoria estiver ausente ou quando variaveis de teste estiverem presentes.
- O inventario de secrets deve refletir a superficie real do runtime e distinguir variaveis de teste, producao, legado e futuras integracoes.
- O backup deve cobrir o estado persistido do runtime atual: arquivos JSON sob `.aralume-state/` e os artefatos de storage associados.
- O restore deve validar checksums antes de mutar o destino.
- O rollback deve ser expresso como recuperacao de aplicacao e estado a partir de backup verificado, nao como sobrescrita parcial silenciosa.
- Se futuramente houver banco relacional, a documentacao desta sprint deve ser atualizada em vez de ser reinterpretada retroativamente.

## Arquivos provaveis

- `server/src/env.ts`
- `server/src/index.ts`
- `server/src/modules/shared/persistent-state.ts`
- `server/src/modules/media-assets/media-assets.storage.ts`
- `server/src/modules/*/*.repository.ts`
- `server/test/env.test.ts`
- novos testes de backup/restore/rollback
- `docs/ENVIRONMENT.md`
- `docs/BACKEND_SETUP.md`
- `docs/releases/1.0.0/RELEASE_NOTES.md`
- `docs/releases/1.0.0/VALIDATION_CHECKLIST.md`
- `docs/releases/1.0.0/DEPLOYMENT_PLAN.md`
- `docs/releases/1.0.0/ROLLBACK_PLAN.md`
- `docs/acceptance/v1/V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md`

## Gates de aceitação

- Configuracao produtiva falha antes da abertura de listener quando o ambiente de producao estiver incompleto ou contaminado por variaveis de teste.
- Inventario de secrets e documentos operacionais ficam coerentes com o estado real da aplicacao.
- Backup cria artefato consistente com timestamp, versao, schema e checksum.
- Restore em ambiente limpo reconstitui o estado e rejeita corrupcao ou checksum divergente.
- Rollback utiliza o fluxo de backup/restore para recuperar aplicacao e estado persistido.
- `npm run lint`, `npm run backend:check`, `npx tsc --noEmit`, `npm test` e `npm run build` passam.
- `bun install --frozen-lockfile` passa.
- `bun audit` e `secret scan` sao executados e registrados.
- Runners 15-21 e runner HMAC permanecem verdes.
- Portas 3001, 4173 e 8080 ficam livres ao final, sem processos orfaos.

## Evidencia esperada

`docs/acceptance/v1/V1_SPRINT27_PRODUCTION_CONFIGURATION_BACKUP_ROLLBACK_EVIDENCE.md`, com preflight, inventario de secrets, backup, checksum, restore limpo, rollback, testes negativos, gates, riscos residuais e confirmacao de que release/deploy nao ocorreram.
