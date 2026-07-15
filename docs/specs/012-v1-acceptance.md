# Spec 012 - V1 Acceptance

## Status

Em execucao na Sprint 14; candidato atual com veredito `V1.0 NÃO ACEITA`.

## Identification

- Spec ID: `012-v1-acceptance.md`
- Sprint number: 14
- Sprint name: V1 Acceptance
- Epic principal: E15 - Hardening V1.0
- Roadmap relation: esta spec governa a Sprint 14, que vem depois do encerramento comprovado das Sprints 12 e 13.
- Relacao historica: a Fase 12 do roadmap e Publicacao Assistida e foi materializada na Sprint 11.

## Objective

Definir o contrato normativo da Sprint 14, que existe para integrar, verificar, endurecer e decidir o aceite da V1.0 com evidencia operacional pelo frontend.

## Context

V1 Acceptance nao e uma sprint de criacao ampla de funcionalidades novas. Ela existe para provar, com evidencia reproduzivel, que a Aralume Studio ja possui uma base operacional coerente, segura e demonstravel para V1.0.

A decisao pode ser negativa. Uma decisao negativa e valida e nao significa que a sprint falhou. Significa apenas que o repositorio ainda nao produziu evidencia suficiente para aceitar a V1.0.

## Distincao entre identificadores

- **Fase do roadmap**: linha historica de capacidade do produto no Documento Mestre.
- **Sprint de execucao**: unidade sequencial de integracao, verificacao e entrega.
- **Spec**: contrato normativo da sprint.
- Os numeros podem divergir.
- A Fase 12 do roadmap nao e a Sprint 12.
- A Sprint 14 esta ligada ao gate de Hardening/V1 Acceptance, nao a antiga Fase 12 de Publicacao Assistida.

## Dependencias upstream

Esta sprint depende do encerramento comprovado de:

- Sprint 12 - Integracoes Reais Autorizadas, governada por `docs/specs/015-authorized-real-integrations.md`;
- Sprint 13 - Metricas e Aprendizado, governada por `docs/specs/014-metrics-learning.md`.

Esta spec nao pode ser usada para implementar E13 ou E14.

## Gate de inicio

A implementacao da Sprint 14 somente pode comecar quando todos os itens abaixo estiverem verdadeiros:

- a normalizacao documental tiver sido mergeada em `main`;
- `main` estiver limpa e alinhada com `origin/main`;
- as Sprints 12 e 13 estiverem comprovadamente encerradas;
- esta spec estiver formalizada como governante da Sprint 14;
- os pre-requisitos da V1.0 estiverem identificados;
- nao houver conflito entre Documento Mestre, roadmap, backlog e handoff.

## Escopo da Sprint 14

A Sprint 14 pode:

- verificar os criterios obrigatorios da V1.0 definidos no Documento Mestre;
- executar o fluxo ponta a ponta pelo frontend;
- validar integracao entre frontend, backend e persistencia;
- validar isolamento por canal;
- validar rastreabilidade, auditoria e custos;
- validar renderizacao e cortes;
- validar qualidade, conformidade e aprovacao humana;
- validar preparacao de publicacao assistida;
- validar metricas e recomendacoes quando essa capacidade ja existir no repositorio;
- corrigir defeitos comprovados que bloqueiem o aceite;
- produzir evidencias de aceite ou rejeicao;
- registrar o resultado binario final da V1.0.

## Fora de escopo

A Sprint 14 nao deve:

- criar grandes modulos novos;
- redefinir a arquitetura;
- recriar o frontend;
- substituir o design system;
- implementar funcionalidades de sprints posteriores;
- implementar E13 ou E14;
- publicar conteudo externamente sem autorizacao;
- introduzir novos provedores sem spec;
- solicitar ou registrar segredos em codigo, documentos, commits ou logs;
- mascarar ausencia de integracao usando mocks;
- aceitar a V1.0 com fluxos disponiveis apenas por CLI;
- declarar aceite sem evidencia reproduzivel;
- tratar endpoints isolados ou backend compilando como evidencia suficiente de V1.0.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/011-publication-assisted.md`
- `docs/specs/013-channels-frontend-integration.md`
- `docs/specs/014-metrics-learning.md`
- `docs/specs/015-authorized-real-integrations.md`

## Acceptance criteria

### Frontend operacional

- Um operador consegue executar, pelo frontend, o fluxo aplicavel definido no Documento Mestre.
- A aceitacao nao depende de CLI, de scripts manuais ou de mocks crus.
- O fluxo demonstrado precisa ser reproduzivel e observavel.

### Integracao real

- O fluxo precisa demonstrar integracao entre frontend, backend e persistencia quando esses componentes estiverem no caminho validado.
- O isolamento por canal precisa estar preservado em toda a superficie demonstrada.
- A rastreabilidade precisa existir de ponta a ponta para o fluxo validado.

### Gates funcionais

- Renderizacao e cortes precisam ser validados quando estiverem no caminho de aceite.
- Aprovacao humana, qualidade e conformidade precisam estar evidenciadas quando fizerem parte do fluxo.
- Publicacao assistida precisa estar preparada de forma auditavel, sem envio externo automatico.
- Custos e auditoria precisam estar visiveis e coerentes com o fluxo.
- Metricas e recomendacoes precisam ser validadas quando a capacidade ja existir no repositorio.

### Nao aceitacao explicita

A V1.0 nao pode ser aceita apenas porque:

- o backend compila;
- os testes unitarios passam;
- os fluxos funcionam somente por CLI;
- existem mocks visuais;
- endpoints existem isoladamente.

## Regra de registro de defeitos

Todo defeito que bloquear o aceite deve ser registrado com:

- severidade;
- componente;
- comportamento observado;
- impacto;
- correcao;
- teste de regressao;
- evidencia de validacao;
- commit correspondente.

## Decisao binaria

A decisao final da Sprint 14 deve ser uma de duas opcoes:

- `V1.0 aceita`;
- `V1.0 nao aceita`.

Uma decisao negativa e valida. Nesse caso, a spec exige uma lista objetiva de bloqueios, severidades, evidencias e proximos trabalhos necessarios.

## Bloqueios documentais remanescentes

- `E13` - Integracoes Reais Autorizadas - precisa estar comprovadamente encerrado antes do inicio da Sprint 14.
- `E14` - Metricas e Aprendizado - precisa estar comprovadamente encerrado antes do inicio da Sprint 14.
- Os gates upstream foram confirmados no preflight desta execucao. A V1.0 somente pode ser declarada aceita quando os 18 criterios obrigatorios tiverem evidencia suficiente.

## Definition of Done

- O contrato da Sprint 14 esta explicito e inequivoco.
- O inicio da sprint depende dos gates documentais definidos acima.
- O resultado final e binario e apoiado por evidencia reproduzivel.
- A documentacao necessaria permanece coerente com Documento Mestre, roadmap, backlog e handoff.
- Nenhum segredo foi exposto.
- Nenhum comportamento de produto foi implementado nesta execucao documental.
- O primeiro candidato foi registrado em `docs/acceptance/v1/` e nao foi aceito.

## Sprint alvo

Sprint 14 - V1 Acceptance.
