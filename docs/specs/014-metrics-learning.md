# Spec 014 - Metrics and Editorial Learning

## Status

Concluida na Sprint 13; PR #23 mergeada por merge commit. A conclusao desta spec
nao equivale ao aceite da V1.0.

## Identificacao

- Spec ID: `014-metrics-learning.md`
- Sprint: 13 - Metricas e Aprendizado
- Epic principal: E14 - Metricas e Aprendizado
- Relacao governante: Fase 14 do roadmap -> E14 -> Sprint 13 -> esta spec.
- A Fase 14 nao e a Sprint 14. A Sprint 14 e E15 / V1 Acceptance e permanece fora
  desta execucao.

## Objetivo e gate

Fechar o ciclo editorial registrando resultados por canal e transformando metricas
persistidas em recomendacoes editoriais deterministicas, explicaveis, auditaveis e
revisaveis por uma pessoa.

Gate do E14: **metricas geram recomendacao editorial por canal**.

## Dependencias e gate de inicio

- Sprint 11 - Publicacao Assistida encerrada.
- Sprint 12 - Integracoes Reais Autorizadas encerrada e mergeada no SHA
  `6690008aa92749415838f97f10a4b407301f2233`.
- ADR 002 permanece vigente: YouTube Data API/OAuth e a unica integracao externa
  aprovada para E13; Analytics e apenas uma base futura, sem novo escopo nesta
  Sprint.
- `main` limpa e alinhada com `origin/main` antes da criacao da branch.
- Documento Mestre, roadmap operacional, backlog, handoff e esta spec sem conflito.

## Historias incluidas

### H14.1 - Registro controlado de metricas por conteudo

Registrar snapshots de desempenho por `channelId`, conteudo, plataforma e janela,
com origem explicita (`manual`, `imported`, `demo` ou `fixture`), validade,
timestamps e idempotencia. O registro manual/importado e controlado pela API; nao
ha coleta externa nesta Sprint.

Aceite: payload valido e canal-scoped persiste; conteudo de outro canal, valores
invalidos, janela invalida, origem desconhecida e replay conflitante sao rejeitados;
replay identico retorna o registro original e gera auditoria.

### H14.2 - Consulta e agregacao canal-scoped

Consultar metricas por canal, periodo, conteudo e plataforma, e consolidar totais,
medias e variacoes apenas sobre os registros do canal solicitado.

Aceite: listagem, detalhe, paginacao, ordenacao, resumo vazio e resumo com dados
parciais usam envelopes oficiais e nunca retornam registros de outro canal.

### H14.3 - Aprendizado editorial assistido

Executar uma regra deterministica versionada sobre metricas persistidas e retornar
uma recomendacao para revisao humana. A recomendacao contem periodo, evidencias,
racional, acao, confianca, limitacoes, data, canal e versao da regra.

Aceite: mesma entrada produz a mesma recomendacao; dados insuficientes, baseline
ausente, zeros e divisao por zero produzem estado explicito sem afirmacao inventada;
nenhuma regra editorial e alterada automaticamente.

### H14.4 - Dashboard operacional de metricas e recomendacoes

Migrar `/metrics` para API real, preservando o frontend existente, o seletor de
canal e o design system. A tela mostra periodo, canal, origem, status dos dados,
KPIs, desempenho por conteudo, tendencia, recomendacao e evidencias.

Aceite: loading, vazio, insuficiente, sucesso, parcial, erro, indisponivel,
recomendacao disponivel/indisponivel e reload persistente sao observaveis sem
importar mocks diretamente.

## Historias nao incluidas

- YouTube Analytics API, OAuth, novos escopos ou qualquer nova integracao.
- Scraping ou coleta sem autorizacao documental.
- TikTok, Instagram, LinkedIn ou novos provedores.
- IA externa, LLM, prompts, custo de inferencia ou alteracao de modo operacional.
- Receita e monetizacao, pois nao ha fonte autorizada nesta Sprint.
- Aplicacao automatica de recomendacoes, mudancas editoriais irreversiveis ou V1
  Acceptance/hardening.
- Banco novo, migration SQL ou recriacao do frontend.

## Contrato de dados

`PerformanceMetric` representa um snapshot por conteudo/plataforma/janela. Cada
registro operacional possui `channelId`, `contentId`, quando aplicavel
`publicationId`/`videoId`, plataforma, campos de metricas aprovados, unidade
implicita documentada, periodo, `capturedAt`, origem, `validationStatus`,
`idempotencyKey`, `createdAt` e `updatedAt`.

Metricas aprovadas nesta fatia:

| Campo                 | Definicao                   | Unidade                  | Regra                 |
| --------------------- | --------------------------- | ------------------------ | --------------------- |
| `views`               | reproducoes contabilizadas  | inteiro                  | >= 0                  |
| `reach`               | contas/pessoas alcancadas   | inteiro                  | >= 0                  |
| `averageWatchSeconds` | duracao media assistida     | segundos inteiros        | >= 0                  |
| `completionRate`      | fracao concluida            | decimal normalizado 0..1 | sem percentual 0..100 |
| `shares`              | compartilhamentos           | inteiro                  | >= 0                  |
| `saves`               | salvamentos                 | inteiro                  | >= 0                  |
| `comments`            | comentarios                 | inteiro                  | >= 0                  |
| `followersGained`     | seguidores/inscritos ganhos | inteiro                  | >= 0                  |

Zero e valido. Valores ausentes entram como dados parciais e nao sao convertidos
em zero no backend. Timestamps persistem em ISO UTC; `America/Sao_Paulo` e usado
apenas para apresentacao e regras operacionais de periodo.

## Origem, autorizacao e persistencia

Esta Sprint usa somente registro controlado local pela API. `manual` e `imported`
sao origens operacionais; `demo` e `fixture` sao dados controlados de validacao e
devem permanecer identificados na API e na interface. Nenhum dado externo e
fabricado como real.

O repository segue o armazenamento JSON atomico ja existente em
`ARALUME_ASSET_STORAGE_ROOT`. O arquivo e `metrics.json`; inicializacao com seed
demo ocorre apenas quando nao existe estado persistido. Nao ha alteracao de
`.env.local`, `.env` ou policy operacional.

Idempotencia e por `channelId + idempotencyKey`: payload igual e retry devolvem o
mesmo registro; payload diferente retorna `CONFLICT`; registros confirmados nao
sao sobrescritos. A operacao e sincronizada no repository e coberta por testes de
replay, conflito, retry e reinicializacao.

## API formal

As superficies canonicas sao:

- `POST /api/metrics` - registrar um snapshot.
- `GET /api/metrics?channelId=&from=&to=&contentId=&platform=&page=&pageSize=` -
  listar registros do canal.
- `GET /api/metrics/:metricId` - consultar detalhe canal-scoped por
  `channelId` na query.
- `GET /api/metrics/summary?channelId=&from=&to=` - retornar agregacao e
  recomendacao do periodo.

Todos usam os envelopes existentes, validam entrada, retornam `requestId`,
sanitizam erros e nao expõem payload externo, tokens ou segredos. `channelId` e
obrigatorio em todas as operacoes de metricas. A rota de resumo e a unica
superficie de analise/recomendacao; nao ha endpoint duplicado de recomendacao.

## Analise e recomendacao

- Janela explicita por `from`/`to`; sem filtro, usa a menor janela coberta pelos
  registros selecionados.
- Agregacao por soma para contagens e media ponderada por views para
  `completionRate` quando houver views; sem views, retorna dado parcial.
- Baseline: media dos snapshots anteriores do mesmo canal e plataforma na janela
  disponivel. Para a recomendacao, o periodo corrente e o periodo mais recente
  selecionado; o baseline e formado pelos snapshots anteriores da mesma
  plataforma. Sem pelo menos dois snapshots correntes e dois snapshots de
  baseline por plataforma comparavel, o estado e `insufficient_data`.
- Regra `metrics-learning-v1`: recomendar priorizar o formato/plataforma com maior
  completion rate e pelo menos duas amostras comparaveis, desde que a variacao
  minima entre as plataformas correntes seja de 10 pontos percentuais. A
  recomendacao cita os IDs das metricas correntes e de baseline que sustentam a
  regra.
- Tendencia e a variacao da media ponderada de `completionRate` entre o periodo
  corrente e o baseline anterior por plataforma. A UI exibe a tendencia junto
  da recomendacao; sem baseline, exibe estado insuficiente.
- Outliers nao sao removidos nesta fatia; o racional registra a limitacao.
- Dados atrasados, incompletos ou contraditorios permanecem marcados e reduzem a
  confianca; nao geram causalidade.
- Recomputacao e reproduzivel a partir dos registros persistidos e da versao da
  regra.

`EditorialRecommendation` e sempre canal-scoped e contem `id`, periodo,
`status`, `evidence`, `rationale`, `suggestedAction`, `confidence`, `limitations`,
`generatedAt` e `ruleVersion`. Uma resposta insuficiente informa os dados faltantes
e nao cria uma recomendacao positiva.

## Auditoria e custos

Registrar, no minimo, `metrics.registered`, `metrics.rejected`,
`metrics.idempotent_replay`, `metrics.analysis_executed`,
`metrics.insufficient_data` e `metrics.recommendation_generated`, sempre com
`channelId`, entidade, periodo, origem, tipos, status, motivo, requestId e
timestamp. Nao registrar tokens, headers, payload externo completo ou dados
pessoais desnecessarios.

Registro, leitura, agregacao e regra local nao geram custo externo. A Sprint nao
altera limites, modo demo, budget ou autorizacao.

## Seguranca e isolamento

- Validar canal, conteudo e referencias antes de persistir.
- Conteudo, publicacao e video devem pertencer ao mesmo `channelId`.
- Filtros, detalhe, cache, agregacao, auditoria e persistencia permanecem
  canal-scoped; IDs externos nao substituem validacao local.
- Limite de JSON existente permanece em 1 MB; cada campo tem limite de schema.
- Sem token ou credencial no frontend, resposta ou log.
- Recomendacoes sao informativas e nunca executam mutacao editorial.

## Criterios de aceite da Sprint

- Registro manual/importado validado e persistido com origem explicita.
- Consulta, detalhe e resumo respeitam canal, periodo, conteudo e plataforma.
- Idempotencia e conflitos sao reproduziveis e auditados.
- Resumo com dados suficientes gera recomendacao por canal com evidencias.
- Dados insuficientes sao estado de produto, nao erro interno nem recomendacao falsa.
- `/metrics` consome API real, exibe origem, recomendacao e evidencias, e persiste
  apos reload.
- Testes novos nao reduzem os 56 testes existentes; todos os quality gates passam.
- QA visual cobre 1366x768, 1600x900, 1792x1024 e 1920x1080, sidebar expandida/
  recolhida e estados operacionais disponiveis.
- Nenhum escopo OAuth, provedor, segredo ou V1 Acceptance foi adicionado.

## Riscos e mitigacoes

- Analytics externo indisponivel: usar registro controlado e deixar a leitura
  automatizada explicitamente futura.
- Dados insuficientes: estado tipado e mensagem operacional, sem inferencia.
- Cruzamento de canais: validacao em servico e testes HTTP/domínio.
- Persistencia JSON concorrente: operacao sincronizada, escrita atomica e conflito
  por idempotencia.
- Recomendacao interpretada como causalidade: linguagem de sinal/indicacao e
  limitacoes obrigatorias.

## Definition of Ready

Problema, objetivo, valor, historias, aceite, entradas, saidas, origem, contratos,
autorizacao, isolamento, regra de recomendacao, evidencia, testes, riscos e fora
de escopo estao definidos acima e alinhados ao backlog, roadmap operacional,
handoff e ADR 003.

## Definition of Done

Implementacao completa das H14.1-H14.4, testes e QA visual executados, persistencia
verificada apos reload, isolamento e auditoria demonstrados, documentacao atualizada,
PR #23 revisada e mergeada por merge commit. Sprint 14 nao foi iniciada e V1
Acceptance nao foi implementada.
