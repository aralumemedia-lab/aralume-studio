# ARALUME STUDIO — DOCUMENTO MESTRE V2.1 PÓS-LOVABLE

**Documento principal do novo projeto Aralume Studio**  
**Versão:** 2.1  
**Status:** Fonte oficial de verdade do projeto após criação inicial do frontend via Lovable  
**Uso obrigatório:** Codex, GitHub, agentes de desenvolvimento, documentação, roadmap, critérios de aceite, revisões técnicas e prompts de sprint  
**Repositório oficial:** `https://github.com/aralumemedia-lab/aralume-studio.git`  
**Contexto local informado:** `C:\Users\carol\Documents\aralume-studio V2`

---

## 0. Mudança de contexto em relação à V2.0

Este documento substitui o Documento Mestre V2.0 como orientação operacional do projeto Aralume Studio.

A V2.0 foi criada para orientar a reconstrução do projeto do zero. Depois disso, o frontend inicial foi criado via Lovable. Portanto, o plano não começa mais em “criar o frontend do zero”. O plano correto agora é:

1. Preservar o frontend criado via Lovable como base inicial.
2. Auditar rigorosamente esse frontend no Codex.
3. Corrigir contratos, mocks, rotas, documentação, estrutura e problemas de build.
4. Congelar contratos TypeScript aprovados.
5. Criar o backend no Codex seguindo exatamente os contratos do frontend.
6. Integrar tela por tela, sem refazer a plataforma inteira.

A regra central permanece: **a Aralume deve nascer como uma plataforma operacional rastreável, não como apenas um gerador de vídeo**.

A regra nova é: **o frontend Lovable não está automaticamente aprovado; ele precisa passar por auditoria e estabilização no Codex antes de ser considerado a base oficial do produto**.

---

## 1. Propósito deste documento

Este documento é a fonte principal de informação para conduzir a Aralume Studio a partir do estado atual: frontend inicial já criado via Lovable e backend ainda não implementado.

Ele existe para impedir a repetição dos erros do projeto anterior:

- muitas sprints sem resultado operacional claro;
- backend avançando antes do frontend ser usável;
- uso excessivo de CLI como validação de produto;
- escopo amplo demais por sprint;
- ausência de design system consolidado;
- problemas de ambiente, banco, credenciais e paths de mídia;
- ambiguidade entre entidades globais e entidades por canal;
- dificuldade de chegar a uma V1.0 demonstrável;
- construção de funcionalidades sem validação visual;
- mocks e contratos frágeis ou improvisados.

A partir deste documento, qualquer agente, plataforma ou desenvolvedor deve entender:

- o que a Aralume Studio é;
- o que ela não é;
- qual é o estado atual do projeto;
- como tratar o frontend criado pelo Lovable;
- como auditar e estabilizar a base atual;
- quais contratos devem orientar o backend futuro;
- qual stack usar;
- como estruturar frontend e backend;
- como desenhar a experiência operacional;
- como modelar os dados;
- como implementar workflows e agentes;
- qual ordem de construção seguir;
- quais gates precisam ser cumpridos antes de avançar;
- o que define uma V1.0 real e funcional.

---

## 2. Decisão executiva atualizada

A Aralume Studio será reconstruída com uma abordagem mais curta, objetiva e verificável.

A decisão anterior de começar pelo frontend foi mantida e executada parcialmente: **o frontend inicial já foi criado via Lovable**.

A decisão executiva atual é:

- Lovable foi usado como acelerador visual e gerador inicial do frontend.
- Codex será o ambiente principal de auditoria, estabilização, backend, integração, testes e evolução por PRs.
- GitHub será a fonte de verdade do código.
- O frontend atual não deve ser recriado do zero sem autorização.
- O backend será criado depois, seguindo os contratos TypeScript aprovados no frontend.
- A próxima fase obrigatória é a **Sprint 0 — Auditoria e Estabilização do Frontend Lovable**.
- Nenhum backend real será criado antes da Sprint 0 estar concluída.
- Nenhum banco, Drizzle, Supabase, autenticação real, IA real, vídeo real ou publicação real deve ser implementado na Sprint 0.
- Python será usado apenas como worker futuro, se necessário, para mídia, FFmpeg, LangGraph, IA pesada ou jobs assíncronos.

O novo projeto deve ser validado por tela, por fluxo, por contrato, por build e por PR. Não basta criar arquivos. Não basta parecer bonito. Não basta compilar uma vez. O sistema precisa ser progressivamente operável.

---

## 3. Visão do produto

A Aralume Studio é uma plataforma SaaS empresarial para operação de uma fábrica editorial multicanal baseada em agentes de inteligência artificial.

A plataforma deverá pesquisar oportunidades, criar pautas, organizar fontes, escrever roteiros, planejar cenas, gerar ou organizar narração, produzir ativos visuais, montar vídeos, gerar cortes, validar qualidade, validar conformidade, submeter conteúdos à aprovação humana, preparar publicações, coletar métricas e alimentar um ciclo de aprendizado editorial.

Ela deve começar com um canal, mas nascer preparada para múltiplos canais. Cada canal terá nicho, público, linguagem, identidade visual, voz, regras editoriais, calendário, plataformas, orçamento e métricas próprias.

A infraestrutura, os agentes, o motor de workflows, o banco, o armazenamento, as validações, a auditoria, os custos e as integrações serão compartilhados, mas os dados editoriais e operacionais devem ser isolados por canal.

A Aralume não é uma ferramenta simples para gerar vídeo automático. O produto correto é uma operação editorial automatizada, auditável, segura, escalável, controlada por custos, supervisionada por humanos e orientada por métricas.

---

## 4. Estado atual do projeto

### 4.1. O que já existe

O frontend inicial foi criado via Lovable no repositório:

`https://github.com/aralumemedia-lab/aralume-studio.git`

Esse frontend deve conter, ou deverá ser auditado para confirmar se contém:

- aplicação React/TypeScript/Vite;
- identidade visual Aralume;
- layout administrativo;
- sidebar;
- topbar;
- rotas administrativas;
- Dashboard;
- Canais;
- Escritório de Agentes;
- páginas para os demais módulos;
- dados mockados;
- contratos TypeScript;
- mock-api ou camada equivalente;
- design system ou componentes visuais reutilizáveis;
- documentação inicial, se o Lovable tiver criado.

### 4.2. O que ainda não existe e não deve ser inventado na Sprint 0

Na Sprint 0, ainda não deve existir:

- backend real;
- banco real;
- Drizzle schema;
- migrations;
- Supabase;
- autenticação real;
- IA real;
- geração de vídeo real;
- publicação real;
- OAuth;
- integração com plataformas externas;
- workers Python;
- renderização real via FFmpeg.

### 4.3. Interpretação correta do frontend Lovable

O frontend criado pelo Lovable é uma base inicial. Ele não é automaticamente a arquitetura oficial aprovada.

O Codex deve auditar:

- se compila;
- se as rotas existem;
- se os contratos estão corretos;
- se os mocks são tipados;
- se a mock-api existe;
- se as páginas consomem serviços e não mocks crus;
- se `channelId` existe em dados operacionais;
- se o seletor de canal filtra contexto;
- se a experiência visual está alinhada ao padrão SaaS premium;
- se não há dependência indevida de Supabase, backend, autenticação ou API externa;
- se não há segredo exposto.

---

## 5. O que deu errado no projeto anterior e como bloquear agora

### 5.1. Escopo grande demais por sprint

Erro anterior: o projeto avançou em muitas frentes ao mesmo tempo: agentes, backend, migrations, publicação, vídeo, OAuth, métricas, conformidade, frontend e testes.

Correção agora:

- cada sprint deve ter escopo pequeno;
- o que está fora do escopo deve ser declarado;
- uma sprint não pode misturar design premium, backend, banco, IA, vídeo e publicação;
- Sprint 0 é apenas auditoria e estabilização do frontend Lovable.

### 5.2. Backend avançou mais que frontend

Erro anterior: o backend ficou tecnicamente denso, mas o operador não tinha uma experiência visual equivalente para usar o sistema.

Correção agora:

- frontend foi criado primeiro;
- backend será criado depois seguindo contratos do frontend;
- toda funcionalidade real futura precisa aparecer na interface ou ter motivo técnico claro.

### 5.3. Frontend sem design system consolidado

Erro anterior: telas com densidade inadequada, colisão visual, quebra de textos longos, headers apertados e aparência abaixo do esperado.

Correção agora:

- design system precisa ser auditado;
- componentes reutilizáveis precisam existir;
- telas premium precisam ser validadas visualmente;
- Lovable não deve ser considerado suficiente sem revisão do Codex.

### 5.4. Validação por CLI em vez de produto operável

Erro anterior: muitos testes e comandos, mas pouca validação operacional em tela.

Correção agora:

- build e testes continuam obrigatórios;
- UI navegável é critério de produto;
- Dashboard, Canais e Escritório de Agentes são telas prioritárias.

### 5.5. Problemas de ambiente, banco e credenciais

Erro anterior: atrito com PostgreSQL local, variáveis de ambiente, senhas, migrations e exposição de segredo em texto operacional.

Correção agora:

- `.env.example` sem segredos;
- nenhum segredo em log, prompt, documento ou código;
- qualquer segredo exposto deve ser rotacionado;
- banco só entra quando a Sprint de backend/banco começar.

### 5.6. Ambiguidade entre global e canal

Erro anterior: confusão entre política global e política por canal.

Correção agora:

- entidade global não recebe `channelId`;
- entidade operacional por canal recebe `channelId`;
- contratos do frontend devem refletir essa regra;
- backend futuro deve implementar a mesma semântica.

### 5.7. Pipeline de mídia antes de storage maduro

Erro anterior: falha por arquivo de entrada fora do `storage_root`.

Correção agora:

- mídia real só depois de asset registry, storage root, jobs e validação de paths;
- Sprint 0 não toca em mídia real.

### 5.8. Prompt grande usado para construir tudo

Erro anterior: prompts amplos demais geraram sprints longas e difíceis de validar.

Correção agora:

- Documento Mestre é contexto e norma;
- prompts de execução devem ser pequenos e específicos;
- Sprint 0 tem escopo fechado.

---

## 6. Princípios inegociáveis

1. Multicanal desde o início.
2. Canal como raiz operacional do conteúdo.
3. Separação entre configuração e regra de negócio.
4. Rastreabilidade completa.
5. Auditoria de eventos e decisões.
6. Controle de custos por canal, etapa e fornecedor.
7. Aprovação humana em decisões de risco.
8. Conteúdo original como padrão.
9. Fontes rastreáveis para conteúdo factual.
10. Integrações autorizadas, sem simulação de comportamento humano.
11. Nenhuma credencial em código, log, prompt ou documento público.
12. Design system antes de multiplicar novas telas.
13. Frontend operacional como critério de produto.
14. Workers especializados somente quando a fundação estiver madura.
15. Testes e screenshots como parte do Definition of Done.
16. Nenhuma expansão de canais antes de estabilidade do primeiro canal.
17. Nenhuma publicação real sem conformidade, aprovação humana e autorização.
18. Nenhum ativo de mídia sem origem, licença ou geração rastreada.
19. Nenhum workflow sem status, eventos, custo, erro e idempotência.
20. Nenhuma fase concluída sem evidências.
21. Backend futuro deve seguir contratos aprovados do frontend.
22. O frontend Lovable deve ser auditado antes de ser tratado como base oficial aprovada.

---

## 7. Stack oficial atualizada

### 7.1. Frontend existente

O frontend inicial foi criado via Lovable e deve ser preservado, auditado e estabilizado.

Stack esperada:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- shadcn/ui ou componentes equivalentes, se usado;
- React Router ou equivalente;
- dados mockados locais;
- contratos TypeScript;
- mock-api local;
- sem backend real obrigatório;
- sem Supabase obrigatório;
- sem autenticação real obrigatória;
- sem chamadas externas obrigatórias.

### 7.2. Backend futuro

O backend será criado posteriormente no Codex, seguindo os contratos do frontend.

Stack recomendada:

- Node.js;
- TypeScript;
- Express;
- Drizzle ORM;
- PostgreSQL;
- Zod;
- Vitest ou Jest;
- Playwright para E2E e screenshots.

### 7.3. Workers futuros

Python será permitido apenas como worker desacoplado para:

- FFmpeg;
- renderização;
- processamento de mídia;
- LangGraph;
- IA pesada;
- jobs assíncronos.

Python não será a aplicação principal nesta fase.

---

## 8. Estrutura de repositório recomendada após auditoria

A estrutura real pode variar por causa do Lovable, mas o Codex deve convergir para a separação abaixo sempre que possível, sem reescrever o projeto inteiro na Sprint 0.

```text
/
  docs/
    PROJECT_MASTER.md
    FRONTEND_DESIGN_SYSTEM.md
    FRONTEND_API_CONTRACTS.md
    CODEX_HANDOFF.md
    NEXT_SPRINTS.md
    runbooks/
      visual-qa.md
      release-checklist.md
  src/
    app/
    components/
      layout/
      ui/
      aralume/
      status/
      tables/
      charts/
    contracts/
      types.ts
      status.ts
      api-contracts.ts
    mocks/
      mock-channels.ts
      mock-agents.ts
      mock-workflows.ts
      mock-content.ts
      mock-approvals.ts
      mock-costs.ts
      mock-metrics.ts
      mock-audit.ts
    services/
      mock-api.ts
      api-client.ts
    pages/
      dashboard/
      channels/
      agent-office/
      production/
      ideas/
      research/
      scripts/
      media-assets/
      videos/
      clips/
      approvals/
      publications/
      metrics/
      costs/
      compliance/
      administration/
      audit-logs/
    styles/
      design-tokens.css
```

Quando o backend começar, a estrutura recomendada será:

```text
server/
  index.ts
  app.ts
  db/
    schema.ts
    client.ts
    migrations/
    seed.ts
  modules/
    channels/
    agents/
    workflows/
    audit/
    costs/
    approvals/
    compliance/
    media/
    publications/
    metrics/
  shared/
    errors.ts
    validation.ts
    auth-context.ts
    ids.ts
    pagination.ts
    result.ts
```

---

## 9. Arquitetura do frontend

O frontend deve seguir camadas claras:

- **AppShell:** layout global, sidebar, topbar, seletor de canal e área principal.
- **Pages:** composição das telas.
- **Components:** peças reutilizáveis.
- **Contracts:** tipos e status oficiais.
- **Services:** mock-api agora; api-client real depois.
- **Mocks:** dados demo isolados.
- **Design system:** tokens, badges, cards, tabelas, ícones e estados.

Regras:

- páginas devem consumir funções de serviço;
- páginas não devem importar mocks crus diretamente;
- componentes visuais não devem conhecer a origem dos dados;
- status devem usar tipos oficiais;
- badges devem ser padronizados;
- dados operacionais devem ter `channelId`;
- seletor de canal deve alterar o contexto visual;
- mocks não são lixo temporário; eles são a simulação inicial do domínio.

---

## 10. Contratos TypeScript oficiais esperados

### 10.1. Regras gerais

- Use `camelCase` no frontend.
- Todos os IDs são `string`.
- Todas as datas são strings ISO 8601.
- Valores monetários são inteiros em centavos com sufixo `Cents`.
- Durações são em segundos com sufixo `Seconds`.
- Dados operacionais por canal devem conter `channelId`.
- Entidades globais não devem conter `channelId` sem necessidade.
- O backend futuro deve respeitar esses contratos ou propor alteração formal.

### 10.2. Status obrigatórios

```ts
export type ChannelStatus = "active" | "paused" | "draft" | "archived" | "blocked" | "warning";

export type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "blocked"
  | "retrying";

export type AgentStatus =
  | "idle"
  | "running"
  | "waiting_input"
  | "waiting_approval"
  | "blocked"
  | "failed"
  | "completed";

export type RiskLevel = "ok" | "attention" | "warning" | "critical" | "blocked";

export type CostStatus = "healthy" | "attention" | "exceeded" | "not_configured";

export type PublicationStatus =
  | "not_connected"
  | "authenticated"
  | "token_expired"
  | "draft"
  | "scheduled"
  | "published"
  | "failed";

export type ComplianceStatus =
  | "approved"
  | "attention"
  | "rejected"
  | "blocked"
  | "needs_human_review";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested" | "blocked";

export type ContentStatus =
  | "idea"
  | "research"
  | "script"
  | "visual_plan"
  | "narration"
  | "editing"
  | "clips"
  | "quality_check"
  | "compliance_check"
  | "waiting_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "blocked";
```

### 10.3. Tipos principais esperados

O frontend deve possuir contratos equivalentes a:

- `Channel`;
- `ChannelSettings`;
- `EditorialRules`;
- `AgentDefinition`;
- `WorkflowRun`;
- `WorkflowStep`;
- `AgentRun`;
- `AgentHandoff`;
- `ContentIdea`;
- `ResearchSession`;
- `ResearchSource`;
- `ClaimEvidence`;
- `Script`;
- `ScriptVersion`;
- `VisualPlan`;
- `ScenePlan`;
- `MediaAssetBase`;
- `NarrationAsset`;
- `VisualAsset`;
- `VideoAsset`;
- `DerivedClip`;
- `QualityCheck`;
- `ComplianceCheck`;
- `HumanApproval`;
- `PublicationTarget`;
- `PublicationJob`;
- `PerformanceMetric`;
- `CostEntry`;
- `AuditLog`;
- `OperationalModePolicy`;
- `DashboardSummary`;
- `AgentOfficeSnapshot`;
- `ProductionItem`.

Se esses tipos não existirem no frontend Lovable, a Sprint 0 deve criá-los ou documentar a pendência, dependendo do impacto no build.

---

## 11. Mock API oficial

O frontend deve ter `src/services/mock-api.ts` ou equivalente.

Funções esperadas:

```ts
getDashboardSummary(channelId?)
getChannels()
getChannelById(channelId)
getChannelSettings(channelId)
getAgentDefinitions()
getAgentOfficeSnapshot(channelId?)
getWorkflowRuns(channelId?)
getProductionItems(channelId?)
getContentIdeas(channelId?)
getResearchSessions(channelId?)
getScripts(channelId?)
getMediaAssets(channelId?)
getVideoAssets(channelId?)
getDerivedClips(channelId?)
getHumanApprovals(channelId?)
getPublicationJobs(channelId?)
getPerformanceMetrics(channelId?)
getCostEntries(channelId?)
getComplianceChecks(channelId?)
getAuditLogs(channelId?)
```

Regras:

- pode haver delay artificial;
- deve retornar estrutura próxima à futura API;
- deve filtrar por `channelId` quando aplicável;
- não deve chamar APIs externas;
- não deve usar segredos;
- deve facilitar substituição por `api-client.ts` real.

---

## 12. Design system Aralume

### 12.1. Objetivo visual

O frontend deve parecer uma plataforma SaaS empresarial premium, com alta densidade de informação, identidade própria e leitura operacional clara.

As referências visuais usadas nas conversas devem orientar a direção de arte: sidebar limpa, cards compactos, fontes pequenas, KPIs no topo, painel lateral de detalhes, tabs compactas, ícones consistentes, linhas de workflow e status visíveis.

A Aralume não deve parecer template genérico, landing page ou dashboard vazio.

### 12.2. Princípios visuais

- Tema claro como padrão.
- Alta densidade, sem poluição.
- Fonte pequena e legível.
- Pouca sombra, mais borda suave.
- Azul como cor primária.
- Verde para OK.
- Amarelo ou laranja para alerta.
- Vermelho para bloqueio/falha.
- Roxo para handoff ou agentes especiais.
- Cinza para neutro e pausado.
- Cards compactos.
- Tabelas densas.
- Sidebar fixa e recolhível.
- Topbar com busca, filtros e ação principal.
- Painel lateral para detalhes.
- Layout desktop responsivo.

### 12.3. Tipografia

Padrão recomendado:

- Título de página: 22px a 26px.
- Subtítulo ou breadcrumb: 12px a 13px.
- Título de card: 13px a 14px.
- Texto comum: 12px a 13px.
- Labels: 10px a 12px.
- Tabelas: 11px a 12px.
- Badges: 10px a 11px.
- Números de KPI: 20px a 28px.

### 12.4. Componentes obrigatórios

- `AppShell`;
- `SidebarNav`;
- `Topbar`;
- `ChannelSwitcher`;
- `PageHeader`;
- `SectionHeader`;
- `AralumeLogo`;
- `StatusBadge`;
- `RiskBadge`;
- `CostBadge`;
- `WorkflowStatusBadge`;
- `AgentStatusBadge`;
- `PublicationStatusBadge`;
- `ComplianceStatusBadge`;
- `KpiCard`;
- `MetricCard`;
- `ChannelCard`;
- `AgentCard`;
- `WorkflowCard`;
- `ApprovalCard`;
- `CompactTable`;
- `AgentBoard`;
- `AgentPhaseColumn`;
- `AgentHandoffLine`;
- `AgentDetailPanel`;
- `WorkflowTimeline`;
- `ChannelList`;
- `ChannelDetailHeader`;
- `ChannelOperationalPanel`;
- `ChannelBudgetPanel`;
- `ChannelPlatformPanel`;
- `ChannelEditorialTabs`;
- `EmptyState`;
- `LoadingState`;
- `ErrorState`.

Se o Lovable tiver criado nomes diferentes, o Codex deve mapear equivalentes antes de renomear. Renomear por estética é proibido na Sprint 0.

### 12.5. Logo e iconografia

A marca Aralume deve transmitir:

- luz;
- clareza;
- automação;
- controle;
- inteligência;
- operação editorial;
- multiagentes;
- rastreabilidade;
- tecnologia premium;
- confiança empresarial.

O logo deve ter:

- símbolo próprio;
- wordmark “Aralume”;
- versão completa para sidebar expandida;
- versão compacta para sidebar recolhida;
- boa leitura em tamanho pequeno;
- estética SaaS premium;
- ausência de aparência infantil ou genérica.

Ícones devem ser consistentes, com traço fino, cantos arredondados e boa leitura em 16px, 18px e 20px.

---

## 13. Rotas oficiais do frontend

Rotas esperadas:

```text
/dashboard
/channels
/agent-office
/production
/ideas
/research
/scripts
/media-assets
/videos
/clips
/approvals
/publications
/metrics
/costs
/compliance
/administration
/audit-logs
```

A rota inicial deve redirecionar para `/dashboard`.

Não criar:

- landing page;
- página pública;
- login real;
- rotas aleatórias;
- fluxos externos.

---

## 14. Telas principais

### 14.1. Dashboard

Objetivo: visão executiva e operacional.

Deve exibir:

- canais ativos;
- conteúdos em produção;
- conteúdos aguardando aprovação;
- publicações programadas;
- custo do mês;
- falhas recentes;
- alertas de conformidade;
- produção por status;
- indicadores de audiência;
- recomendações do agente analista.

### 14.2. Canais

Objetivo: administrar canais e entender se estão prontos para operar.

Layout recomendado:

- lista de canais à esquerda;
- detalhe do canal no centro;
- painéis operacionais à direita.

Abas esperadas:

- Visão geral;
- Perfil editorial;
- Identidade visual;
- Voz e narração;
- Regras editoriais;
- Plataformas;
- Orçamento;
- Histórico.

A tela de Canais não deve ser apenas CRUD. Ela deve mostrar readiness operacional.

### 14.3. Escritório de Agentes

Objetivo: cockpit operacional da fábrica editorial.

Layout:

- KPIs no topo;
- board central com fases e agentes;
- handoffs visuais entre agentes;
- painel lateral do agente selecionado;
- tabelas inferiores com handoffs, timeline, fila e bloqueios.

O cockpit deve responder em 30 segundos:

- quem está trabalhando;
- em qual conteúdo;
- em qual etapa;
- o que foi entregue;
- o que está bloqueando;
- qual é o próximo agente.

### 14.4. Produção

Deve mostrar conteúdos em andamento por canal, etapa, agente atual, progresso, custo acumulado, risco e próxima ação.

### 14.5. Pautas

Deve permitir visualizar oportunidades, score editorial, nicho, canal, fonte da ideia, risco e ações simuladas.

### 14.6. Pesquisas

Deve exibir sessões de pesquisa, fontes, claims, confiança, divergências, risco de desatualização e data de acesso.

### 14.7. Roteiros

Deve exibir roteiros, versões, status, duração estimada, estrutura narrativa, CTA, ideias de cortes e histórico.

### 14.8. Ativos de Mídia

Deve exibir narrações, imagens, vídeos, thumbnails, trilhas, legendas, origem, licença, prompt, modelo, status, risco e custo.

### 14.9. Vídeos

Deve exibir vídeos principais, render status, duração, formato, resolução, canal, roteiro vinculado, custo, qualidade e conformidade.

### 14.10. Cortes

Deve exibir cortes derivados, vídeo-mãe, gancho, duração, plataforma sugerida, status, risco e potencial.

### 14.11. Aprovações

Deve exibir fila de aprovação, canal, conteúdo, roteiro, fontes, vídeo/corte, custo, risco, alertas, recomendação dos agentes e ações simuladas.

### 14.12. Publicações

Deve exibir calendário ou fila, plataforma, status, canal, conteúdo, data planejada, tipo e alertas de token/conexão, sem publicação real.

### 14.13. Métricas

Deve exibir visão por canal, vídeo, tema, retenção, views, alcance, comentários, compartilhamentos, seguidores e recomendações editoriais mockadas.

### 14.14. Custos

Deve exibir custo por canal, etapa, fornecedor, mês, orçamento, limites, alertas e custo por conteúdo.

### 14.15. Conformidade

Deve exibir alertas, bloqueios, riscos, conteúdos reprovados, claims sem fonte, uso de terceiros, tema proibido e necessidade de revisão humana.

### 14.16. Administração

Deve exibir usuários mockados, perfis, permissões, integrações futuras, provedores futuros, modos operacionais e configurações globais, sem autenticação real.

### 14.17. Logs e Auditoria

Deve exibir eventos, ator, canal, workflow, agente, ação, timestamp, status, erro, custo e metadados.

---

## 15. Modelo de dados futuro do backend

### 15.1. Regra de `channel_id`

- Entidades editoriais e operacionais terão `channel_id`.
- Entidades globais de configuração da plataforma não terão `channel_id`.
- Entidades globais e por canal devem ser separadas quando tiverem semântica diferente.

Exemplos com `channel_id`:

- `content_ideas`;
- `research_sessions`;
- `research_sources`;
- `scripts`;
- `visual_plans`;
- `media_assets`;
- `workflow_runs`;
- `agent_runs`;
- `cost_entries`;
- `human_approval_items`;
- `publication_jobs`;
- `performance_metrics`.

Exemplos globais:

- `system_settings`;
- `global_provider_catalog`;
- `global_operational_policy`;
- `feature_flags` globais.

Exemplos por canal:

- `channel_settings`;
- `channel_editorial_rules`;
- `channel_budget_policy`;
- `channel_operational_policy`;
- `channel_platform_accounts`;
- `channel_voice_profile`.

### 15.2. Tabelas iniciais futuras

Quando o backend começar, a fase inicial deve conter:

- `channels`;
- `channel_settings`;
- `channel_editorial_rules`;
- `agent_definitions`;
- `workflow_runs`;
- `agent_runs`;
- `agent_handoffs`;
- `audit_logs`;
- `cost_entries`;
- `human_approval_items`.

Não criar todas as tabelas da V1.0 em uma única sprint sem necessidade.

---

## 16. Workflows e agentes

### 16.1. Agentes esperados

- Inteligência de Nicho;
- Pesquisador;
- Editorial;
- Roteirista;
- Direção Visual;
- Narração;
- Produção Visual;
- Editor de Vídeo;
- Gerador de Cortes;
- Qualidade;
- Conformidade;
- Publicador;
- Analista.

### 16.2. Fluxo principal futuro

1. Selecionar canal.
2. Carregar regras editoriais.
3. Criar oportunidade.
4. Criar pauta.
5. Pesquisar fontes.
6. Validar pauta.
7. Criar roteiro.
8. Planejar cenas.
9. Gerar ou registrar narração.
10. Gerar ou registrar ativos visuais.
11. Montar vídeo principal.
12. Gerar cortes.
13. Validar qualidade.
14. Validar conformidade.
15. Solicitar aprovação humana.
16. Preparar publicação.
17. Publicar ou gerar rascunho autorizado.
18. Coletar métricas.
19. Analisar desempenho.
20. Alimentar aprendizado.

### 16.3. Handoffs

Todo handoff deve registrar:

- agente origem;
- agente destino;
- artefato entregue;
- status;
- hora;
- resumo;
- bloqueios;
- `workflowRunId`;
- `channelId`.

---

## 17. Segurança, credenciais e conformidade

Regras obrigatórias:

- nunca commitar `.env`;
- nunca imprimir token;
- nunca colar senha em prompt;
- nunca registrar segredo em audit log;
- usar `.env.example`;
- mascarar valores sensíveis;
- rotacionar segredo exposto;
- não publicar conteúdo sem aprovação;
- não usar automação que burle plataformas;
- não copiar e republicar conteúdo de terceiros sem direito;
- conteúdo factual precisa de fonte;
- conteúdo bloqueado não publica.

---

## 18. Mídia, storage e renderização

Esta seção é futura. Não deve ser implementada na Sprint 0.

Regras futuras:

- todo ativo deve ser registrado antes de uso;
- renderizador só pode usar arquivos dentro do storage root autorizado;
- caminhos externos devem ser rejeitados;
- todo render deve ser job;
- todo render deve registrar entrada, saída, comando, logs, status, erro e duração.

---

## 19. Testes e validação

### 19.1. Camadas esperadas no ciclo do projeto

- build;
- typecheck;
- lint;
- unit tests;
- component tests;
- E2E tests;
- screenshots;
- contract tests;
- integration tests com banco, quando o backend existir.

### 19.2. QA visual obrigatório

Telas premium devem ser validadas em:

- 1366x768;
- 1600x900;
- 1792x1024;
- 1920x1080.

Validar:

- sidebar expandida;
- sidebar recolhida;
- nomes longos;
- timezone `America/Sao_Paulo`;
- tabela cheia;
- estado vazio;
- estado de erro;
- status crítico;
- sem overflow horizontal;
- sem sobreposição;
- sem botão quebrado;
- sem texto ilegível.

Na Sprint 0, se screenshots não forem possíveis, registrar pendência formal.

---

## 20. Ordem atualizada de construção até a V1.0

Nota operacional atualizada:

- A Sprint 8 foi encerrada em Media Assets and Storage.
- A Sprint 9 foi encerrada e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- A Sprint 10 foi encerrada e integrada ao `main` via PR #17.
- As fases abaixo continuam como roadmap conceitual e nao precisam coincidir numericamente com a sequencia operacional das sprints entregues.

### Fase 0 — Documento Mestre e contexto oficial

**Status:** concluída parcialmente.

Entregas:

- Documento Mestre V2 criado;
- Documento Mestre V2.1 pós-Lovable criado;
- visão consolidada;
- erros do projeto anterior documentados;
- estratégia de frontend primeiro definida;
- backend futuro no Codex definido.

Pendência:

- consolidar este documento no repositório como `docs/PROJECT_MASTER.md`.

### Fase 1 — Frontend Lovable criado

**Status:** criado fora do Codex.

Entregas esperadas:

- AppShell;
- sidebar;
- topbar;
- logo Aralume;
- rotas principais;
- Dashboard;
- Canais;
- Escritório de Agentes;
- páginas administrativas;
- mocks;
- contratos TypeScript;
- mock-api;
- design system;
- documentação inicial.

Gate:

- só será aprovada após auditoria do Codex.

### Fase 1.1 — Sprint 0: Auditoria e estabilização do frontend Lovable

**Próxima fase obrigatória.**

Objetivo:

- auditar e estabilizar o frontend gerado pelo Lovable.

Escopo:

- verificar build;
- verificar rotas;
- verificar contratos;
- verificar mocks;
- verificar mock-api;
- verificar design system;
- verificar páginas;
- verificar `channelId`;
- verificar seletor de canal;
- verificar ausência de backend real indevido;
- verificar ausência de Supabase obrigatório;
- verificar ausência de segredos;
- criar/atualizar documentação;
- abrir PR.

Fora do escopo:

- backend real;
- banco;
- autenticação;
- IA real;
- publicação real;
- vídeo real;
- integrações externas.

Gate:

- frontend compila ou erros estão documentados;
- rotas principais existem;
- contratos e mocks auditados;
- documentação mínima criada;
- nenhum backend real criado;
- PR aberto.

### Fase 2 — Backend Foundation

Objetivo:

- criar backend inicial seguindo contratos aprovados do frontend.

Entregas:

- Express;
- Drizzle;
- PostgreSQL;
- Zod;
- health check;
- padrão de erro;
- migrations iniciais;
- seed demo;
- endpoints base.

Gate:

- backend sobe;
- migrations aplicam em banco limpo;
- health check responde;
- contratos compatíveis com frontend.

### Fase 3 — Canais reais

Objetivo:

- substituir mocks de canais por API real.

Entregas:

- CRUD real de canais;
- channel settings;
- regras editoriais;
- orçamento;
- integração da tela Canais com backend.

Gate:

- criar dois canais reais;
- comprovar isolamento de dados por canal.

### Fase 4 — Dashboard real inicial

Objetivo:

- conectar Dashboard a dados reais de canais, custos, workflows e aprovações iniciais.

### Fase 5 — Escritório de Agentes persistido

Objetivo:

- persistir `agent_definitions`, `workflow_runs`, `agent_runs` e `agent_handoffs`.

Gate:

- iniciar workflow demo e ver handoff no frontend.

### Fase 6 — Pipeline Editorial

Objetivo:

- pauta, pesquisa, fonte, claim, roteiro e versões.

Gate:

- criar pauta, registrar fonte, criar roteiro versionado e enviar para aprovação.

### Fase 7 — Aprovação, Qualidade e Conformidade

Objetivo:

- bloquear riscos antes de mídia real.

Gate:

- conteúdo com risco alto fica bloqueado até decisão humana.

### Fase 8 — Custos e Modos Operacionais

Objetivo:

- governar execução real.

Gate:

- modo demo bloqueia IA real e publicação real.

### Fase 9 — Ativos de Mídia

Objetivo:

- registrar mídia corretamente.

Gate:

- todo ativo usado por conteúdo tem origem e URI interna válida.

### Fase 10 — Renderização Controlada

**Status:** concluída.

Objetivo:

- gerar vídeo demo reproduzível.

Gate:

- renderizar vídeo curto de teste com logs e validação.

### Fase 11 — Cortes

**Status:** em andamento.

Objetivo:

- gerar e rastrear derivados.

Gate:

- gerar pelo menos um corte vinculado ao vídeo principal.

### Fase 12 — Publicação Assistida

**Status:** materializada na Sprint 11 e encerrada.

Objetivo:

- preparar publicação sem risco externo.

Gate:

- pacote de publicação pronto, sem envio externo automático.

### Fase 13 — Integrações Reais Autorizadas

Objetivo:

- conectar provedores com governança.

Gate:

- integração oficial funcionando sem expor segredo.

### Fase 14 — Métricas e Aprendizado

Objetivo:

- fechar ciclo editorial.

Gate:

- métricas geram recomendação editorial por canal.

### Fase 15 — Hardening V1.0

**Status:** planejada.

Objetivo:

- transformar MVP em V1.0 funcional.

Gate:

- demonstração ponta a ponta pelo frontend;
- aceite binário documentado como V1.0 aceita ou V1.0 não aceita na Sprint 12;
- esta fase é validada pela Sprint 12 e pela spec `docs/specs/012-v1-acceptance.md`, sem reclassificar a Fase 12 histórica.

### Mapa de identificadores

- **Fase do roadmap do produto**: linha histórica de capacidade do produto no Documento Mestre.
- **Sprint de execução**: unidade sequencial de entrega, integração e validação.
- **Spec**: contrato normativo que governa a execução da sprint.
- Os identificadores podem divergir numericamente.
- A Fase 12 do roadmap materializou-se na Sprint 11 e permanece encerrada.
- A Sprint 12 formaliza o gate de Hardening/V1 Acceptance da V1.0 e é regida pela spec `docs/specs/012-v1-acceptance.md`.
- A Sprint 12 não é uma renumeração silenciosa da Fase 12.

---

## 21. V1.0 — critérios obrigatórios

A V1.0 existe quando um operador consegue:

1. Criar ou selecionar canal.
2. Configurar perfil editorial.
3. Criar pauta.
4. Registrar pesquisa e fontes.
5. Criar roteiro versionado.
6. Planejar cenas.
7. Registrar narração ou gerar narração autorizada.
8. Registrar ativos visuais.
9. Renderizar vídeo demo ou real controlado.
10. Gerar pelo menos um corte.
11. Validar qualidade.
12. Validar conformidade.
13. Submeter à aprovação humana.
14. Preparar publicação ou rascunho.
15. Registrar custos.
16. Registrar métricas.
17. Gerar recomendação editorial.
18. Ver todo o histórico no frontend.

Não é V1.0 se:

- só funciona por CLI;
- só tem backend;
- só tem mock visual;
- não tem canal real;
- não tem aprovação humana;
- não tem rastreabilidade;
- não tem controle de custo;
- não tem validação visual;
- não tem fluxo ponta a ponta.

---

A decisão final de V1.0 é binária: V1.0 aceita ou V1.0 não aceita.

## 22. Sprint 0 — Prompt normativo para Codex

Use este prompt para a primeira rodada do Codex após o frontend Lovable:

```text
Você atuará como engenheiro de software sênior e guardião técnico da Aralume Studio.

Repositório:
https://github.com/aralumemedia-lab/aralume-studio.git

Contexto obrigatório:
O frontend inicial da Aralume Studio já foi criado via Lovable.

Não recrie o frontend do zero.
Não substitua a identidade visual sem necessidade.
Não implemente backend real nesta rodada.
Não conecte Supabase.
Não crie banco.
Não implemente autenticação real.
Não implemente IA real.
Não implemente vídeo real.
Não implemente publicação real.
Não crie integrações externas.

Sua tarefa é executar a Sprint 0 — Auditoria e Estabilização do Frontend Lovable.

Antes de qualquer alteração:
1. Localize e leia o Documento Mestre V2.1.
2. Trate esse documento como fonte oficial de verdade.
3. Audite o estado real do repositório.
4. Compare o frontend gerado pelo Lovable com o Documento Mestre V2.1.
5. Corrija apenas problemas estruturais, bloqueadores ou desalinhamentos críticos.

Objetivos:
- consolidar docs/PROJECT_MASTER.md;
- verificar build;
- verificar rotas;
- verificar contratos TypeScript;
- verificar mocks;
- verificar mock-api;
- verificar se páginas consomem services/mock-api e não mocks crus;
- verificar se dados operacionais possuem channelId;
- verificar se seletor de canal filtra contexto;
- verificar design system;
- verificar documentação;
- verificar ausência de segredos;
- verificar ausência de backend/Supabase/API externa indevida;
- gerar relatório final preciso.

Branch:
codex/sprint-0-audit-stabilize-lovable-frontend

PR:
chore: audit and stabilize Lovable frontend foundation
```

---

## 23. Regras de sprint e PR

Toda sprint deve começar com:

- branch atual;
- SHA local;
- SHA remoto;
- divergência;
- working tree;
- untracked;
- staged;
- modificados;
- escopo;
- fora de escopo.

Toda sprint deve terminar com:

- branch final;
- SHA final;
- arquivos alterados;
- migrations, se houver;
- testes executados;
- resultado;
- screenshots, se houver alteração visual;
- pendências;
- riscos;
- recomendação;
- confirmação de que nenhum segredo foi exposto.

Não misturar:

- limpeza administrativa com feature;
- design premium com backend pesado;
- IA real com fundação;
- publicação real com protótipo;
- refatoração grande com feature nova.

---

## 24. Antipadrões proibidos

- Recriar o frontend Lovable do zero sem autorização.
- Criar backend antes de auditar contratos.
- Criar a plataforma inteira em uma única solicitação.
- Criar tela bonita sem dados estruturados.
- Criar backend sem tela correspondente.
- Criar entidade operacional sem `channelId` no frontend ou `channel_id` no backend.
- Criar política global com campos de canal.
- Usar arquivo de mídia fora do storage oficial.
- Publicar sem aprovação.
- Usar automação que burle plataforma.
- Colar token ou senha em prompt.
- Considerar sprint concluída sem teste.
- Considerar frontend aprovado sem build e auditoria.
- Avançar para IA real antes de custo e modo operacional.
- Avançar para vídeo real antes de asset registry.
- Expandir canais antes de estabilizar o primeiro.

---

## 25. Indicadores de sucesso

### 25.1. Produto

- operador entende a situação em menos de 30 segundos;
- fluxo principal funciona pelo frontend;
- canais não misturam dados;
- conteúdo tem rastreabilidade;
- aprovação humana funciona;
- custos aparecem corretamente;
- conformidade bloqueia riscos.

### 25.2. Engenharia

- build passa;
- typecheck passa;
- contratos são claros;
- mocks são realistas;
- mock-api simula futura API;
- sem segredo no repositório;
- sem logs locais commitados;
- arquitetura modular;
- endpoints futuros documentados.

### 25.3. Operação

- tempo de criação de conteúdo reduzido;
- baixa taxa de retrabalho;
- custo previsível;
- aprovação em lote possível;
- falhas visíveis;
- reprocessamento seguro.

---

## 26. Conclusão

A Aralume Studio deve ser construída com menos ansiedade e mais critério.

A etapa Lovable acelerou a criação visual, mas não substitui engenharia, auditoria, contratos e governança. O próximo passo correto é estabilizar o frontend no Codex, documentar a base real e só então criar backend.

A decisão fundamental agora é:

**O frontend Lovable é a base inicial, mas o Codex deve transformá-lo em fundação confiável. O backend só começa depois que contratos, mocks, rotas e documentação estiverem auditados.**

Este documento passa a ser a fonte principal de informação do projeto a partir do estado pós-Lovable.

## 27. Modelo de entrega a partir da Sprint 11

A partir da Sprint 11, as fases amplas deste documento passam a funcionar como epicos estrategicos.

Regras normativas:

- um epico pode ser dividido em varias sprints;
- uma sprint deve entregar historias integradas e verificaveis;
- os gates existentes continuam obrigatorios;
- frontend operacional continua sendo criterio de produto;
- SDD continua obrigatorio;
- o historico das Sprints 0 a 10 permanece inalterado;
- nenhuma capacidade futura pode ser antecipada sem atualizacao documental previa.
- A Fase 12 foi materializada pela Sprint 11.
- A Sprint 12 e a primeira execucao formal do gate de Hardening/V1 Acceptance e usa a spec `docs/specs/012-v1-acceptance.md`.
- A relacao entre fase, sprint e spec deve permanecer explicitada nos documentos de roadmap, backlog, handoff e spec.
