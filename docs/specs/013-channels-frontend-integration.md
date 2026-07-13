# Spec 013 - Channels Frontend Integration

## Status

Aprovada.

## Objetivo

Integrar a rota `/channels` ao backend real de Canais entregue na Sprint 3, preservando a experiencia visual existente e mantendo a camada de dados isolada.

## Contexto

A Sprint 3 concluiu o dominio de Canais no backend e o merge commit `6bf1bfec40cafaa7d2228f040745127e7ede9041` esta em `main`.

O frontend ainda consome dados mockados em `/channels` e o `ChannelProvider` ainda usa `mockChannels`. Esta sprint substitui essa fonte silenciosa por chamadas HTTP reais para o dominio de Canais, sem ampliar o dominio.

## Problema

Hoje a tela `/channels` e o contexto global de canal dependem de mocks locais. Isso impede:

- leitura real da lista de canais;
- sincronizacao do canal selecionado com o backend real;
- exibicao de erros HTTP reais;
- separacao clara entre dados reais e dados mockados;
- validacao operacional do backend da Sprint 3 pelo frontend.

## Escopo

- Rota `/channels`.
- `ChannelProvider` e o contexto de canal.
- Camada de servico de Canais no frontend.
- Cliente HTTP compartilhado.
- Tipos compartilhados de `Channel` e `ChannelSettings`.
- Estados de loading, vazio e erro na tela.
- Testes da integracao de Canais.
- Documentacao minima para execucao local.

## Fora de escopo

- Novos endpoints.
- Expansao do dominio de Canais.
- Banco, migrations, seeds ou persistencia nova.
- Autenticacao.
- Supabase.
- Dashboards reais de outras areas.
- Modificacao de outras rotas alem de ajustes de compatibilidade no provider.
- Redesign da tela `/channels`.
- Fallback silencioso para mocks em producao.
- Formulario novo de criacao ou edicao se a experiencia atual nao os expuser explicitamente.

## Estado atual

- `/channels` consome `src/services/mock-api.ts` via `src/services/api-client.ts`.
- `src/components/aralume/channel-context.tsx` importa `mockChannels` diretamente.
- `src/routes/channels.tsx` faz queries para listar canais e settings, mas ainda usando a camada mockada.
- O backend real expoe:
  - `GET /api/channels`
  - `POST /api/channels`
  - `GET /api/channels/:id`
  - `PATCH /api/channels/:id`
  - `GET /api/channels/:id/settings`

## Arquitetura alvo

- Componentes visuais nao conhecem URL de API.
- Pages nao fazem `fetch` direto.
- `src/services/api-client.ts` centraliza o transporte HTTP compartilhado e a resolucao da base URL.
- `src/services/channels-api.ts` centraliza as operacoes tipadas do dominio de Canais.
- `src/services/mock-api.ts` permanece para as rotas ainda nao integradas e para testes/fixtures.
- `ChannelProvider` carrega os canais pela camada de servico, nao por mocks.
- A tela `/channels` usa dados reais do dominio de Canais e exibe erro operacional quando a API nao estiver disponivel.
- O frontend usa base URL relativa `/api` no runtime de desenvolvimento, com proxy Vite apontando para o backend local.

## Contratos utilizados

### Tipos

- `Channel`
- `ChannelSettings`
- `ChannelStatus`
- `CostStatus`
- `RiskLevel`

### Envelopes

- `ApiSuccess<T>`
- `ApiListSuccess<T>`
- `ApiError`
- `ApiMeta`

### Erros HTTP relevantes

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`

## Comportamento do `api-client`

- Resolve a base URL por variavel publica Vite: `VITE_ARALUME_API_BASE_URL`.
- Usa default relativo seguro para desenvolvimento e deploy com proxy: `/api`.
- Quando o proxy local estiver ativo, as chamadas vao para `http://127.0.0.1:3001` sem CORS na experiencia do navegador.
- Remove barra final da base URL antes de montar requests.
- Faz `fetch` com timeout e cancelamento quando necessario.
- Converte respostas nao OK em erro tipado.
- Converte resposta nao JSON, envelope inesperado, erro de rede e timeout em estados previsiveis.
- Nao esconde falhas trocando silenciosamente para mocks.

## Comportamento do `ChannelProvider`

- Busca a lista de canais pela camada de servico.
- Expõe `channels`, `activeChannelId`, `activeChannel`, `loading` e `error`.
- Seleciona um canal padrao de forma deterministica quando a lista chega:
  - primeiro canal retornado pela API;
  - se a selecao atual deixar de existir, troca para o primeiro canal disponivel;
  - se a lista ficar vazia, limpa a selecao.
- Nao persiste selecao em `localStorage` nesta sprint.
- Nao importa `mockChannels`.
- Nao faz `fetch` direto.
- Evita requisicoes duplicadas desnecessarias usando a camada de consulta e memoizacao do provider.

## Carregamento inicial

1. A pagina entra em estado de loading enquanto a lista de canais nao chega.
2. Quando a lista chega, a selecao padrao e calculada.
3. O canal selecionado dispara a leitura de settings.
4. O painel central e os cards laterais renderizam apenas quando os dados do canal selecionado estiverem prontos.

## Selecao de canal

- A selecao e baseada no `id` do canal real.
- Mudancas de selecao atualizam o contexto global.
- Se o canal selecionado nao existir mais apos refresh ou mutacao, o provider escolhe o primeiro canal disponivel.
- Se a lista estiver vazia, o contexto fica sem canal ativo.

## Listagem

- A lista da coluna esquerda vem do `GET /api/channels`.
- O estado vazio mostra mensagem operacional clara quando nao houver canais.
- O estado de erro mostra uma mensagem recuperavel e um botao de tentar novamente, sem fallback para mocks.

## Consulta de settings

- A aba e os blocos que dependem de `ChannelSettings` usam `GET /api/channels/:id/settings`.
- O carregamento dos settings e independente da lista de canais.
- Falha de settings e tratada sem derrubar a lista de canais.

## Criacao

- A camada de servico deve expor a operacao de criacao.
- A UI so deve disparar criacao se a experiencia existente oferecer um ponto de entrada real e aprovado.
- Sem formulario aprovado, a criacao permanece fora do fluxo funcional desta sprint.

## Atualizacao

- A camada de servico deve expor a operacao de atualizacao.
- A UI so deve disparar atualizacao se a experiencia existente oferecer um ponto de entrada real e aprovado.
- Quando houver mutacao, a lista e o contexto devem ser revalidados e a selecao mantida ou ajustada conforme a presenca do canal alterado.

## Estados de loading

- Loading inicial da lista.
- Loading de settings.
- Loading por mutacao, quando houver.
- Botao de acao desabilitado durante mutacao.

## Estados de erro

- Backend indisponivel.
- Timeout.
- Resposta nao JSON.
- Validacao `400`.
- Nao encontrado `404`.
- Conflito `409`.
- Erro interno `500`.
- Envelope inesperado.

## Tratamento de backend indisponivel

- Exibir erro operacional claro.
- Nao exibir dados mockados como substituicao silenciosa.
- Nao misturar dados reais e dados demo.
- Permitir nova tentativa sem recarregar manualmente a aplicacao.

## Politica de mocks

- `/channels` usa API real como fonte primaria.
- Mocks continuam permitidos apenas para:
  - outras rotas ainda nao integradas;
  - testes;
  - fixtures;
  - demos explicitamente separadas do fluxo real.
- Nao existe fallback silencioso da rota `/channels` para mock.

## Páginas e componentes afetados

- `src/routes/channels.tsx`
- `src/components/aralume/channel-context.tsx`
- `src/components/aralume/channel-context-state.ts`
- `src/components/layout/AppShell.tsx`
- `src/services/api-client.ts`
- `src/services/channels-api.ts`
- `src/services/mock-api.ts`
- possiveis helpers de erro e base URL dentro de `src/services/`

## Testes

- Cliente HTTP de Canais:
  - lista com sucesso;
  - criacao com sucesso;
  - atualizacao com sucesso;
  - settings com sucesso;
  - erro de validacao;
  - erro de conflito;
  - erro de nao encontrado;
  - backend indisponivel;
  - envelope inesperado.
- `ChannelProvider`:
  - loading inicial;
  - carregamento de canais;
  - selecao padrao;
  - troca de canal;
  - erro de carregamento;
  - lista vazia;
  - ausencia de importacao de mocks.
- `/channels`:
  - render com dados reais;
  - loading;
  - empty state;
  - error state;
  - selecao de canal;
  - atualizacao visual apos mutacao quando houver acao exposta.

## QA visual

- Validar a tela nas larguras:
  - 1366x768
  - 1600x900
  - 1792x1024
  - 1920x1080
- Verificar:
  - sidebar expandida;
  - nomes longos;
  - timezone `America/Sao_Paulo`;
  - loading;
  - empty state;
  - erro;
  - canal ativo;
  - canal pausado;
  - canal selecionado;
  - ausencia de overflow horizontal;
  - ausencia de sobreposicao;
  - texto legivel;
  - preservacao do layout existente.

## Riscos

- O frontend atual nao possui um formulario completo de criacao ou edicao.
- A ausencia de proxy Vite exige disciplina na base URL via env publica.
- O provider global pode impactar rotas que dependem de `activeChannelId`.
- O backend da Sprint 3 e em memoria; dados criados nao persistem apos reinicio do servidor.

## Critérios de aceite

- `/channels` deixa de depender de `mockChannels` como fonte primaria.
- `ChannelProvider` nao importa mocks diretamente.
- Erros HTTP sao previsiveis e visiveis ao operador.
- A selecao de canal permanece consistente apos loading, refresh e mutacoes.
- A UI preserva o design existente.
- Nenhum endpoint novo e criado.
- Nenhum segredo e exposto.

## Definition of Done

- Spec publicada e coerente com o estado real do repositorio.
- Cliente HTTP e servico de Canais implementados.
- `ChannelProvider` usa a camada real.
- `/channels` renderiza dados reais do backend.
- Testes e builds passam.
- QA visual executado quando houver alteracao visual.
- Documentacao de execucao local atualizada.
- PR da Sprint 4 aberta, sem merge nesta rodada.
