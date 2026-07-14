# Spec 010 - Derived Clips

## Status

Planejada.

## Objetivo

Definir a geracao controlada, persistente e rastreavel de cortes derivados a partir de videos principais concluidos, reutilizando a infraestrutura de renderizacao controlada entregue na Sprint 9.

## Problema

A Sprint 9 ja entrega videos principais controlados, persistencia de jobs, custos, auditoria, storage validado e execucao real com FFmpeg. Ainda falta um dominio formal para produzir ativos editoriais derivados a partir desses videos principais, sem criar uma segunda arquitetura de renderizacao.

Sem essa camada, a plataforma nao consegue:

- selecionar um video principal concluido;
- recortar um intervalo temporal valido;
- rastrear o corte de forma permanente;
- vincular o corte ao job de renderizacao correspondente;
- consultar o estado real de processamento;
- persistir o corte apos reinicio do backend;
- registrar custo, auditoria e metadados operacionais do derivado.

## Contexto

Esta sprint nao cria um motor novo. Ela estende a fundacao ja existente de:

- `RenderJob`;
- estado de jobs;
- storage root autorizado;
- validacao de caminhos;
- FFmpeg real;
- FFprobe real;
- custos;
- auditoria;
- persistencia em arquivo;
- contratos de frontend ja tipados.

O dominio de cortes deve continuar isolado por `channelId` e usar o mesmo padrao de repositorio persistido em arquivo adotado na Sprint 9.

## Escopo

- criacao de cortes derivados a partir de um video principal concluido;
- validacao temporal do intervalo de corte;
- validacao de canal e storage;
- reaproveitamento da maquina de estados de renderizacao;
- persistencia do corte, do job, do custo e da auditoria;
- idempotencia por chave e por canal;
- integracao real com FFmpeg e FFprobe;
- listagem e consulta de cortes por canal;
- filtro por video principal;
- rota frontend `/clips`;
- acesso ao ativo gerado por contrato seguro;
- testes de dominio, API, storage, FFmpeg, persistencia e frontend.

## Fora de escopo

- selecao automatica de trechos por IA;
- analise semantica do video;
- transcricao automatica;
- legendas automáticas novas;
- reenquadramento inteligente;
- thumbnails automáticas;
- publicacao;
- OAuth;
- upload para plataformas externas;
- metricas reais;
- monetizacao;
- aprovacao editorial nova;
- redesign amplo do design system;
- reimplementacao da Sprint 9;
- caminho arbitario fornecido pelo frontend.

## Fontes de verdade

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/007-costs-operational-modes.md`
- `docs/specs/008-media-assets-storage.md`
- `docs/specs/009-rendering.md`
- `docs/specs/011-publication-assisted.md`

## Entidades

### DerivedClip

O contrato deve permanecer compatível com o tipo ja aprovado no frontend e pode incluir, no minimo:

- `id`
- `channelId`
- `parentVideoId`
- `renderJobId`
- `title`
- `hook`
- `description`
- `startSeconds`
- `endSeconds`
- `durationSeconds`
- `status`
- `targetPlatform`
- `format`
- `resolution`
- `aspectRatio`
- `clipPotentialScore`
- `riskLevel`
- `internalUri`
- `storagePath`
- `mimeType`
- `sizeBytes`
- `checksumAlgorithm`
- `checksum`
- `costActualCents`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

Regras de compatibilidade:

- `parentVideoId` identifica sempre o video principal de origem.
- `renderJobId` aponta para o job persistido que executou o corte.
- `status` representa o estado operacional real do job.
- `title`, `hook` e `description` sao metadados editoriais operacionais, nao IA obrigatoria.
- `format`, `resolution` e `aspectRatio` devem vir da validacao real do arquivo final.
- `internalUri` e `storagePath` nunca devem expor caminhos arbitrarios do cliente.

### VideoAsset

O corte depende de um `VideoAsset` principal ja concluido.

Regras do video de origem:

- mesmo `channelId` do corte;
- `renderStatus` concluido;
- arquivo existente;
- arquivo dentro do storage root autorizado;
- arquivo dentro do namespace do canal.

### RenderJob

O corte deve reutilizar a infraestrutura de `RenderJob` ja existente.

Campos adicionais esperados para o fluxo de cortes:

- `parentVideoId`
- `startSeconds`
- `endSeconds`
- `targetPlatform`

## Regras de dominio

1. Somente videos principais concluídos podem gerar cortes.
2. O video principal deve pertencer ao mesmo canal da solicitacao.
3. O arquivo do video principal deve existir.
4. O arquivo do video principal deve estar dentro do storage root autorizado.
5. O arquivo do video principal deve pertencer ao namespace do canal.
6. O inicio deve ser maior ou igual a zero.
7. O fim deve ser maior que o inicio.
8. O fim nao pode ultrapassar a duracao real do video.
9. A duracao do corte deve ser positiva.
10. Intervalos invalidos devem ser rejeitados antes de executar FFmpeg.
11. O corte deve manter vinculacao permanente com o video principal.
12. Um replay idempotente nao pode criar outro corte, outro job, outro custo ou outra auditoria terminal equivalente.
13. Uma falha nao pode registrar arquivo parcial como concluido.
14. O corte deve sobreviver a reinicializacao dos repositorios.
15. O corte nao pode cruzar canais.
16. O frontend nao pode enviar caminho de arquivo arbitario.

## Maquina de estados

Reutilizar a maquina de estados da renderizacao sempre que possivel.

Estados aplicaveis ao corte:

- `queued`
- `running`
- `completed`
- `failed`
- `blocked`

Transicoes aceitas:

- criacao -> `queued`
- `queued` -> `running`
- `running` -> `completed`
- `queued` -> `blocked`
- `queued` -> `failed` quando a execucao nao puder concluir por falha do runtime dentro do fluxo
- `running` -> `failed`
- `running` -> `blocked`

Se retry ja estiver suportado na infraestrutura compartilhada, a transicao pode ser reaproveitada; caso contrario, nao introduzir retry novo para este dominio.

## Idempotencia

### Chave

- A chave de idempotencia deve ser obrigatoria na criacao do corte.
- O escopo da chave e por canal.

### Operacao protegida

- A operacao protegida e a criacao do corte derivado e do job correspondente.

### Comportamento de replay

- Mesma chave e mesmo payload retornam o mesmo corte e o mesmo job.
- Nenhum novo custo terminal e nenhuma nova auditoria terminal devem ser criados no replay.

### Mesmo chave, payload diferente

- Deve resultar em conflito deterministico.

### Concorrencia

- Solicitaçoes concorrentes com a mesma chave devem convergir para um unico corte e um unico job.

### Efeito sobre custo e auditoria

- Nao duplicar custo.
- Nao duplicar auditoria terminal.
- Nao duplicar arquivo de saida.

## Persistencia

Persistir sob o storage root autorizado:

- cortes derivados;
- jobs de renderizacao relacionados;
- custos;
- auditoria;
- relacao permanente com o video principal.

Persistencia esperada:

- `media-assets.json` continua sendo a fonte de verdade de `DerivedClip` e `VideoAsset`;
- `render-jobs.json` continua sendo a fonte de verdade de `RenderJob`;
- custos e auditoria continuam persistidos pelos repositórios ja existentes;
- o link entre corte e video principal sobrevive a reinicio.

## Storage e seguranca de caminhos

Regras obrigatorias:

- rejeitar caminho absoluto nao autorizado;
- rejeitar `..`;
- rejeitar traversal apos normalizacao;
- rejeitar arquivo de outro canal;
- rejeitar video inexistente;
- rejeitar video sem arquivo;
- manter output no namespace do canal;
- manter output vinculado ao corte;
- usar nomes de arquivo seguros;
- usar extensao controlada;
- limpar arquivo temporario apos falha;
- nao expor path interno desnecessario na API;
- nao aceitar caminho arbitrario enviado pelo frontend.

## FFmpeg

A geracao do corte deve ser reproduzivel.

Estratégia:

- usar argumentos estruturados;
- nao concatenar shell;
- validar o video principal antes do recorte;
- recortar com reprocessamento controlado, nao apenas stream copy;
- aplicar timeout;
- capturar stdout e stderr de forma controlada;
- validar exit code;
- confirmar que o arquivo foi criado;
- confirmar que o arquivo possui tamanho valido;
- limpar temporarios quando houver falha;
- persistir apenas depois da validacao final.

O corte deve preservar a geometria do video principal quando nao houver regra de reenquadramento inteligente.

## FFprobe

Usar FFprobe para validar:

- duracao do arquivo-fonte;
- duracao do output;
- formato do output;
- resolucao do output;
- compatibilidade do intervalo solicitado com o resultado final.

## Custos

O custo deve:

- pertencer ao canal correto;
- identificar a etapa de cortes;
- estar associado ao job;
- estar associado ao corte;
- ser registrado uma unica vez;
- nao ser duplicado por replay idempotente;
- possuir comportamento definido para falha e timeout;
- permanecer apos reinicio;
- aparecer nas consultas de custo existentes quando aplicavel.

Se o processamento local for considerado custo zero em algum ambiente, registrar conforme a convencao ja adotada pelo projeto, sem inventar valores externos.

## Auditoria

Eventos minimos esperados:

- solicitacao recebida;
- job criado;
- execucao iniciada;
- corte concluido;
- falha;
- timeout;
- replay idempotente;
- rejeicao por validacao;
- retry, somente se suportado.

Cada evento deve registrar:

- ator;
- channelId;
- entidade;
- ID do video principal;
- ID do corte;
- ID do job;
- acao;
- status;
- timestamp;
- erro controlado;
- metadados nao sensiveis.

## API

Endpoints minimos esperados:

- `POST /api/clips`
- `GET /api/clips`
- `GET /api/clips/:id`
- `GET /api/clips/:id/file` ou endpoint equivalente de acesso seguro ao ativo, quando usado pela UI

Filtros esperados:

- `channelId`
- `parentVideoId`
- `status`
- `targetPlatform`
- `renderJobId`

Regras:

- o frontend envia IDs e parametros de negocio;
- o backend resolve storage e arquivo internamente;
- a API nao expõe caminhos internos desnecessarios;
- a criacao do corte deve retornar o contrato oficial do corte;
- a consulta deve permitir rastrear o job relacionado e o video principal.

## Frontend

Rota: `/clips`

Requisitos minimos:

- listar cortes do canal selecionado;
- identificar o video principal de origem;
- exibir titulo ou identificacao operacional;
- exibir inicio e fim;
- exibir duracao;
- exibir status real do processamento;
- exibir formato, resolucao e proporcao quando disponiveis;
- exibir custo quando disponivel;
- exibir data de criacao;
- exibir erro controlado quando houver;
- permitir criar novo corte a partir de um video concluido;
- impedir envio evidentemente invalido;
- enviar chave de idempotencia;
- exibir loading;
- exibir sucesso;
- exibir erro;
- impedir duplicacao por multiclque;
- atualizar a lista apos criacao;
- consumir somente a camada de services.

Estados visuais obrigatorios:

- loading;
- empty state;
- error state;
- lista com dados;
- job em fila;
- job executando;
- job concluido;
- job falho;
- timeout, quando suportado;
- canal sem video concluido.

Integraçao com `/videos`:

- quando compatível com a estrutura existente, adicionar uma acao discreta no video principal concluido para iniciar um corte ou navegar para `/clips` com o video preselecionado.

## Testes

### Dominio

- criacao valida;
- inicio negativo;
- fim menor ou igual ao inicio;
- fim alem da duracao;
- video nao concluido;
- video inexistente;
- video de outro canal;
- vinculo entre corte e video principal;
- metadados do corte;
- transicoes validas;
- transicoes invalidas.

### Idempotencia

- repeticao da mesma solicitacao;
- mesma chave e mesmo payload;
- mesma chave e payload diferente;
- ausencia de corte duplicado;
- ausencia de job duplicado;
- ausencia de custo duplicado;
- ausencia de auditoria terminal duplicada;
- chamadas concorrentes, quando a arquitetura permitir.

### Persistencia

- corte sobrevive ao reinicio do repositorio;
- job sobrevive ao reinicio;
- vinculo com o video principal sobrevive;
- custo sobrevive;
- auditoria sobrevive;
- estado falho sobrevive, quando aplicavel.

Inclui regressao equivalente a:

- `derived clip and its parent relationship survive a repository restart`

### Storage

- source dentro do storage root;
- source fora do storage root;
- source de outro canal;
- path traversal;
- output no namespace correto;
- arquivo parcial removido apos falha.

### FFmpeg e FFprobe

- adapter fake deterministico;
- sucesso real quando FFmpeg estiver disponivel;
- duracao real validada por FFprobe;
- exit code invalido;
- timeout;
- output ausente;
- output corrompido ou vazio;
- limpeza apos falha.

### API

- criacao;
- listagem;
- consulta;
- filtros;
- isolamento por canal;
- erros de validacao;
- idempotencia;
- falha do processador;
- contratos HTTP;
- ausencia de paths internos indevidos.

### Frontend

- servico de criacao;
- servico de listagem;
- serializacao correta;
- tratamento de erro;
- filtro por canal;
- ausencia de importacao direta de mocks;
- comportamento da tela `/clips`, conforme infraestrutura de testes disponivel.

### Regresao

Executar a suite existente, especialmente:

- canais;
- custos;
- governanca;
- media assets;
- storage;
- renderizacao principal;
- servicos de frontend;
- rotas de video.

## Validacao real obrigatoria

Quando FFmpeg e FFprobe estiverem disponiveis:

1. gerar ou reutilizar um video principal real da Sprint 9;
2. garantir que ele esteja registrado no canal correto;
3. solicitar um corte por API HTTP;
4. acompanhar o job conforme o contrato;
5. confirmar estado concluido;
6. confirmar arquivo dentro do storage root;
7. executar FFprobe;
8. registrar duracao, resolucao, formato e tamanho;
9. reiniciar ou recriar os repositorios;
10. consultar novamente o corte;
11. confirmar custo e auditoria;
12. repetir a requisicao com a mesma chave;
13. confirmar que nenhum segundo corte ou arquivo foi criado.

## Criterios de aceite

- corte real gerado;
- video principal valido;
- intervalo validado;
- storage seguro;
- isolamento por canal;
- output validado por FFprobe;
- vinculo persistente com video principal;
- job persistente;
- corte persistente;
- custo persistente;
- auditoria persistente;
- idempotencia sem duplicidade;
- backend real;
- frontend `/clips` real;
- nenhum mock cru no fluxo;
- testes de regressao;
- typecheck aprovado;
- lint aprovado;
- build aprovado;
- suite integral aprovada;
- `git diff --check` aprovado;
- validacao real aprovada;
- working tree limpo;
- commit criado;
- push realizado;
- PR aberto;
- nenhum merge.

## Definition of Done

- spec publicada e coerente com o estado real do repositorio;
- dominio de cortes implementado com validacao e testes;
- frontend `/clips` integrado ao backend real;
- contratos documentados e alinhados;
- validacao real executada com FFmpeg e FFprobe;
- screenshots capturadas na rota alterada, quando a ferramenta estiver disponivel;
- commit criado;
- branch enviada;
- PR aberto contra `main`;
- sprint nao mergeada;
