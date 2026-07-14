# Spec 011 - Publicacao Assistida

## 1. Identification

- Spec ID: `011-publication-assisted.md`
- Sprint number: 11
- Sprint name: Publicacao Assistida
- Spec status: completed
- Date: 2026-07-14
- Linked ADR: `docs/architecture/adrs/001-adocao-epicos-historias-fatias-verticais.md`

## 2. Epic

- Epic ID: E12
- Epic name: Publicacao Assistida
- Epic objective: preparar publicacao com aprovacao humana, compliance e contratos seguros, sem envio externo automatico.

## 3. Sprint objective

Preparar a primeira entrega do modelo novo para publicacao assistida, mantendo o fluxo sob controle humano e sem publicar automaticamente em plataforma externa.

## 4. Context

Esta sprint nasce depois da entrega de renderizacao controlada e cortes derivados controlados.

O produto ja possui conteudos que podem chegar ao estado de video pronto ou de corte pronto. Falta formalizar o passo seguinte: preparar publicacao com aprovacao humana, compliance, auditoria e contratos seguros, sem transformar a publicacao em automacao irrestrita.

## 5. Dependencies

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/CODEX_HANDOFF.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/006-approvals-compliance.md`
- `docs/specs/007-costs-operational-modes.md`
- `docs/specs/008-media-assets-storage.md`
- `docs/specs/009-rendering.md`
- `docs/specs/010-derived-clips.md`

## 6. Histories included

- H11.1 - Catalogo de alvos de publicacao e readiness da plataforma.
- H11.2 - Modelo de job de publicacao e rastreio de estados.
- H11.3 - Preparacao assistida de payload e agendamento.
- H11.4 - Gate de aprovacao e compliance para publicacao.

## 7. Histories not included

- Publicacao automatica sem humano.
- Automacao de browser para envio externo.
- Armazenamento inseguro de refresh token.
- OCR, scraping ou coleta externa nao autorizada.
- Metricas de aprendizado como entrega principal da sprint.
- Mudancas de frontend nao relacionadas a `/publications`.
- Integracoes reais autorizadas sem aprovacao documental especifica.

## 8. Acceptance criteria by history

### H11.1 - Catalogo de alvos de publicacao e readiness da plataforma

- O usuario consegue listar os alvos de publicacao por canal.
- O usuario consegue criar ou atualizar um alvo de publicacao permitido pela spec.
- O status do alvo de publicacao e verificavel e nao aceita valores fora do contrato.
- O estado de readiness deixa claro se o alvo pode receber uma publicacao assistida.
- Nenhum segredo e exposto na tela ou na API.

### H11.2 - Modelo de job de publicacao e rastreio de estados

- O usuario consegue criar e consultar um job de publicacao assistida.
- O job fica sempre associado a um unico canal.
- O job registra estado, agendamento, erro e timestamp relevantes.
- A transicao de estado e deterministica.
- O job nao pode atravessar canal.

### H11.3 - Preparacao assistida de payload e agendamento

- O usuario consegue preparar um payload de publicacao a partir de um video elegivel.
- O fluxo recusa video bloqueado, inexistente, de outro canal ou sem aprovacao/compliance.
- O fluxo permite agendamento assistido ou salvamento de rascunho conforme o contrato.
- O fluxo nao executa envio externo automatico.
- A evidencia da preparacao fica disponivel para revisao.

### H11.4 - Gate de aprovacao e compliance para publicacao

- O conteudo nao aprovado e bloqueado antes da publicacao.
- O conteudo reprovado por compliance nao avanca.
- O gate registra evidencia da decisao.
- O fluxo deixa claro se a publicacao pode seguir ou nao.
- O gatilho de bloqueio e objetivo e auditavel.

## 9. Operational flow

1. Selecionar canal.
2. Selecionar video pronto ou corte elegivel.
3. Carregar o alvo de publicacao ou criar um alvo permitido.
4. Preparar o payload assistido.
5. Validar aprovacao humana e compliance.
6. Registrar job de publicacao.
7. Salvar como rascunho ou agendamento assistido.
8. Exibir status, erro e evidencias.
9. Bloquear qualquer tentativa de envio externo automatico fora da aprovacao documental.

## 10. Contracts affected

- `PublicationTarget`
- `PublicationJob`
- `PublicationStatus`
- `HumanApproval`
- `ComplianceCheck`
- `VideoAsset`
- `DerivedClip`
- `AuditLog`
- API endpoints esperados:
  - `GET /api/publication-targets`
  - `POST /api/publication-targets`
  - `GET /api/publications`
  - `POST /api/publications`
  - `POST /api/publications/:publicationJobId/reschedule`

## 11. Frontend

- Rota principal: `/publications`
- A tela deve mostrar alvos de publicacao, jobs, status, readiness, aprovacao e compliance.
- A tela deve ter loading, empty e error states.
- A tela nao deve permitir envio externo automatico fora do fluxo assistido.
- A tela deve consumir a camada de services e nao importar mocks crus.
- A tela deve respeitar o seletor de canal e nao misturar dados entre canais.

## 12. Backend

- Persistir alvos de publicacao e jobs de publicacao.
- Validar `channelId` em todas as operacoes.
- Validar aprovacao humana e compliance antes do agendamento assistido.
- Auditar criacao, preparacao, bloqueio, agendamento e erro.
- Nao introduzir envio externo automatico nesta sprint.

## 13. Persistence

- `PublicationTarget` e `PublicationJob` devem sobreviver a reinicio do repositorio.
- O estado do job deve permanecer rastreavel.
- O canal deve continuar sendo a chave de isolamento.
- Se existir idempotencia local, ela deve ser explicitada no contrato da implementacao, nunca assumida em silencio.

## 14. Audit

- Evento de alvo de publicacao criado.
- Evento de payload preparado.
- Evento de job criado.
- Evento de job agendado.
- Evento de bloqueio por aprovacao.
- Evento de bloqueio por compliance.
- Evento de erro normalizado.

Cada evento deve registrar:

- ator;
- canal;
- entidade;
- acao;
- status;
- timestamp;
- erro normalizado quando houver;
- metadados seguros.

## 15. Costs

- Registrar custo apenas se a politica operacional exigir.
- Nao simular custo de envio externo que nao ocorreu.
- Se houver custo de preparacao, ele deve ser explicitado em contrato e auditoria.
- O comportamento deve ser previsivel por canal.

## 16. Security and compliance

- Publicacao depende de aprovacao humana.
- Publicacao depende de compliance aprovado.
- Token expirado bloqueia o fluxo.
- Nenhum segredo deve ser exposto.
- Nenhum refresh token deve ser gravado em texto aberto.
- Nenhuma automacao de browser deve substituir o fluxo documental aprovado.

## 17. Out of scope

- Publicacao automatica sem aprovacao.
- Credenciais reais sem autorizacao.
- Automacao de browser para publicacao.
- Armazenamento inseguro de token.
- Publicacao de conteudo bloqueado.
- Revisao de outras rotas nao relacionadas.
- Mudanca em renderizacao ou cortes.

## 18. Probable files

Arquivos provaveis para uma futura implementacao, se esta sprint for executada:

- `docs/specs/011-publication-assisted.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `src/contracts/types.ts`
- `src/contracts/status.ts`
- `src/services/api-client.ts`
- `src/routes/publications.tsx`
- `server/src/modules/publications/*`
- `server/test/*`

## 19. Test strategy

- Validar criacao de alvo de publicacao.
- Validar listagem por canal.
- Validar criacao e consulta de job.
- Validar bloqueio por aprovacao e compliance.
- Validar ausencia de envio externo automatico.
- Validar isolamento por canal.
- Validar estados loading, empty e error na tela `/publications`.

## 20. Evidence

- Screenshot da rota `/publications` com canal selecionado.
- Screenshots geradas: `screenshots/publications-valid-1366x768.png`, `screenshots/publications-blocked-approval-1600x900.png`, `screenshots/publications-blocked-compliance-1792x1024.png`, `screenshots/publications-empty-1920x1080.png`, `screenshots/publications-details-1600x900.png`, `screenshots/publications-channel-switch-1366x768.png`.
- Log de criacao e bloqueio de job.
- Evidencia de estado de aprovacao e compliance.
- Relatorio de testes executados: `npm run lint`, `npm run backend:check`, `npm run test`, `npm run build`, `git diff --check`.
- Link do PR apos a publicacao da branch.

## 21. Risks

- Confundir publicacao assistida com publicacao automatica.
- Expor segredo em contrato, log ou tela.
- Misturar dados entre canais.
- Abrir escopo para integracoes externas antes da aprovacao documental.
- Permitir que o fluxo pareca concluido quando ainda esta bloqueado.

## 22. Definition of Ready

A historia so pode entrar na sprint quando:

- estiver vinculada ao epico;
- tiver descricao objetiva;
- tiver criterios de aceite;
- tiver dependencias identificadas;
- tiver contratos afetados identificados;
- tiver evidencia esperada definida;
- nao apresentar conflito documental;
- tiver escopo compativel com a sprint.

## 23. Definition of Done

A historia so pode ser marcada como concluida quando:

- a implementacao prevista estiver concluida;
- os criterios de aceite estiverem atendidos;
- os testes relevantes tiverem passado;
- a documentacao necessaria estiver atualizada;
- seguranca, auditoria e custos tiverem sido avaliados;
- as evidencias estiverem disponiveis;
- pendencias materiais estiverem explicitamente registradas.

## 24. Gate da sprint

Gate da Sprint 11:

- o sistema consegue preparar um pacote de publicacao assistida por canal;
- o sistema mostra aprovacao e compliance de forma objetiva;
- o sistema bloqueia o que nao pode publicar;
- o sistema nao executa envio externo automatico;
- as evidencias da preparacao ficam disponiveis para revisao;
- a spec, o roadmap, o backlog e o handoff permanecem alinhados.
