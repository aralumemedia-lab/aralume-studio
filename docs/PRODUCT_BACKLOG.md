# Product Backlog

Este backlog e um indice de planejamento. As specs continuam sendo os contratos
normativos das sprints.

## Catalogo de epicos

| ID  | Epico                         | Objetivo                                                              | Status    | Gate                                                                                            | Dependencias                   |
| --- | ----------------------------- | --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| E10 | Renderizacao Controlada       | Entregar renderizacao de video controlada e auditavel.                | completed | Video curto de teste com logs, custo e validacao.                                               | -                              |
| E11 | Cortes Derivados Controlados  | Entregar cortes persistentes e vinculados ao video principal.         | completed | Pelo menos um corte valido vinculado.                                                           | -                              |
| E12 | Publicacao Assistida          | Preparar publicacao com aprovacao, compliance e sem envio automatico. | completed | Pacote pronto sem envio externo automatico.                                                     | E10, E11                       |
| E13 | Integracoes Reais Autorizadas | Conectar provedores com governanca, autorizacao e seguranca.          | completed | Integracao oficial sem segredo e com destino server-side comprovado.                            | E12; ADR 002; PR #22           |
| E14 | Metricas e Aprendizado        | Fechar o ciclo com metricas por canal e recomendacoes assistidas.     | completed | Metricas geram recomendacao editorial por canal.                                                | E13 concluido; PR #23 mergeada |
| E15 | Hardening V1.0                | Consolidar a base operacional demonstravel para V1.0.                 | completed | Gate de aceite executado; veredito binario `V1.0 NÃƒÆ’O ACEITA`; remediacao formalizada abaixo. | E13 e E14 concluidos           |

## Sprints formalizadas

| Sprint | Nome                          | Epico | Spec                                             | Estado    | Observacao                                                                                   |
| ------ | ----------------------------- | ----- | ------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------- |
| S11    | Publicacao Assistida          | E12   | `docs/specs/011-publication-assisted.md`         | completed | PR #19 mergeado.                                                                             |
| S12    | Integracoes Reais Autorizadas | E13   | `docs/specs/015-authorized-real-integrations.md` | completed | PR #22; validacao real concluida em 2026-07-15.                                              |
| S13    | Metricas e Aprendizado        | E14   | `docs/specs/014-metrics-learning.md`             | completed | PR #23 mergeada por merge commit `9b89d1be04e7a6e319efb9a957282097c4854f31`.                 |
| S14    | V1 Acceptance                 | E15   | `docs/specs/012-v1-acceptance.md`                | completed | Gate concluido com veredito `V1.0 NÃƒÆ’O ACEITA`; 13 criterios pendentes; PR #24 documental. |

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

Esta secao consolida a sequencia apos a Sprint 14 e formaliza a remediacao completa do E16.
Sprint 15 e Sprint 16 foram executadas nesta trilha de remediacao.

| Sequencia                                 | Epic                                                   | Criterios V1        | Itens R14                        | Tipo principal                              | Saida esperada                                                                                      |
| ----------------------------------------- | ------------------------------------------------------ | ------------------- | -------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Sprint 15 (entregue)                      | E16 - Pipeline Editorial Operavel pelo Frontend        | V1-02, V1-03, V1-04 | R14-02, R14-03, R14-04           | funcional + frontend + UX                   | perfil editorial, pautas, pesquisa, fontes e claims operaveis no frontend                           |
| Sprint 16 (entregue)                      | E16 - Pipeline Editorial Operavel pelo Frontend        | V1-05, V1-06        | R14-05, R14-06                   | funcional + frontend + UX                   | roteiro versionado, versoes e plano visual com cenas operaveis no frontend                          |
| Sprint 17 (entregue pela PR #28)          | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-07, V1-08        | R14-07, R14-08                   | funcional + frontend + backend + integracao | narracao e ativos visuais operaveis no frontend com reload, auditoria e isolamento                  |
| Sprint 18 (entregue pela PR #30)          | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-09, V1-10        | R14-09, R14-10                   | funcional + frontend + backend + integracao | render e cortes operaveis no frontend com reload, auditoria e isolamento                            |
| Sprint 19 (mergeada pela PR #32)          | E18 - Governanca e Publicacao Assistida pelo Frontend  | V1-11, V1-12, V1-13 | R14-11, R14-12, R14-13           | funcional + frontend + backend + governance | qualidade, compliance e aprovacao humana operaveis no frontend                                      |
| Sprint 20 (entregue pela PR #33)          | E18 - Governanca e Publicacao Assistida pelo Frontend  | V1-14               | R14-14                           | funcional + frontend + backend + governance | pacote de publicacao com confirmacao humana, readiness e sem auto-send                              |
| Sprint 21 (mergeada pela PR #34)          | E19 - Cockpits Reais e Evidencias Transversais         | R14-T01, R14-T02    | R14-T01, R14-T02                 | technical + evidence + QA                   | dashboard e escritorio de agentes reais, mais evidencias reutilizaveis; E19 concluido em `main`      |
| Final gate                                | R14-REACCEPT                                           | V1-01..V1-18        | R14-02..R14-14, R14-T01, R14-T02 | evidence / reaccept                         | novo V1 Acceptance com prova nova no mesmo head                                                     |

## Mapa de criterio para remediacao

| Criterio V1                | R14          | Epic       | Sprint sugerida |
| -------------------------- | ------------ | ---------- | --------------- |
| V1-02                      | R14-02       | E16        | Sprint 15       |
| V1-03                      | R14-03       | E16        | Sprint 15       |
| V1-04                      | R14-04       | E16        | Sprint 15       |
| V1-05                      | R14-05       | E16        | Sprint 16       |
| V1-06                      | R14-06       | E16        | Sprint 16       |
| V1-07                      | R14-07       | E17        | Sprint 17       |
| V1-08                      | R14-08       | E17        | Sprint 17       |
| V1-09                      | R14-09       | E17        | Sprint 18       |
| V1-10                      | R14-10       | E17        | Sprint 18       |
| V1-11                      | R14-11       | E18        | Sprint 19       |
| V1-12                      | R14-12       | E18        | Sprint 19       |
| V1-13                      | R14-13       | E18        | Sprint 19       |
| V1-14                      | R14-14       | E18        | Sprint 20       |
| Dashboard real             | R14-T01      | E19        | Sprint 21       |
| Escritorio de Agentes real | R14-T02      | E19        | Sprint 21       |
| Reaccept final             | R14-REACCEPT | final gate | after Sprint 21 |

## Observacoes

- Nao usar story points.
- Nao renumerar historias anteriores.
- Mudanca de escopo exige atualizar a Spec 014, o roadmap operacional e este backlog.
- ADR 002 continua aprovando somente YouTube para E13; Analytics permanece futuro.
- A Sprint 14 foi iniciada em branch isolada e nao autoriza merge, release ou deploy.
- O primeiro candidato nao atende todos os 18 criterios obrigatorios; o resultado detalhado esta em `docs/acceptance/v1/`.

## Remediacao pos-Sprint 14 (atualizada apos Sprint 15)

Esta secao transforma os 13 criterios `FAIL`/`NOT PROVEN` e os dois cockpits mockados em trabalho planejavel. Ela nao inicia sprint, nao autoriza implementacao e nao altera o veredito da V1.0. A Sprint 15 e a Sprint 16 foram executadas e E16 esta concluido.

| ID           | Tipo               | Criterio / superficie       | Grupo                        | Prioridade | Dependencias                                          |
| ------------ | ------------------ | --------------------------- | ---------------------------- | ---------- | ----------------------------------------------------- |
| R14-02       | Historia funcional | V1-02 Perfil editorial      | A Ã¢â‚¬â€ Pipeline editorial | P1         | V1-01                                                 |
| R14-03       | Historia funcional | V1-03 Pauta                 | A Ã¢â‚¬â€ Pipeline editorial | P1         | R14-02                                                |
| R14-04       | Historia funcional | V1-04 Pesquisa/fontes       | A Ã¢â‚¬â€ Pipeline editorial | P1         | R14-03                                                |
| R14-05       | Historia funcional | V1-05 Roteiro versionado    | A Ã¢â‚¬â€ Pipeline editorial | P1         | R14-04                                                |
| R14-06       | Historia funcional | V1-06 Plano visual/cenas    | A Ã¢â‚¬â€ Pipeline editorial | P1         | R14-05                                                |
| R14-07       | Historia funcional | V1-07 Narracao autorizada   | B Ã¢â‚¬â€ Midia e producao   | P1         | R14-06                                                |
| R14-08       | Historia funcional | V1-08 Ativos rastreaveis    | B Ã¢â‚¬â€ Midia e producao   | P1         | R14-07                                                |
| R14-09       | Historia funcional | V1-09 Render controlado     | B Ã¢â‚¬â€ Midia e producao   | P1         | R14-08                                                |
| R14-10       | Historia funcional | V1-10 Corte derivado        | B Ã¢â‚¬â€ Midia e producao   | P1         | R14-09                                                |
| R14-11       | Historia funcional | V1-11 Qualidade             | C Ã¢â‚¬â€ Governanca         | P1         | R14-09, R14-10                                        |
| R14-12       | Historia funcional | V1-12 Conformidade          | C Ã¢â‚¬â€ Governanca         | P1         | R14-08, R14-11                                        |
| R14-13       | Historia funcional | V1-13 Aprovacao humana      | C Ã¢â‚¬â€ Governanca         | P1         | R14-11, R14-12                                        |
| R14-14       | Historia funcional | V1-14 Publicacao assistida  | C Ã¢â‚¬â€ Governanca         | P1         | R14-13                                                |
| R14-T01      | Tarefa tecnica     | Dashboard real              | D Ã¢â‚¬â€ Cockpits reais     | P0         | APIs reais de custos, metricas, auditoria e workflows |
| R14-T02      | Tarefa tecnica     | Escritorio de Agentes real  | D Ã¢â‚¬â€ Cockpits reais     | P0         | Contratos reais de agentes, workflows e handoffs      |
| R14-REACCEPT | Tarefa tecnica     | Nova execucao V1 Acceptance | E Ã¢â‚¬â€ Reaceite           | P1         | R14-02 a R14-14, R14-T01 e R14-T02                    |

### Definition of Ready comum

Cada item abaixo so pode iniciar quando houver contrato frontend/backend revisado, dados e IDs definidos, canal-scoping especificado, estrategia de persistencia e auditoria, cenarios positivos/negativos, teste de contrato, teste de rota e evidencias visuais planejadas. Nenhum item autoriza mock como comportamento final.

### R14-02 Ã¢â‚¬â€ Perfil editorial

- Ator/valor: operador configura a identidade editorial do canal sem editar banco ou CLI.
- Estado atual/causa raiz: campos sao exibidos, mas a mutacao frontend completa nao foi comprovada; falta fatia de formulario + persistencia.
- Superficies: `src/routes/channels.tsx`; `PATCH /api/channels/:id` e settings; persistir no repositorio de canais; auditar alteracao.
- Testes/evidencia: contrato PATCH, validacao, reload, isolamento e screenshot do formulario salvo.
- Risco/prioridade/estimativa: perfil incorreto contamina toda a linha editorial; P1; M.
- Dependencias: V1-01. Aceite: salvar, recarregar, isolar por canal e produzir evento auditavel sem segredo.

### R14-03 Ã¢â‚¬â€ Criacao de pauta

- Ator/valor: operador cria pauta e inicia o pipeline pelo frontend.
- Estado atual/causa raiz: `/ideas` lista dados, `Nova pauta` nao abre formulario e transicoes sao toasts mockados.
- Superficies: `src/routes/ideas.tsx`; `POST/PATCH /api/content-ideas`; persistir `ContentIdea`, estado e vinculo de canal; auditar criacao/transicao.
- Testes/evidencia: mutation real, erro/duplicidade, reload, isolamento, screenshot e ID novo no browser.
- Risco/prioridade/estimativa: bloqueia todo o pipeline; P1; M.
- Dependencias: R14-02. Aceite: pauta nova aparece apos reload e cada transicao muda estado via API real.

### R14-04 Ã¢â‚¬â€ Pesquisa, fontes e claims

- Ator/valor: pesquisador registra fonte e claim rastreavel ligado a pauta.
- Estado atual/causa raiz: `/research` e consulta; comandos de fonte/claim nao foram demonstrados.
- Superficies: `src/routes/research.tsx`; `POST /api/research-sessions`, `/sources`, `/claims`; persistencia de sessao/fonte/claim; auditar procedencia.
- Testes/evidencia: URLs invalidas, claim sem fonte, reload, isolamento e screenshot com IDs novos.
- Risco/prioridade/estimativa: conteudo sem sustentacao; P1; L.
- Dependencias: R14-03. Aceite: sessao, fonte, claim e vinculo sao criados pelo frontend e consultaveis depois.

### R14-05 Ã¢â‚¬â€ Roteiro versionado

- Ator/valor: editor cria roteiro e preserva historico de versoes.
- Estado atual/causa raiz: `/scripts` lista roteiros, sem criacao/versionamento E2E.
- Superficies: `src/routes/scripts.tsx`; `POST/PATCH /api/scripts` e `/versions`; persistir roteiro/versao; auditar cada versao.
- Testes/evidencia: versionamento monotonicamente ordenado, concorrencia/erro, reload e screenshot do historico.
- Risco/prioridade/estimativa: perda de contexto editorial; P1; M.
- Dependencias: R14-04. Aceite: duas versoes sao criadas, a anterior permanece imutavel e o roteiro e canal-scoped.

### R14-06 Ã¢â‚¬â€ Plano visual e cenas

- Ator/valor: produtor planeja cenas ligadas ao roteiro antes do render.
- Estado atual/causa raiz: contratos/backend existem, mas nao ha tela operacional comprovada.
- Superficies: producao/detalhe editorial; `POST/PATCH /api/visual-plans` e `/scenes`; persistencia e auditoria do plano.
- Testes/evidencia: cena sem roteiro, ordenacao, reload, isolamento e screenshot do plano.
- Risco/prioridade/estimativa: render sem plano rastreavel; P1; M.
- Dependencias: R14-05. Aceite: plano e cenas novas aparecem no frontend e vinculam roteiro/pauta/canal.

### R14-07 Ã¢â‚¬â€ Narracao autorizada

- Ator/valor: operador registra narracao propria ou autorizada com procedencia.
- Estado atual/causa raiz: existe seed `ma_hist_narration_01`, mas seed nao prova entrada operacional.
- Superficies: `/media-assets`; `POST/PATCH /api/media-assets`; persistencia de origem/licenca/autorizacao e auditoria.
- Testes/evidencia: origem obrigatoria, licenca/autorizacao, canal divergente, reload e screenshot.
- Risco/prioridade/estimativa: uso indevido de audio; P1; M.
- Dependencias: R14-06. Aceite: narracao nova e autorizada e selecionavel pelo plano/render.

### R14-08 Ã¢â‚¬â€ Ativos visuais rastreaveis

- Ator/valor: operador registra/importa imagem, video, thumbnail ou musica com procedencia.
- Estado atual/causa raiz: `/media-assets` le e detalha, mas nao comprovou criacao/importacao frontend completa.
- Superficies: `src/routes/media-assets.tsx`; `POST/PATCH /api/media-assets` e validacoes; persistencia de checksum/origem/licenca; auditoria.
- Testes/evidencia: storage inseguro, integridade, duplicidade, uso vinculado e screenshot com ID novo.
- Risco/prioridade/estimativa: ativo sem direitos/rastreabilidade; P1; M.
- Dependencias: R14-07. Aceite: ativo novo e validado, canal-scoped e utilizavel no render.

### R14-09 Ã¢â‚¬â€ Render controlado

- Ator/valor: produtor inicia render auditavel pelo frontend.
- Estado atual/causa raiz: controles e backend existem, mas nao houve transacao E2E nesta rodada.
- Superficies: `/videos`; `POST /api/renders`, `GET /api/renders`, `/videos`; persistencia job/video/custo/auditoria.
- Testes/evidencia: idempotencia, falha de engine, timeout, reload e screenshot de estados.
- Risco/prioridade/estimativa: saida nao reproduzivel; P1; M.
- Dependencias: R14-08. Aceite: job novo conclui ou falha com estado, output, custo e evento auditavel.

### R14-10 Ã¢â‚¬â€ Corte derivado

- Ator/valor: editor gera corte rastreado do video-mÃƒÂ£e.
- Estado atual/causa raiz: contrato/servico existem, mas criacao persistida nao foi observada.
- Superficies: `/clips`; `POST /api/clips`, `GET /api/clips/:id`; persistencia do corte/arquivo/vinculo; auditoria.
- Testes/evidencia: intervalo invalido, canal divergente, idempotencia, reload e screenshot.
- Risco/prioridade/estimativa: derivado sem vinculo; P1; M.
- Dependencias: R14-09. Aceite: corte novo exibe video-mae, intervalo, gancho, status e arquivo.

### R14-11 Ã¢â‚¬â€ Qualidade tecnica

- Ator/valor: revisor verifica qualidade antes de aprovar/publicar.
- Estado atual/causa raiz: backend/servico existe, mas gate visual completo nao foi executado.
- Superficies: `/approvals`; `GET/POST /api/quality-checks`; persistencia de findings/status; auditoria.
- Testes/evidencia: caso aprovado e bloqueado, regra de bloqueio, reload e screenshot.
- Risco/prioridade/estimativa: produto defeituoso avancar; P1; M.
- Dependencias: R14-09, R14-10. Sprint proposta: Sprint 19. Aceite: qualidade bloqueada impede avanco e aprovada permite proximo gate.

### R14-12 Ã¢â‚¬â€ Conformidade e direitos

- Ator/valor: compliance bloqueia risco material e exige correÃƒÂ§ÃƒÂ£o.
- Estado atual/causa raiz: alertas consultaveis, mas cenÃƒÂ¡rio negativo nao foi exercitado pelo frontend.
- Superficies: `/compliance`/`/approvals`; `GET/POST /api/compliance-checks`; persistencia de findings/status; auditoria.
- Testes/evidencia: caso blocked, correÃƒÂ§ÃƒÂ£o, revalidaÃƒÂ§ÃƒÂ£o, canal divergente e screenshot.
- Risco/prioridade/estimativa: violaÃƒÂ§ÃƒÂ£o de direitos/policy; P1; M.
- Dependencias: R14-08, R14-11. Sprint proposta: Sprint 19. Aceite: bloqueio material impede aprovacao/publicacao ate revalidacao aprovada.

### R14-13 Ã¢â‚¬â€ Aprovacao humana

- Ator/valor: responsÃƒÂ¡vel decide com rastreabilidade, sem aprovaÃƒÂ§ÃƒÂ£o automÃƒÂ¡tica.
- Estado atual/causa raiz: aÃƒÂ§ÃƒÂµes reais e testes existem, mas nenhuma decisÃƒÂ£o humana E2E foi registrada.
- Superficies: `/approvals`; endpoints approve/reject/request-changes; persistencia de decisÃƒÂ£o/histÃƒÂ³rico; auditoria.
- Testes/evidencia: trÃƒÂªs decisÃƒÂµes, estados invÃƒÂ¡lidos, reload e screenshot com ator/timestamp.
- Risco/prioridade/estimativa: publicaÃƒÂ§ÃƒÂ£o sem supervisÃƒÂ£o; P1; M.
- Dependencias: R14-11, R14-12. Sprint proposta: Sprint 19. Aceite: somente decisao valida muda o estado e o historico fica consultavel.

### R14-14 Ã¢â‚¬â€ Publicacao assistida

- Ator/valor: operador prepara pacote/draft sem upload automÃƒÂ¡tico.
- Estado atual/causa raiz: fluxo de pacote real implementado nesta branch; evidencia formal e merge ainda pendentes.
- Superficies: `/publications`; targets/readiness e `POST /api/publications`; persistencia de job/payload/bloqueios; auditoria.
- Testes/evidencia: readiness blocked/ready, aprovaÃƒÂ§ÃƒÂ£o ausente, replay, reload e screenshot; nenhum upload real.
- Risco/prioridade/estimativa: publicaÃƒÂ§ÃƒÂ£o sem governanÃƒÂ§a; P1; M.
- Dependencias: R14-13. Sprint: Sprint 20. Aceite: pacote preparado com source video, approval, compliance, readiness, confirmacao humana e bloqueios visiveis, sem envio automatico.

### R14-T01 Ã¢â‚¬â€ Dashboard real

- Ator/valor: operador acompanha KPIs operacionais reais por canal.
- Estado atual/causa raiz: `src/services/api-client.ts:91` reexporta `getDashboardSummary` de `mock-api.ts`; nÃƒÂ£o hÃƒÂ¡ superfÃƒÂ­cie real comprovada para o resumo.
- Superficies: `/dashboard`; contratos de custos, metrics, audit e workflows; persistencia nos dominios existentes; auditoria de aÃƒÂ§ÃƒÂµes quando aplicÃƒÂ¡vel.
- Testes/evidencia: sem mock import, requests reais, loading/erro/vazio, isolamento e screenshot por viewport.
- Risco/prioridade/estimativa: cockpit enganoso; P0; L.
- Dependencias: R14-09 a R14-14, APIs de metrics/costs/audit e decisÃƒÂ£o de contrato.
- Aceite: nenhum mock chega ao dashboard; KPIs e estados vÃƒÂªm de APIs reais e preservam `channelId`.

### R14-T02 Ã¢â‚¬â€ Escritorio de Agentes real

- Ator/valor: operador acompanha agentes, workflows, handoffs, fila e bloqueios reais.
- Estado atual/causa raiz: `src/services/api-client.ts:91,135` reexporta agentes, snapshot e workflows de `mock-api.ts`; endpoints reais nÃƒÂ£o estÃƒÂ£o comprovados.
- Superficies: `/agent-office`; contratos `/api/agents`, `/api/agent-office/snapshot`, `/api/workflows`; persistencia de execuÃƒÂ§ÃƒÂ£o/handoff; auditoria de transiÃƒÂ§ÃƒÂµes.
- Testes/evidencia: requests reais, estados loading/erro/vazio, canal, timeline, fila e screenshot por viewport.
- Risco/prioridade/estimativa: falsa visibilidade operacional; P0; L.
- Dependencias: contrato backend aprovado e integraÃƒÂ§ÃƒÂ£o com workflows/handoffs.
- Aceite: nenhum fixture/mock ÃƒÂ© exibido como estado real; agentes e workflows vÃƒÂªm de APIs persistentes e auditÃƒÂ¡veis.

### E18 - Sequencia proposta

1. Sprint 19: H18.1, H18.2 e H18.3, mergeada pela PR #32, cobrindo V1-11 a V1-13 e R14-11 a R14-13.
2. Sprint 20: H18.4, entregue pela PR #33, cobrindo V1-14 e R14-14 apos o gate da Sprint 19.
3. E18 foi concluido depois das duas fatias, com auditoria correlacionada por requestId e sem auto-send externo.
4. Sprint 21: E19, R14-T01, R14-T02 e evidencia transversal.
5. R14-REACCEPT: etapa final apos E16, E17, E18 e E19.

## Sprint 22 - Remediacao dos findings do reaceite

Esta unidade tecnica pertence ao E15 e foi formalizada antes da implementacao. Ela fecha findings materiais observados apos as fatias E16-E19 sem alterar a matriz historica da Sprint 14 e sem executar o `R14-REACCEPT`.

| ID | Tipo | Escopo | Prioridade | Spec | Dependencias |
| --- | --- | --- | --- | --- | --- |
| R15-01 | Hardening tecnico | `AuditLog.requestId` estruturado e auditoria de mutacoes editoriais | P0 | `docs/specs/023-sprint-22-v1-remediation-findings.md` | E16, E17, E18 integrados |
| R15-02 | Seguranca de contexto | Leituras detalhadas e rejeicao cross-channel sanitizada | P0 | mesma spec | contratos editoriais e canal ativo |
| R15-03 | Evidencia operacional | Runner Sprint 15 e correcoes de runners Sprint 16-21 | P1 | mesma spec | Playwright, backend e frontend locais |
| R15-04 | Regressao V1 | Reexecucao de V1-03..V1-10 e preservacao de V1-01/V1-02/V1-11..V1-18 | P0 | mesma spec | R15-01 a R15-03 |

### Definition of Done da Sprint 22

- Auditoria de pauta, pesquisa, roteiro, versao, plano visual e cena e consultavel com `requestId` no campo correto.
- Detalhes editoriais exigem canal ativo e tentativas cross-channel retornam erro sanitizado sem vazamento.
- Runners Sprints 15-21 tem timeout, assercoes, codigo de saida e teardown verificaveis.
- Evidencias novas ficam separadas em `docs/acceptance/v1/V1_SPRINT22_REMEDIATION_EVIDENCE.md`.
- Validacoes da spec passam; nenhum reaceite integral, release, tag ou deploy e executado.

## Epico E16 - Pipeline Editorial Operavel pelo Frontend

- Status: completed, com Sprint 15 e Sprint 16 entregues.
- Nota: esta e a proposta inicial do E16, preservada como historico; a sequencia consolidada e vigente aparece mais abaixo e inclui V1-02 no mesmo epico e E16 concluido.
- Iniciativa: Remediacao da Operabilidade da V1.
- Objetivo: tornar operaveis pelo frontend os fluxos editoriais de pauta, pesquisa, fontes, claims, roteiro, versao, plano visual e cenas com persistencia, auditoria e isolamento por canal.
- CritÃƒÂ©rios V1 relacionados: V1-03 Pauta, V1-04 Pesquisa e fontes, V1-05 Roteiro versionado, V1-06 Planejamento visual.
- Dependencia upstream: V1-02 Perfil editorial, somente como precondicao de contexto.
- Itens R14 incluidos: R14-03, R14-04, R14-05, R14-06.
- Itens R14 dependentes: R14-02 como dependencia de identidade/perfil editorial.
- Historias previstas: H16.0 Perfil editorial operavel pelo frontend; H16.1 Pautas operaveis pelo frontend; H16.2 Pesquisa, fontes e claims; H16.3 Roteiro versionado; H16.4 Planejamento visual e cenas.
- Fora de escopo: IA externa, scraping, geracao automatica, midia, renderizacao, cortes, publicacao, autenticao nova, redesign geral, release e novo V1 Acceptance.
- Gate: planejamento concluido; E16 fechado nas Sprints 15 e 16.

### E16 - Sequencia proposta

1. Sprint 15: pautas, pesquisa, fontes e claims.
2. Sprint 16: roteiro, versoes, plano visual, cenas e integracao E2E do fluxo.
3. Reaceite futuro: V1 Acceptance somente apos fechamento das historias e evidencias do E16, E17, E18 e E19.

### E16 - Observacoes de backlog

- Nao renumerar epicos historicos.
- Nao tratar esta proposta como inicio de sprint.
- Nao registrar remediacao como concluida em histórico anterior, mas manter o estado atual de E16 como concluido.

### R14-REACCEPT Ã¢â‚¬â€ Reexecucao da V1 Acceptance

- Ator/valor: revisor independente decide novamente o aceite binÃƒÂ¡rio.
- Estado atual/causa raiz: sÃƒÂ³ pode ocorrer apÃƒÂ³s R14-02 a R14-14 e R14-T01/T02; nenhum reaceite foi iniciado.
- Superficies: jornada inteira pelo frontend; todos os contratos acima; dados novos, IDs, persistencia e auditoria.
- Testes/evidencia: 18 critÃƒÂ©rios, positivos/negativos, isolamento, custos, auditoria, QA visual, logs e matriz vinculada ao head.
- Risco/prioridade/estimativa: aceitar V1 sem prova; P1; L.
- Dependencias: todos os itens obrigatÃƒÂ³rios fechados e checks verdes.
- Aceite: cada V1-01..V1-18 tem status `PASS` com prova nova no mesmo head; caso contrÃƒÂ¡rio, permanece `V1.0 NÃƒÆ’O ACEITA`.
