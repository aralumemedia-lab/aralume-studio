# ADR 002 - Selecao documentada dos provedores aprovados para o E13

- Status: Accepted
- Data: 2026-07-14
- Contexto: Aralume Studio
- Escopo: governanca documental, Sprint 12, E13

## Contexto

A Sprint 12 - Integracoes Reais Autorizadas precisava de uma decisao documental fechada sobre quais provedores ou plataformas reais entram no E13. Sem isso, o gate de inicio permanecia aberto e a implementacao nao podia começar.

O repositorio ja possuia:

- contracts e telas para publicacao assistida;
- integracao de publicacao assistida em `/publications`;
- variaveis documentadas para YouTube / OAuth / publicacao;
- referencias a metricas por plataforma, sem que isso implicasse aprovacao de qualquer provedor adicional.

Ao mesmo tempo, os dados mockados e os nomes de plataforma em fixtures nao constituem aprovacao documental. Eles apenas demonstram que o front e o backend suportam varias opcoes sem, por isso, selecionar todas elas para a V1.0.

## Problema

- A documentacao permitia entender que o gate de inicio da Sprint 12 aceitava uma pendencia aberta.
- A lista de provedores aptos para E13 nao estava fechada.
- O risco de ampliar E13 com catalogo generico de integracoes era alto.
- A ausencia de uma lista fechada impedia definir com seguranca autorizacao, revogacao, auditoria, segredos e contratos afetados.

## Decisao

O E13 aprova somente a integracao real necessaria e justificavel para a publicacao assistida da V1.0:

- YouTube, por meio da YouTube Data API e do fluxo oficial de OAuth 2.0 da Google.

Decisoes complementares:

- A aprovacao e limitada ao uso autorizado no E13.
- A autorizacao e feita com OAuth 2.0 oficial da Google.
- O armazenamento de tokens e revogacao devem seguir as regras da spec 015.
- A lista aprovada e fechada; a ausente selecao de outros provedores nao autoriza suposicao.
- YouTube Analytics fica como base documental relevante para a Sprint 13, nao como parte da aprovacao operacional da Sprint 12.
- TikTok, Instagram e LinkedIn nao sao aprovados para E13 nesta decisao.

## Justificativa

- O Documento Mestre e os docs de roadmap apontam publicacao assistida e o ciclo V1 em torno do ecossistema de canal, com variaveis especificas para YouTube em `docs/ENVIRONMENT.md`.
- O frontend e o backend atuais ja possuem contratos para publicacao assistida por plataforma.
- O conjunto minimo necessario para destravar a Sprint 12 nao exige catalogo generico de multiplos provedores.
- Aprovar mais plataformas sem base documental suficiente ampliaria o escopo sem necessidade comprovada.

## Integracoes classificadas

| Provedor / plataforma | Status | Finalidade | Dependencia normativa | Fluxo operacional | Autorizacao | Permissoes minimas | Efeito externo | Aprovacao humana | Isolamento por canal | Segredos | Revogacao | Auditoria | Contratos afetados | Persistencia | Estados de erro | Testes obrigatorios | Custos e limites | Fora de escopo | Riscos | Fonte oficial |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YouTube Data API + OAuth 2.0 Google | approved for E13 | Publicacao assistida em canal YouTube autorizado e manutencao de estado de conexao por canal. | E13 / Sprint 12 / spec 015 | Operador seleciona canal, escolhe alvo autorizado, prepara pacote assistido e conclui o fluxo documental de autorizacao. | OAuth 2.0 Google | `youtube.upload` como minimo; escopos adicionais somente se uma necessidade documental futura exigir leitura complementar. | Upload e publicacao assistida em canal autorizado. | Obrigatoria antes de qualquer efeito externo. | Cada canal possui autorizacao independente. | Access token e refresh token criptografados/armazenados fora do repositorio. | Revogacao via fluxo oficial da Google e invalidacao local do estado. | Tentativa, aprovacao, recusa, expiracao, revogacao, erro e idempotencia. | `PublicationTarget`, `PublicationJob`, `HumanApproval`, `AuditLog`, `PublicationStatus`, readiness. | Canal-scoped e auditavel. | autorizacao negada, expiracao, credencial ausente, revogado, indisponivel, configuracao inconsistente, erro de auditoria ou persistencia | Fluxo aprovado; fluxo negado; revogacao; erro indisponivel; isolamento por canal; ausencia de segredo em log ou documento. | Custos de publicacao e de chamada autorizada devem ser rastreados se aplicavel; quotas e limites do provedor devem ser respeitados. | TikTok/Instagram/LinkedIn e novos provedores sem spec. | Escopo de autorizacao maior que o necessario; revogacao mal tratada; upload sem aprovacao humana; segredo exposto. | `https://developers.google.com/youtube/v3/guides/authentication`, `https://developers.google.com/youtube/v3/guides/uploading_a_video`, `https://developers.google.com/youtube/v3/guides/auth/installed-apps`, `https://developers.google.com/identity/protocols/oauth2/web-server`, `https://support.google.com/accounts/answer/13533235?hl=en` |
| YouTube Analytics API | deferred | Fonte oficial futura para metricas da Sprint 13 e nao parte da liberacao operacional da Sprint 12. | E14 / Sprint 13 / spec 014 | Ler relatorios de canal e consolidar metricas por canal. | OAuth 2.0 Google | `yt-analytics.readonly`; `yt-analytics-monetary.readonly` apenas se receita monetaria for exigida documentalmente. | Leitura de analytics e monetizacao. | Nao para E13. | Por canal. | Tokens autorizados em armazenamento seguro. | Revogacao via fluxo oficial. | Relatorios, origem, canal, periodo, erro. | `PerformanceMetric`, dashboard e contratos de metricas. | Canal-scoped. | sem autorizacao, token expirado, dados indisponiveis, erro de consulta | Validacao de leitura por canal e isolamento de metrica. | Respeitar quotas e limites do YouTube Analytics API. | Nao iniciar E14 nesta decisao. | Ampliar Sprint 12 com leitura de metricas antes da base autorizada. | `https://developers.google.com/youtube/analytics` |
| TikTok | deferred | Nao aprovado para E13. | Sem dependencia normativa suficiente para V1.0 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Nao | Escopo nao aprovado. | Nao inventar fluxo nem contratos. | Falta base documental fechada para V1.0. | Nao ha fonte oficial usada para aprovacao. |
| Instagram | deferred | Nao aprovado para E13. | Sem dependencia normativa suficiente para V1.0 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Nao | Escopo nao aprovado. | Nao inventar fluxo nem contratos. | Falta base documental fechada para V1.0. | Nao ha fonte oficial usada para aprovacao. |
| LinkedIn | deferred | Nao aprovado para E13. | Sem dependencia normativa suficiente para V1.0 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Nao | Escopo nao aprovado. | Nao inventar fluxo nem contratos. | Falta base documental fechada para V1.0. | Nao ha fonte oficial usada para aprovacao. |

## Consequencias

- A lista de provedores para E13 fica fechada.
- O gate de inicio deixa de depender de uma pendencia aberta.
- A Sprint 12 pode ser planejada como pronta para implementacao documental, sem inicio funcional nesta execucao.
- O restante das plataformas presentes em mocks e fixtures permanece como material nao aprovado.

## Vigencia

Esta decisao entra em vigor a partir da merge da normalizacao documental em `main`.

## Regra para futuras mudancas

Qualquer novo provedor ou plataforma para E13 ou para sprints posteriores deve:

1. ser documentado em nova decisao formal antes da implementacao;
2. explicitar finalidade, escopo, autorizacao, revogacao, auditoria e segredos;
3. evitar ampliar o E13 por analogia com mocks ou sementes de teste.

