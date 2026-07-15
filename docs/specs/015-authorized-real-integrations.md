# Spec 015 - Integracoes Reais Autorizadas

## Status

Planejada.

## Identification

- Spec ID: `015-authorized-real-integrations.md`
- Sprint number: 12
- Sprint name: Integracoes Reais Autorizadas
- Epic principal: E13 - Integracoes Reais Autorizadas
- Roadmap relation: esta spec governa a Sprint 12 e materializa E13; o numero da spec nao precisa coincidir com o numero da sprint.
- Relacao historica: a Fase 12 do roadmap e Publicacao Assistida e foi materializada na Sprint 11.

## Objective

Definir o contrato normativo da Sprint 12 para habilitar integracoes reais autorizadas, seguras, auditaveis e isoladas por canal, sem antecipar metricas, aprendizado ou V1 Acceptance.

## Context

Sprint 12 existe para formalizar a camada de autorizacao e governanca das integracoes reais que o produto precisar utilizar. Esta sprint nao incorpora metricas, aprendizado editorial nem hardening da V1.0.

O repositorio ainda nao definiu oficialmente quais provedores ou plataformas entram no E13. Essa decisao precisa ser aprovada em documentacao oficial antes da implementacao; esta spec nao inventa essa lista.

Enquanto essa aprovacao nao existir, a Sprint 12 permanece bloqueada e nao pode começar.

## Distincao entre identificadores

- **Fase do roadmap**: linha historica de capacidade do produto no Documento Mestre.
- **Sprint de execucao**: unidade sequencial de entrega e integracao.
- **Spec**: contrato normativo que governa a sprint.
- Os numeros podem divergir.
- A Fase 12 do roadmap nao e a Sprint 12.
- A Sprint 12 pertence ao E13 e usa esta spec como contrato normativo.

## Historias incluidas

- Autorizar integracoes reais somente com aprovacao humana documentada quando houver efeito externo.
- Registrar e recuperar o estado de autorizacao por canal.
- Armazenar tokens ou credenciais em forma segura, sem expor segredos.
- Revogar autorizacoes e invalidar acessos de forma auditavel.
- Exibir estados operacionais e de erro da integracao real por canal.
- Preservar isolamento entre canais e evitar vazamento de contexto.

## Historias nao incluidas

- Metricas e aprendizado editorial.
- Hardening ou aceite da V1.0.
- Publicacao externa sem autorizacao humana.
- Novos provedores nao citados em documentacao oficial.
- Recriacao do frontend.
- Mudanca de arquitetura fora do contrato desta sprint.

## Pre-requisitos

- Sprint 11 encerrada e integrada ao `main`.
- Documento Mestre, roadmap, backlog e handoff sem conflito de sequenciamento.
- Gate documental para definir quais integracoes reais entram no E13.
- Politica de segredos, auditoria e aprovacao humana alinhada com os docs oficiais.
- Nenhum segredo exposto em codigo, commit, log ou documento.

## Decisao documental obrigatoria

Antes de qualquer implementacao da Sprint 12, a documentacao oficial deve aprovar explicitamente cada integracao selecionada com:

- plataforma ou provedor;
- finalidade;
- canal ou contexto operacional;
- fluxo de autorizacao;
- permissoes minimas;
- efeito externo permitido;
- necessidade de aprovacao humana;
- politica de revogacao;
- contratos afetados;
- evidencias exigidas.

Se qualquer um desses pontos permanecer pendente, o gate de inicio continua bloqueado. Registrar a pendencia nao satisfaz o gate.

## Gate de inicio

A implementacao da Sprint 12 somente pode comecar quando todos os itens abaixo forem verdadeiros:

- a normalizacao documental estiver mergeada em `main`;
- `main` estiver limpa e alinhada com `origin/main`;
- a Sprint 11 estiver comprovadamente encerrada;
- esta spec estiver formalizada como governante da Sprint 12;
- os provedores ou plataformas abrangidos estiverem explicitamente definidos e aprovados na documentacao oficial;
- finalidade, permissoes, autorizacao, revogacao e contratos afetados estiverem documentados;
- o escopo estiver suficientemente definido para produzir testes e evidencias reproduziveis;
- nao existir pendencia aberta sobre a escolha dos provedores ou plataformas;
- nao houver conflito entre Documento Mestre, roadmap, backlog e handoff.

## Escopo

- Fluxo de autorizacao para integracoes reais.
- Estados de conexao, autorizacao, expiracao, revogacao e erro.
- Armazenamento seguro de segredos e tokens.
- Auditoria das decisoes relevantes.
- Isolamento por canal.
- Conformidade e aprovacao humana quando houver efeito externo.
- Contratos afetados no frontend e no backend futuro, apenas na extensao necessaria para a integracao autorizada.

## Contratos afetados

- Estado de integracao por canal.
- Estado de autorizacao e revogacao.
- Metadados de credenciais e tokens.
- Auditoria de tentativas, aprovacoes, recusas e revogacoes.
- Mensagens de erro e estados vazios.
- Interfaces de configuracao ou confirmacao ja previstas em docs oficiais.

## Fluxo de autorizacao

1. O operador identifica o canal e a integracao real autorizada.
2. O sistema solicita aprovacao humana quando houver permissao ou efeito externo.
3. O provedor autorizado conclui o fluxo de autorizacao.
4. O sistema grava apenas o estado necessario para operar, sem expor segredo.
5. O estado fica disponivel para leitura operacional e auditoria.
6. A revogacao invalida o acesso e deixa trilha auditavel.

## Politica para OAuth e tokens

- OAuth, quando aplicavel ao provedor autorizado, deve seguir fluxo aprovado em documento oficial.
- Access token, refresh token, client secret ou equivalente nunca devem aparecer em codigo, commit, log, documento ou saida operacional.
- Tokens sensiveis devem ficar apenas em armazenamento seguro aprovado.
- Credenciais nao devem ser copiadas para mocks, fixtures ou exemplos reais.
- Qualquer integracao sem OAuth ainda precisa obedecer ao mesmo principio de segredo minimo e armazenamento seguro.

## Armazenamento seguro de segredos

- Segredos devem ficar fora do repositorio.
- Nao usar texto aberto para tokens ou segredos operacionais.
- Rotacao, invalidacao e revogacao devem ser possiveis sem reescrever historico.
- Logs devem omitir valores sensiveis.

## Aprovacao humana

- Qualquer integracao com efeito externo exige aprovacao humana documentada quando a doc oficial assim determinar.
- A aprovacao humana e parte do contrato, nao um detalhe de implementacao.

## Conformidade

- A integracao deve respeitar isolamento por canal.
- A integracao nao pode misturar contexto de canais diferentes.
- A superficie exibida ao operador precisa deixar claro o estado de autorizacao, risco e disponibilidade.
- A ausencia de provedor oficialmente definido nao deve ser preenchida com suposicao.

## Auditoria

- Registrar tentativa de autorizacao.
- Registrar aprovacao, recusa, expiracao e revogacao.
- Registrar canal, integracao, ator e timestamp.
- Registrar estados de erro reproduziveis.
- Manter trilha suficiente para revisao documental e operacional.

## Isolamento por canal

- Um canal nao pode ler credenciais de outro canal.
- Um estado autorizado em um canal nao autoriza outros canais.
- A auditoria precisa permitir distinguir o contexto de cada canal.

## Revogacao

- Revogar acesso deve ser possivel sem redeclarar a sprint.
- Revogacao precisa invalidar o uso futuro do token ou da autorizacao.
- O estado revogado precisa ser visivel para o operador.

## Estados de erro

- pendente de aprovacao;
- autorizacao negada;
- autorizacao expirada;
- credencial ausente;
- integracao indisponivel;
- integracao revogada;
- provedor nao suportado;
- configuracao inconsistente;
- erro de auditoria ou persistencia.

## Evidencias esperadas

- Evidencia reproduzivel do fluxo de autorizacao.
- Evidencia de armazenamento seguro.
- Evidencia de revogacao.
- Evidencia de auditoria por canal.
- Evidencia de estados de erro previsiveis.
- Evidencia de que nenhum segredo apareceu em artefatos de trabalho.

## Testes obrigatorios

- Fluxo de autorizacao bem-sucedido.
- Fluxo de aprovacao negada.
- Fluxo de expiracao ou revogacao.
- Fluxo de erro de integracao indisponivel.
- Verificacao de isolamento por canal.
- Verificacao de ausencia de segredo em log, commit e resposta operacional.

## Fora de escopo

- Metricas e aprendizado.
- V1 Acceptance.
- Grandes modulos novos nao previstos no contrato.
- Recriacao do frontend.
- Publicacao externa sem autorizacao.
- Novos provedores sem documento oficial.
- Mascarar ausencia de integracao com mocks.
- Aceitar o fluxo sem evidencia reproduzivel.

## Definition of Done

- A governanca da integracao real esta documentada sem ambiguidade.
- A decisao sobre provedores ou plataformas esta explicitada na documentacao oficial.
- Segredos permanecem fora do repositorio e dos logs.
- A auditoria e o isolamento por canal estao definidos.
- O contrato e coerente com Documento Mestre, roadmap, backlog, handoff e demais specs.
- Nenhum comportamento de produto foi implementado nesta execucao documental.
