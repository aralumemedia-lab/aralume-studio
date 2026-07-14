# Codex Handoff - Sprint 11

## Estado atual

- Sprint 10 - Cortes Derivados Controlados foi concluida e integrada ao `main` via PR #17.
- A spec normativa e `docs/specs/010-derived-clips.md`.
- O dominio novo cobre cortes derivados, validacao temporal, video principal de origem, storage root autorizado, FFmpeg e FFprobe controlados, auditoria, custos, idempotencia e a rota `/clips`.
- O frontend da rota `/clips` agora consome o backend real de cortes derivados e nao depende de mocks crus.
- A base de canais, editorial, aprovacoes, custos e assets de midia ja estava integrada antes desta sprint e foi reutilizada sem reabrir escopo anterior.
- As validacoes locais principais ja passaram: typecheck, lint, build, testes e `git diff --check`.
- FFmpeg e FFprobe estao disponiveis no ambiente e a integracao real de cortes sera validada.
- O PR #17 foi mergeado.
- Merge commit: `dffd197449176fffab6ad6b93b6dfb0904cca513`.
- Sprint 9 - Renderizacao Controlada foi encerrada formalmente no PR #16 e permanece como base imediata desta implementacao.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- `main` e `origin/main` estao alinhados nesse SHA no estado atual.
- Historico anterior mantido abaixo para referencia operacional.

## Sprint 11 - Publicacao Assistida

- Sprint 11 foi implementada na branch `codex/sprint-11-publication-assisted`.
- PR aberto: `https://github.com/aralumemedia-lab/aralume-studio/pull/19`.
- A rota `/publications` agora consome backend real de publicacoes, com alvos, jobs, aprovacao humana, conformidade, auditoria e bloqueio de envio externo automatico.
- Validacoes executadas: `npm run lint`, `npm run backend:check`, `npm run test`, `npm run build`, `git diff --check`.
- Evidencias visuais geradas: `screenshots/publications-valid-1366x768.png`, `screenshots/publications-blocked-approval-1600x900.png`, `screenshots/publications-blocked-compliance-1792x1024.png`, `screenshots/publications-empty-1920x1080.png`, `screenshots/publications-details-1600x900.png`, `screenshots/publications-channel-switch-1366x768.png`.
- O isolamento por canal foi validado visualmente entre Historia, Curiosidades e Negocios.

## Sprint 5 - Editorial Pipeline

- A Sprint 5 foi concluida formalmente e integrada ao `main`.
- PR #12 foi mergeado.
- Merge commit: `9d6393738cb26264b876fe6b9e43f1435fc3a229`.
- A camada editorial adicionou ideias, pesquisas, fontes, evidencias, roteiros, versoes de roteiro, planos visuais, cenas e testes deterministas.
- As rotas `/ideas`, `/research`, `/scripts` e `/production` ja usam a API real do dominio editorial.
- O proximo passo operacional e a Sprint 6 - Approvals, Quality and Compliance.

## Sprint 3 - Channels Domain Foundation

- Spec normativa: `docs/specs/003-channels.md`.
- Escopo implementado: dominio de Canais no backend com listagem, criacao, consulta, atualizacao e settings.
- Endpoints reais disponiveis: `GET /api/channels`, `POST /api/channels`, `GET /api/channels/:id`, `PATCH /api/channels/:id`, `GET /api/channels/:id/settings`.
- Persistencia adotada: repositorio substituivel em memoria, sem banco real nesta sprint.
- Integracao frontend: concluida na Sprint 4 via PR #10.
- Exclusao fisica: nao implementada.
- PR de Sprint 3: `#8` MERGED.

## Sprint 4 - Channels Frontend Integration

- Spec normativa: `docs/specs/013-channels-frontend-integration.md`.
- Escopo implementado: `src/services/http-client.ts`, `src/services/channels-api.ts`, `src/components/aralume/channel-selection.ts`, `src/components/aralume/channel-context.tsx`, `src/components/layout/AppShell.tsx` e `src/routes/channels.tsx`.
- Endpoints consumidos: `GET /api/channels`, `GET /api/channels/:id/settings`, `PATCH /api/channels/:id`.
- Proxy local: `vite.config.ts` aponta `/api` para `http://127.0.0.1:3001`.
- Estados validados: loading, empty, error, canal ativo, canal pausado, selecao de canal, mutacao de status e reload com backend em memoria.
- Areas demo permanecem explicitamente marcadas como demo e nao foram promovidas a persistencia real.
- Validacoes executadas: `bun install --frozen-lockfile`, `bun run lint`, `bun x tsc --noEmit`, `bun run build`, `bun run backend:check`, `bun run test`, testes especificos da integracao de Canais, smoke backend, smoke frontend e QA visual nas resolucoes definidas.
- Limitacao residual: foi observado um warning de hydration mismatch no console de desenvolvimento, sem page error e sem bloqueio de fluxo; nao foi corrigido nesta branch documental.
- PR de Sprint 4: `#10` MERGED.
- Merge commit: `3ee439ca7e0ae414a68a459ab9fcba650e076148`.

## Sprint 0.2 - Preparacao segura de variaveis de ambiente

- O `.env.local` legado foi usado somente para extrair nomes de variaveis.
- Nenhum valor real foi copiado, impresso, versionado ou validado.
- `.env.example`, `.gitignore`, `docs/ENVIRONMENT.md` e as specs de SDD/ambiente foram preparados para a migracao segura.
- O inventario distingue variaveis de backend foundation, futuro de IA/video/publicacao e itens de legado/revisao manual.
- Naquele momento, o proximo passo recomendado era Backend Foundation, apenas apos a migracao segura estar mergeada e o repositorio seguir limpo.
- Pendencias: copiar manualmente os valores reais quando necessario e rotacionar qualquer segredo que tenha sido exposto no projeto antigo.

## Scripts disponiveis

- `dev`
- `build`
- `build:dev`
- `preview`
- `lint`
- `format`
- `backend:dev`
- `backend:build`
- `backend:check`
- `backend:start`
- `test`

## Validacao executada

- `npm run lint` passou sem warnings.
- `npm run backend:check` passou.
- `npm run test` passou.
- `npm run build` passou.
- `git diff --check` passou.
- Rotas validadas visualmente: `/dashboard`, `/channels`, `/agent-office`, `/publications`.
- Smoke visual realizado em: `/production`, `/approvals`, `/costs`, `/compliance`, `/audit-logs`.

## Screenshots geradas

- `screenshots/dashboard-1366x768.png`
- `screenshots/dashboard-1600x900.png`
- `screenshots/dashboard-1920x1080.png`
- `screenshots/channels-1366x768.png`
- `screenshots/channels-1600x900.png`
- `screenshots/channels-1920x1080.png`
- `screenshots/agent-office-1366x768.png`
- `screenshots/agent-office-1600x900.png`
- `screenshots/agent-office-1920x1080.png`
- `screenshots/publications-valid-1366x768.png`
- `screenshots/publications-blocked-approval-1600x900.png`
- `screenshots/publications-blocked-compliance-1792x1024.png`
- `screenshots/publications-empty-1920x1080.png`
- `screenshots/publications-details-1600x900.png`
- `screenshots/publications-channel-switch-1366x768.png`

## Warnings

- Warnings iniciais: 7 `react-refresh/only-export-components`.
- Warnings corrigidos: 7.
- Warnings restantes: 0.

## Limitacoes

- A Sprint 11 nao executa publicacao externa automatica.
- O backend de publicacoes permanece local e deterministico para o fluxo assistido.
- Nao houve conexao com Supabase.
