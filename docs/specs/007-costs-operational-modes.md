# Spec 007 - Costs and Operational Modes

## Status

Planejada.

## Objetivo

Definir custos, orcamento, limites e modos operacionais como mecanismos de governanca da Aralume Studio.

## Problema

A plataforma precisa registrar custos deterministicamente, mostrar orcamento e situacao do consumo, e impedir acoes reais nao autorizadas quando a policy operacional nao permitir.

Sem essa camada:

- o modo demo nao tem bloqueio central;
- custo por canal fica misturado com status visual solto;
- orcamento e consumo nao sao explicitos;
- policy global e policy por canal podem ser confundidas;
- a decisao de permitir ou bloquear acoes nao e rastreavel.

## Contexto

A base atual ja possui:

- canais com `monthlyBudgetCents`, `monthlyCostUsedCents` e `costStatus` como snapshot de produto;
- frontend com rota `/costs` e area administrativa;
- contratos TypeScript para `CostEntry`, `CostStatus` e `OperationalModePolicy`;
- backend em memoria para canais, editorial e governanca.

Esta sprint nao introduz banco, migrations, IA real, publicacao real, storage real ou renderizacao real. O foco e fundacao deterministica e auditavel.

## Pre-condicoes

- `AGENTS.md` lido.
- `docs/PROJECT_MASTER.md` lido.
- `docs/NEXT_SPRINTS.md` lido.
- `docs/CODEX_HANDOFF.md` lido.
- `docs/FRONTEND_API_CONTRACTS.md` lido.
- `docs/FRONTEND_DESIGN_SYSTEM.md` lido.
- `docs/specs/000-sdd-process.md` lido.
- `docs/specs/005-editorial-pipeline.md` lido.
- `docs/specs/006-approvals-compliance.md` lido.
- `main` alinhada com `origin/main`.
- SDD ativo.

## Escopo funcional

- registro de custos;
- consulta e agregacao;
- orcamento por canal;
- situacao do orcamento;
- status de custo;
- policy operacional global;
- policy operacional por canal;
- resolucao da policy efetiva;
- bloqueio centralizado e deterministico de acoes;
- auditoria de decisoes;
- integracao do frontend;
- testes;
- documentacao.

## Fora de escopo

- cobranca de clientes;
- emissao fiscal;
- pagamentos;
- gateway de cartao;
- marketplace;
- contratacao automatica de provedores;
- consulta de preco em tempo real;
- IA real;
- renderizacao real;
- storage real;
- publicacao real;
- OAuth;
- execucao externa de fornecedores;
- workers Python;
- redesign geral.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/specs/003-channels.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/006-approvals-compliance.md`

## Entidades e contratos

### CostEntry

Contrato de custo operacional individual.

Campos obrigatorios:

- `id`
- `channelId`
- `stage`
- `providerName`
- `costType`
- `description`
- `amountCents`
- `currency`
- `createdAt`

Campos opcionais:

- `contentId`
- `workflowRunId`
- `agentRunId`

Regras:

- valores monetarios sempre em inteiros de centavos;
- `channelId` obrigatorio;
- `stage` obrigatorio para agregacao deterministica;
- `currency` fixada no contrato do produto;
- nenhum custo real externo e gerado;
- nenhuma entrada e alterada retrospectivamente sem regra explicita.

### OperationalModePolicy

Policy operacional com escopo global ou por canal.

Campos obrigatorios:

- `id`
- `scope`
- `mode`
- `allowRealAi`
- `allowRealTts`
- `allowRealImageGeneration`
- `allowRealVideoGeneration`
- `allowExternalPublication`
- `requireHumanApproval`
- `dailyBudgetLimitCents`
- `monthlyBudgetLimitCents`
- `createdAt`
- `updatedAt`

Campos opcionais:

- `channelId`

Regras:

- policy global nao pode carregar `channelId`;
- policy por canal deve carregar `channelId`;
- policy por canal pode ser mais restritiva, nunca mais permissiva que a global;
- budget e policy permanecem explicitamente registrados na mesma policy, mas a resolucao efetiva e separada da visualizacao de custos;
- policy ausente resolve para fallback seguro.

### OperationalModeDecision

Decisao centralizada para uma acao operacional.

Campos minimos:

- `id`
- `channelId`
- `action`
- `allowed`
- `decisionCode`
- `reason`
- `policySource`
- `globalPolicyId`
- `effectivePolicyId`
- `evaluatedAt`

Campos opcionais:

- `channelPolicyId`
- `costEntryId`
- `plannedCostCents`
- `actor`

### CostSummary

Resumo deterministico de custos e orcamento.

Campos minimos:

- `channelId` quando o resumo for filtrado por canal
- `periodStart`
- `periodEnd`
- `budgetCents`
- `consumedCents`
- `remainingCents`
- `consumptionPercent`
- `status`
- `budgetConfigured`
- `totalCostCents`
- `entryCount`
- `byChannel`
- `byStage`
- `byProvider`
- `byContent`
- `byPeriod`

### CostBreakdownItem

Item de consolidacao para qualquer dimensao.

Campos minimos:

- `key`
- `label`
- `amountCents`
- `count`
- `sharePercent`

### AuditLog

O contrato ja existe no frontend e deve ser usado para rastrear:

- criacao de custo;
- alteracao de budget;
- alteracao de policy;
- tentativa bloqueada;
- decisao permitida;
- limite atingido;
- budget excedido.

Nao registrar segredos, tokens ou payloads sensiveis.

## Status de custo

Contratar o tipo oficial:

```ts
type CostStatus = "healthy" | "attention" | "exceeded" | "not_configured";
```

### Regras deterministicas

- `not_configured`: nao existe budget configurado para o escopo avaliado;
- `healthy`: existe budget configurado e o consumo esta abaixo de 80%;
- `attention`: existe budget configurado e o consumo esta entre 80% e 99.999%;
- `exceeded`: existe budget configurado e o consumo e igual ou superior ao limite;
- budget zero configurado e valido e distinto de budget nao configurado;
- budget zero configurado com consumo zero e `healthy`;
- budget zero configurado com qualquer consumo positivo e `exceeded`;
- o calculo nunca usa ponto flutuante para dinheiro; porcentagem pode ser arredondada para exibicao, mas a decisao e feita por comparacao inteira.

## Modos operacionais

Os modos existentes no contrato oficial sao:

- `demo`
- `local_test`
- `supervised_production`
- `restricted_production`
- `paused`

### Semantica por modo

#### `demo`

Finalidade:

- ambiente seguro para demonstracao e desenvolvimento sem efeitos reais.

Permitido:

- simulacoes;
- leitura;
- rastreio;
- operacoes sem efeito externo.

Bloqueado:

- IA real;
- TTS real;
- geracao real de imagem;
- geracao real de video;
- publicacao real;
- chamadas externas nao autorizadas;
- provedores pagos reais.

Comportamento padrao:

- se a acao puder gerar efeito real, bloquear;
- se a acao for simulacao, permitir.

Precedencia:

- nenhum policy por canal pode transformar `demo` em permissivo para acoes reais.

Resposta de API em bloqueio:

- `409` com `OPERATION_BLOCKED` ou `COMPLIANCE_BLOCKED` quando o bloqueio for de governanca operacional;
- payload com codigo deterministico, motivo legivel e origem da regra.

Auditoria:

- registrar `operational_mode.action_blocked`.

Frontend:

- exibir claramente que IA real e publicacao real estao bloqueadas;
- nao oferecer botao ou estado que sugira permissao real inexistente.

#### `local_test`

Finalidade:

- testes locais e ensaios sem custo ou efeito externo.

Permitido:

- leitura;
- simulacao;
- validacoes internas.

Bloqueado:

- IA real;
- publicacao real;
- provedores pagos reais;
- chamadas externas nao autorizadas.

Comportamento padrao:

- similar ao demo, mas pode expor mais dados de validacao interna.

#### `supervised_production`

Finalidade:

- operacao controlada, com efeitos reais apenas onde o contrato autorizar.

Permitido:

- acoes reais explicitamente permitidas pela policy global e pela policy do canal;
- operacoes pagas quando o budget permitir.

Bloqueado:

- acoes reais nao autorizadas;
- publicacao real nesta sprint;
- qualquer acao que a policy global proibir.

#### `restricted_production`

Finalidade:

- producao real mais restrita que `supervised_production`.

Permitido:

- apenas acoes explicitamente habilitadas pela policy efetiva.

Bloqueado:

- tudo o que a policy global ou do canal nao autorizar;
- publicacao real nesta sprint;
- qualquer acao real que ultrapasse budget.

#### `paused`

Finalidade:

- pausa operacional segura.

Bloqueado:

- todas as acoes reais;
- todas as acoes pagas;
- publicacao real;
- chamadas externas.

## Acoes controladas

A policy precisa decidir, no minimo, sobre:

- `real_ai_generation`
- `real_media_generation`
- `real_publication`
- `external_call`
- `paid_provider_call`
- `simulation_only`

Regras:

- IA real e publicacao real devem estar bloqueadas no modo `demo`;
- bloqueios reais sao garantidos no backend ou na camada central de dominio;
- frontend sozinho nao e controle suficiente;
- a policy efetiva e sempre a combinacao mais restritiva entre global e canal;
- policy de canal nao pode liberar o que a global bloqueou;
- canal inexistente retorna `404`;
- acao desconhecida retorna `400`.

## Regra de precedencia

- policy global e a base da plataforma;
- policy por canal refina a global;
- a policy efetiva usa sempre a semantica mais restritiva;
- se a policy de canal estiver ausente, o canal herda a global;
- se a policy global estiver ausente, o sistema cai em fallback seguro `demo`;
- se o canal existir mas nao tiver policy propria, isso nao libera acoes reais por omissao;
- uma configuracao por canal nunca pode enfraquecer um bloqueio global obrigatorio.

## Auditoria

Eventos obrigatorios:

- `cost.entry_created`
- `cost.budget_updated`
- `cost.policy_updated`
- `operational_mode.policy_updated`
- `operational_mode.decision_allowed`
- `operational_mode.decision_blocked`
- `operational_mode.limit_reached`
- `operational_mode.budget_exceeded`

Campos de auditoria relevantes:

- ator ou origem;
- `channelId` quando aplicavel;
- acao;
- policy aplicada;
- resultado;
- motivo;
- timestamp;
- custo associado quando aplicavel;
- metadados nao sensiveis.

## Endpoints

### Custos

- `GET /api/costs`
- `POST /api/costs`
- `GET /api/costs/:id`
- `GET /api/costs/summary`
- `GET /api/costs/breakdown`

### Policies e modos operacionais

- `GET /api/operational-modes`
- `PATCH /api/operational-modes/global`
- `PATCH /api/operational-modes/channels/:channelId`
- `POST /api/operational-modes/evaluate`

### Auditoria

- `GET /api/audit-logs`

Regras HTTP:

- validacao com Zod ou equivalente;
- `400` para payload invalido;
- `404` para recurso inexistente;
- `409` para conflito de dominio;
- `403` ou codigo coerente apenas se a implementacao ja adotar esse mapeamento, mas bloqueio operacional deve permanecer deterministico;
- sem stack trace;
- sem segredos;
- respostas deterministicas;
- isolamento por `channelId`.

## Integracao frontend

### Rotas

- `/costs`
- `/administration`
- `/audit-logs`

### Requisitos de `/costs`

- mostrar custo total do periodo;
- mostrar budget;
- mostrar consumo;
- mostrar saldo;
- mostrar status de custo;
- mostrar consolidacao por canal;
- mostrar consolidacao por etapa;
- mostrar consolidacao por fornecedor;
- mostrar consolidacao por conteudo quando houver vinculo;
- mostrar alertas de budget;
- mostrar estado nao configurado;
- mostrar estado vazio;
- mostrar estado de erro;
- mostrar loading;
- manter densidade empresarial.

### Requisitos de `/administration`

- mostrar policy global atual;
- mostrar policy do canal selecionado;
- mostrar policy efetiva;
- mostrar capacidades permitidas;
- mostrar capacidades bloqueadas;
- mostrar origem do bloqueio;
- mostrar impacto do modo `demo`;
- mostrar alertas operacionais;
- mostrar orcamento e status sem misturar semanticas;
- nao sugerir que IA real ou publicacao real estao disponiveis quando bloqueadas.

### Requisitos de `/audit-logs`

- mostrar eventos de custo e policy;
- filtrar por canal quando aplicavel;
- expor tracabilidade clara de bloqueios e decisoes.

## Seeds

As seeds desta sprint devem demonstrar de forma deterministica:

- status `healthy`;
- status `attention`;
- status `exceeded`;
- status `not_configured`;
- policy global `demo`;
- policy por canal mais restritiva;
- bloqueio de IA real no `demo`;
- bloqueio de publicacao real no `demo`;
- auditoria de decisao permitida e bloqueada;
- isolamento entre canais.

## Cenarios de teste

### Custos

- registro valido de custo;
- rejeicao de valor negativo;
- rejeicao de valor nao inteiro;
- rejeicao de canal inexistente;
- isolamento entre canais;
- total por canal;
- total por etapa;
- total por fornecedor;
- total por periodo;
- budget nao configurado;
- budget saudavel;
- budget em atencao;
- budget excedido;
- saldo correto;
- consistencia do breakdown.

### Policies e modos

- resolucao da policy global;
- resolucao da policy por canal;
- policy de canal mais restritiva;
- impossibilidade de liberar acao globalmente bloqueada;
- modo `demo` bloqueando IA real;
- modo `demo` bloqueando publicacao real;
- acao permitida em modo compativel;
- canal inexistente;
- acao desconhecida;
- resposta deterministica;
- evento de auditoria para tentativa bloqueada.

### API

- payload valido;
- payload invalido;
- `404`;
- isolamento por canal;
- status HTTP;
- formato de erro;
- contratos de resposta;
- bloqueio operacional.

### Frontend

- carregamento dos servicos;
- status de custo;
- budget nao configurado;
- budget excedido;
- modo `demo`;
- acao bloqueada;
- erro de API;
- estado vazio;
- troca de canal;
- ausencia de dados cruzados entre canais.

## Critérios de aceite

- custos sao registrados e consultados de forma deterministica;
- budget e consumo sao exibidos com status claro;
- policy global e policy por canal nao sao confundidas;
- policy efetiva e calculada de forma central;
- modo `demo` bloqueia IA real e publicacao real no backend;
- bloqueios nao dependem apenas do frontend;
- auditoria existe para eventos relevantes;
- contratos frontend/backend ficam alinhados;
- build, typecheck, lint e testes passam;
- telas alteradas passam por validacao visual;
- nenhum segredo foi exposto.

## Definition of Done

- spec 007 atualizada e coerente com o repositorio real;
- backend de custos, modes e auditoria implementado com validacao e testes;
- frontend minimo integrado nas rotas do escopo;
- contratos documentados e alinhados;
- smoke executado;
- screenshots capturadas nas telas alteradas;
- working tree limpo ou estado final documentado;
- commit criado;
- PR aberto.

## Riscos

- a policy operacional pode crescer se a sprint tentar cobrir futuras integracoes de publicacao e media antes do tempo;
- budget e status precisam de seeds consistentes para nao flapping em testes e QA visual;
- a persistencia em memoria exige ordenacao deterministica;
- a camada de bloqueio precisa ser centralizada para nao vazar regras por varias rotas.

## Proxima sprint recomendada

Sprint 8 - Media Assets and Storage Registry.
