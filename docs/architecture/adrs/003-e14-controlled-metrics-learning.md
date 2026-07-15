# ADR 003 - Metricas controladas e aprendizado editorial deterministico

- Status: Accepted for Sprint 13
- Data: 2026-07-15
- Escopo: E14 / Sprint 13

## Contexto

O E14 precisa fechar o ciclo editorial, mas o ADR 002 deixou YouTube Analytics
como base futura e nao autorizou sua implementacao operacional na Sprint 12. A
rota `/metrics` existente ainda usa mocks e nao havia contrato para procedencia,
idempotencia ou recomendacao.

## Decisao

1. A Sprint 13 usa registro controlado pela API. As origens permitidas sao
   `manual`, `imported`, `demo` e `fixture`; as duas ultimas sao sempre rotuladas
   e nao representam dados reais de producao.
2. Nao sera solicitado escopo OAuth, conectado YouTube Analytics ou adicionado
   provedor externo nesta Sprint.
3. `PerformanceMetric` permanece um snapshot por canal, conteudo, plataforma e
   janela. As metricas aprovadas sao views, reach, average watch seconds,
   completion rate, shares, saves, comments e followers gained. Receita fica
   fora por falta de fonte autorizada.
4. A persistencia usa o repository JSON atomico existente e `metrics.json` sob o
   storage root. A chave de idempotencia e composta por `channelId` e
   `idempotencyKey`; replay identico e permitido e payload divergente e conflito.
5. A analise e local, deterministica e versionada como `metrics-learning-v1`.
   Recomendacoes sao evidenciadas, explicaveis, canal-scoped e somente informativas.
   Nao ha IA externa nem mutacao automatica de regras editoriais.
6. A recomendacao usa o periodo corrente mais recente selecionado e compara a
   media ponderada de `completionRate` com snapshots anteriores da mesma
   plataforma. Cada plataforma comparavel exige pelo menos dois snapshots
   correntes e dois de baseline; a UI exibe a variacao como tendencia.

## Alternativas consideradas

- YouTube Analytics nesta Sprint: adiada por exigir reautorizacao, escopo novo,
  quotas, disponibilidade externa e validacao documental que nao faz parte do
  gate de S13.
- Recomendacao por LLM: rejeitada por custo, falta de aprovacao e menor
  reprodutibilidade.
- Manter mocks na rota: rejeitada porque nao demonstra persistencia nem o gate E14.
- Agregar sem canal obrigatorio: rejeitada por risco de vazamento cross-channel.

## Consequencias

- A fatia vertical e demonstravel sem credenciais externas e sem fabricar dados.
- A UI precisa exibir origem e estado de suficiencia.
- A futura leitura automatizada do YouTube Analytics continua dependente de nova
  decisao documental e nao e implicitamente autorizada por este ADR.
- Custos externos da analise sao zero nesta Sprint; policy operacional permanece
  inalterada.

## Evidencias e rollback

Evidencias incluem testes de dominio/HTTP, auditoria sanitizada, isolamento,
persistencia apos reinicializacao e screenshots da rota `/metrics`. Rollback do
recurso remove o modulo/rotas da branch antes do merge; nao exige alteracao de
OAuth, banco compartilhado ou dados externos.
