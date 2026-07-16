# ARALUME STUDIO â€” DOCUMENTO MESTRE V2.1 PÃ“S-LOVABLE

**Documento principal do novo projeto Aralume Studio**
**VersÃ£o:** 2.1
**Status:** Fonte oficial de verdade do projeto apÃ³s criaÃ§Ã£o inicial do frontend via Lovable
**Uso obrigatÃ³rio:** Codex, GitHub, agentes de desenvolvimento, documentaÃ§Ã£o, roadmap, critÃ©rios de aceite, revisÃµes tÃ©cnicas e prompts de sprint
**RepositÃ³rio oficial:** `https://github.com/aralumemedia-lab/aralume-studio.git`
**Contexto local informado:** `C:\Users\carol\Documents\aralume-studio V2`

---

## 0. MudanÃ§a de contexto em relaÃ§Ã£o Ã  V2.0

Este documento substitui o Documento Mestre V2.0 como orientaÃ§Ã£o operacional do projeto Aralume Studio.

A V2.0 foi criada para orientar a reconstruÃ§Ã£o do projeto do zero. Depois disso, o frontend inicial foi criado via Lovable. Portanto, o plano nÃ£o comeÃ§a mais em â€œcriar o frontend do zeroâ€. O plano correto agora Ã©:

1. Preservar o frontend criado via Lovable como base inicial.
2. Auditar rigorosamente esse frontend no Codex.
3. Corrigir contratos, mocks, rotas, documentaÃ§Ã£o, estrutura e problemas de build.
4. Congelar contratos TypeScript aprovados.
5. Criar o backend no Codex seguindo exatamente os contratos do frontend.
6. Integrar tela por tela, sem refazer a plataforma inteira.

A regra central permanece: **a Aralume deve nascer como uma plataforma operacional rastreÃ¡vel, nÃ£o como apenas um gerador de vÃ­deo**.

A regra nova Ã©: **o frontend Lovable nÃ£o estÃ¡ automaticamente aprovado; ele precisa passar por auditoria e estabilizaÃ§Ã£o no Codex antes de ser considerado a base oficial do produto**.

---

## 1. PropÃ³sito deste documento

Este documento Ã© a fonte principal de informaÃ§Ã£o para conduzir a Aralume Studio a partir do estado atual: frontend inicial jÃ¡ criado via Lovable e backend ainda nÃ£o implementado.

Ele existe para impedir a repetiÃ§Ã£o dos erros do projeto anterior:

- muitas sprints sem resultado operacional claro;
- backend avanÃ§ando antes do frontend ser usÃ¡vel;
- uso excessivo de CLI como validaÃ§Ã£o de produto;
- escopo amplo demais por sprint;
- ausÃªncia de design system consolidado;
- problemas de ambiente, banco, credenciais e paths de mÃ­dia;
- ambiguidade entre entidades globais e entidades por canal;
- dificuldade de chegar a uma V1.0 demonstrÃ¡vel;
- construÃ§Ã£o de funcionalidades sem validaÃ§Ã£o visual;
- mocks e contratos frÃ¡geis ou improvisados.

A partir deste documento, qualquer agente, plataforma ou desenvolvedor deve entender:

- o que a Aralume Studio Ã©;
- o que ela nÃ£o Ã©;
- qual Ã© o estado atual do projeto;
- como tratar o frontend criado pelo Lovable;
- como auditar e estabilizar a base atual;
- quais contratos devem orientar o backend futuro;
- qual stack usar;
- como estruturar frontend e backend;
- como desenhar a experiÃªncia operacional;
- como modelar os dados;
- como implementar workflows e agentes;
- qual ordem de construÃ§Ã£o seguir;
- quais gates precisam ser cumpridos antes de avanÃ§ar;
- o que define uma V1.0 real e funcional.

---

## 2. DecisÃ£o executiva atualizada

A Aralume Studio serÃ¡ reconstruÃ­da com uma abordagem mais curta, objetiva e verificÃ¡vel.

A decisÃ£o anterior de comeÃ§ar pelo frontend foi mantida e executada parcialmente: **o frontend inicial jÃ¡ foi criado via Lovable**.

A decisÃ£o executiva atual Ã©:

- Lovable foi usado como acelerador visual e gerador inicial do frontend.
- Codex serÃ¡ o ambiente principal de auditoria, estabilizaÃ§Ã£o, backend, integraÃ§Ã£o, testes e evoluÃ§Ã£o por PRs.
- GitHub serÃ¡ a fonte de verdade do cÃ³digo.
- O frontend atual nÃ£o deve ser recriado do zero sem autorizaÃ§Ã£o.
- O backend serÃ¡ criado depois, seguindo os contratos TypeScript aprovados no frontend.
- A prÃ³xima fase obrigatÃ³ria Ã© a **Sprint 0 â€” Auditoria e EstabilizaÃ§Ã£o do Frontend Lovable**.
- Nenhum backend real serÃ¡ criado antes da Sprint 0 estar concluÃ­da.
- Nenhum banco, Drizzle, Supabase, autenticaÃ§Ã£o real, IA real, vÃ­deo real ou publicaÃ§Ã£o real deve ser implementado na Sprint 0.
- Python serÃ¡ usado apenas como worker futuro, se necessÃ¡rio, para mÃ­dia, FFmpeg, LangGraph, IA pesada ou jobs assÃ­ncronos.

O novo projeto deve ser validado por tela, por fluxo, por contrato, por build e por PR. NÃ£o basta criar arquivos. NÃ£o basta parecer bonito. NÃ£o basta compilar uma vez. O sistema precisa ser progressivamente operÃ¡vel.

---

## 3. VisÃ£o do produto

A Aralume Studio Ã© uma plataforma SaaS empresarial para operaÃ§Ã£o de uma fÃ¡brica editorial multicanal baseada em agentes de inteligÃªncia artificial.

A plataforma deverÃ¡ pesquisar oportunidades, criar pautas, organizar fontes, escrever roteiros, planejar cenas, gerar ou organizar narraÃ§Ã£o, produzir ativos visuais, montar vÃ­deos, gerar cortes, validar qualidade, validar conformidade, submeter conteÃºdos Ã  aprovaÃ§Ã£o humana, preparar publicaÃ§Ãµes, coletar mÃ©tricas e alimentar um ciclo de aprendizado editorial.

Ela deve comeÃ§ar com um canal, mas nascer preparada para mÃºltiplos canais. Cada canal terÃ¡ nicho, pÃºblico, linguagem, identidade visual, voz, regras editoriais, calendÃ¡rio, plataformas, orÃ§amento e mÃ©tricas prÃ³prias.

A infraestrutura, os agentes, o motor de workflows, o banco, o armazenamento, as validaÃ§Ãµes, a auditoria, os custos e as integraÃ§Ãµes serÃ£o compartilhados, mas os dados editoriais e operacionais devem ser isolados por canal.

A Aralume nÃ£o Ã© uma ferramenta simples para gerar vÃ­deo automÃ¡tico. O produto correto Ã© uma operaÃ§Ã£o editorial automatizada, auditÃ¡vel, segura, escalÃ¡vel, controlada por custos, supervisionada por humanos e orientada por mÃ©tricas.

---

## 4. Estado atual do projeto

### 4.1. O que jÃ¡ existe

O frontend inicial foi criado via Lovable no repositÃ³rio:

`https://github.com/aralumemedia-lab/aralume-studio.git`

Esse frontend deve conter, ou deverÃ¡ ser auditado para confirmar se contÃ©m:

- aplicaÃ§Ã£o React/TypeScript/Vite;
- identidade visual Aralume;
- layout administrativo;
- sidebar;
- topbar;
- rotas administrativas;
- Dashboard;
- Canais;
- EscritÃ³rio de Agentes;
- pÃ¡ginas para os demais mÃ³dulos;
- dados mockados;
- contratos TypeScript;
- mock-api ou camada equivalente;
- design system ou componentes visuais reutilizÃ¡veis;
- documentaÃ§Ã£o inicial, se o Lovable tiver criado.

### 4.2. O que ainda nÃ£o existe e nÃ£o deve ser inventado na Sprint 0

Na Sprint 0, ainda nÃ£o deve existir:

- backend real;
- banco real;
- Drizzle schema;
- migrations;
- Supabase;
- autenticaÃ§Ã£o real;
- IA real;
- geraÃ§Ã£o de vÃ­deo real;
- publicaÃ§Ã£o real;
- OAuth;
- integraÃ§Ã£o com plataformas externas;
- workers Python;
- renderizaÃ§Ã£o real via FFmpeg.

### 4.3. InterpretaÃ§Ã£o correta do frontend Lovable

O frontend criado pelo Lovable Ã© uma base inicial. Ele nÃ£o Ã© automaticamente a arquitetura oficial aprovada.

O Codex deve auditar:

- se compila;
- se as rotas existem;
- se os contratos estÃ£o corretos;
- se os mocks sÃ£o tipados;
- se a mock-api existe;
- se as pÃ¡ginas consomem serviÃ§os e nÃ£o mocks crus;
- se `channelId` existe em dados operacionais;
- se o seletor de canal filtra contexto;
- se a experiÃªncia visual estÃ¡ alinhada ao padrÃ£o SaaS premium;
- se nÃ£o hÃ¡ dependÃªncia indevida de Supabase, backend, autenticaÃ§Ã£o ou API externa;
- se nÃ£o hÃ¡ segredo exposto.

---

## 5. O que deu errado no projeto anterior e como bloquear agora

### 5.1. Escopo grande demais por sprint

Erro anterior: o projeto avanÃ§ou em muitas frentes ao mesmo tempo: agentes, backend, migrations, publicaÃ§Ã£o, vÃ­deo, OAuth, mÃ©tricas, conformidade, frontend e testes.

CorreÃ§Ã£o agora:

- cada sprint deve ter escopo pequeno;
- o que estÃ¡ fora do escopo deve ser declarado;
- uma sprint nÃ£o pode misturar design premium, backend, banco, IA, vÃ­deo e publicaÃ§Ã£o;
- Sprint 0 Ã© apenas auditoria e estabilizaÃ§Ã£o do frontend Lovable.

### 5.2. Backend avanÃ§ou mais que frontend

Erro anterior: o backend ficou tecnicamente denso, mas o operador nÃ£o tinha uma experiÃªncia visual equivalente para usar o sistema.

CorreÃ§Ã£o agora:

- frontend foi criado primeiro;
- backend serÃ¡ criado depois seguindo contratos do frontend;
- toda funcionalidade real futura precisa aparecer na interface ou ter motivo tÃ©cnico claro.

### 5.3. Frontend sem design system consolidado

Erro anterior: telas com densidade inadequada, colisÃ£o visual, quebra de textos longos, headers apertados e aparÃªncia abaixo do esperado.

CorreÃ§Ã£o agora:

- design system precisa ser auditado;
- componentes reutilizÃ¡veis precisam existir;
- telas premium precisam ser validadas visualmente;
- Lovable nÃ£o deve ser considerado suficiente sem revisÃ£o do Codex.

### 5.4. ValidaÃ§Ã£o por CLI em vez de produto operÃ¡vel

Erro anterior: muitos testes e comandos, mas pouca validaÃ§Ã£o operacional em tela.

CorreÃ§Ã£o agora:

- build e testes continuam obrigatÃ³rios;
- UI navegÃ¡vel Ã© critÃ©rio de produto;
- Dashboard, Canais e EscritÃ³rio de Agentes sÃ£o telas prioritÃ¡rias.

### 5.5. Problemas de ambiente, banco e credenciais

Erro anterior: atrito com PostgreSQL local, variÃ¡veis de ambiente, senhas, migrations e exposiÃ§Ã£o de segredo em texto operacional.

CorreÃ§Ã£o agora:

- `.env.example` sem segredos;
- nenhum segredo em log, prompt, documento ou cÃ³digo;
- qualquer segredo exposto deve ser rotacionado;
- banco sÃ³ entra quando a Sprint de backend/banco comeÃ§ar.

### 5.6. Ambiguidade entre global e canal

Erro anterior: confusÃ£o entre polÃ­tica global e polÃ­tica por canal.

CorreÃ§Ã£o agora:

- entidade global nÃ£o recebe `channelId`;
- entidade operacional por canal recebe `channelId`;
- contratos do frontend devem refletir essa regra;
- backend futuro deve implementar a mesma semÃ¢ntica.

### 5.7. Pipeline de mÃ­dia antes de storage maduro

Erro anterior: falha por arquivo de entrada fora do `storage_root`.

CorreÃ§Ã£o agora:

- mÃ­dia real sÃ³ depois de asset registry, storage root, jobs e validaÃ§Ã£o de paths;
- Sprint 0 nÃ£o toca em mÃ­dia real.

### 5.8. Prompt grande usado para construir tudo

Erro anterior: prompts amplos demais geraram sprints longas e difÃ­ceis de validar.

CorreÃ§Ã£o agora:

- Documento Mestre Ã© contexto e norma;
- prompts de execuÃ§Ã£o devem ser pequenos e especÃ­ficos;
- Sprint 0 tem escopo fechado.

---

## 6. PrincÃ­pios inegociÃ¡veis

1. Multicanal desde o inÃ­cio.
2. Canal como raiz operacional do conteÃºdo.
3. SeparaÃ§Ã£o entre configuraÃ§Ã£o e regra de negÃ³cio.
4. Rastreabilidade completa.
5. Auditoria de eventos e decisÃµes.
6. Controle de custos por canal, etapa e fornecedor.
7. AprovaÃ§Ã£o humana em decisÃµes de risco.
8. ConteÃºdo original como padrÃ£o.
9. Fontes rastreÃ¡veis para conteÃºdo factual.
10. IntegraÃ§Ãµes autorizadas, sem simulaÃ§Ã£o de comportamento humano.
11. Nenhuma credencial em cÃ³digo, log, prompt ou documento pÃºblico.
12. Design system antes de multiplicar novas telas.
13. Frontend operacional como critÃ©rio de produto.
14. Workers especializados somente quando a fundaÃ§Ã£o estiver madura.
15. Testes e screenshots como parte do Definition of Done.
16. Nenhuma expansÃ£o de canais antes de estabilidade do primeiro canal.
17. Nenhuma publicaÃ§Ã£o real sem conformidade, aprovaÃ§Ã£o humana e autorizaÃ§Ã£o.
18. Nenhum ativo de mÃ­dia sem origem, licenÃ§a ou geraÃ§Ã£o rastreada.
19. Nenhum workflow sem status, eventos, custo, erro e idempotÃªncia.
20. Nenhuma fase concluÃ­da sem evidÃªncias.
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
- sem backend real obrigatÃ³rio;
- sem Supabase obrigatÃ³rio;
- sem autenticaÃ§Ã£o real obrigatÃ³ria;
- sem chamadas externas obrigatÃ³rias.

### 7.2. Backend futuro

O backend serÃ¡ criado posteriormente no Codex, seguindo os contratos do frontend.

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

Python serÃ¡ permitido apenas como worker desacoplado para:

- FFmpeg;
- renderizaÃ§Ã£o;
- processamento de mÃ­dia;
- LangGraph;
- IA pesada;
- jobs assÃ­ncronos.

Python nÃ£o serÃ¡ a aplicaÃ§Ã£o principal nesta fase.

---

## 8. Estrutura de repositÃ³rio recomendada apÃ³s auditoria

A estrutura real pode variar por causa do Lovable, mas o Codex deve convergir para a separaÃ§Ã£o abaixo sempre que possÃ­vel, sem reescrever o projeto inteiro na Sprint 0.

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

Quando o backend comeÃ§ar, a estrutura recomendada serÃ¡:

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

- **AppShell:** layout global, sidebar, topbar, seletor de canal e Ã¡rea principal.
- **Pages:** composiÃ§Ã£o das telas.
- **Components:** peÃ§as reutilizÃ¡veis.
- **Contracts:** tipos e status oficiais.
- **Services:** mock-api agora; api-client real depois.
- **Mocks:** dados demo isolados.
- **Design system:** tokens, badges, cards, tabelas, Ã­cones e estados.

Regras:

- pÃ¡ginas devem consumir funÃ§Ãµes de serviÃ§o;
- pÃ¡ginas nÃ£o devem importar mocks crus diretamente;
- componentes visuais nÃ£o devem conhecer a origem dos dados;
- status devem usar tipos oficiais;
- badges devem ser padronizados;
- dados operacionais devem ter `channelId`;
- seletor de canal deve alterar o contexto visual;
- mocks nÃ£o sÃ£o lixo temporÃ¡rio; eles sÃ£o a simulaÃ§Ã£o inicial do domÃ­nio.

---

## 10. Contratos TypeScript oficiais esperados

### 10.1. Regras gerais

- Use `camelCase` no frontend.
- Todos os IDs sÃ£o `string`.
- Todas as datas sÃ£o strings ISO 8601.
- Valores monetÃ¡rios sÃ£o inteiros em centavos com sufixo `Cents`.
- DuraÃ§Ãµes sÃ£o em segundos com sufixo `Seconds`.
- Dados operacionais por canal devem conter `channelId`.
- Entidades globais nÃ£o devem conter `channelId` sem necessidade.
- O backend futuro deve respeitar esses contratos ou propor alteraÃ§Ã£o formal.

### 10.2. Status obrigatÃ³rios

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

Se esses tipos nÃ£o existirem no frontend Lovable, a Sprint 0 deve criÃ¡-los ou documentar a pendÃªncia, dependendo do impacto no build.

---

## 11. Mock API oficial

O frontend deve ter `src/services/mock-api.ts` ou equivalente.

FunÃ§Ãµes esperadas:

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
- deve retornar estrutura prÃ³xima Ã  futura API;
- deve filtrar por `channelId` quando aplicÃ¡vel;
- nÃ£o deve chamar APIs externas;
- nÃ£o deve usar segredos;
- deve facilitar substituiÃ§Ã£o por `api-client.ts` real.

---

## 12. Design system Aralume

### 12.1. Objetivo visual

O frontend deve parecer uma plataforma SaaS empresarial premium, com alta densidade de informaÃ§Ã£o, identidade prÃ³pria e leitura operacional clara.

As referÃªncias visuais usadas nas conversas devem orientar a direÃ§Ã£o de arte: sidebar limpa, cards compactos, fontes pequenas, KPIs no topo, painel lateral de detalhes, tabs compactas, Ã­cones consistentes, linhas de workflow e status visÃ­veis.

A Aralume nÃ£o deve parecer template genÃ©rico, landing page ou dashboard vazio.

### 12.2. PrincÃ­pios visuais

- Tema claro como padrÃ£o.
- Alta densidade, sem poluiÃ§Ã£o.
- Fonte pequena e legÃ­vel.
- Pouca sombra, mais borda suave.
- Azul como cor primÃ¡ria.
- Verde para OK.
- Amarelo ou laranja para alerta.
- Vermelho para bloqueio/falha.
- Roxo para handoff ou agentes especiais.
- Cinza para neutro e pausado.
- Cards compactos.
- Tabelas densas.
- Sidebar fixa e recolhÃ­vel.
- Topbar com busca, filtros e aÃ§Ã£o principal.
- Painel lateral para detalhes.
- Layout desktop responsivo.

### 12.3. Tipografia

PadrÃ£o recomendado:

- TÃ­tulo de pÃ¡gina: 22px a 26px.
- SubtÃ­tulo ou breadcrumb: 12px a 13px.
- TÃ­tulo de card: 13px a 14px.
- Texto comum: 12px a 13px.
- Labels: 10px a 12px.
- Tabelas: 11px a 12px.
- Badges: 10px a 11px.
- NÃºmeros de KPI: 20px a 28px.

### 12.4. Componentes obrigatÃ³rios

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

Se o Lovable tiver criado nomes diferentes, o Codex deve mapear equivalentes antes de renomear. Renomear por estÃ©tica Ã© proibido na Sprint 0.

### 12.5. Logo e iconografia

A marca Aralume deve transmitir:

- luz;
- clareza;
- automaÃ§Ã£o;
- controle;
- inteligÃªncia;
- operaÃ§Ã£o editorial;
- multiagentes;
- rastreabilidade;
- tecnologia premium;
- confianÃ§a empresarial.

O logo deve ter:

- sÃ­mbolo prÃ³prio;
- wordmark â€œAralumeâ€;
- versÃ£o completa para sidebar expandida;
- versÃ£o compacta para sidebar recolhida;
- boa leitura em tamanho pequeno;
- estÃ©tica SaaS premium;
- ausÃªncia de aparÃªncia infantil ou genÃ©rica.

Ãcones devem ser consistentes, com traÃ§o fino, cantos arredondados e boa leitura em 16px, 18px e 20px.

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

NÃ£o criar:

- landing page;
- pÃ¡gina pÃºblica;
- login real;
- rotas aleatÃ³rias;
- fluxos externos.

---

## 14. Telas principais

### 14.1. Dashboard

Objetivo: visÃ£o executiva e operacional.

Deve exibir:

- canais ativos;
- conteÃºdos em produÃ§Ã£o;
- conteÃºdos aguardando aprovaÃ§Ã£o;
- publicaÃ§Ãµes programadas;
- custo do mÃªs;
- falhas recentes;
- alertas de conformidade;
- produÃ§Ã£o por status;
- indicadores de audiÃªncia;
- recomendaÃ§Ãµes do agente analista.

### 14.2. Canais

Objetivo: administrar canais e entender se estÃ£o prontos para operar.

Layout recomendado:

- lista de canais Ã  esquerda;
- detalhe do canal no centro;
- painÃ©is operacionais Ã  direita.

Abas esperadas:

- VisÃ£o geral;
- Perfil editorial;
- Identidade visual;
- Voz e narraÃ§Ã£o;
- Regras editoriais;
- Plataformas;
- OrÃ§amento;
- HistÃ³rico.

A tela de Canais nÃ£o deve ser apenas CRUD. Ela deve mostrar readiness operacional.

### 14.3. EscritÃ³rio de Agentes

Objetivo: cockpit operacional da fÃ¡brica editorial.

Layout:

- KPIs no topo;
- board central com fases e agentes;
- handoffs visuais entre agentes;
- painel lateral do agente selecionado;
- tabelas inferiores com handoffs, timeline, fila e bloqueios.

O cockpit deve responder em 30 segundos:

- quem estÃ¡ trabalhando;
- em qual conteÃºdo;
- em qual etapa;
- o que foi entregue;
- o que estÃ¡ bloqueando;
- qual Ã© o prÃ³ximo agente.

### 14.4. ProduÃ§Ã£o

Deve mostrar conteÃºdos em andamento por canal, etapa, agente atual, progresso, custo acumulado, risco e prÃ³xima aÃ§Ã£o.

### 14.5. Pautas

Deve permitir visualizar oportunidades, score editorial, nicho, canal, fonte da ideia, risco e aÃ§Ãµes simuladas.

### 14.6. Pesquisas

Deve exibir sessÃµes de pesquisa, fontes, claims, confianÃ§a, divergÃªncias, risco de desatualizaÃ§Ã£o e data de acesso.

### 14.7. Roteiros

Deve exibir roteiros, versÃµes, status, duraÃ§Ã£o estimada, estrutura narrativa, CTA, ideias de cortes e histÃ³rico.

### 14.8. Ativos de MÃ­dia

Deve exibir narraÃ§Ãµes, imagens, vÃ­deos, thumbnails, trilhas, legendas, origem, licenÃ§a, prompt, modelo, status, risco e custo.

### 14.9. VÃ­deos

Deve exibir vÃ­deos principais, render status, duraÃ§Ã£o, formato, resoluÃ§Ã£o, canal, roteiro vinculado, custo, qualidade e conformidade.

### 14.10. Cortes

Deve exibir cortes derivados, vÃ­deo-mÃ£e, gancho, duraÃ§Ã£o, plataforma sugerida, status, risco e potencial.

### 14.11. AprovaÃ§Ãµes

Deve exibir fila de aprovaÃ§Ã£o, canal, conteÃºdo, roteiro, fontes, vÃ­deo/corte, custo, risco, alertas, recomendaÃ§Ã£o dos agentes e aÃ§Ãµes simuladas.

### 14.12. PublicaÃ§Ãµes

Deve exibir calendÃ¡rio ou fila, plataforma, status, canal, conteÃºdo, data planejada, tipo e alertas de token/conexÃ£o, sem publicaÃ§Ã£o real.

### 14.13. MÃ©tricas

Deve exibir visÃ£o por canal, vÃ­deo, tema, retenÃ§Ã£o, views, alcance, comentÃ¡rios, compartilhamentos, seguidores e recomendaÃ§Ãµes editoriais mockadas.

### 14.14. Custos

Deve exibir custo por canal, etapa, fornecedor, mÃªs, orÃ§amento, limites, alertas e custo por conteÃºdo.

### 14.15. Conformidade

Deve exibir alertas, bloqueios, riscos, conteÃºdos reprovados, claims sem fonte, uso de terceiros, tema proibido e necessidade de revisÃ£o humana.

### 14.16. AdministraÃ§Ã£o

Deve exibir usuÃ¡rios mockados, perfis, permissÃµes, integraÃ§Ãµes futuras, provedores futuros, modos operacionais e configuraÃ§Ãµes globais, sem autenticaÃ§Ã£o real.

### 14.17. Logs e Auditoria

Deve exibir eventos, ator, canal, workflow, agente, aÃ§Ã£o, timestamp, status, erro, custo e metadados.

---

## 15. Modelo de dados futuro do backend

### 15.1. Regra de `channel_id`

- Entidades editoriais e operacionais terÃ£o `channel_id`.
- Entidades globais de configuraÃ§Ã£o da plataforma nÃ£o terÃ£o `channel_id`.
- Entidades globais e por canal devem ser separadas quando tiverem semÃ¢ntica diferente.

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

Quando o backend comeÃ§ar, a fase inicial deve conter:

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

NÃ£o criar todas as tabelas da V1.0 em uma Ãºnica sprint sem necessidade.

---

## 16. Workflows e agentes

### 16.1. Agentes esperados

- InteligÃªncia de Nicho;
- Pesquisador;
- Editorial;
- Roteirista;
- DireÃ§Ã£o Visual;
- NarraÃ§Ã£o;
- ProduÃ§Ã£o Visual;
- Editor de VÃ­deo;
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
9. Gerar ou registrar narraÃ§Ã£o.
10. Gerar ou registrar ativos visuais.
11. Montar vÃ­deo principal.
12. Gerar cortes.
13. Validar qualidade.
14. Validar conformidade.
15. Solicitar aprovaÃ§Ã£o humana.
16. Preparar publicaÃ§Ã£o.
17. Publicar ou gerar rascunho autorizado.
18. Coletar mÃ©tricas.
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

## 17. SeguranÃ§a, credenciais e conformidade

Regras obrigatÃ³rias:

- nunca commitar `.env`;
- nunca imprimir token;
- nunca colar senha em prompt;
- nunca registrar segredo em audit log;
- usar `.env.example`;
- mascarar valores sensÃ­veis;
- rotacionar segredo exposto;
- nÃ£o publicar conteÃºdo sem aprovaÃ§Ã£o;
- nÃ£o usar automaÃ§Ã£o que burle plataformas;
- nÃ£o copiar e republicar conteÃºdo de terceiros sem direito;
- conteÃºdo factual precisa de fonte;
- conteÃºdo bloqueado nÃ£o publica.

---

## 18. MÃ­dia, storage e renderizaÃ§Ã£o

Esta seÃ§Ã£o Ã© futura. NÃ£o deve ser implementada na Sprint 0.

Regras futuras:

- todo ativo deve ser registrado antes de uso;
- renderizador sÃ³ pode usar arquivos dentro do storage root autorizado;
- caminhos externos devem ser rejeitados;
- todo render deve ser job;
- todo render deve registrar entrada, saÃ­da, comando, logs, status, erro e duraÃ§Ã£o.

---

## 19. Testes e validaÃ§Ã£o

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

### 19.2. QA visual obrigatÃ³rio

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
- status crÃ­tico;
- sem overflow horizontal;
- sem sobreposiÃ§Ã£o;
- sem botÃ£o quebrado;
- sem texto ilegÃ­vel.

Na Sprint 0, se screenshots nÃ£o forem possÃ­veis, registrar pendÃªncia formal.

---

## 20. Ordem atualizada de construÃ§Ã£o atÃ© a V1.0

Nota operacional atualizada:

- A Sprint 8 foi encerrada em Media Assets and Storage.
- A Sprint 9 foi encerrada e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- A Sprint 10 foi encerrada e integrada ao `main` via PR #17.
- As fases abaixo continuam como roadmap conceitual e nao precisam coincidir numericamente com a sequencia operacional das sprints entregues.

### Fase 0 â€” Documento Mestre e contexto oficial

**Status:** concluÃ­da parcialmente.

Entregas:

- Documento Mestre V2 criado;
- Documento Mestre V2.1 pÃ³s-Lovable criado;
- visÃ£o consolidada;
- erros do projeto anterior documentados;
- estratÃ©gia de frontend primeiro definida;
- backend futuro no Codex definido.

PendÃªncia:

- consolidar este documento no repositÃ³rio como `docs/PROJECT_MASTER.md`.

### Fase 1 â€” Frontend Lovable criado

**Status:** criado fora do Codex.

Entregas esperadas:

- AppShell;
- sidebar;
- topbar;
- logo Aralume;
- rotas principais;
- Dashboard;
- Canais;
- EscritÃ³rio de Agentes;
- pÃ¡ginas administrativas;
- mocks;
- contratos TypeScript;
- mock-api;
- design system;
- documentaÃ§Ã£o inicial.

Gate:

- sÃ³ serÃ¡ aprovada apÃ³s auditoria do Codex.

### Fase 1.1 â€” Sprint 0: Auditoria e estabilizaÃ§Ã£o do frontend Lovable

**PrÃ³xima fase obrigatÃ³ria.**

Objetivo:

- auditar e estabilizar o frontend gerado pelo Lovable.

Escopo:

- verificar build;
- verificar rotas;
- verificar contratos;
- verificar mocks;
- verificar mock-api;
- verificar design system;
- verificar pÃ¡ginas;
- verificar `channelId`;
- verificar seletor de canal;
- verificar ausÃªncia de backend real indevido;
- verificar ausÃªncia de Supabase obrigatÃ³rio;
- verificar ausÃªncia de segredos;
- criar/atualizar documentaÃ§Ã£o;
- abrir PR.

Fora do escopo:

- backend real;
- banco;
- autenticaÃ§Ã£o;
- IA real;
- publicaÃ§Ã£o real;
- vÃ­deo real;
- integraÃ§Ãµes externas.

Gate:

- frontend compila ou erros estÃ£o documentados;
- rotas principais existem;
- contratos e mocks auditados;
- documentaÃ§Ã£o mÃ­nima criada;
- nenhum backend real criado;
- PR aberto.

### Fase 2 â€” Backend Foundation

Objetivo:

- criar backend inicial seguindo contratos aprovados do frontend.

Entregas:

- Express;
- Drizzle;
- PostgreSQL;
- Zod;
- health check;
- padrÃ£o de erro;
- migrations iniciais;
- seed demo;
- endpoints base.

Gate:

- backend sobe;
- migrations aplicam em banco limpo;
- health check responde;
- contratos compatÃ­veis com frontend.

### Fase 3 â€” Canais reais

Objetivo:

- substituir mocks de canais por API real.

Entregas:

- CRUD real de canais;
- channel settings;
- regras editoriais;
- orÃ§amento;
- integraÃ§Ã£o da tela Canais com backend.

Gate:

- criar dois canais reais;
- comprovar isolamento de dados por canal.

### Fase 4 â€” Dashboard real inicial

Objetivo:

- conectar Dashboard a dados reais de canais, custos, workflows e aprovaÃ§Ãµes iniciais.

### Fase 5 â€” EscritÃ³rio de Agentes persistido

Objetivo:

- persistir `agent_definitions`, `workflow_runs`, `agent_runs` e `agent_handoffs`.

Gate:

- iniciar workflow demo e ver handoff no frontend.

### Fase 6 â€” Pipeline Editorial

Objetivo:

- pauta, pesquisa, fonte, claim, roteiro e versÃµes.

Gate:

- criar pauta, registrar fonte, criar roteiro versionado e enviar para aprovaÃ§Ã£o.

### Fase 7 â€” AprovaÃ§Ã£o, Qualidade e Conformidade

Objetivo:

- bloquear riscos antes de mÃ­dia real.

Gate:

- conteÃºdo com risco alto fica bloqueado atÃ© decisÃ£o humana.

### Fase 8 â€” Custos e Modos Operacionais

Objetivo:

- governar execuÃ§Ã£o real.

Gate:

- modo demo bloqueia IA real e publicaÃ§Ã£o real.

### Fase 9 â€” Ativos de MÃ­dia

Objetivo:

- registrar mÃ­dia corretamente.

Gate:

- todo ativo usado por conteÃºdo tem origem e URI interna vÃ¡lida.

### Fase 10 â€” RenderizaÃ§Ã£o Controlada

**Status:** concluÃ­da.

Objetivo:

- gerar vÃ­deo demo reproduzÃ­vel.

Gate:

- renderizar vÃ­deo curto de teste com logs e validaÃ§Ã£o.

### Fase 11 â€” Cortes

**Status:** em andamento.

Objetivo:

- gerar e rastrear derivados.

Gate:

- gerar pelo menos um corte vinculado ao vÃ­deo principal.

### Fase 12 â€” PublicaÃ§Ã£o Assistida

**Status:** materializada na Sprint 11 e encerrada.

Objetivo:

- preparar publicaÃ§Ã£o sem risco externo.

Gate:

- pacote de publicaÃ§Ã£o pronto, sem envio externo automÃ¡tico.

### Fase 13 â€” IntegraÃ§Ãµes Reais Autorizadas

Objetivo:

- conectar provedores com governanÃ§a.

Sprint alvo:

- Sprint 12.

Gate:

- integraÃ§Ã£o oficial funcionando sem expor segredo.

### Fase 14 â€” MÃ©tricas e Aprendizado

Objetivo:

- fechar ciclo editorial.

Sprint alvo:

- Sprint 13.

Gate:

- mÃ©tricas geram recomendaÃ§Ã£o editorial por canal.

### Fase 15 â€” Hardening V1.0

**Status:** planejada.

Objetivo:

- transformar MVP em V1.0 funcional.

Sprint alvo:

- Sprint 14.

Gate:

- demonstraÃ§Ã£o ponta a ponta pelo frontend;
- aceite binÃ¡rio documentado como V1.0 aceita ou V1.0 nÃ£o aceita na Sprint 14;
- esta fase Ã© validada pela Sprint 14 e pela spec `docs/specs/012-v1-acceptance.md`, sem reclassificar a Fase 12 historica.

### Mapa de identificadores

- **Fase do roadmap do produto**: linha histÃ³rica de capacidade do produto no Documento Mestre.
- **Sprint de execuÃ§Ã£o**: unidade sequencial de entrega, integraÃ§Ã£o e validaÃ§Ã£o.
- **Spec**: contrato normativo que governa a execuÃ§Ã£o da sprint.
- Os identificadores podem divergir numericamente.
- A Fase 12 do roadmap materializou-se na Sprint 11 e permanece encerrada.
- A Sprint 12 materializa o E13 - Integracoes Reais Autorizadas e e regida pela spec `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 13 materializa o E14 - Metricas e Aprendizado e e regida pela spec `docs/specs/014-metrics-learning.md`.
- A Sprint 14 formaliza o gate de Hardening/V1 Acceptance da V1.0 e e regida pela spec `docs/specs/012-v1-acceptance.md`.
- A relacao entre fase, sprint e spec deve permanecer explicitada.

---

## 21. V1.0 â€” critÃ©rios obrigatÃ³rios

A V1.0 existe quando um operador consegue:

1. Criar ou selecionar canal.
2. Configurar perfil editorial.
3. Criar pauta.
4. Registrar pesquisa e fontes.
5. Criar roteiro versionado.
6. Planejar cenas.
7. Registrar narraÃ§Ã£o ou gerar narraÃ§Ã£o autorizada.
8. Registrar ativos visuais.
9. Renderizar vÃ­deo demo ou real controlado.
10. Gerar pelo menos um corte.
11. Validar qualidade.
12. Validar conformidade.
13. Submeter Ã  aprovaÃ§Ã£o humana.
14. Preparar publicaÃ§Ã£o ou rascunho.
15. Registrar custos.
16. Registrar mÃ©tricas.
17. Gerar recomendaÃ§Ã£o editorial.
18. Ver todo o histÃ³rico no frontend.

NÃ£o Ã© V1.0 se:

- sÃ³ funciona por CLI;
- sÃ³ tem backend;
- sÃ³ tem mock visual;
- nÃ£o tem canal real;
- nÃ£o tem aprovaÃ§Ã£o humana;
- nÃ£o tem rastreabilidade;
- nÃ£o tem controle de custo;
- nÃ£o tem validaÃ§Ã£o visual;
- nÃ£o tem fluxo ponta a ponta.

---

A decisÃ£o final de V1.0 Ã© binÃ¡ria: V1.0 aceita ou V1.0 nÃ£o aceita.

## 22. Sprint 0 â€” Prompt normativo para Codex

Use este prompt para a primeira rodada do Codex apÃ³s o frontend Lovable:

```text
VocÃª atuarÃ¡ como engenheiro de software sÃªnior e guardiÃ£o tÃ©cnico da Aralume Studio.

RepositÃ³rio:
https://github.com/aralumemedia-lab/aralume-studio.git

Contexto obrigatÃ³rio:
O frontend inicial da Aralume Studio jÃ¡ foi criado via Lovable.

NÃ£o recrie o frontend do zero.
NÃ£o substitua a identidade visual sem necessidade.
NÃ£o implemente backend real nesta rodada.
NÃ£o conecte Supabase.
NÃ£o crie banco.
NÃ£o implemente autenticaÃ§Ã£o real.
NÃ£o implemente IA real.
NÃ£o implemente vÃ­deo real.
NÃ£o implemente publicaÃ§Ã£o real.
NÃ£o crie integraÃ§Ãµes externas.

Sua tarefa Ã© executar a Sprint 0 â€” Auditoria e EstabilizaÃ§Ã£o do Frontend Lovable.

Antes de qualquer alteraÃ§Ã£o:
1. Localize e leia o Documento Mestre V2.1.
2. Trate esse documento como fonte oficial de verdade.
3. Audite o estado real do repositÃ³rio.
4. Compare o frontend gerado pelo Lovable com o Documento Mestre V2.1.
5. Corrija apenas problemas estruturais, bloqueadores ou desalinhamentos crÃ­ticos.

Objetivos:
- consolidar docs/PROJECT_MASTER.md;
- verificar build;
- verificar rotas;
- verificar contratos TypeScript;
- verificar mocks;
- verificar mock-api;
- verificar se pÃ¡ginas consomem services/mock-api e nÃ£o mocks crus;
- verificar se dados operacionais possuem channelId;
- verificar se seletor de canal filtra contexto;
- verificar design system;
- verificar documentaÃ§Ã£o;
- verificar ausÃªncia de segredos;
- verificar ausÃªncia de backend/Supabase/API externa indevida;
- gerar relatÃ³rio final preciso.

Branch:
codex/sprint-0-audit-stabilize-lovable-frontend

PR:
chore: audit and stabilize Lovable frontend foundation
```

---

## 23. Regras de sprint e PR

Toda sprint deve comeÃ§ar com:

- branch atual;
- SHA local;
- SHA remoto;
- divergÃªncia;
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
- screenshots, se houver alteraÃ§Ã£o visual;
- pendÃªncias;
- riscos;
- recomendaÃ§Ã£o;
- confirmaÃ§Ã£o de que nenhum segredo foi exposto.

NÃ£o misturar:

- limpeza administrativa com feature;
- design premium com backend pesado;
- IA real com fundaÃ§Ã£o;
- publicaÃ§Ã£o real com protÃ³tipo;
- refatoraÃ§Ã£o grande com feature nova.

---

## 24. AntipadrÃµes proibidos

- Recriar o frontend Lovable do zero sem autorizaÃ§Ã£o.
- Criar backend antes de auditar contratos.
- Criar a plataforma inteira em uma Ãºnica solicitaÃ§Ã£o.
- Criar tela bonita sem dados estruturados.
- Criar backend sem tela correspondente.
- Criar entidade operacional sem `channelId` no frontend ou `channel_id` no backend.
- Criar polÃ­tica global com campos de canal.
- Usar arquivo de mÃ­dia fora do storage oficial.
- Publicar sem aprovaÃ§Ã£o.
- Usar automaÃ§Ã£o que burle plataforma.
- Colar token ou senha em prompt.
- Considerar sprint concluÃ­da sem teste.
- Considerar frontend aprovado sem build e auditoria.
- AvanÃ§ar para IA real antes de custo e modo operacional.
- AvanÃ§ar para vÃ­deo real antes de asset registry.
- Expandir canais antes de estabilizar o primeiro.

---

## 25. Indicadores de sucesso

### 25.1. Produto

- operador entende a situaÃ§Ã£o em menos de 30 segundos;
- fluxo principal funciona pelo frontend;
- canais nÃ£o misturam dados;
- conteÃºdo tem rastreabilidade;
- aprovaÃ§Ã£o humana funciona;
- custos aparecem corretamente;
- conformidade bloqueia riscos.

### 25.2. Engenharia

- build passa;
- typecheck passa;
- contratos sÃ£o claros;
- mocks sÃ£o realistas;
- mock-api simula futura API;
- sem segredo no repositÃ³rio;
- sem logs locais commitados;
- arquitetura modular;
- endpoints futuros documentados.

### 25.3. OperaÃ§Ã£o

- tempo de criaÃ§Ã£o de conteÃºdo reduzido;
- baixa taxa de retrabalho;
- custo previsÃ­vel;
- aprovaÃ§Ã£o em lote possÃ­vel;
- falhas visÃ­veis;
- reprocessamento seguro.

---

## 26. ConclusÃ£o

A Aralume Studio deve ser construÃ­da com menos ansiedade e mais critÃ©rio.

A etapa Lovable acelerou a criaÃ§Ã£o visual, mas nÃ£o substitui engenharia, auditoria, contratos e governanÃ§a. O prÃ³ximo passo correto Ã© estabilizar o frontend no Codex, documentar a base real e sÃ³ entÃ£o criar backend.

A decisÃ£o fundamental agora Ã©:

**O frontend Lovable Ã© a base inicial, mas o Codex deve transformÃ¡-lo em fundaÃ§Ã£o confiÃ¡vel. O backend sÃ³ comeÃ§a depois que contratos, mocks, rotas e documentaÃ§Ã£o estiverem auditados.**

Este documento passa a ser a fonte principal de informaÃ§Ã£o do projeto a partir do estado pÃ³s-Lovable.

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
- A Sprint 12 corresponde ao E13 e usa a spec `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 13 corresponde ao E14 e usa a spec `docs/specs/014-metrics-learning.md`.
- A Sprint 14 corresponde ao E15 / V1 Acceptance e usa a spec `docs/specs/012-v1-acceptance.md`.
- A relacao entre fase, sprint e spec deve permanecer explicitada nos documentos de roadmap, backlog, handoff e spec.
- A decisao documental fechada do E13 aprova apenas YouTube como integracao externa da Sprint 12, com OAuth 2.0 oficial da Google para autorizacao.
- TikTok, Instagram e LinkedIn permanecem fora da aprovacao do E13 ate nova decisao formal.

## 28. Remediacao V1 apos a Sprint 14

### Sequencia consolidada

| Ordem | Epic | Escopo principal | Resultado |
| --- | --- | --- | --- |
| Sprint 15 | E16 - Pipeline Editorial Operavel pelo Frontend | V1-02 a V1-04 | perfil editorial, pautas, pesquisa, fontes e claims operaveis no frontend |
| Sprint 16 (planejada) | E16 - Pipeline Editorial Operavel pelo Frontend | V1-05 a V1-06 | roteiro versionado e plano visual com cenas operaveis no frontend |
| Sprint proposta B | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-07 a V1-10 | narracao, ativos, render e cortes operaveis no frontend |
| Sprint proposta C | E18 - Governanca e Publicacao Assistida pelo Frontend | V1-11 a V1-14 | qualidade, compliance, aprovacao e publicacao assistida operaveis no frontend |
| Sprint proposta D | E19 - Cockpits Reais e Evidencias Transversais | R14-T01, R14-T02 | dashboard e escritorio de agentes reais, mais evidencias reutilizaveis |
| Gate final | R14-REACCEPT | V1-01..V1-18 | novo V1 Acceptance com prova nova no mesmo head |

### Mapa de remediacao

| CritÃ©rio V1 | R14 | Epic | Sprint sugerida |
| --- | --- | --- | --- |
| V1-02 | R14-02 | E16 | Sprint 15 |
| V1-03 | R14-03 | E16 | Sprint 15 |
| V1-04 | R14-04 | E16 | Sprint 15 |
| V1-05 | R14-05 | E16 | Sprint 16 |
| V1-06 | R14-06 | E16 | Sprint 16 |
| V1-07 | R14-07 | E17 | Sprint proposta B |
| V1-08 | R14-08 | E17 | Sprint proposta B |
| V1-09 | R14-09 | E17 | Sprint proposta B |
| V1-10 | R14-10 | E17 | Sprint proposta B |
| V1-11 | R14-11 | E18 | Sprint proposta C |
| V1-12 | R14-12 | E18 | Sprint proposta C |
| V1-13 | R14-13 | E18 | Sprint proposta C |
| V1-14 | R14-14 | E18 | Sprint proposta C |
| Dashboard real | R14-T01 | E19 | Sprint proposta D |
| Escritorio de Agentes real | R14-T02 | E19 | Sprint proposta D |

### R14-REACCEPT

- Gate final somente depois de E16, E17, E18 e E19 evidenciados.
- O reaceite usa a mesma matriz de 18 criterios com evidencia nova no mesmo head.
- Nenhuma remediacao funcional comeca sem a documentacao desta sequencia.
