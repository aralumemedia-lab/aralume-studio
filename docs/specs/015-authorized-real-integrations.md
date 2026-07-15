# Spec 015 - Integracoes Reais Autorizadas

## Status

Em implementacao na branch `codex/sprint-12-authorized-youtube-integration`.

## Identification

- Spec ID: `015-authorized-real-integrations.md`
- Sprint number: 12
- Sprint name: Integracoes Reais Autorizadas
- Epic principal: E13 - Integracoes Reais Autorizadas
- Roadmap relation: esta spec governa a Sprint 12 e materializa E13; o numero da spec nao precisa coincidir com o numero da sprint.
- Relacao historica: a Fase 12 do roadmap e Publicacao Assistida e foi materializada na Sprint 11.
- ADR relacionado: `docs/architecture/adrs/002-e13-approved-providers.md`

## Objective

Definir o contrato normativo da Sprint 12 para habilitar integracoes reais autorizadas, seguras, auditaveis e isoladas por canal, sem antecipar metricas, aprendizado ou V1 Acceptance.

## Context

Sprint 12 existe para formalizar a camada de autorizacao e governanca das integracoes reais que o produto precisa utilizar. Esta sprint nao incorpora metricas, aprendizado editorial nem hardening da V1.0.

A decisao documental do E13 esta fechada no ADR relacionado. A lista aprovada para esta sprint e minima e nao deve ser ampliada por analogia com mocks, seeds ou preferencias de produto.

Enquanto a normalizacao documental nao estiver mergeada em `main` e a branch funcional da Sprint 12 nao existir, a implementacao continua fora de execucao. O documento define o contrato; a branch futura executa esse contrato.

## Distincao entre identificadores

- **Fase do roadmap**: linha historica de capacidade do produto no Documento Mestre.
- **Sprint de execucao**: unidade sequencial de entrega e integracao.
- **Spec**: contrato normativo que governa a sprint.
- Os numeros podem divergir.
- A Fase 12 do roadmap nao e a Sprint 12.
- A Sprint 12 pertence ao E13 e usa esta spec como contrato normativo.
- A lista aprovada de provedores/plataformas e fechada e consta no ADR relacionado.

## Historias incluidas

- H12.1 - Estado da integracao YouTube por canal.
- H12.2 - Autorizacao e revogacao OAuth 2.0 Google.
- H12.3 - Selecao do canal YouTube e readiness operacional.
- H12.4 - Upload autorizado de publicacao aprovada.
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
- Novos provedores nao aprovados no ADR relacionado.
- Recriacao do frontend.
- Mudanca de arquitetura fora do contrato desta sprint.

## Pre-requisitos

- Sprint 11 encerrada e integrada ao `main`.
- Documento Mestre, roadmap, backlog e handoff sem conflito de sequenciamento.
- Lista fechada de provedores/plataformas aprovada no ADR relacionado.
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

Esses pontos ja estao fechados para a integracao aprovada no ADR relacionado. Qualquer integracao adicional continua fora da aprovacao da Sprint 12 e exige nova decisao formal.

## Gate de inicio

A implementacao da Sprint 12 somente pode comecar quando todos os itens abaixo forem verdadeiros:

- a normalizacao documental estiver mergeada em `main`;
- `main` estiver limpa e alinhada com `origin/main`;
- a Sprint 11 estiver comprovadamente encerrada;
- esta spec estiver formalizada como governante da Sprint 12;
- os provedores ou plataformas abrangidos estiverem explicitamente definidos e aprovados na documentacao oficial;
- finalidade, permissoes, autorizacao, revogacao e contratos afetados estiverem documentados;
- o escopo estiver suficientemente definido para produzir testes e evidencias reproduziveis;
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

## Contratos de execucao da Sprint 12

Todos os endpoints abaixo usam o envelope HTTP existente, exigem `channelId` quando
operacionais e nunca retornam tokens, secrets ou payloads sensiveis. O `state` de
OAuth e transportado apenas no redirect e nao e persistido em resposta operacional.

| Metodo | Endpoint                                               | Entrada                         | Retorno sem segredo                                          |
| ------ | ------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------ |
| GET    | `/api/integrations/youtube/oauth/start?channelId=<id>` | canal ativo                     | `OAuthStartResponse` com `authorizationUrl`, `expiresAt`     |
| GET    | `/api/integrations/youtube/oauth/callback`             | `code`, `state`, `error`        | HTML/redirect seguro para a UI; estado persistido no backend |
| GET    | `/api/integrations/youtube/connection?channelId=<id>`  | canal ativo                     | `YouTubeConnectionState`                                     |
| GET    | `/api/integrations/youtube/channels?channelId=<id>`    | canal ativo                     | `YouTubeChannel[]`                                           |
| POST   | `/api/integrations/youtube/selection`                  | `channelId`, `youtubeChannelId` | `YouTubeConnectionState`                                     |
| GET    | `/api/integrations/youtube/readiness?channelId=<id>`   | canal ativo                     | `YouTubeReadiness`                                           |
| POST   | `/api/integrations/youtube/revoke`                     | `channelId`                     | `YouTubeConnectionState`                                     |
| POST   | `/api/publications/:publicationJobId/upload`           | `channelId`, `requestedBy`      | `YouTubeUploadResult`                                        |
| GET    | `/api/publications/:publicationJobId/upload`           | `channelId`                     | `YouTubeUploadResult` ou estado `pending`                    |

`YouTubeConnectionState.status` é fechado em `disconnected`, `pending`, `connected`,
`expired`, `revoked` e `error`. `YouTubeReadiness.status` é `ready`, `warning` ou
`blocked` e inclui razões determinísticas. `YouTubeUploadResult` contém somente
IDs externos, status, timestamps, `publicationJobId` e código/mensagem normalizados.
O único escopo autorizado nesta sprint é
`https://www.googleapis.com/auth/youtube.upload`.

Critérios por história:

- H12.1: conexão, destino selecionado e readiness são sempre filtrados por `channelId`.
- H12.2: state é HMAC, expirável e one-shot; callback exige escopo mínimo; tokens ficam
  cifrados em repouso; refresh, revogação remota e invalidação local são auditáveis.
- H12.3: apenas canais retornados pela API autorizada podem ser selecionados; canal
  selecionado e token pertencem ao mesmo contexto operacional.
- H12.4: upload exige aprovação humana aprovada, compliance aprovado, modo externo
  permitido, readiness, asset elegível do mesmo canal e idempotência sem conflito.

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
- Novos provedores nao aprovados no ADR relacionado.
- Mascarar ausencia de integracao com mocks.
- Aceitar o fluxo sem evidencia reproduzivel.

## Definition of Done

- H12.1-H12.4 estao implementadas no frontend, backend, persistencia, auditoria e testes.
- A decisao sobre provedores ou plataformas esta explicitada na documentacao oficial e fechada no ADR relacionado.
- Segredos permanecem fora do repositorio, bundles, respostas e logs.
- A auditoria e o isolamento por canal sao verificaveis por testes e operacao.
- O contrato e coerente com Documento Mestre, roadmap, backlog, handoff e demais specs.
- O gate de conclusao exige evidencia reproduzivel do fluxo autorizado; mocks comprovam apenas o comportamento controlado e nao substituem validacao real quando credenciais seguras estiverem disponiveis.

## Matriz de integracoes aprovadas

| Campo                 | Conteudo                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provedor/plataforma   | YouTube Data API com autorizacao oficial da Google                                                                                                                                                                                                                                                                                              |
| Status                | approved for E13                                                                                                                                                                                                                                                                                                                                |
| Finalidade            | Publicacao assistida em canal YouTube autorizado, com estado de conexao por canal e evidencias auditaveis                                                                                                                                                                                                                                       |
| Dependencia normativa | E13 / Sprint 12 / spec 015 / ADR 002                                                                                                                                                                                                                                                                                                            |
| Fluxo operacional     | Operador seleciona canal, escolhe alvo autorizado, prepara pacote assistido e conclui o fluxo documental de autorizacao                                                                                                                                                                                                                         |
| Tipo de autorizacao   | OAuth 2.0 oficial da Google                                                                                                                                                                                                                                                                                                                     |
| Permissoes minimas    | `https://www.googleapis.com/auth/youtube.upload` como minimo; escopos adicionais somente se uma necessidade documental futura exigir leitura complementar                                                                                                                                                                                       |
| Efeito externo        | Upload e publicacao assistida em canal autorizado                                                                                                                                                                                                                                                                                               |
| Aprovacao humana      | Obrigatoria antes de qualquer efeito externo                                                                                                                                                                                                                                                                                                    |
| Isolamento por canal  | Cada canal possui autorizacao independente                                                                                                                                                                                                                                                                                                      |
| Armazenamento seguro  | Access token e refresh token criptografados/armazenados fora do repositorio                                                                                                                                                                                                                                                                     |
| Revogacao             | Fluxo oficial de revogacao da Google e invalidacao local do estado                                                                                                                                                                                                                                                                              |
| Auditoria             | Tentativa, aprovacao, recusa, expiracao, revogacao, erro e idempotencia                                                                                                                                                                                                                                                                         |
| Contratos de frontend | `/publications`, `PublicationTarget`, `PublicationJob`, estados de readiness e aprovacoes                                                                                                                                                                                                                                                       |
| Contratos de backend  | `/api/publication-targets`, `/api/publications`, `/api/publications/:publicationJobId/reschedule`; contratos de iniciar OAuth, callback, estado de conexao, revogacao, selecao de canal e readiness devem ser formalizados na Spec Review da Sprint 12 antes da implementacao                                                                   |
| Persistencia          | `PublicationTarget`, `PublicationJob`, `HumanApproval`, `AuditLog`                                                                                                                                                                                                                                                                              |
| Estados de erro       | autorizacao negada, expiracao, credencial ausente, revogado, indisponivel, configuracao inconsistente, erro de auditoria ou persistencia                                                                                                                                                                                                        |
| Testes obrigatorios   | Fluxo aprovado, fluxo negado, revogacao, erro de indisponibilidade, isolamento por canal, ausencia de segredo                                                                                                                                                                                                                                   |
| Custos e limites      | Respeitar quotas e limites do provedor e registrar custo quando aplicavel                                                                                                                                                                                                                                                                       |
| Fora de escopo        | TikTok, Instagram, LinkedIn, novos provedores sem nova decisao formal, automacao sem aprovacao humana                                                                                                                                                                                                                                           |
| Riscos                | Escopo excessivo, revogacao mal tratada, token exposto, publicacao sem aprovacao                                                                                                                                                                                                                                                                |
| Fonte oficial         | `https://developers.google.com/youtube/v3/guides/authentication`, `https://developers.google.com/youtube/v3/guides/uploading_a_video`, `https://developers.google.com/youtube/v3/guides/auth/installed-apps`, `https://developers.google.com/identity/protocols/oauth2/web-server`, `https://support.google.com/accounts/answer/13533235?hl=en` |
