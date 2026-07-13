# Spec 006 - Approvals, Quality and Compliance

## Status
Planejada.

## Objetivo
Definir a camada deterministica de governanca da Aralume Studio para avaliar, bloquear, aprovar, rejeitar ou solicitar alteracoes em artefatos editoriais produzidos na Sprint 5.

## Problema
A Sprint 5 entregou ideias, pesquisas, fontes, evidencias, roteiros, versoes de roteiro, planos visuais, cenas e itens de producao. Falta uma camada formal que:

- consulte o que aguarda decisao humana;
- mostre o conteudo editorial relacionado;
- apresente resultados de qualidade;
- apresente resultados de conformidade;
- explique riscos e motivos de bloqueio;
- registre decisoes humanas com historico auditavel;
- impeca aprovacao indevida de conteudo bloqueado;
- exponha `/approvals` e `/compliance` usando API real.

Sem essa camada, o pipeline editorial nao possui gate formal suficiente para avancar com previsibilidade.

## Contexto
Esta sprint e a continuacao natural da Sprint 5. O repositorio ja possui:

- frontend com rotas `/approvals` e `/compliance`;
- contratos TypeScript centrais em `src/contracts/types.ts`;
- backend in-memory para `channels` e `editorial`;
- envelopes HTTP e padrao de erro ja estabelecidos;
- seeds editoriais deterministicas com canais distintos.

Nao existe baseline relacional nem migrations para este dominio. Portanto, a persistencia desta sprint deve continuar in-memory e encapsulada em repositorio.

## Pre-condicoes
- Sprint 5 integrada na `main`.
- `main` alinhada com `origin/main`.
- `AGENTS.md` lido.
- `docs/PROJECT_MASTER.md` lido.
- `docs/NEXT_SPRINTS.md` lido.
- `docs/CODEX_HANDOFF.md` lido.
- `docs/FRONTEND_API_CONTRACTS.md` lido.
- `docs/FRONTEND_DESIGN_SYSTEM.md` lido.
- `docs/specs/000-sdd-process.md` lido.
- `docs/specs/005-editorial-pipeline.md` lido.
- `docs/specs/006-approvals-compliance.md` revisto e coerente com o repositorio atual.
- Frontend `/approvals` e `/compliance` estabilizados o suficiente para serem rebados a API real.

## Escopo
- `HumanApproval`.
- `ApprovalDecision`.
- `QualityCheck`.
- `QualityCheckItem`.
- `ComplianceCheck`.
- `ComplianceFinding`.
- estados, transicoes e bloqueios do dominio de governanca.
- endpoints HTTP reais para leitura, criacao e decisao.
- validacao Zod.
- repositórios encapsulados em memoria.
- seeds deterministicas.
- contratos frontend alinhados com o backend.
- integracao das rotas `/approvals` e `/compliance` com API real.
- testes de dominio, API e frontend.

## Fora de escopo
- IA real.
- LLM.
- moderacao externa.
- analise juridica automatizada.
- pesquisa web real.
- scraping.
- verificacao externa de copyright.
- publicacao real.
- banco relacional.
- migrations.
- autenticao real.
- usuarios reais.
- permissao real.
- filas, workers ou jobs distribuido.
- redesign geral do frontend.
- qualquer entidade generica fora das entidades explicitamente suportadas.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/004-agent-office-workflows.md`
- `docs/specs/005-editorial-pipeline.md`

## Conceitos do dominio

### Entity type suportado
Esta sprint nao deve aceitar `entityType` arbitrario. O conjunto suportado precisa ser explicitamente fechado.

Entidades suportadas nesta sprint:

- `content_idea`
- `production_item`
- `research_session`
- `script`
- `visual_plan`

Limite deliberado:

- `script_version` e `scene_plan` nao entram como target direto nesta sprint para evitar ampliar demais o contrato sem necessidade de front-end e API adicionais.

### Human approval
Registro de decisao humana sobre um artefato editorial.

### Quality check
Leitura deterministica da saude estrutural do artefato editorial.

### Compliance check
Leitura deterministica de risco, fonte, evidencias e necessidade de revisao humana.

### Decision history
Historico imutavel de mudancas de status e justificativas de um approval.

## Estados

### ApprovalStatus
Reutilizar o tipo ja aprovado no frontend:

- `pending`
- `approved`
- `rejected`
- `changes_requested`
- `blocked`

### QualityCheckStatus
Definir formalmente nesta sprint:

- `pending`
- `passed`
- `attention`
- `blocked`

### ComplianceStatus
Reutilizar o tipo ja aprovado no frontend:

- `approved`
- `attention`
- `rejected`
- `blocked`
- `needs_human_review`

### RiskLevel
Reutilizar:

- `ok`
- `attention`
- `warning`
- `critical`
- `blocked`

## Transicoes

### Approvals
- `pending -> approved`
- `pending -> rejected`
- `pending -> changes_requested`
- `pending -> blocked`
- `changes_requested -> approved` quando o bloqueio ou ajuste foi resolvido
- `changes_requested -> rejected`
- `changes_requested -> blocked`
- `blocked -> changes_requested` quando a causa foi formalmente enderecada
- `blocked -> approved` somente se as verificacoes associadas estiverem resolvidas

Regras:

- `approved` e `rejected` sao estados finais.
- `changes_requested` e `blocked` podem ser reabertos por nova decisao formal.
- nao pode haver decisao silenciosa repetida sobre o mesmo estado final.
- a transicao deve falhar se o estado atual ja impedir a decisao solicitada.

### Quality checks
- `pending -> passed`
- `pending -> attention`
- `pending -> blocked`

### Compliance checks
- `pending -> approved`
- `pending -> attention`
- `pending -> rejected`
- `pending -> blocked`
- `pending -> needs_human_review`

## Regras de bloqueio
1. Um approval operacional deve possuir `channelId`.
2. O item aprovado deve pertencer ao mesmo `channelId` da aprovacao.
3. Nao pode existir approval para entidade inexistente.
4. Nao pode existir aprovacao cruzando canais diferentes.
5. A aprovacao deve usar apenas `entityType` suportado explicitamente.
6. Conteudo com `complianceStatus` `blocked` nao pode ser aprovado.
7. Conteudo com `complianceStatus` `rejected` nao pode ser aprovado.
8. Conteudo com finding bloqueador nao pode ser aprovado.
9. Conteudo com `qualityCheck` `blocked` nao pode ser aprovado.
10. `blocked` nao pode virar `approved` sem resolucao formal da causa.
11. Rejeicao e solicitacao de alteracao exigem justificativa.
12. Toda decisao deve registrar ator e timestamp.
13. Transicoes invalidas devem gerar erro de dominio.
14. Historico de decisoes e imutavel.
15. Listagens precisam ser deterministicamente ordenadas.
16. Objetos retornados por repositorio nao podem permitir mutacao acidental do estado interno.
17. Nao pode haver dependencia de IA ou servicos externos.

## Regras de aprovacao
- Aprovar e permitido apenas quando o alvo existir, pertencer ao canal e nao estiver bloqueado por qualidade ou conformidade.
- Rejeitar e permitido quando o alvo existir e pertencer ao canal; justificativa e obrigatoria.
- Solicitar alteracoes e permitido quando o alvo existir e pertencer ao canal; justificativa e obrigatoria.
- Aprovar um item com risco alto requer verificacao explicita das findings e do estado corrente.
- A decisao deve registrar `decidedBy`, `decidedAt` e `decisionReason`.

## Relacao com o pipeline editorial
As aprovacoes e verificacoes desta sprint se relacionam com as entidades entregues na Sprint 5.

### Entidades de origem
- `ContentIdea`
- `ProductionItem`
- `ResearchSession`
- `Script`
- `VisualPlan`

### Regras de vinculacao
- validar existencia da entidade referenciada;
- validar `channelId`;
- nao duplicar integralmente os dados editoriais;
- expor resumo suficiente para a UI;
- manter rastreabilidade por IDs;
- impedir cruzamento entre canais.

### Base de conformidade
A analise de conformidade deve ser deterministica e baseada em regras internas, por exemplo:

- claim factual sem evidencia;
- fonte ausente;
- fonte sem URL ou identificacao minima quando exigida pelo tipo;
- evidencias sem relacao com claims da sessao;
- risco critico informado;
- conteudo bloqueado;
- ausencia de revisao humana obrigatoria;
- inconsistencias entre entidades relacionadas;
- canal divergente entre artefatos.

### Base de qualidade
A analise de qualidade deve ser deterministica e baseada em regras internas, por exemplo:

- titulo ausente;
- roteiro vazio;
- duracao estimada invalida;
- ausencia de cenas em plano visual;
- estrutura obrigatoria incompleta;
- CTA ausente quando exigido;
- item editorial sem dados minimos;
- inconsistencias entre entidades relacionadas.

## Modelo de dados

### HumanApproval
Campos minimos:

- `id`
- `channelId`
- `entityType`
- `entityId`
- `status`
- `riskLevel`
- `title`
- `summary`
- `requestedAt`
- `requestedBy`
- `decidedAt`
- `decidedBy`
- `decisionReason`
- `createdAt`
- `updatedAt`

Campos adicionais permitidos:

- `targetSnapshot`
- `qualityCheckId`
- `complianceCheckId`
- `latestDecisionId`

### ApprovalDecision
Campos minimos:

- `id`
- `approvalId`
- `previousStatus`
- `nextStatus`
- `decision`
- `justification`
- `actor`
- `decidedAt`
- `createdAt`

### QualityCheck
Campos minimos:

- `id`
- `channelId`
- `entityType`
- `entityId`
- `status`
- `score`
- `checks`
- `findings`
- `blockingFindings`
- `checkedAt`
- `createdAt`
- `updatedAt`

Campos adicionais permitidos:

- `targetSnapshot`
- `summary`

### QualityCheckItem
Campos minimos:

- `code`
- `name`
- `result`
- `severity`
- `message`
- `blocking`
- `metadata`

### ComplianceCheck
Campos minimos:

- `id`
- `channelId`
- `entityType`
- `entityId`
- `status`
- `riskLevel`
- `findings`
- `blockingFindings`
- `checkedAt`
- `createdAt`
- `updatedAt`

Campos adicionais permitidos:

- `targetSnapshot`
- `requiresHumanReview`

### ComplianceFinding
Campos minimos:

- `code`
- `name`
- `severity`
- `message`
- `blocking`
- `metadata`

## Contratos HTTP

### Approvals
- `GET /api/approvals`
- `GET /api/approvals/:id`
- `POST /api/approvals`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`
- `POST /api/approvals/:id/request-changes`
- `GET /api/approvals/:id/history`

Filtros:

- `channelId`
- `status`
- `riskLevel`
- `entityType`
- `entityId`

### Quality checks
- `GET /api/quality-checks`
- `GET /api/quality-checks/:id`
- `POST /api/quality-checks`

Filtros:

- `channelId`
- `status`
- `riskLevel`
- `entityType`
- `entityId`

### Compliance checks
- `GET /api/compliance-checks`
- `GET /api/compliance-checks/:id`
- `POST /api/compliance-checks`

Filtros:

- `channelId`
- `status`
- `riskLevel`
- `entityType`
- `entityId`

### Regras de HTTP
- validar params e body com Zod;
- retornar envelopes consistentes com o projeto;
- usar status HTTP corretos;
- tratar `404`, `400`, `409` e bloqueios de dominio com erro apropriado;
- nao vazar detalhes internos;
- ordenar listagens de forma deterministica;
- manter o contrato simples, sem endpoints genericos adicionais.

## Integracao frontend

### Rotas
- `/approvals`
- `/compliance`

### Requisitos da tela `/approvals`
- listar approvals;
- filtrar por canal;
- filtrar por status;
- selecionar um item;
- visualizar conteudo relacionado;
- visualizar qualidade;
- visualizar conformidade;
- visualizar findings;
- identificar bloqueios;
- visualizar historico de decisoes;
- aprovar quando permitido;
- rejeitar;
- solicitar alteracoes;
- registrar justificativa;
- atualizar a lista apos a decisao;
- tratar loading, erro, vazio, dados parciais, item inexistente e operacao em andamento;
- manter botoes proibidos visiveis e desabilitados com motivo claro.

### Requisitos da tela `/compliance`
- listar verificacoes de conformidade;
- filtrar por canal;
- filtrar por status;
- filtrar por risco;
- visualizar findings;
- visualizar entidade relacionada;
- diferenciar alerta de bloqueio;
- identificar necessidade de revisao humana;
- visualizar a data da verificacao;
- tratar loading, erro e vazio.

### Clientes de API esperados
- `src/services/approvals-api.ts`
- `src/services/compliance-api.ts`

### Contratos frontend
- tipos camels-case;
- IDs string;
- datas ISO 8601;
- `channelId` obrigatorio em dados operacionais;
- tipos compartilhados coerentes;
- sem casts que escondam incompatibilidade.

## Seeds
As seeds desta sprint devem ser deterministicas e suficientes para demonstrar:

- approval pendente;
- approval aprovado;
- approval rejeitado;
- approval com alteracoes solicitadas;
- approval bloqueado;
- quality check aprovado;
- quality check com alerta;
- quality check bloqueador;
- compliance aprovado;
- compliance com atencao;
- compliance com revisao humana;
- compliance bloqueado;
- dois canais distintos com isolamento de dados.

As seeds devem referenciar entidades existentes e validas da Sprint 5.

## Testes

### Dominio
- criacao de approval valida;
- entidade inexistente;
- `channelId` incompativel;
- `entityType` invalido;
- aprovacao permitida;
- aprovacao bloqueada por conformidade;
- rejeicao;
- solicitacao de alteracoes;
- justificativa obrigatoria;
- transicao invalida;
- decisao repetida;
- historico imutavel;
- ordenacao deterministica;
- isolamento entre canais.

### Quality
- criacao de check;
- regra aprovada;
- regra de atencao;
- finding bloqueador;
- entidade inexistente;
- canal incompativel;
- entrada invalida.

### Compliance
- criacao de check;
- claim sem evidencia;
- fonte ausente;
- risco bloqueador;
- revisao humana;
- entidade inexistente;
- canal incompativel;
- entrada invalida.

### API
- envelopes;
- status HTTP;
- filtros;
- recurso inexistente;
- payload invalido;
- erros de dominio;
- ausencia de vazamento de detalhes internos.

### Frontend
- clientes;
- URLs;
- metodos;
- serializacao;
- parsing;
- erros;
- timeout;
- rota `/approvals` consumindo API real;
- rota `/compliance` consumindo API real;
- loading;
- erro;
- vazio;
- filtros;
- troca de canal;
- acoes de decisao;
- bloqueio do botao de aprovacao;
- atualizacao apos decisao.

## Critérios de aceite
- entidades de governanca existem;
- regras de bloqueio e aprovacao sao respeitadas;
- endpoints minimos existem e estao alinhados aos contratos;
- historico de decisoes e auditavel;
- `/approvals` e `/compliance` consomem API real;
- loading, empty, error e estados bloqueados sao visiveis;
- seeds demonstram os estados essenciais;
- testes e validacoes passam;
- nenhum segredo foi exposto;
- nenhuma dependencia externa foi introduzida.

## Definition of Done
- spec coerente com o repo atual;
- backend de governanca implementado com validacao e testes;
- frontend minimo integrado nas rotas do escopo;
- contratos documentados e alinhados;
- smoke executado;
- screenshots capturadas nas telas alteradas;
- working tree limpo ou estado final documentado;
- commit criado;
- PR aberto.

## Riscos
- O dominio de aprovacao pode crescer rapidamente se a sprint tentar cobrir muitas entidades de uma vez.
- Se os contratos de frontend nao forem alinhados, as telas quebram silenciosamente.
- A persistencia em memoria exige seeds e ordenacao deterministicas para nao introduzir flapping em testes.
- O gate de bloqueio precisa ser rigoroso sem se tornar subjetivo.

## Limitacoes atuais
- Sem banco relacional.
- Sem IA real.
- Sem moderacao externa.
- Sem analise juridica automatizada.
- Sem publicacao real.
- Sem workers assíncronos.

## Proxima sprint recomendada
Sprint 7 - Costs and Operational Modes.
