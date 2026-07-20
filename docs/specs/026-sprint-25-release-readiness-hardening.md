# Sprint 25 - Hardening técnico de release readiness

## Identificação e decisão normativa

- Sprint: Sprint 25
- Spec: `docs/specs/026-sprint-25-release-readiness-hardening.md`
- Épico governante: E15 - Hardening V1.0
- Base: `15d113ad0181164af306e28a61aae5b0ec28bea5`
- Decisão: a documentação formaliza Sprint 24 como a unidade anterior e não reserva outra numeração. Sprint 25 e Spec 026 são, portanto, o próximo número normativo documentado nesta unidade.
- Branch: `codex/sprint-25-release-readiness-hardening`
- Estado inicial: V1 funcionalmente aceita pelo R14; release 1.0.0 `NOT_READY`.

## Objetivo

Eliminar legitimamente os diagnósticos do typecheck global, remediar ou classificar formalmente os advisories transitivos e tornar inequívoca a identidade dos serviços iniciados pelos runners E2E, produzindo evidência reproduzível para os gates técnicos.

## Histórias incluídas

### RR25.1 - Typecheck global

- Corrigir os 14 diagnósticos reproduzidos por `npx tsc --noEmit`.
- Preservar `strict` e os contratos existentes.
- Não usar `any`, `@ts-ignore`, casts duplos, exclusões ou relaxamento de `tsconfig`.

### RR25.2 - Dependências

- Remediar `@babel/core`, `brace-expansion` e `js-yaml` com a menor atualização compatível, ou registrar classificação formal caso a remediação falhe.
- Atualizar e revisar `package.json`/`bun.lock` somente quando necessário.

### RR25.3 - Identidade dos serviços

- Associar cada execução E2E a um `runId` efêmero.
- Propagar o `runId` aos processos iniciados pelo runner.
- Validar serviço esperado, `runId` exato, porta esperada e processo ainda vivo.
- Rejeitar servidor antigo, processo de outra execução, serviço incorreto e processo alheio que responda HTTP.

### RR25.4 - Evidência e gates

- Reexecutar os gates técnicos.
- Incluir testes positivos e negativos de identidade.
- Registrar lifecycle de agentes, comandos, resultados, riscos residuais e fora de escopo.

## Fora de escopo

- Configuração produtiva e secrets.
- Backup e restore.
- Rollback.
- Observabilidade ampla.
- Topologia produtiva e ingress.
- Nova avaliação integral de release readiness.
- Release, tag, deploy ou publicação externa.
- Alteração da matriz histórica R14 ou dos documentos históricos das Sprints 23 e 24.

## Decisões técnicas

- TypeScript: corrigir causas de tipagem nos testes, mocks e rotas, sem enfraquecer o compilador.
- Advisories: atualizar seletivamente para `@babel/core` 7.29.6, `brace-expansion` 5.0.6 e `js-yaml` 4.2.0, se a resolução do lockfile confirmar compatibilidade.
- Identidade: usar `runId` criptograficamente aleatório por execução, propagado por ambiente; o backend deve expô-lo no health apenas quando fornecido, e o frontend deve expor endpoint de identidade somente em ambiente E2E/teste.
- Runner: substituir health HTTP genérico por validação de identidade esperada e falha imediata se o processo iniciado morrer antes da confirmação.
- Ownership: a aprovação de readiness também exige challenge-response HMAC com segredo efêmero em memória do processo iniciado; runId, nonce, PID e porta são metadados auxiliares, não prova de posse.
- Lifecycle: waiters de startup devem ter timeouts independentes sem remover listeners de outros waiters; teardown deve preservar erro primário e falhas secundárias; testes devem sincronizar por eventos, nunca por sleep fixo.

## Arquivos prováveis

- `server/test/clips.test.ts`
- `server/test/metrics.test.ts`
- `src/mocks/mock-metrics.ts`
- `src/routes/media-assets.tsx`
- `src/routes/production.tsx`
- `package.json`
- `bun.lock`
- `server/src/routes/health.ts`
- `server/src/env.ts` ou configuração equivalente
- `vite.config.ts`
- `scripts/e2e-process-utils.mjs`
- `scripts/e2e-process-utils.test.mjs`
- runners E2E 15-21 e HMAC
- evidência e documentos de release readiness

## Gates de aceitação

- `npx tsc --noEmit` termina com exit code 0 e zero diagnósticos.
- `bun audit` termina sem os três advisories conhecidos, ou cada exceção é formalmente classificada com risco residual e permanece bloqueadora quando aplicável.
- `npm run lint`, `npm run backend:check`, `npm test` e `npm run build` passam.
- `node --test scripts/e2e-process-utils.test.mjs` cobre identidade correta, `runId` divergente, serviço incorreto, processo morto e teardown.
- Runners 15-21 e `sprint24-security-hmac-e2e.mjs` validam o serviço correto e não reutilizam processos antigos.
- Portas 3001, 4173 e 8080 estão livres antes e depois dos runners.
- A prova HMAC rejeita endpoint independente, MAC inválida, challenge ausente, expirado ou reutilizado; o segredo não aparece em endpoint, IPC, logs ou evidência.
- Waiters concorrentes, erros agregados, sincronização por eventos e checklist de portas/processos são cobertos na evidência canônica.
- Não há processo órfão, segredo exposto, tag, release ou deploy.

## Critérios de bloqueio

O resultado permanece `NOT_READY` se qualquer diagnóstico TypeScript permanecer, advisory não for remediado/classificado, identidade não for validada inequivocamente, teste crítico falhar, regressão surgir ou documentação divergir.

## Evidência esperada

`docs/acceptance/v1/V1_SPRINT25_RELEASE_READINESS_HARDENING_EVIDENCE.md`, contendo preflight, baseline, relatórios de agentes, decisões, diff lógico, comandos, resultados, testes negativos, riscos residuais e confirmação explícita de que release/deploy não ocorreram.
