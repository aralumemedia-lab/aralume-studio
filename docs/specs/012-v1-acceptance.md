# Spec 012 - V1 Acceptance

## Status

Planejada.

## Identification

- Spec ID: `012-v1-acceptance.md`
- Sprint number: 12
- Sprint name: V1 Acceptance
- Epic principal: E15 - Hardening V1.0
- Roadmap relation: esta spec governa a Sprint 12 e valida o gate de Hardening/V1 Acceptance.
- Relação histórica: a Fase 12 do roadmap é Publicação Assistida e foi materializada na Sprint 11.

## Objective

Definir o contrato normativo da Sprint 12, que existe para integrar, verificar, endurecer e decidir o aceite da V1.0 com evidência operacional pelo frontend.

## Context

V1 Acceptance não é uma sprint de criação ampla de funcionalidades novas. Ela existe para provar, com evidência reproduzível, que a Aralume Studio já possui uma base operacional coerente, segura e demonstrável para V1.0.

A decisão pode ser negativa. Uma decisão negativa é válida e não significa que a sprint falhou. Significa apenas que o repositório ainda não produziu evidência suficiente para aceitar a V1.0.

## Distinção entre identificadores

- **Fase do roadmap**: linha histórica de capacidade do produto no Documento Mestre.
- **Sprint de execução**: unidade sequencial de integração, verificação e entrega.
- **Spec**: contrato normativo da sprint.
- Os números podem divergir.
- A Fase 12 do roadmap não é a Sprint 12.
- A Sprint 12 está ligada ao gate de Hardening/V1 Acceptance, não à antiga Fase 12 de Publicação Assistida.

## Gate de início

A implementação da Sprint 12 somente poderá começar quando todos os itens abaixo estiverem verdadeiros:

- a normalização documental tiver sido mergeada em `main`;
- `main` estiver limpa e alinhada com `origin/main`;
- a Sprint 11 estiver comprovadamente encerrada;
- esta spec estiver formalizada como governante da Sprint 12;
- os pré-requisitos da V1.0 estiverem identificados;
- não houver conflito entre Documento Mestre, roadmap, backlog e handoff.

## Escopo da Sprint 12

A Sprint 12 pode:

- verificar os critérios obrigatórios da V1.0 definidos no Documento Mestre;
- executar o fluxo ponta a ponta pelo frontend;
- validar integração entre frontend, backend e persistência;
- validar isolamento por canal;
- validar rastreabilidade, auditoria e custos;
- validar renderização e cortes;
- validar qualidade, conformidade e aprovação humana;
- validar preparação de publicação assistida;
- validar métricas e recomendações quando esses requisitos já estiverem implementados;
- corrigir defeitos comprovados que bloqueiem o aceite;
- produzir evidências de aceite ou rejeição;
- registrar o resultado binário final da V1.0.

## Fora de escopo

A Sprint 12 não deve:

- criar grandes módulos novos;
- redefinir a arquitetura;
- recriar o frontend;
- substituir o design system;
- implementar funcionalidades de sprints posteriores;
- publicar conteúdo externamente sem autorização;
- introduzir novos provedores sem spec;
- solicitar ou registrar segredos em código, documentos, commits ou logs;
- mascarar ausência de integração usando mocks;
- aceitar a V1.0 com fluxos disponíveis apenas por CLI;
- declarar aceite sem evidência reproduzível;
- tratar endpoints isolados ou backend compilando como evidência suficiente de V1.0.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/001-environment-safe-migration.md`
- `docs/specs/002-backend-foundation.md`
- `docs/specs/003-channels.md`
- `docs/specs/004-agent-office-workflows.md`
- `docs/specs/005-editorial-pipeline.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/007-costs-operational-modes.md`
- `docs/specs/008-media-assets-storage.md`
- `docs/specs/009-rendering.md`
- `docs/specs/010-derived-clips.md`
- `docs/specs/011-publication-assisted.md`
- `docs/specs/013-channels-frontend-integration.md`
- `docs/specs/014-metrics-learning.md`

## Acceptance criteria

### Frontend operacional

- Um operador consegue executar, pelo frontend, o fluxo aplicável definido no Documento Mestre.
- A aceitação não depende de CLI, de scripts manuais ou de mocks crus.
- O fluxo demonstrado precisa ser reproduzível e observável.

### Integração real

- O fluxo precisa demonstrar integração entre frontend, backend e persistência quando esses componentes estiverem no caminho validado.
- O isolamento por canal precisa estar preservado em toda a superfície demonstrada.
- A rastreabilidade precisa existir de ponta a ponta para o fluxo validado.

### Gates funcionais

- Renderização e cortes precisam ser validados quando estiverem no caminho de aceite.
- Aprovação humana, qualidade e conformidade precisam estar evidenciadas quando fizerem parte do fluxo.
- Publicação assistida precisa estar preparada de forma auditável, sem envio externo automático.
- Custos e auditoria precisam estar visíveis e coerentes com o fluxo.
- Métricas e recomendações precisam ser validadas quando a capacidade já existir no repositório.

### Não aceitação explícita

A V1.0 não pode ser aceita apenas porque:

- o backend compila;
- os testes unitários passam;
- os fluxos funcionam somente por CLI;
- existem mocks visuais;
- endpoints existem isoladamente.

## Regra de registro de defeitos

Todo defeito que bloquear o aceite deve ser registrado com:

- severidade;
- componente;
- comportamento observado;
- impacto;
- correção;
- teste de regressão;
- evidência de validação;
- commit correspondente.

## Decisão binária

A decisão final da Sprint 12 deve ser uma de duas opções:

- `V1.0 aceita`;
- `V1.0 não aceita`.

Uma decisão negativa é válida. Nesse caso, a spec exige uma lista objetiva de bloqueios, severidades, evidências e próximos trabalhos necessários.

## Bloqueios atuais

- `E13` - Integracoes Reais Autorizadas - permanece planejada.
- `E14` - Metricas e Aprendizado - permanece planejada.
- Enquanto esses gates obrigatórios permanecerem sem evidência suficiente, a V1.0 não pode ser declarada aceita.

## Definition of Done

- O contrato da Sprint 12 está explícito e inequívoco.
- O início da sprint depende dos gates documentais definidos acima.
- O resultado final é binário e apoiado por evidência reproduzível.
- A documentação necessária permanece coerente com Documento Mestre, roadmap, backlog e handoff.
- Nenhum segredo foi exposto.
- Nenhum comportamento de produto foi implementado nesta execução documental.

## Próxima sprint recomendada

Sprint 12 - V1 Acceptance.
