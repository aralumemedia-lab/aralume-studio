# Sprint 24 - Evidencia de seguranca de entrada e isolamento multicanal

## Estado e governanca

- Sprint: Sprint 24
- Epico: E15 - Hardening V1.0
- Spec: `docs/specs/025-sprint-24-security-isolation.md`
- Branch: `codex/sprint-24-production-security-isolation`
- Base integrada: `origin/main` em `92f72f5e283b2921f4af62b0a9d7c37b8d477cb2`
- Base original autorizada: `0e81d9dc1e77bd0959cf1d223097312e555587d3`
- Merge de integracao: `3e198e1` (`Merge origin/main into Sprint 24 security isolation`)
- Commit funcional avaliado: `e818b4094e8ac9d52a22921cb3a4951c07d26493`
- HEAD final da revisao: `6d27bbf`
- V1 funcional: `V1.0 ACCEPTED`, R14 com 18/18 criterios `PASS`
- Readiness da release: `NOT_READY`
- Esta unidade nao autoriza merge da PR, release, tag ou deploy.
- Estado desta unidade: `READY_FOR_REVIEW`

## Entregas

- H24.1/H24.2: autenticacao HMAC-SHA256 fail-closed, matriz de papeis, permissao server-side, escopo explicito de `channelIds`, autorizacao de parametros de path depois do matching da rota, isolamento e erros sanitizados.
- H24.3: ativos, usos, videos, renders, cortes, arquivos e importacoes preservam storage root, canal autorizado, protecao contra traversal e IDOR.
- H24.4: payload, quantidade, MIME, extensao, profundidade JSON e importacao sao limitados; ativos `available` exigem arquivo regular existente, nao-symlink, tamanho/checksum reais e tipo real compativel.
- H24.5: auditoria de media/importacao recebe o principal autenticado validado, `channelId` e `requestId`; campos de identidade enviados pelo cliente nao substituem o ator confiavel.

## Gates reproduziveis

| Comando                                                                                                        | Resultado                                            |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `git diff --check`                                                                                             | PASS                                                 |
| `npm run lint`                                                                                                 | PASS                                                 |
| `npm run backend:check`                                                                                        | PASS                                                 |
| `npm test`                                                                                                     | PASS - 92/92                                         |
| `node --import tsx --test server/test/media-assets.test.ts server/test/auth.test.ts server/test/costs.test.ts` | PASS - 19/19                                         |
| `npm run build`                                                                                                | PASS                                                 |
| `npx tsc --noEmit` na branch                                                                                   | FAIL - exit code 2, 14 diagnosticos                  |
| `npx tsc --noEmit` em worktree de `origin/main`                                                                | FAIL - exit code 2, 18 diagnosticos                  |
| `bun audit`                                                                                                    | FAIL - 3 advisories transitivos (1 low, 2 moderate)  |
| scan de segredos                                                                                               | PASS - nenhum segredo material encontrado            |
| `node --test scripts/e2e-process-utils.test.mjs`                                                               | PASS - 5/5 testes de lifecycle, exit code e teardown |

O typecheck global continua sendo um gate falho. A branch possui 14 diagnosticos; o baseline atual de `origin/main` possui 18. A comparacao foi executada em worktree temporaria e confirmou que os quatro diagnosticos adicionais do baseline estao em fixtures editoriais que foram ajustadas pela correcao de escopo de canal da propria Sprint 24. Os 14 diagnosticos restantes nao foram ocultados por `any`, `@ts-ignore`, exclusao de arquivo ou alteracao de `tsconfig`; permanecem registrados como risco e bloqueador de release.

## Correcoes e evidencias negativas

- Identidade de auditoria: media e importacao recebem contexto derivado de `getTrustedAuditActor(req)`. `decidedBy`, `x-aralume-actor` e campos equivalentes nao sao autoridade. Auditorias de sucesso, rejeicao, replay e falha carregam o principal autenticado e o `AuditLog.requestId`; token, cookie, assinatura e segredo nao sao persistidos.
- MP4 estrutural: a deteccao ISO-BMFF exige boxes validos, `ftyp` como primeiro box, limites de tamanho, `moov` e `mdat`; um arquivo de 12 bytes com apenas `ftyp` e rejeitado. Importacao tambem exige resultado FFprobe compativel com o contrato MP4, timeout e caminho previamente autorizado.
- Persistencia: arquivo inexistente, diretorio, symlink, traversal, canal incorreto, checksum/tamanho/MIME/extensao incompatíveis e conteudo truncado nao criam ativo `available` nem auditoria de sucesso falsa.
- Profundidade JSON: `MAX_JSON_DEPTH=32`, travessia iterativa para objetos e arrays, rejeicao antes da persistencia e resposta sem stack trace.
- Testes de regressao: cobertura focada inclui identidade forjada, principal confiavel, `requestId`, validacao de arquivo real, MP4 truncado, auditoria de importacao e ausencia de persistencia apos rejeicao.

## E2E e evidencias operacionais

Os runners historicos `scripts/sprint15-browser-e2e.mjs` a `scripts/sprint21-browser-e2e.mjs` passaram individualmente com exit code 0. Eles continuam documentados como cobertura funcional com bypass de teste explicitamente marcado (`ARALUME_ENV=test`, `ARALUME_AUTH_TEST_BYPASS=true`), e nao como prova de autenticacao real.

O novo runner `scripts/sprint24-security-hmac-e2e.mjs` passou com credencial HMAC efemera em runtime, principal owner com `channelIds: ["ch_historia"]`, sem wildcard e sem bypass. Reproduziu autorizacao `200`, cross-channel `403`, conflitos body/query `403`, token ausente `401`, token invalido `401`, papel insuficiente `403`, ausencia de mutacao rejeitada e auditoria confiavel com `requestId`. Foram geradas duas screenshots suplementares em `screenshots/sprint-24-security-hmac/`. As 56 screenshots historicas em `screenshots/sprint-24-security/` permanecem preservadas.

O utilitario de processo agora limpa diretorios de evidencia antes de cada runner, verifica portas antes de iniciar servidores, registra `error`/`exit`/`close`, diferencia encerramento solicitado de falha inesperada, propaga exit codes nao-zero, agrega falhas de teardown, mata a arvore de processos no Windows e grupos de processo em POSIX, e falha se o processo filho permanecer ativo apos o teardown. Os runners 17-21 passaram a consumir o mesmo lifecycle compartilhado; os testes de regressao cobrem falha tardia, erro de spawn, teardown agregado e exit code do coordenador.

## Dependencias e riscos residuais

`bun audit` retornou:

- `@babel/core`, cadeia `@tanstack/router-plugin`/`@vitejs/plugin-react`/`@tanstack/react-start`: low, GHSA-4x5r-pxfx-6jf8;
- `brace-expansion`, cadeia de ESLint/TypeScript tooling: moderate, GHSA-jxxr-4gwj-5jf2;
- `js-yaml`, cadeia de ESLint/TanStack Start: moderate, GHSA-h67p-54hq-rp68.

Os advisories sao transitivos, nao foram introduzidos ou agravados por esta unidade. O `package.json` foi alterado somente para incluir `server/test/auth.test.ts` na suite oficial; nao houve alteracao de dependencias, versoes ou do `bun.lock`. Eles continuam bloqueadores de release e devem ser tratados em unidade propria.

A release 1.0.0 permanece `NOT_READY` por pendencias de backup/restore, rollback, observabilidade produtiva, topologia/ingress, advisories e os 14 diagnosticos TypeScript globais. Nao existe aceite formal de risco nesta unidade.

## Decisao

`READY_FOR_REVIEW`. A implementacao esta pronta para nova revisao independente. O aceite funcional historico do R14 permanece valido, mas este resultado nao autoriza producao, release, tag ou deploy.
