# ADR 001 - Adocao de epicos, historias e fatias verticais a partir da Sprint 11

- Status: Accepted
- Data: 2026-07-14
- Contexto: Aralume Studio
- Escopo: governanca documental e processo

## Contexto

A Aralume Studio ja operava com Spec Driven Development, mas os documentos de planejamento e handoff ainda misturavam linguagem de fase, sprint, capacidade ampla e entrega pontual. Isso dificultava separar o que era agrupador estrategico do que era incremento executavel.

O projeto tambem acumulou sprints historicas que nao devem ser reclassificadas retroativamente. A mudanca, portanto, precisa criar um modelo novo a partir da Sprint 11 sem apagar o historico anterior.

## Problema do modelo atual

- Roadmap, backlog, handoff e spec podiam divergir em nivel de abstracao.
- Capacidade ampla e incremento executavel apareciam como se fossem a mesma unidade.
- A numeracao da sprint era confundida com identificador de spec.
- Faltava um vocabulario oficial para historia funcional, historia tecnica e fatia vertical.
- Nao havia um contrato documental claro para diferenciar conclusao de sprint e conclusao de epico.

## Decisao

A partir da Sprint 11, a Aralume Studio passa a usar:

- epicos como agrupadores de grandes capacidades;
- historias como unidades funcionais ou tecnicas verificaveis;
- sprints como unidades pequenas de execucao e integracao;
- specs como contratos normativos das sprints;
- tarefas como unidades tecnicas de implementacao;
- PRs como unidades de integracao;
- gates como condicoes objetivas para avancar;
- fatias verticais como forma preferencial de entrega quando a historia pedir frontend, backend, persistencia, auditoria e testes juntos.

Decisoes complementares:

- SDD continua obrigatorio.
- Nao sera adotado Scrum completo.
- Nao serao usados story points obrigatorios.
- Nao serao criadas cerimonias obrigatorias adicionais.
- O historico anterior nao sera reescrito.
- Epicos podem atravessar varias sprints.
- Sprints devem entregar incrementos pequenos e verificaveis.

## Vigencia

Esta decisao entra em vigor a partir da Sprint 11.

As Sprints 0 a 10 permanecem historicamente validas, sem conversao retroativa de nomenclatura, sem renumeracao e sem alteracao de sentido dos registros ja publicados.

## Definicoes metodologicas

- Epico: capacidade ampla do produto, normalmente descrita no Documento Mestre como grande bloco estrategico.
- Historia funcional: comportamento de produto que pode ser verificado por criterio de aceite objetivo.
- Historia tecnica: trabalho tecnico necessario para viabilizar uma capacidade futura, com motivo, impacto e criterio de aceite claros.
- Sprint: incremento pequeno e integrado que pertence a um unico epico principal.
- Tarefa: trabalho tecnico especifico dentro de uma historia ou sprint.
- Spec: contrato normativo da sprint, com escopo, aceite, evidencias e gates.
- PR: unidade de integracao e revisao que consolida uma entrega.
- Gate: condicao objetiva para promover o trabalho a proxima etapa.
- Fatia vertical: entrega que cruza camadas suficientes para demonstrar valor real, em vez de acumular apenas trabalho de infraestrutura ou apenas visual.

## Consequencias positivas

- Menor ambiguidade entre roadmap e execucao.
- Melhor rastreabilidade entre epico, sprint, historia, tarefa e PR.
- Facilita planejamento incremental sem perder coerencia estrategica.
- Reduz o risco de sprint grande demais ou vaga demais.
- Ajuda a manter SDD como processo real e nao apenas declarativo.

## Riscos

- Se os documentos nao forem atualizados juntos, pode haver divergencia de linguagem.
- Se o modelo for aplicado de forma inconsistente, a sprint pode virar apenas uma nova etiqueta sem ganho real.
- Se historias tecnicas forem usadas sem criterio, o produto pode voltar a parecer abstrato demais.
- Se o historico de 0 a 10 for tocado, a governanca de transicao perde confianca.

## Alternativas consideradas

1. Manter o modelo atual centrado apenas em sprint.
2. Adotar Scrum completo com todas as cerimonias e artefatos.
3. Criar story points obrigatorios.
4. Tratar fases e sprints como a mesma coisa.
5. Adiar qualquer mudanca metodologica para depois da Sprint 11.

## Alternativas descartadas

- Manter o modelo atual apenas com sprint: descartado porque nao resolve a mistura entre capacidade ampla e incremento executavel.
- Adotar Scrum completo: descartado porque o projeto nao pediu uma reconstrucao metodologica total, apenas uma formalizacao mais util.
- Story points obrigatorios: descartado porque nao sao necessarios para o objetivo documental e podem criar falsa precisao.
- Tratar fases e sprints como a mesma coisa: descartado porque gera conflito numerico e semantico.
- Adiar a mudanca: descartado porque a Sprint 11 precisa nascer ja com o novo modelo.

## Regra para futuras mudancas metodologicas

Qualquer mudanca futura de metodologia deve:

1. Ser registrada em um novo ADR.
2. Atualizar os documentos normativos relevantes antes de qualquer implementacao.
3. Preservar o historico publicado, salvo quando houver erro documental material claramente comprovado.
4. Explicitar impacto em epicos, sprints, historias, specs, backlog e handoff.
5. Manter o SDD como regra superior do processo.
