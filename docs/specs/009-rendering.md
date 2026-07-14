# Spec 009 - Renderização Controlada

## Status

Planejada.

## Sprint Identificada

- **Sprint 9 - Renderização Controlada**
- Esta spec é a fonte de verdade da Sprint 9.
- Se `docs/NEXT_SPRINTS.md` ou `docs/CODEX_HANDOFF.md` estiverem defasados, esta spec prevalece para o domínio de renderização.

## Objetivo

Definir a primeira capacidade real, controlada, reproduzível e auditável de renderização de vídeo da Aralume Studio.

A sprint cria um domínio de `RenderJob` com execução local controlada, validação rigorosa de ativos registrados, persistência do estado do job, registro do vídeo resultante e integração operacional na rota `/videos`.

## Problema

A Sprint 8 entregou um registry seguro de mídia e storage, mas ainda não existe um fluxo real de renderização de vídeo.

Sem esta camada:

- o produto não consegue transformar ativos registrados em vídeo de saída;
- o operador depende de CLI para validar renderização;
- não existe job rastreável de render;
- não existe histórico de tentativas, duração, erro e logs;
- não existe vínculo explícito entre inputs, job e output;
- não existe bloqueio real por modo operacional, validade de storage, canal ou idempotência;
- a UI `/videos` continua limitada a listagem de vídeos, sem fluxo operacional de renderização controlada.

## Estado Atual Relevante

- A Sprint 8 foi concluída com o registry de mídia e o storage root autorizado.
- O backend já possui:
  - `MediaAssetBase`, `VideoAsset` e `DerivedClip` nos contratos;
  - validação de storage segura;
  - validação de integridade;
  - isolamento por `channelId`;
  - auditoria estruturada;
  - custos e modos operacionais;
  - envelopes HTTP e padrão de erro.
- A rota frontend `/videos` já existe, mas hoje representa apenas a camada de listagem de vídeos.
- Não existe ainda um domínio persistido de `RenderJob`.
- Não existe ainda execução FFmpeg controlada no repositório.

## Fontes de Verdade

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

## Escopo

- `RenderJob` persistido.
- Estado explícito e testável de renderização.
- Validação de ativos registrados por `channelId`.
- Resolução segura de arquivos apenas via storage root autorizado.
- Execução local controlada com FFmpeg quando disponível.
- Timeout e limpeza de temporários.
- Registro do vídeo resultante como ativo de vídeo.
- Idempotência por chave explícita e escopo de canal.
- Custos e modo operacional respeitados.
- Auditoria completa dos eventos do job.
- Consulta de jobs e resultados pelo backend real.
- Integração da rota frontend `/videos` com o backend real.
- Testes de domínio, API, serviço, frontend e regressão de storage.

## Fora de Escopo

- Renderização genérica irrestrita.
- Caminhos arbitrários fornecidos pelo cliente.
- Arquivos fora do storage root.
- Upload externo.
- Serviços externos.
- IA real.
- Download externo de assets.
- Fila distribuída.
- Workers remotos.
- Redis.
- Kubernetes.
- Banco relacional ou migrations.
- Publicação.
- Thumbnails por IA.
- Cortes.
- Edição visual avançada.
- Sequência multimodal complexa.
- API pública irrestrita para shell commands.

## Contrato Normativo

### RenderJob

O domínio desta sprint deve introduzir um `RenderJob` persistido com, no mínimo:

- `id`
- `channelId`
- `renderType`
- `status`
- `inputAssetIds`
- `outputAssetId`
- `renderProfile`
- `idempotencyKey`
- `outputStoragePath`
- `createdAt`
- `startedAt`
- `completedAt`
- `durationSeconds`
- `attemptCount`
- `errorCode`
- `errorMessage`
- `logSummary`
- `logEntries`
- `technicalMetadata`
- `contentId` quando o contrato exigir
- `workflowRunId` quando o contrato exigir

### Regras de status

O `RenderJob.status` deve reutilizar o contrato oficial de `WorkflowStatus` sempre que possível.

Nesta sprint, os estados usados devem ser:

- `queued`
- `running`
- `completed`
- `failed`
- `blocked`

Regras:

- `queued` representa a solicitação aceita e pronta para execução local.
- `running` representa execução efetiva em andamento.
- `completed` representa renderização concluída com output válido.
- `failed` representa falha de processo, timeout ou saída inválida.
- `blocked` representa violação de segurança, validação, canal, storage ou modo operacional.
- `completed` e `blocked` são terminais.
- `completed` não pode voltar para `running`.
- `failed` não pode ser tratado como sucesso por ausência de erro na API.
- `retrying` só pode existir se o repositório já adotar explicitamente retry; não é exigido nesta sprint.

### VideoAsset resultante

O vídeo final produzido pela renderização deve ser registrado como `VideoAsset` no contrato já existente, com:

- `channelId`
- `contentId` ou vínculo equivalente quando houver origem editorial
- `title`
- `renderStatus`
- `qualityStatus`
- `complianceStatus`
- `internalUri`
- `storagePath`
- `mimeType`
- `sizeBytes`
- `checksum`
- `providerName`
- `modelName`
- `prompt` quando aplicável
- `riskLevel`
- `costActualCents`
- `createdAt`
- `updatedAt`

### Ligação entre job e vídeo

O `RenderJob` deve apontar para o `outputAssetId` do vídeo produzido.

O vídeo resultante deve permanecer no mesmo `channelId` do job.

O cliente não pode fornecer `outputAssetId` arbitrário.

## Regras Obrigatórias

### 1. Aceitação do job

- Toda requisição de render deve incluir `channelId`.
- Todo input deve ser um `MediaAssetBase` previamente registrado.
- O render só pode aceitar ativos pertencentes ao mesmo canal da solicitação.
- Ativos inativos, indisponíveis, corrompidos, ausentes, inválidos, arquivados ou cruzados com outro canal devem ser rejeitados.
- O cliente nunca fornece um path arbitrário de entrada.
- O cliente nunca fornece um path arbitrário de saída.
- O servidor resolve caminhos e arquivos internamente.

### 2. Segurança de storage

O renderer deve rejeitar:

- caminho absoluto;
- `..`;
- traversal codificado ou normalizado;
- caminhos com drive letter;
- UNC path;
- arquivo fora do storage root;
- symlink, junction ou resolução real que escape do storage root, quando o runtime permitir verificação;
- path cujo primeiro segmento não corresponda ao `channelId`;
- entrada não registrada no catálogo de mídia;
- saída fora da área autorizada do canal;
- referência cruzada entre canais.

### 3. Operação e modo

- A execução real de render deve consultar a policy operacional efetiva antes de iniciar.
- Se a policy bloquear `real_video_generation`, o job deve ser marcado `blocked`.
- O modo `demo` não pode resultar em render concluído como se fosse produção.
- O render não pode chamar provedores externos.
- O render não pode depender de autenticação real.
- O render não pode depender de Supabase.

### 4. FFmpeg

Quando FFmpeg estiver disponível, o render deve:

- invocar o processo com argumentos estruturados;
- evitar shell concatenado;
- capturar `stdout`, `stderr`, exit code e duração;
- aplicar timeout;
- encerrar o processo corretamente em timeout;
- usar arquivos temporários dentro do storage autorizado;
- preservar a saída final apenas quando a renderização concluir com sucesso;
- remover temporários exclusivos do job;
- validar a existência e a integridade básica do arquivo de saída;
- manter compatibilidade com Windows;
- evitar logar segredos, comandos completos sensíveis ou paths externos.

Quando FFmpeg não estiver disponível:

- o job não pode ser marcado como concluído;
- o fluxo deve resultar em `blocked` com erro normalizado de indisponibilidade do runtime;
- a ausência do binário não autoriza simulação concluída.

### 5. Idempotência

- `POST /api/renders` deve exigir ou aceitar uma chave de idempotência explícita.
- Requisições repetidas com a mesma chave e o mesmo payload normalizado não podem gerar múltiplos jobs nem múltiplos vídeos equivalentes.
- Requisições repetidas com a mesma chave e payload diferente devem retornar conflito determinístico.
- A idempotência é sempre escopada ao canal.

### 6. Auditoria

Eventos mínimos:

- solicitação recebida;
- job criado;
- validação de ativos concluída;
- execução iniciada;
- execução concluída;
- execução falha;
- execução bloqueada;
- ativo de vídeo registrado.

Os eventos devem conter, quando aplicável:

- ator;
- canal;
- job;
- ação;
- status;
- timestamp;
- erro normalizado;
- duração;
- metadados seguros.

Não registrar:

- binário;
- segredos;
- tokens;
- comando completo com dados sensíveis;
- path externo;
- conteúdo fora do escopo do job.

### 7. Custos

- O render deve respeitar o módulo de custos já existente.
- O render deve consultar a policy operacional efetiva antes de iniciar.
- Se o modelo operacional exigir registro de custo, um `CostEntry` determinístico deve ser criado com `stage = "render"` e `costType = "render"`.
- O custo não pode ser simulado como cobrança externa.
- O custo não pode ignorar bloqueios de modo operacional ou budget.

### 8. Isolamento por canal

O isolamento por `channelId` é obrigatório em todas as camadas:

- request;
- serviço;
- persistência;
- storage;
- auditoria;
- custos;
- API;
- frontend.

## Máquina de Estados

Transições mínimas e aceitas:

- solicitação aceita -> `queued`;
- `queued` -> `running`;
- `running` -> `completed`;
- `queued` -> `blocked`;
- `queued` -> `failed` quando a execução não puder ser iniciada por falha do runtime já dentro do fluxo;
- `running` -> `failed`;
- `running` -> `blocked` quando um guard-rail operacional ou de storage descobrir violação antes de concluir o output;
- `completed` e `blocked` são terminais;
- `failed` é terminal para esta sprint.

Transições inválidas devem ser rejeitadas de forma determinística.

Uma falha de processo não pode deixar o job indefinidamente em `running`.

Jobs concluídos não podem ser executados novamente de maneira acidental.

## Estratégia de Render

### Perfil controlado

Esta sprint deve implementar um único perfil aprovado e reproduzível para renderização controlada.

Regras:

- o cliente só pode escolher entre perfis aprovados pelo contrato;
- o preset padrão da sprint deve ser determinístico;
- o preset não pode aceitar script de shell, filter graph arbitrário ou parâmetros livres perigosos;
- o output deve ser tecnicamente válido e pequeno o suficiente para teste;
- a renderização deve usar apenas ativos registrados no mesmo canal;
- o job deve ser audível e reproduzível.

### Execução local

A sprint pode usar fila simples local ou execução controlada in-process.

O importante é que:

- o job exista antes da execução;
- o estado do job seja persistido ao longo das transições;
- o job termine em estado terminal explícito;
- o fluxo seja acessível pela API e pela UI, não apenas por CLI.

### Integridade de saída

Ao concluir com sucesso:

- o arquivo de saída deve existir;
- o arquivo deve ter tamanho maior que zero;
- o checksum deve ser calculado;
- a saída deve ser registrada como `VideoAsset`;
- o `RenderJob.outputAssetId` deve apontar para o vídeo resultante;
- o `VideoAsset.channelId` deve ser igual ao do job;
- o resultado deve permanecer dentro do storage root autorizado.

## API

### Endpoints mínimos

- `POST /api/renders`
- `GET /api/renders`
- `GET /api/renders/:renderJobId`
- `GET /api/videos`

### Endpoint de criação

`POST /api/renders`

Request mínimo:

- `channelId`
- `inputAssetIds`
- `renderType`
- `renderProfile`
- `idempotencyKey`

Campos opcionais quando o contrato existente exigir:

- `contentId`
- `workflowRunId`
- `requestedBy`

Regras:

- criar o job persistido;
- registrar o estado inicial;
- iniciar a execução controlada;
- devolver o job com o estado atual e a referência ao output quando houver;
- responder com envelope padrão do projeto;
- não aceitar path de entrada ou saída fornecido pelo cliente.

### Listagem

`GET /api/renders`

Filtros mínimos:

- `channelId` obrigatório;
- `status` opcional;
- `renderType` opcional;
- `contentId` opcional;
- `workflowRunId` opcional;
- `idempotencyKey` opcional.

### Consulta de job

`GET /api/renders/:renderJobId`

Regras:

- exige `channelId`;
- retorna `404` para job inexistente ou de outro canal;
- expõe o estado atual, duração, erro normalizado, logs e vínculo com o vídeo resultante quando houver.

### Vídeos resultantes

`GET /api/videos`

Regras:

- exige `channelId`;
- retorna apenas vídeos do canal ativo;
- cada resultado deve permanecer isolado por canal;
- a UI pode correlacionar vídeo e job por `outputAssetId`/`renderJobId` e `channelId`.

## Contratos de Erro

O domínio deve distinguir, no mínimo:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `OPERATION_BLOCKED`
- `COMPLIANCE_BLOCKED`
- `BUDGET_EXCEEDED`
- `INTERNAL_ERROR`

Erros de execução também devem ser normalizados em nível de job:

- `FFMPEG_UNAVAILABLE`
- `TIMEOUT`
- `PROCESS_FAILED`
- `OUTPUT_INVALID`
- `PATH_OUTSIDE_STORAGE`
- `CROSS_CHANNEL_INPUT`
- `IDEMPOTENCY_CONFLICT`

## Frontend

### Rota

- `/videos`

### Requisitos da tela

A tela deve exibir, no mínimo:

- canal;
- job de renderização;
- status do job;
- ativos de origem;
- vídeo resultante;
- data de criação;
- início;
- conclusão;
- duração;
- falha ou bloqueio;
- metadados básicos do vídeo;
- logs ou resumo operacional;
- tentativa/idempotência quando útil;
- ação para iniciar a renderização controlada, quando a policy e a spec permitirem;
- loading state;
- empty state;
- error state.

### Regras de UI

- respeitar `docs/FRONTEND_DESIGN_SYSTEM.md`;
- manter densidade SaaS empresarial;
- usar componentes existentes;
- consumir camada de services;
- respeitar o seletor de canal;
- não mostrar dados de outro canal;
- não importar mocks crus;
- não refazer o `AppShell`;
- não alterar rotas não relacionadas.

### Comportamento esperado

- o operador consegue iniciar um render controlado a partir de ativos registrados do canal ativo;
- o operador consegue ver jobs aguardando, executando, concluídos, bloqueados e falhos;
- o operador consegue inspecionar o resultado sem CLI;
- a UI não apresenta path arbitrário editável como origem de render.

## Dependências de Ambiente

- `ARALUME_ASSET_STORAGE_ROOT` para o storage autorizado;
- `ARALUME_FFMPEG_PATH` opcional quando o binário não estiver no `PATH`;
- `ARALUME_FFPROBE_PATH` opcional para validação adicional;
- o comportamento padrão deve ser seguro quando essas variáveis não existirem.

## Repositório e Implementação Esperada

Arquivos provavelmente afetados:

- `docs/specs/009-rendering.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/NEXT_SPRINTS.md`
- `src/contracts/types.ts`
- `src/contracts/status.ts` se houver necessidade de novo contrato auxiliar
- `src/services/api-client.ts`
- `src/services/media-assets-api.ts`
- `src/services/media-assets-api.test.ts`
- `src/routes/videos.tsx`
- `src/tests/videos-route.test.ts` ou equivalente
- `server/src/app.ts`
- `server/src/modules/media-assets/*` se o domínio de vídeo resultante reutilizar o registry existente
- novo módulo de renderização em `server/src/modules/renders/*` ou equivalente
- `server/test/*` para domínio, API, segurança e FFmpeg
- fixtures de storage autorizadas, se necessárias para teste real

## Testes Obrigatórios

### Backend

1. Criação válida de render job.
2. Renderização válida com ativos do mesmo canal.
3. Registro do vídeo de saída.
4. Transição correta de estados.
5. Falha normalizada do processo.
6. Timeout.
7. Rejeição de ativo inexistente.
8. Rejeição de ativo inativo.
9. Rejeição de ativo de outro canal.
10. Rejeição de path externo.
11. Rejeição de path traversal.
12. Rejeição de saída fora do storage autorizado.
13. Idempotência.
14. Consulta filtrada por canal.
15. Auditoria dos eventos.
16. Registro de duração.
17. Comportamento quando FFmpeg não está disponível.
18. Integridade básica da saída quando FFmpeg está disponível.

### Frontend e contracts

1. Serviço de renderização/API.
2. Mapeamento correto do contrato.
3. Filtro por canal.
4. Loading state.
5. Empty state.
6. Error state.
7. Job concluído.
8. Job falho.
9. Job bloqueado.
10. Ausência de vazamento entre canais.
11. Interação de criação de job, quando aplicável.
12. Renderização da tela `/videos` sem mocks crus.

## Validações Obrigatórias

Executar, no mínimo:

- `npx tsc -p server/tsconfig.json --noEmit`
- `npx eslint .`
- `npm run build`
- `git diff --check`

Executar também:

- todos os testes existentes do backend;
- todos os testes existentes dos serviços frontend;
- todos os testes de rotas relevantes;
- novos testes do domínio de renderização;
- testes de regressão de media assets;
- validação real com FFmpeg, quando disponível;
- checagem do conteúdo do arquivo de saída;
- checagem de arquivos temporários residuais;
- checagem de segredos;
- checagem de arquivos grandes;
- checagem do status final do Git.

## QA Visual

Como a rota `/videos` será alterada, realizar validação visual nas resoluções disponíveis, priorizando:

- 1366x768;
- 1600x900;
- 1792x1024;
- 1920x1080.

Validar:

- sidebar expandida;
- sidebar recolhida, quando suportada;
- canal com nome longo;
- lista cheia;
- estado vazio;
- loading;
- erro;
- job em execução;
- job concluído;
- job falho;
- job bloqueado;
- textos longos;
- ausência de overflow horizontal;
- ausência de sobreposição;
- legibilidade dos badges;
- alinhamento da tabela ou cards;
- comportamento do painel de detalhes.

## Critérios de Aceite

A Sprint 9 só pode ser considerada pronta para revisão quando:

1. A spec `009-rendering.md` for a fonte de verdade atualizada.
2. Um render job puder ser criado para um canal ativo.
3. Apenas ativos registrados do mesmo canal forem aceitos.
4. Nenhum path arbitrário fornecido pelo cliente for executado.
5. Entradas e saídas permanecerem dentro do storage autorizado.
6. A máquina de estados estiver explícita e testada.
7. Erros e timeouts forem tratados.
8. A idempotência impedir duplicação acidental.
9. Um vídeo curto de teste puder ser produzido no ambiente compatível.
10. A saída for registrada como ativo de vídeo.
11. Auditoria e duração forem registradas.
12. Custos e modo operacional forem respeitados.
13. A rota `/videos` consumir o backend real da sprint.
14. O seletor de canal não misturar dados.
15. TypeScript compilar.
16. Lint passar.
17. Todos os testes relevantes passarem.
18. Build de produção passar.
19. `git diff --check` passar.
20. Nenhum segredo for exposto.
21. Nenhum arquivo grande ou temporário indevido for commitado.
22. A documentação e o handoff refletirem o estado real.
23. O PR for aberto.
24. O PR não for mergeado.

## Definition of Done

- spec implementada em código;
- contratos atualizados somente onde necessário;
- tests green;
- QA visual capturado;
- commit criado com escopo restrito;
- branch enviada;
- PR aberto contra `main`;
- sprint não mergeada.

## Divergências ou Lacunas Documentais

- `docs/NEXT_SPRINTS.md` e `docs/CODEX_HANDOFF.md` ainda podem refletir fases anteriores e devem ser atualizados ao final da sprint.
- O frontend ainda trata `/videos` como listagem operacional simples; esta sprint amplia o contrato para render controlado.
- A baseline atual não possui banco nem workers, então a execução precisa continuar encapsulada e local.
- Não existe ainda um contrato de `RenderJob` no frontend; esta sprint deve introduzi-lo formalmente.

## Riscos Técnicos

- Ajustar o fluxo de `/videos` sem quebrar os contratos de mídia existentes.
- Diferenciar claramente `RenderJob` de `VideoAsset`.
- Garantir que o FFmpeg seja usado sem shell injection e com compatibilidade Windows.
- Manter o isolamento por canal em todos os acessos ao storage.
- Registrar estados e auditoria sem duplicar job ou vídeo em re-renders idempotentes.
- Evitar que falhas de processo deixem jobs presos em `running`.
- Não misturar render real com simulação que pareça sucesso.
