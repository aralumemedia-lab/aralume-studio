# Product Backlog

Este backlog e um indice de planejamento. As specs continuam sendo os contratos
normativos das sprints.

## Catalogo de epicos

| ID | Epico | Objetivo | Status | Gate | Dependencias |
| --- | --- | --- | --- | --- | --- |
| E10 | Renderizacao Controlada | Entregar renderizacao de video controlada e auditavel. | completed | Video curto de teste com logs, custo e validacao. | - |
| E11 | Cortes Derivados Controlados | Entregar cortes persistentes e vinculados ao video principal. | completed | Pelo menos um corte valido vinculado. | - |
| E12 | Publicacao Assistida | Preparar publicacao com aprovacao, compliance e sem envio automatico. | completed | Pacote pronto sem envio externo automatico. | E10, E11 |
| E13 | Integracoes Reais Autorizadas | Conectar provedores com governanca, autorizacao e seguranca. | completed | Integracao oficial sem segredo e com destino server-side comprovado. | E12; ADR 002; PR #22 |
| E14 | Metricas e Aprendizado | Fechar o ciclo com metricas por canal e recomendacoes assistidas. | completed | Metricas geram recomendacao editorial por canal. | E13 concluido; PR #23 mergeada |
| E15 | Hardening V1.0 | Consolidar a base operacional demonstravel para V1.0. | completed | Gate de aceite executado; veredito binario `V1.0 NÃƒO ACEITA`; remediacao formalizada abaixo. | E13 e E14 concluidos |

## Sprints formalizadas

| Sprint | Nome | Epico | Spec | Estado | Observacao |
| --- | --- | --- | --- | --- | --- |
| S11 | Publicacao Assistida | E12 | `docs/specs/011-publication-assisted.md` | completed | PR #19 mergeado. |
| S12 | Integracoes Reais Autorizadas | E13 | `docs/specs/015-authorized-real-integrations.md` | completed | PR #22; validacao real concluida em 2026-07-15. |
| S13 | Metricas e Aprendizado | E14 | `docs/specs/014-metrics-learning.md` | completed | PR #23 mergeada por merge commit `9b89d1be04e7a6e319efb9a957282097c4854f31`. |
| S14 | V1 Acceptance | E15 | `docs/specs/012-v1-acceptance.md` | completed | Gate concluido com veredito `V1.0 NÃƒO ACEITA`; 13 criterios pendentes; PR #24 documental. |

## Historias da Sprint 11

H11.1 catalogo de alvos e readiness; H11.2 job e estados; H11.3 payload e
agendamento; H11.4 aprovacao e compliance. Todas completed conforme Spec 011 e PR #19.

## Historias da Sprint 12

H12.1 estado YouTube por canal; H12.2 OAuth e revogacao; H12.3 descoberta e
selecao explicita; H12.4 upload autorizado; H12.5 reautorizacao/migracao de
escopos; H12.6 VideoAsset oficial para validacao real. Todas encerradas no PR #22.

## Historias da Sprint 13

### H14.1 - Registro controlado de metricas por conteudo

Registrar snapshots por canal, conteudo, plataforma e janela com origem, validade,
timestamps e idempotencia; rejeitar canal divergente e replay conflitante.

### H14.2 - Consulta e agregacao canal-scoped

Consultar por canal, periodo, conteudo e plataforma e consolidar totais, medias e
variacoes sem cruzar canais.

### H14.3 - Aprendizado editorial assistido

Gerar recomendacao deterministica, versionada, explicavel, evidenciada e revisavel
por humano; dados insuficientes nao geram afirmacao positiva.

### H14.4 - Dashboard operacional de metricas e recomendacoes

Substituir mocks de `/metrics` por API real, mostrando origem, estado, KPIs,
desempenho, tendencia, recomendacao e evidencias em todos os estados obrigatorios.

## Historias nao incluidas em S13

Analytics/OAuth novo, scraping, novos provedores, IA externa, receita/monetizacao,
aplicacao automatica de recomendacoes, migrations SQL, hardening e V1 Acceptance.

## Remediacao V1 - roadmap consolidado

Esta secao consolida a sequencia apos a Sprint 14 e formaliza a primeira fatia funcional do E16 como Sprint 15.

| Sequencia | Epic | Criterios V1 | Itens R14 | Tipo principal | Saida esperada |
| --- | --- | --- | --- | --- | --- |
| Sprint 15 | E16 - Pipeline Editorial Operavel pelo Frontend | V1-02, V1-03, V1-04 | R14-02, R14-03, R14-04 | funcional + frontend + UX | perfil editorial, pautas, pesquisa, fontes e claims operaveis no frontend |
| Sprint 16 | E16 - Pipeline Editorial Operavel pelo Frontend | V1-05, V1-06 | R14-05, R14-06 | funcional + frontend + UX | roteiro versionado, versoes e plano visual com cenas operaveis no frontend |
| Sprint proposta B | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-07, V1-08, V1-09, V1-10 | R14-07, R14-08, R14-09, R14-10 | funcional + frontend + backend + integracao | narracao, ativos, render e cortes operaveis no frontend |
| Sprint proposta C | E18 - Governanca e Publicacao Assistida pelo Frontend | V1-11, V1-12, V1-13, V1-14 | R14-11, R14-12, R14-13, R14-14 | funcional + frontend + backend + governance | qualidade, compliance, aprovacao e publicacao assistida operaveis no frontend |
| Sprint proposta D | E19 - Cockpits Reais e Evidencias Transversais | R14-T01, R14-T02 | R14-T01, R14-T02 | technical + evidence + QA | dashboard e escritorio de agentes reais, mais evidencias reutilizaveis |
| Final gate | R14-REACCEPT | V1-01..V1-18 | R14-02..R14-14, R14-T01, R14-T02 | evidence / reaccept | novo V1 Acceptance com prova nova no mesmo head |

## Mapa de criterio para remediacao

| Criterio V1 | R14 | Epic | Sprint sugerida |
| --- | --- | --- | --- |
| V1-02 | R14-02 | E16 | Sprint 15 |
| V1-03 | R14-03 | E16 | Sprint 15 |
| V1-04 | R14-04 | E16 | Sprint 15 |
| V1-05 | R14-05 | E16 | Sprint 16 |
| V1-06 | R14-06 | E16 | Sprint 16 |
| V1-07 | R14-07 | E17 | Sprint proposta B |
| V1-08 | R14-08 | E17 | Sprint proposta B |
| V1-09 | R14-09 | E17 | Sprint proposta B |
| V1-10 | R14-10 | E17 | Sprint proposta B |
| V1-11 | R14-11 | E18 | Sprint proposta C |
| V1-12 | R14-12 | E18 | Sprint proposta C |
| V1-13 | R14-13 | E18 | Sprint proposta C |
| V1-14 | R14-14 | E18 | Sprint proposta C |
| Dashboard real | R14-T01 | E19 | Sprint proposta D |
| Escritorio de Agentes real | R14-T02 | E19 | Sprint proposta D |
| Reaccept final | R14-REACCEPT | final gate | after Sprint D |

## Observacoes

- Nao usar story points.
- Nao renumerar historias anteriores.
- Mudanca de escopo exige atualizar a Spec 014, o roadmap operacional e este backlog.
- ADR 002 continua aprovando somente YouTube para E13; Analytics permanece futuro.
- A Sprint 14 foi iniciada em branch isolada e nao autoriza merge, release ou deploy.
- O primeiro candidato nao atende todos os 18 criterios obrigatorios; o resultado detalhado esta em `docs/acceptance/v1/`.

## Remediacao pos-Sprint 14 (PROPOSTA â€” nao iniciada)

Esta secao transforma os 13 criterios `FAIL`/`NOT PROVEN` e os dois cockpits mockados em trabalho planejavel. Ela nao inicia sprint, nao autoriza implementacao e nao altera o veredito da V1.0. A Sprint 15 formaliza a primeira fatia funcional do E16 e a Sprint 16 fica reservada para H16.3-H16.4.

| ID | Tipo | Criterio / superficie | Grupo | Prioridade | Dependencias |
| --- | --- | --- | --- | --- | --- |
| R14-02 | Historia funcional | V1-02 Perfil editorial | A â€” Pipeline editorial | P1 | V1-01 |
| R14-03 | Historia funcional | V1-03 Pauta | A â€” Pipeline editorial | P1 | R14-02 |
| R14-04 | Historia funcional | V1-04 Pesquisa/fontes | A â€” Pipeline editorial | P1 | R14-03 |
| R14-05 | Historia funcional | V1-05 Roteiro versionado | A â€” Pipeline editorial | P1 | R14-04 |
| R14-06 | Historia funcional | V1-06 Plano visual/cenas | A â€” Pipeline editorial | P1 | R14-05 |
| R14-07 | Historia funcional | V1-07 Narracao autorizada | B â€” Midia e producao | P1 | R14-06 |
| R14-08 | Historia funcional | V1-08 Ativos rastreaveis | B â€” Midia e producao | P1 | R14-07 |
| R14-09 | Historia funcional | V1-09 Render controlado | B â€” Midia e producao | P1 | R14-08 |
| R14-10 | Historia funcional | V1-10 Corte derivado | B â€” Midia e producao | P1 | R14-09 |
| R14-11 | Historia funcional | V1-11 Qualidade | C â€” Governanca | P1 | R14-09, R14-10 |
| R14-12 | Historia funcional | V1-12 Conformidade | C â€” Governanca | P1 | R14-08, R14-11 |
| R14-13 | Historia funcional | V1-13 Aprovacao humana | C â€” Governanca | P1 | R14-11, R14-12 |
| R14-14 | Historia funcional | V1-14 Publicacao assistida | C â€” Governanca | P1 | R14-13 |
| R14-T01 | Tarefa tecnica | Dashboard real | D â€” Cockpits reais | P0 | APIs reais de custos, metricas, auditoria e workflows |
| R14-T02 | Tarefa tecnica | Escritorio de Agentes real | D â€” Cockpits reais | P0 | Contratos reais de agentes, workflows e handoffs |
| R14-REACCEPT | Tarefa tecnica | Nova execucao V1 Acceptance | E â€” Reaceite | P1 | R14-02 a R14-14, R14-T01 e R14-T02 |

### Definition of Ready comum

Cada item abaixo so pode iniciar quando houver contrato frontend/backend revisado, dados e IDs definidos, canal-scoping especificado, estrategia de persistencia e auditoria, cenarios positivos/negativos, teste de contrato, teste de rota e evidencias visuais planejadas. Nenhum item autoriza mock como comportamento final.

### R14-02 â€” Perfil editorial

- Ator/valor: operador configura a identidade editorial do canal sem editar banco ou CLI.
- Estado atual/causa raiz: campos sao exibidos, mas a mutacao frontend completa nao foi comprovada; falta fatia de formulario + persistencia.
- Superficies: `src/routes/channels.tsx`; `PATCH /api/channels/:id` e settings; persistir no repositorio de canais; auditar alteracao.
- Testes/evidencia: contrato PATCH, validacao, reload, isolamento e screenshot do formulario salvo.
- Risco/prioridade/estimativa: perfil incorreto contamina toda a linha editorial; P1; M.
- Dependencias: V1-01. Aceite: salvar, recarregar, isolar por canal e produzir evento auditavel sem segredo.

### R14-03 â€” Criacao de pauta

- Ator/valor: operador cria pauta e inicia o pipeline pelo frontend.
- Estado atual/causa raiz: `/ideas` lista dados, `Nova pauta` nao abre formulario e transicoes sao toasts mockados.
- Superficies: `src/routes/ideas.tsx`; `POST/PATCH /api/content-ideas`; persistir `ContentIdea`, estado e vinculo de canal; auditar criacao/transicao.
- Testes/evidencia: mutation real, erro/duplicidade, reload, isolamento, screenshot e ID novo no browser.
- Risco/prioridade/estimativa: bloqueia todo o pipeline; P1; M.
- Dependencias: R14-02. Aceite: pauta nova aparece apos reload e cada transicao muda estado via API real.

### R14-04 â€” Pesquisa, fontes e claims

- Ator/valor: pesquisador registra fonte e claim rastreavel ligado a pauta.
- Estado atual/causa raiz: `/research` e consulta; comandos de fonte/claim nao foram demonstrados.
- Superficies: `src/routes/research.tsx`; `POST /api/research-sessions`, `/sources`, `/claims`; persistencia de sessao/fonte/claim; auditar procedencia.
- Testes/evidencia: URLs invalidas, claim sem fonte, reload, isolamento e screenshot com IDs novos.
- Risco/prioridade/estimativa: conteudo sem sustentacao; P1; L.
- Dependencias: R14-03. Aceite: sessao, fonte, claim e vinculo sao criados pelo frontend e consultaveis depois.

### R14-05 â€” Roteiro versionado

- Ator/valor: editor cria roteiro e preserva historico de versoes.
- Estado atual/causa raiz: `/scripts` lista roteiros, sem criacao/versionamento E2E.
- Superficies: `src/routes/scripts.tsx`; `POST/PATCH /api/scripts` e `/versions`; persistir roteiro/versao; auditar cada versao.
- Testes/evidencia: versionamento monotonicamente ordenado, concorrencia/erro, reload e screenshot do historico.
- Risco/prioridade/estimativa: perda de contexto editorial; P1; M.
- Dependencias: R14-04. Aceite: duas versoes sao criadas, a anterior permanece imutavel e o roteiro e canal-scoped.

### R14-06 â€” Plano visual e cenas

- Ator/valor: produtor planeja cenas ligadas ao roteiro antes do render.
- Estado atual/causa raiz: contratos/backend existem, mas nao ha tela operacional comprovada.
- Superficies: producao/detalhe editorial; `POST/PATCH /api/visual-plans` e `/scenes`; persistencia e auditoria do plano.
- Testes/evidencia: cena sem roteiro, ordenacao, reload, isolamento e screenshot do plano.
- Risco/prioridade/estimativa: render sem plano rastreavel; P1; M.
- Dependencias: R14-05. Aceite: plano e cenas novas aparecem no frontend e vinculam roteiro/pauta/canal.

### R14-07 â€” Narracao autorizada

- Ator/valor: operador registra narracao propria ou autorizada com procedencia.
- Estado atual/causa raiz: existe seed `ma_hist_narration_01`, mas seed nao prova entrada operacional.
- Superficies: `/media-assets`; `POST/PATCH /api/media-assets`; persistencia de origem/licenca/autorizacao e auditoria.
- Testes/evidencia: origem obrigatoria, licenca/autorizacao, canal divergente, reload e screenshot.
- Risco/prioridade/estimativa: uso indevido de audio; P1; M.
- Dependencias: R14-06. Aceite: narracao nova e autorizada e selecionavel pelo plano/render.

### R14-08 â€” Ativos visuais rastreaveis

- Ator/valor: operador registra/importa imagem, video, thumbnail ou musica com procedencia.
- Estado atual/causa raiz: `/media-assets` le e detalha, mas nao comprovou criacao/importacao frontend completa.
- Superficies: `src/routes/media-assets.tsx`; `POST/PATCH /api/media-assets` e validacoes; persistencia de checksum/origem/licenca; auditoria.
- Testes/evidencia: storage inseguro, integridade, duplicidade, uso vinculado e screenshot com ID novo.
- Risco/prioridade/estimativa: ativo sem direitos/rastreabilidade; P1; M.
- Dependencias: R14-07. Aceite: ativo novo e validado, canal-scoped e utilizavel no render.

### R14-09 â€” Render controlado

- Ator/valor: produtor inicia render auditavel pelo frontend.
- Estado atual/causa raiz: controles e backend existem, mas nao houve transacao E2E nesta rodada.
- Superficies: `/videos`; `POST /api/renders`, `GET /api/renders`, `/videos`; persistencia job/video/custo/auditoria.
- Testes/evidencia: idempotencia, falha de engine, timeout, reload e screenshot de estados.
- Risco/prioridade/estimativa: saida nao reproduzivel; P1; M.
- Dependencias: R14-08. Aceite: job novo conclui ou falha com estado, output, custo e evento auditavel.

### R14-10 â€” Corte derivado

- Ator/valor: editor gera corte rastreado do video-mÃ£e.
- Estado atual/causa raiz: contrato/servico existem, mas criacao persistida nao foi observada.
- Superficies: `/clips`; `POST /api/clips`, `GET /api/clips/:id`; persistencia do corte/arquivo/vinculo; auditoria.
- Testes/evidencia: intervalo invalido, canal divergente, idempotencia, reload e screenshot.
- Risco/prioridade/estimativa: derivado sem vinculo; P1; M.
- Dependencias: R14-09. Aceite: corte novo exibe video-mae, intervalo, gancho, status e arquivo.

### R14-11 â€” Qualidade tecnica

- Ator/valor: revisor verifica qualidade antes de aprovar/publicar.
- Estado atual/causa raiz: backend/servico existe, mas gate visual completo nao foi executado.
- Superficies: `/approvals`; `GET/POST /api/quality-checks`; persistencia de findings/status; auditoria.
- Testes/evidencia: caso aprovado e bloqueado, regra de bloqueio, reload e screenshot.
- Risco/prioridade/estimativa: produto defeituoso avancar; P1; M.
- Dependencias: R14-09, R14-10. Aceite: qualidade bloqueada impede avanÃ§o e aprovada permite prÃ³ximo gate.

### R14-12 â€” Conformidade e direitos

- Ator/valor: compliance bloqueia risco material e exige correÃ§Ã£o.
- Estado atual/causa raiz: alertas consultaveis, mas cenÃ¡rio negativo nao foi exercitado pelo frontend.
- Superficies: `/compliance`/`/approvals`; `GET/POST /api/compliance-checks`; persistencia de findings/status; auditoria.
- Testes/evidencia: caso blocked, correÃ§Ã£o, revalidaÃ§Ã£o, canal divergente e screenshot.
- Risco/prioridade/estimativa: violaÃ§Ã£o de direitos/policy; P1; M.
- Dependencias: R14-08, R14-11. Aceite: bloqueio material impede aprovaÃ§Ã£o/publicaÃ§Ã£o atÃ© revalidaÃ§Ã£o aprovada.

### R14-13 â€” Aprovacao humana

- Ator/valor: responsÃ¡vel decide com rastreabilidade, sem aprovaÃ§Ã£o automÃ¡tica.
- Estado atual/causa raiz: aÃ§Ãµes reais e testes existem, mas nenhuma decisÃ£o humana E2E foi registrada.
- Superficies: `/approvals`; endpoints approve/reject/request-changes; persistencia de decisÃ£o/histÃ³rico; auditoria.
- Testes/evidencia: trÃªs decisÃµes, estados invÃ¡lidos, reload e screenshot com ator/timestamp.
- Risco/prioridade/estimativa: publicaÃ§Ã£o sem supervisÃ£o; P1; M.
- Dependencias: R14-11, R14-12. Aceite: somente decisÃ£o vÃ¡lida muda o estado e o histÃ³rico fica consultÃ¡vel.

### R14-14 â€” Publicacao assistida

- Ator/valor: operador prepara pacote/draft sem upload automÃ¡tico.
- Estado atual/causa raiz: telas e contratos existem, mas readiness/job nao foram demonstrados ponta a ponta.
- Superficies: `/publications`; targets/readiness e `POST /api/publications`; persistencia de job/payload/bloqueios; auditoria.
- Testes/evidencia: readiness blocked/ready, aprovaÃ§Ã£o ausente, replay, reload e screenshot; nenhum upload real.
- Risco/prioridade/estimativa: publicaÃ§Ã£o sem governanÃ§a; P1; M.
- Dependencias: R14-13. Aceite: pacote preparado com source video, approval, compliance, readiness e bloqueios visÃ­veis, sem envio automÃ¡tico.

### R14-T01 â€” Dashboard real

- Ator/valor: operador acompanha KPIs operacionais reais por canal.
- Estado atual/causa raiz: `src/services/api-client.ts:91` reexporta `getDashboardSummary` de `mock-api.ts`; nÃ£o hÃ¡ superfÃ­cie real comprovada para o resumo.
- Superficies: `/dashboard`; contratos de custos, metrics, audit e workflows; persistencia nos dominios existentes; auditoria de aÃ§Ãµes quando aplicÃ¡vel.
- Testes/evidencia: sem mock import, requests reais, loading/erro/vazio, isolamento e screenshot por viewport.
- Risco/prioridade/estimativa: cockpit enganoso; P0; L.
- Dependencias: R14-09 a R14-14, APIs de metrics/costs/audit e decisÃ£o de contrato.
- Aceite: nenhum mock chega ao dashboard; KPIs e estados vÃªm de APIs reais e preservam `channelId`.

### R14-T02 â€” Escritorio de Agentes real

- Ator/valor: operador acompanha agentes, workflows, handoffs, fila e bloqueios reais.
- Estado atual/causa raiz: `src/services/api-client.ts:91,135` reexporta agentes, snapshot e workflows de `mock-api.ts`; endpoints reais nÃ£o estÃ£o comprovados.
- Superficies: `/agent-office`; contratos `/api/agents`, `/api/agent-office/snapshot`, `/api/workflows`; persistencia de execuÃ§Ã£o/handoff; auditoria de transiÃ§Ãµes.
- Testes/evidencia: requests reais, estados loading/erro/vazio, canal, timeline, fila e screenshot por viewport.
- Risco/prioridade/estimativa: falsa visibilidade operacional; P0; L.
- Dependencias: contrato backend aprovado e integraÃ§Ã£o com workflows/handoffs.
- Aceite: nenhum fixture/mock Ã© exibido como estado real; agentes e workflows vÃªm de APIs persistentes e auditÃ¡veis.

## Epico E16 - Pipeline Editorial Operavel pelo Frontend

- Status: proposta documental, nao iniciada.
- Nota: esta e a proposta inicial do E16, preservada como historico; a sequencia consolidada e vigente aparece mais abaixo e inclui V1-02 no mesmo epico.
- Iniciativa: Remediacao da Operabilidade da V1.
- Objetivo: tornar operaveis pelo frontend os fluxos editoriais de pauta, pesquisa, fontes, claims, roteiro, versao, plano visual e cenas com persistencia, auditoria e isolamento por canal.
- CritÃ©rios V1 relacionados: V1-03 Pauta, V1-04 Pesquisa e fontes, V1-05 Roteiro versionado, V1-06 Planejamento visual.
- Dependencia upstream: V1-02 Perfil editorial, somente como precondicao de contexto.
- Itens R14 incluidos: R14-03, R14-04, R14-05, R14-06.
- Itens R14 dependentes: R14-02 como dependencia de identidade/perfil editorial.
- Historias previstas: H16.1 Pautas operaveis pelo frontend; H16.2 Pesquisa, fontes e claims; H16.3 Roteiro versionado; H16.4 Planejamento visual e cenas.
- Fora de escopo: IA externa, scraping, geracao automatica, midia, renderizacao, cortes, publicacao, autenticao nova, redesign geral, release e novo V1 Acceptance.
- Gate: apenas planejamento documental ate a conclusao das dependencias e validacoes.

### E16 - Sequencia proposta

1. Sprint proposta A: pautas, pesquisa, fontes e claims.
2. Sprint proposta B: roteiro, versoes, plano visual, cenas e integracao E2E do fluxo.
3. Reaceite futuro: V1 Acceptance somente apos fechamento das historias e evidencias do E16.

### E16 - Observacoes de backlog

- Nao renumerar epicos historicos.
- Nao tratar esta proposta como inicio de sprint.
- Nao registrar remediacao como concluida.

### R14-REACCEPT â€” Reexecucao da V1 Acceptance

- Ator/valor: revisor independente decide novamente o aceite binÃ¡rio.
- Estado atual/causa raiz: sÃ³ pode ocorrer apÃ³s R14-02 a R14-14 e R14-T01/T02; nenhum reaceite foi iniciado.
- Superficies: jornada inteira pelo frontend; todos os contratos acima; dados novos, IDs, persistencia e auditoria.
- Testes/evidencia: 18 critÃ©rios, positivos/negativos, isolamento, custos, auditoria, QA visual, logs e matriz vinculada ao head.
- Risco/prioridade/estimativa: aceitar V1 sem prova; P1; L.
- Dependencias: todos os itens obrigatÃ³rios fechados e checks verdes.
- Aceite: cada V1-01..V1-18 tem status `PASS` com prova nova no mesmo head; caso contrÃ¡rio, permanece `V1.0 NÃƒO ACEITA`.
