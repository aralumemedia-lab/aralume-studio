# Relatório de aceite V1.0 — Sprint 14

## Veredito

# V1.0 NÃO ACEITA

O candidato não atingiu a exigência de aprovação dos 18 critérios obrigatórios. A decisão é válida e reproduzível: os gates técnicos passaram, mas a demonstração frontend revelou fluxos ausentes, telas somente de consulta e dependências mockadas.

## Escopo executado

- Preflight Git: `main`, `origin/main` e HEAD alinhados no SHA `d78959a47a2bafbb343408d703eafafec8c6df59`; working tree limpo; sem worktrees adicionais.
- Branch criada: `codex/sprint-14-v1-acceptance`.
- Documentação governante e especificações upstream lidas antes da validação.
- Backend iniciado localmente em `127.0.0.1:3001` e frontend em `127.0.0.1:4173`.
- Rotas frontend percorridas: dashboard, canais, escritório de agentes, produção, ideias, pesquisa, roteiros, ativos, vídeos, cortes, aprovações, publicações, métricas, custos, compliance, administração e auditoria.
- Nenhuma publicação externa, upload, release, deploy ou alteração de segredo foi realizada.

## Gates técnicos

Todos passaram no baseline e serão repetidos após a documentação:

| Gate | Resultado |
| --- | --- |
| `git diff --check` | PASS |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `npm test` | PASS — 64 arquivos, 64 testes, 0 falhas, 0 skipped, 0 todo |
| `npm run build` | PASS |
| Scan de padrões de segredo | PASS — nenhum segredo encontrado; ocorrência de `client_secret` é identificador de código, não credencial |

O build emitiu avisos não bloqueantes do Vite sobre plugins já suportados nativamente, timing de plugins e `inlineDynamicImports` com code splitting. Não houve erro de compilação.

## Bloqueios materiais

### P0 — Fluxos V1 obrigatórios não são operacionais pelo frontend

`/ideas` mostrou dados reais, porém o botão `Nova pauta` não apresentou formulário ou mutation. As ações de pesquisa e priorização exibiram toasts explicitamente marcados como `mockado`. Isso bloqueia V1-03 e contamina o fluxo ponta a ponta.

### P0 — Superfícies críticas ainda dependem de mock

`src/services/api-client.ts` reexporta `getAgentDefinitions`, `getAgentOfficeSnapshot`, `getDashboardSummary` e `getWorkflowRuns` de `mock-api.ts`. As rotas `/dashboard` e `/agent-office` continuam, portanto, sem integração real comprovada, em conflito com a regra de não mascarar ausência de integração usando mocks.

### P1 — Fluxos de consulta não provam criação, versionamento ou transição

Pesquisa, roteiros e ativos apresentam dados/serviços, mas não demonstram pelo frontend os comandos de criação, procedência, versionamento ou vínculo necessários para concluir V1-04, V1-05, V1-06 e V1-08. Render, corte, qualidade, compliance, aprovação e publicação também não foram executados ponta a ponta nesta rodada.

## Decisão de escopo

Não foi implementada uma recriação ampla do frontend nem uma API nova para agentes/dashboard. Isso seria expansão de escopo e poderia mascarar a lacuna encontrada. O hardening desta rodada é documental: tornar o estado de execução e o veredito auditáveis, com próximos trabalhos objetivos.

## Próximas ações necessárias

1. Remover as dependências mockadas das superfícies obrigatórias ou formalizar contratos backend equivalentes.
2. Entregar o fluxo real de criação de pauta e transições para pesquisa/priorização.
3. Completar pesquisa/fontes, roteiro versionado, plano visual, ativos e narração no frontend.
4. Reexecutar o fluxo ponta a ponta com dados novos e auditoria, sem depender apenas de seeds.
5. Repetir a matriz inteira e somente então decidir novamente entre os dois vereditos normativos.

Detalhes por critério: [`V1_ACCEPTANCE_MATRIX.md`](./V1_ACCEPTANCE_MATRIX.md).
