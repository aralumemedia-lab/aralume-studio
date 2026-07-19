# Sprint 24 - Seguranca de entrada e isolamento multicanal

## Identificacao

- Sprint: Sprint 24
- Epico governante: E15 - Hardening V1.0
- Spec: `docs/specs/025-sprint-24-security-isolation.md`
- Branch: `codex/sprint-24-production-security-isolation`
- Base autorizada: `0e81d9dc1e77bd0959cf1d223097312e555587d3`
- Dependencia: Sprint 23 integrada pela PR #38 com readiness `NOT_READY`
- V1 funcional: R14 `V1.0 ACCEPTED`, 18/18 `PASS`
- Limite: nenhuma release, tag, implantacao ou remediacao de backup/restore/rollback nesta unidade

## Objetivo

Fechar os controles de entrada e isolamento que impedem a preparacao produtiva: principal autenticado fail-closed, autorizacao server-side, escopo por `channelId`, protecao de midia e limites verificaveis de upload/importacao. A unidade nao altera a matriz historica do R14 nem transforma readiness em autorizacao de release.

## Historias

### H24.1 - Autenticacao inbound fail-closed

- Rotas operacionais sob `/api` exigem um principal autenticado.
- O principal e derivado de um bearer token assinado por segredo configurado no backend; headers livres de identidade nao sao autoridade.
- O token valida `sub`, `role`, `channelIds` e expiracao quando presente; payload invalido, assinatura invalida, ausente ou expirado retorna `UNAUTHORIZED`.
- Em `production`, o segredo de assinatura e obrigatorio e nao existe fallback permissivo.
- O bypass de testes e opt-in explicito no harness, somente fora de `production`, e nao e usado pelo entrypoint real.
- Respostas de autenticacao nao expõem token, payload bruto, segredo ou stack.

### H24.2 - Autorizacao e isolamento por canal

- Papeis minimos: `owner`, `editor`, `operator`, `reviewer` e `viewer`.
- Cada rota declara permissao minima; ausencia de papel/permissao falha fechada.
- A consulta ou mutacao aplica o canal autorizado no service/repository, nunca apenas no frontend.
- Ausencia de `channelId`, canal divergente ou objeto de outro canal nao confirma existencia cross-channel.
- Rotas de lista, detalhe, criacao, alteracao e acoes operacionais validam identidade, permissao e canal antes do dominio.

### H24.3 - Protecao de midia, render e cortes

- Media assets, validacao de storage/integridade, usos, videos, renders, cortes, arquivos de cortes e importacoes usam a mesma fronteira de autenticacao/autorizacao.
- O ativo de entrada deve existir no canal autorizado; referencias e paths arbitrarios sao rejeitados.
- Downloads e leituras de arquivo verificam canal, status, storage root e arquivo regular antes de responder.
- Erros de acesso cross-channel sao sanitizados e nao retornam paths internos ou ids de objetos de outros canais.

### H24.4 - Limites de upload e importacao

- O parser JSON aplica limite de corpo; schemas aplicam limites de itens, strings, MIME, extensao, path e campos obrigatorios.
- Importacao de storage aceita somente path relativo normalizado sob o root autorizado e sob o prefixo do canal.
- Arquivos devem ser regulares, existir, ter tamanho dentro do limite, MIME/extensao permitidos e metadados tecnicos validaveis.
- Duplicatas, traversal, storage cross-channel, payload excessivo e quantidade excessiva de itens falham com resposta sanitizada.
- Timeouts de importacao/validacao sao definidos no service e nao permitem trabalho ilimitado.

### H24.5 - Auditoria e evidencia negativa

- Decisoes relevantes registram `requestId`, ator, papel, `channelId`, acao, recurso, resultado, motivo sanitizado e timestamp.
- Tokens, cookies, segredos, credenciais e paths sensiveis nao entram no log.
- Testes cobrem ausencia/invalidade de identidade, permissao insuficiente, canal divergente, IDOR, midia cross-channel, arquivo nao autorizado, traversal, MIME/extensao, payload e quantidade.
- Testes positivos preservam operacoes autorizadas no canal correto e os fluxos R14 ja aceitos.

## Contrato de autenticacao

O header `Authorization` usa `Bearer <payload>.<signature>`, com payload JSON base64url contendo `sub`, `role`, `channelIds` e opcionalmente `exp` em epoch seconds. A assinatura e HMAC-SHA256 sobre o payload base64url usando `ARALUME_AUTH_SIGNING_SECRET`. O backend rejeita algoritmo/forma ausente, payload desconhecido, papel invalido, escopo vazio ou expiracao vencida. O formato e um contrato interno para esta unidade; nenhuma UI deve armazenar ou expor o segredo.

O harness pode usar um principal de teste somente por opt-in explicito de `CreateAppOptions` e nunca quando `ARALUME_ENV=production`. O entrypoint `server/src/index.ts` nao habilita esse modo.

## Matriz minima de permissoes

| Papel | Leitura | Escrita editorial | Midia/render/import | Governanca/publicacao |
| --- | --- | --- | --- | --- |
| `owner` | sim | sim | sim | sim |
| `editor` | sim | sim | sim | nao |
| `operator` | sim | nao | sim | nao |
| `reviewer` | sim | nao | nao | sim |
| `viewer` | sim | nao | nao | nao |

Operacoes sem um papel explicitamente permitido falham fechada. O `channelId` do request deve estar contido no escopo do principal, salvo leitura global de canais autorizada ao `owner` conforme a implementação e os testes da sprint.

## Fora de escopo

- Backup, restore, rollback, topologia produtiva, ingress, TLS e observabilidade produtiva completa.
- Release, tag, deploy, publicacao externa e aceite formal de risco.
- Correcao indiscriminada dos 18 diagnosticos globais de TypeScript; somente diagnosticos diretamente tocados pela alteracao podem ser corrigidos.
- Novas funcionalidades editoriais ou alteracao dos criterios historicos R14.

## Quality gates

- `git diff --check`
- lint
- backend typecheck
- `npx tsc --noEmit`, registrando os diagnosticos globais restantes
- suite oficial e testes negativos especificos de auth, autorizacao, canal, midia e importacao
- build e analise de seguranca aplicavel
- runners E2E afetados, quando a interface correspondente for exercitada
- inspeccao de segredos, processos orfaos, portas e working tree

## Criterios de bloqueio

O resultado e `BLOCKED` ou `NOT_READY` se qualquer rota operacional permanecer sem autenticacao, houver fallback permissivo, IDOR/cross-channel reproduzivel, midia sem autorizacao, importacao sem limite verificavel, segredo exposto, teste negativo critico falhar, regressao R14 surgir ou spec/contrato/implementacao divergirem.

## Definition of Done

- Historias H24.1-H24.5 implementadas em uma unica fatia coerente e rastreavel.
- Testes positivos e negativos reproduzem as fronteiras de seguranca sem enfraquecer assercoes.
- Auditoria sanitizada comprova sucesso e rejeicao.
- Evidencia operacional registra comandos, resultados, portas, processos e limitacoes.
- PR exclusiva da Sprint 24 aberta em draft para revisao independente; nenhum merge, release, tag ou deploy nesta unidade.
