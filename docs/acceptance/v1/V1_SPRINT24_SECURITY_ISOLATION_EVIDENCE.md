# Sprint 24 — Evidência de segurança de entrada e isolamento multicanal

## Estado

- Sprint: Sprint 24
- Épico: E15 — Hardening V1.0
- Spec: `docs/specs/025-sprint-24-security-isolation.md`
- Branch: `codex/sprint-24-production-security-isolation`
- Base funcional: `0e81d9dc1e77bd0959cf1d223097312e555587d3`
- V1 funcional: `V1.0 ACCEPTED`, R14 com 18/18 critérios `PASS`
- Readiness de release: `NOT_READY`; esta sprint não autoriza release, tag, deploy ou merge
- Estado desta unidade: `READY_FOR_REVIEW`

## Entregas por história

- H24.1: bearer token HMAC-SHA256 validado no backend, expiração validada, ausência/invalidade rejeitada com `UNAUTHORIZED`, segredo obrigatório em produção e bypass somente em testes explicitamente marcados.
- H24.2: matriz de papéis `owner`, `editor`, `operator`, `reviewer` e `viewer`; permissões fail-closed; `channelId` obrigatório nas superfícies operacionais; conflitos de canal, IDOR e cross-channel rejeitados com `FORBIDDEN` sanitizado.
- H24.3: media assets, usos, vídeos, renders, cortes, arquivos de cortes e importações permanecem protegidos por autenticação, autorização, canal e storage root.
- H24.4: limite de JSON, limite de itens de render/cenas, MIME/extensão compatíveis, importação somente de MP4 relativo sob storage autorizado e rejeição de traversal/cross-channel.
- H24.5: decisões de autenticação/autorização registram `requestId`, ator, papel, canal, ação, recurso, resultado e motivo sanitizado; tokens, cookies e segredos não entram nos logs.

## Validações reproduzíveis

| Comando                             | Resultado                                            |
| ----------------------------------- | ---------------------------------------------------- |
| `git diff --check`                  | PASS                                                 |
| `npm run lint`                      | PASS                                                 |
| `npm run backend:check`             | PASS                                                 |
| `npm test`                          | PASS — 89/89                                         |
| `npm run build`                     | PASS                                                 |
| `npx tsc --noEmit` na branch        | FAIL — exit code 2; 14 diagnósticos restantes        |
| `npx tsc --noEmit` em `origin/main` | FAIL — exit code 2; 18 diagnósticos preexistentes    |
| `npm audit --audit-level=high`      | NÃO EXECUTÁVEL — repositório não possui lockfile npm |
| inspeção de segredos com `rg`       | PASS — nenhum padrão sensível encontrado             |

Os quatro diagnósticos de `ScenePlanCreateInput.channelId` foram diretamente tocados pela exigência de escopo da Sprint 24 e corrigidos. Os 14 restantes permanecem equivalentes ao baseline nas áreas de `server/test/clips.test.ts`, `server/test/metrics.test.ts`, `src/mocks/mock-metrics.ts`, `src/routes/media-assets.tsx` e `src/routes/production.tsx`; não foram ampliados pela sprint.

Testes específicos executados incluem autenticação ausente/inválida, identidade fornecida pelo cliente, papel sem permissão, canal ausente/divergente, leituras cross-channel, payload acima do limite, auditoria sanitizada, MIME/extensão incompatíveis, traversal, storage cross-channel e importação inválida. O teste editorial de regressão também preservou criação, alteração, versões, planos visuais e cenas no canal correto.

## E2E e operação

Os runners `scripts/sprint15-browser-e2e.mjs` até `scripts/sprint21-browser-e2e.mjs` foram executados com o bypass de teste explicitamente marcado (`ARALUME_ENV=test`, `ARALUME_AUTH_TEST_BYPASS=true`) e concluíram com exit code 0. As evidências novas foram gravadas sem sobrescrever históricos em `screenshots/sprint-24-security/`, com 56 screenshots.

Após os runners:

- porta 3001: livre;
- porta 4173: livre;
- porta 8080: livre;
- processos `tsx`, Vite e runners da aplicação: encerrados; nenhum processo órfão identificado;
- working tree: validada após a consolidação da unidade.

## Riscos residuais e condição de produção

- A release 1.0.0 continua `NOT_READY`. Autenticação/isolation foram endurecidas, mas backup/restore, rollback, observabilidade produtiva, topologia/ingress e advisories de dependências continuam fora desta sprint.
- Os 14 diagnósticos globais restantes devem ser tratados em sprint e PR funcional próprias antes da liberação produtiva; não há aceite formal de risco nesta unidade.
- A ausência de lockfile impede auditoria automatizada via `npm audit`; uma unidade de dependências deve fornecer lockfile e executar o gate correspondente.
- O bypass de teste não é uma credencial de produção e não deve ser habilitado fora de execução local explicitamente marcada.

## Decisão

A implementação da Sprint 24 está pronta para revisão independente (`READY_FOR_REVIEW`). A decisão não altera o aceite funcional histórico do R14 e não transforma o readiness `NOT_READY` em autorização de release.
