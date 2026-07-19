# ARALUME STUDIO Ã¢â‚¬â€ DOCUMENTO MESTRE V2.1 PÃƒâ€œS-LOVABLE

**Documento principal do novo projeto Aralume Studio**
**VersÃƒÂ£o:** 2.1
**Status:** Fonte oficial de verdade do projeto apÃƒÂ³s criaÃƒÂ§ÃƒÂ£o inicial do frontend via Lovable
**Uso obrigatÃƒÂ³rio:** Codex, GitHub, agentes de desenvolvimento, documentaÃƒÂ§ÃƒÂ£o, roadmap, critÃƒÂ©rios de aceite, revisÃƒÂµes tÃƒÂ©cnicas e prompts de sprint
**RepositÃƒÂ³rio oficial:** `https://github.com/aralumemedia-lab/aralume-studio.git`
**Contexto local informado:** `C:\Users\carol\Documents\aralume-studio V2`

---

## 0. MudanÃƒÂ§a de contexto em relaÃƒÂ§ÃƒÂ£o ÃƒÂ  V2.0

Este documento substitui o Documento Mestre V2.0 como orientaÃƒÂ§ÃƒÂ£o operacional do projeto Aralume Studio.

A V2.0 foi criada para orientar a reconstruÃƒÂ§ÃƒÂ£o do projeto do zero. Depois disso, o frontend inicial foi criado via Lovable. Portanto, o plano nÃƒÂ£o comeÃƒÂ§a mais em Ã¢â‚¬Å“criar o frontend do zeroÃ¢â‚¬Â. O plano correto agora ÃƒÂ©:

1. Preservar o frontend criado via Lovable como base inicial.
2. Auditar rigorosamente esse frontend no Codex.
3. Corrigir contratos, mocks, rotas, documentaÃƒÂ§ÃƒÂ£o, estrutura e problemas de build.
4. Congelar contratos TypeScript aprovados.
5. Criar o backend no Codex seguindo exatamente os contratos do frontend.
6. Integrar tela por tela, sem refazer a plataforma inteira.

A regra central permanece: **a Aralume deve nascer como uma plataforma operacional rastreÃƒÂ¡vel, nÃƒÂ£o como apenas um gerador de vÃƒÂ­deo**.

A regra nova ÃƒÂ©: **o frontend Lovable nÃƒÂ£o estÃƒÂ¡ automaticamente aprovado; ele precisa passar por auditoria e estabilizaÃƒÂ§ÃƒÂ£o no Codex antes de ser considerado a base oficial do produto**.

---

## 1. PropÃƒÂ³sito deste documento

Este documento ÃƒÂ© a fonte principal de informaÃƒÂ§ÃƒÂ£o para conduzir a Aralume Studio a partir do estado atual: frontend inicial jÃƒÂ¡ criado via Lovable e backend ainda nÃƒÂ£o implementado.

Ele existe para impedir a repetiÃƒÂ§ÃƒÂ£o dos erros do projeto anterior:

- muitas sprints sem resultado operacional claro;
- backend avanÃƒÂ§ando antes do frontend ser usÃƒÂ¡vel;
- uso excessivo de CLI como validaÃƒÂ§ÃƒÂ£o de produto;
- escopo amplo demais por sprint;
- ausÃƒÂªncia de design system consolidado;
- problemas de ambiente, banco, credenciais e paths de mÃƒÂ­dia;
- ambiguidade entre entidades globais e entidades por canal;
- dificuldade de chegar a uma V1.0 demonstrÃƒÂ¡vel;
- construÃƒÂ§ÃƒÂ£o de funcionalidades sem validaÃƒÂ§ÃƒÂ£o visual;
- mocks e contratos frÃƒÂ¡geis ou improvisados.

A partir deste documento, qualquer agente, plataforma ou desenvolvedor deve entender:

- o que a Aralume Studio ÃƒÂ©;
- o que ela nÃƒÂ£o ÃƒÂ©;
- qual ÃƒÂ© o estado atual do projeto;
- como tratar o frontend criado pelo Lovable;
- como auditar e estabilizar a base atual;
- quais contratos devem orientar o backend futuro;
- qual stack usar;
- como estruturar frontend e backend;
- como desenhar a experiÃƒÂªncia operacional;
- como modelar os dados;
- como implementar workflows e agentes;
- qual ordem de construÃƒÂ§ÃƒÂ£o seguir;
- quais gates precisam ser cumpridos antes de avanÃƒÂ§ar;
- o que define uma V1.0 real e funcional.

---

## 2. DecisÃƒÂ£o executiva atualizada

A Aralume Studio serÃƒÂ¡ reconstruÃƒÂ­da com uma abordagem mais curta, objetiva e verificÃƒÂ¡vel.

A decisÃƒÂ£o anterior de comeÃƒÂ§ar pelo frontend foi mantida e executada parcialmente: **o frontend inicial jÃƒÂ¡ foi criado via Lovable**.

A decisÃƒÂ£o executiva atual ÃƒÂ©:

- Lovable foi usado como acelerador visual e gerador inicial do frontend.
- Codex serÃƒÂ¡ o ambiente principal de auditoria, estabilizaÃƒÂ§ÃƒÂ£o, backend, integraÃƒÂ§ÃƒÂ£o, testes e evoluÃƒÂ§ÃƒÂ£o por PRs.
- GitHub serÃƒÂ¡ a fonte de verdade do cÃƒÂ³digo.
- O frontend atual nÃƒÂ£o deve ser recriado do zero sem autorizaÃƒÂ§ÃƒÂ£o.
- O backend serÃƒÂ¡ criado depois, seguindo os contratos TypeScript aprovados no frontend.
- A prÃƒÂ³xima fase obrigatÃƒÂ³ria ÃƒÂ© a **Sprint 0 Ã¢â‚¬â€ Auditoria e EstabilizaÃƒÂ§ÃƒÂ£o do Frontend Lovable**.
- Nenhum backend real serÃƒÂ¡ criado antes da Sprint 0 estar concluÃƒÂ­da.
- Nenhum banco, Drizzle, Supabase, autenticaÃƒÂ§ÃƒÂ£o real, IA real, vÃƒÂ­deo real ou publicaÃƒÂ§ÃƒÂ£o real deve ser implementado na Sprint 0.
- Python serÃƒÂ¡ usado apenas como worker futuro, se necessÃƒÂ¡rio, para mÃƒÂ­dia, FFmpeg, LangGraph, IA pesada ou jobs assÃƒÂ­ncronos.

O novo projeto deve ser validado por tela, por fluxo, por contrato, por build e por PR. NÃƒÂ£o basta criar arquivos. NÃƒÂ£o basta parecer bonito. NÃƒÂ£o basta compilar uma vez. O sistema precisa ser progressivamente operÃƒÂ¡vel.

---

## 3. VisÃƒÂ£o do produto

A Aralume Studio ÃƒÂ© uma plataforma SaaS empresarial para operaÃƒÂ§ÃƒÂ£o de uma fÃƒÂ¡brica editorial multicanal baseada em agentes de inteligÃƒÂªncia artificial.

A plataforma deverÃƒÂ¡ pesquisar oportunidades, criar pautas, organizar fontes, escrever roteiros, planejar cenas, gerar ou organizar narraÃƒÂ§ÃƒÂ£o, produzir ativos visuais, montar vÃƒÂ­deos, gerar cortes, validar qualidade, validar conformidade, submeter conteÃƒÂºdos ÃƒÂ  aprovaÃƒÂ§ÃƒÂ£o humana, preparar publicaÃƒÂ§ÃƒÂµes, coletar mÃƒÂ©tricas e alimentar um ciclo de aprendizado editorial.

Ela deve comeÃƒÂ§ar com um canal, mas nascer preparada para mÃƒÂºltiplos canais. Cada canal terÃƒÂ¡ nicho, pÃƒÂºblico, linguagem, identidade visual, voz, regras editoriais, calendÃƒÂ¡rio, plataformas, orÃƒÂ§amento e mÃƒÂ©tricas prÃƒÂ³prias.

A infraestrutura, os agentes, o motor de workflows, o banco, o armazenamento, as validaÃƒÂ§ÃƒÂµes, a auditoria, os custos e as integraÃƒÂ§ÃƒÂµes serÃƒÂ£o compartilhados, mas os dados editoriais e operacionais devem ser isolados por canal.

A Aralume nÃƒÂ£o ÃƒÂ© uma ferramenta simples para gerar vÃƒÂ­deo automÃƒÂ¡tico. O produto correto ÃƒÂ© uma operaÃƒÂ§ÃƒÂ£o editorial automatizada, auditÃƒÂ¡vel, segura, escalÃƒÂ¡vel, controlada por custos, supervisionada por humanos e orientada por mÃƒÂ©tricas.

---

## 4. Estado atual do projeto

### 4.1. O que jÃƒÂ¡ existe

O frontend inicial foi criado via Lovable no repositÃƒÂ³rio:

`https://github.com/aralumemedia-lab/aralume-studio.git`

Esse frontend deve conter, ou deverÃƒÂ¡ ser auditado para confirmar se contÃƒÂ©m:

- aplicaÃƒÂ§ÃƒÂ£o React/TypeScript/Vite;
- identidade visual Aralume;
- layout administrativo;
- sidebar;
- topbar;
- rotas administrativas;
- Dashboard;
- Canais;
- EscritÃƒÂ³rio de Agentes;
- pÃƒÂ¡ginas para os demais mÃƒÂ³dulos;
- dados mockados;
- contratos TypeScript;
- mock-api ou camada equivalente;
- design system ou componentes visuais reutilizÃƒÂ¡veis;
- documentaÃƒÂ§ÃƒÂ£o inicial, se o Lovable tiver criado.

### 4.2. O que ainda nÃƒÂ£o existe e nÃƒÂ£o deve ser inventado na Sprint 0

Na Sprint 0, ainda nÃƒÂ£o deve existir:

- backend real;
- banco real;
- Drizzle schema;
- migrations;
- Supabase;
- autenticaÃƒÂ§ÃƒÂ£o real;
- IA real;
- geraÃƒÂ§ÃƒÂ£o de vÃƒÂ­deo real;
- publicaÃƒÂ§ÃƒÂ£o real;
- OAuth;
- integraÃƒÂ§ÃƒÂ£o com plataformas externas;
- workers Python;
- renderizaÃƒÂ§ÃƒÂ£o real via FFmpeg.

### 4.3. InterpretaÃƒÂ§ÃƒÂ£o correta do frontend Lovable

O frontend criado pelo Lovable ÃƒÂ© uma base inicial. Ele nÃƒÂ£o ÃƒÂ© automaticamente a arquitetura oficial aprovada.

O Codex deve auditar:

- se compila;
- se as rotas existem;
- se os contratos estÃƒÂ£o corretos;
- se os mocks sÃƒÂ£o tipados;
- se a mock-api existe;
- se as pÃƒÂ¡ginas consomem serviÃƒÂ§os e nÃƒÂ£o mocks crus;
- se `channelId` existe em dados operacionais;
- se o seletor de canal filtra contexto;
- se a experiÃƒÂªncia visual estÃƒÂ¡ alinhada ao padrÃƒÂ£o SaaS premium;
- se nÃƒÂ£o hÃƒÂ¡ dependÃƒÂªncia indevida de Supabase, backend, autenticaÃƒÂ§ÃƒÂ£o ou API externa;
- se nÃƒÂ£o hÃƒÂ¡ segredo exposto.

---

## 5. O que deu errado no projeto anterior e como bloquear agora

### 5.1. Escopo grande demais por sprint

Erro anterior: o projeto avanÃƒÂ§ou em muitas frentes ao mesmo tempo: agentes, backend, migrations, publicaÃƒÂ§ÃƒÂ£o, vÃƒÂ­deo, OAuth, mÃƒÂ©tricas, conformidade, frontend e testes.

CorreÃƒÂ§ÃƒÂ£o agora:

- cada sprint deve ter escopo pequeno;
- o que estÃƒÂ¡ fora do escopo deve ser declarado;
- uma sprint nÃƒÂ£o pode misturar design premium, backend, banco, IA, vÃƒÂ­deo e publicaÃƒÂ§ÃƒÂ£o;
- Sprint 0 ÃƒÂ© apenas auditoria e estabilizaÃƒÂ§ÃƒÂ£o do frontend Lovable.

### 5.2. Backend avanÃƒÂ§ou mais que frontend

Erro anterior: o backend ficou tecnicamente denso, mas o operador nÃƒÂ£o tinha uma experiÃƒÂªncia visual equivalente para usar o sistema.

CorreÃƒÂ§ÃƒÂ£o agora:

- frontend foi criado primeiro;
- backend serÃƒÂ¡ criado depois seguindo contratos do frontend;
- toda funcionalidade real futura precisa aparecer na interface ou ter motivo tÃƒÂ©cnico claro.

### 5.3. Frontend sem design system consolidado

Erro anterior: telas com densidade inadequada, colisÃƒÂ£o visual, quebra de textos longos, headers apertados e aparÃƒÂªncia abaixo do esperado.

CorreÃƒÂ§ÃƒÂ£o agora:

- design system precisa ser auditado;
- componentes reutilizÃƒÂ¡veis precisam existir;
- telas premium precisam ser validadas visualmente;
- Lovable nÃƒÂ£o deve ser considerado suficiente sem revisÃƒÂ£o do Codex.

### 5.4. ValidaÃƒÂ§ÃƒÂ£o por CLI em vez de produto operÃƒÂ¡vel

Erro anterior: muitos testes e comandos, mas pouca validaÃƒÂ§ÃƒÂ£o operacional em tela.

CorreÃƒÂ§ÃƒÂ£o agora:

- build e testes continuam obrigatÃƒÂ³rios;
- UI navegÃƒÂ¡vel ÃƒÂ© critÃƒÂ©rio de produto;
- Dashboard, Canais e EscritÃƒÂ³rio de Agentes sÃƒÂ£o telas prioritÃƒÂ¡rias.

### 5.5. Problemas de ambiente, banco e credenciais

Erro anterior: atrito com PostgreSQL local, variÃƒÂ¡veis de ambiente, senhas, migrations e exposiÃƒÂ§ÃƒÂ£o de segredo em texto operacional.

CorreÃƒÂ§ÃƒÂ£o agora:

- `.env.example` sem segredos;
- nenhum segredo em log, prompt, documento ou cÃƒÂ³digo;
- qualquer segredo exposto deve ser rotacionado;
- banco sÃƒÂ³ entra quando a Sprint de backend/banco comeÃƒÂ§ar.

### 5.6. Ambiguidade entre global e canal

Erro anterior: confusÃƒÂ£o entre polÃƒÂ­tica global e polÃƒÂ­tica por canal.

CorreÃƒÂ§ÃƒÂ£o agora:

- entidade global nÃƒÂ£o recebe `channelId`;
- entidade operacional por canal recebe `channelId`;
- contratos do frontend devem refletir essa regra;
- backend futuro deve implementar a mesma semÃƒÂ¢ntica.

### 5.7. Pipeline de mÃƒÂ­dia antes de storage maduro

Erro anterior: falha por arquivo de entrada fora do `storage_root`.

CorreÃƒÂ§ÃƒÂ£o agora:

- mÃƒÂ­dia real sÃƒÂ³ depois de asset registry, storage root, jobs e validaÃƒÂ§ÃƒÂ£o de paths;
- Sprint 0 nÃƒÂ£o toca em mÃƒÂ­dia real.

### 5.8. Prompt grande usado para construir tudo

Erro anterior: prompts amplos demais geraram sprints longas e difÃƒÂ­ceis de validar.

CorreÃƒÂ§ÃƒÂ£o agora:

- Documento Mestre ÃƒÂ© contexto e norma;
- prompts de execuÃƒÂ§ÃƒÂ£o devem ser pequenos e especÃƒÂ­ficos;
- Sprint 0 tem escopo fechado.

---

## 6. PrincÃƒÂ­pios inegociÃƒÂ¡veis

1. Multicanal desde o inÃƒÂ­cio.
2. Canal como raiz operacional do conteÃƒÂºdo.
3. SeparaÃƒÂ§ÃƒÂ£o entre configuraÃƒÂ§ÃƒÂ£o e regra de negÃƒÂ³cio.
4. Rastreabilidade completa.
5. Auditoria de eventos e decisÃƒÂµes.
6. Controle de custos por canal, etapa e fornecedor.
7. AprovaÃƒÂ§ÃƒÂ£o humana em decisÃƒÂµes de risco.
8. ConteÃƒÂºdo original como padrÃƒÂ£o.
9. Fontes rastreÃƒÂ¡veis para conteÃƒÂºdo factual.
10. IntegraÃƒÂ§ÃƒÂµes autorizadas, sem simulaÃƒÂ§ÃƒÂ£o de comportamento humano.
11. Nenhuma credencial em cÃƒÂ³digo, log, prompt ou documento pÃƒÂºblico.
12. Design system antes de multiplicar novas telas.
13. Frontend operacional como critÃƒÂ©rio de produto.
14. Workers especializados somente quando a fundaÃƒÂ§ÃƒÂ£o estiver madura.
15. Testes e screenshots como parte do Definition of Done.
16. Nenhuma expansÃƒÂ£o de canais antes de estabilidade do primeiro canal.
17. Nenhuma publicaÃƒÂ§ÃƒÂ£o real sem conformidade, aprovaÃƒÂ§ÃƒÂ£o humana e autorizaÃƒÂ§ÃƒÂ£o.
18. Nenhum ativo de mÃƒÂ­dia sem origem, licenÃƒÂ§a ou geraÃƒÂ§ÃƒÂ£o rastreada.
19. Nenhum workflow sem status, eventos, custo, erro e idempotÃƒÂªncia.
20. Nenhuma fase concluÃƒÂ­da sem evidÃƒÂªncias.
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
- sem backend real obrigatÃƒÂ³rio;
- sem Supabase obrigatÃƒÂ³rio;
- sem autenticaÃƒÂ§ÃƒÂ£o real obrigatÃƒÂ³ria;
- sem chamadas externas obrigatÃƒÂ³rias.

### 7.2. Backend futuro

O backend serÃƒÂ¡ criado posteriormente no Codex, seguindo os contratos do frontend.

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

Python serÃƒÂ¡ permitido apenas como worker desacoplado para:

- FFmpeg;
- renderizaÃƒÂ§ÃƒÂ£o;
- processamento de mÃƒÂ­dia;
- LangGraph;
- IA pesada;
- jobs assÃƒÂ­ncronos.

Python nÃƒÂ£o serÃƒÂ¡ a aplicaÃƒÂ§ÃƒÂ£o principal nesta fase.

---

## 8. Estrutura de repositÃƒÂ³rio recomendada apÃƒÂ³s auditoria

A estrutura real pode variar por causa do Lovable, mas o Codex deve convergir para a separaÃƒÂ§ÃƒÂ£o abaixo sempre que possÃƒÂ­vel, sem reescrever o projeto inteiro na Sprint 0.

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

Quando o backend comeÃƒÂ§ar, a estrutura recomendada serÃƒÂ¡:

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

- **AppShell:** layout global, sidebar, topbar, seletor de canal e ÃƒÂ¡rea principal.
- **Pages:** composiÃƒÂ§ÃƒÂ£o das telas.
- **Components:** peÃƒÂ§as reutilizÃƒÂ¡veis.
- **Contracts:** tipos e status oficiais.
- **Services:** mock-api agora; api-client real depois.
- **Mocks:** dados demo isolados.
- **Design system:** tokens, badges, cards, tabelas, ÃƒÂ­cones e estados.

Regras:

- pÃƒÂ¡ginas devem consumir funÃƒÂ§ÃƒÂµes de serviÃƒÂ§o;
- pÃƒÂ¡ginas nÃƒÂ£o devem importar mocks crus diretamente;
- componentes visuais nÃƒÂ£o devem conhecer a origem dos dados;
- status devem usar tipos oficiais;
- badges devem ser padronizados;
- dados operacionais devem ter `channelId`;
- seletor de canal deve alterar o contexto visual;
- mocks nÃƒÂ£o sÃƒÂ£o lixo temporÃƒÂ¡rio; eles sÃƒÂ£o a simulaÃƒÂ§ÃƒÂ£o inicial do domÃƒÂ­nio.

---

## 10. Contratos TypeScript oficiais esperados

### 10.1. Regras gerais

- Use `camelCase` no frontend.
- Todos os IDs sÃƒÂ£o `string`.
- Todas as datas sÃƒÂ£o strings ISO 8601.
- Valores monetÃƒÂ¡rios sÃƒÂ£o inteiros em centavos com sufixo `Cents`.
- DuraÃƒÂ§ÃƒÂµes sÃƒÂ£o em segundos com sufixo `Seconds`.
- Dados operacionais por canal devem conter `channelId`.
- Entidades globais nÃƒÂ£o devem conter `channelId` sem necessidade.
- O backend futuro deve respeitar esses contratos ou propor alteraÃƒÂ§ÃƒÂ£o formal.

### 10.2. Status obrigatÃƒÂ³rios

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

Se esses tipos nÃƒÂ£o existirem no frontend Lovable, a Sprint 0 deve criÃƒÂ¡-los ou documentar a pendÃƒÂªncia, dependendo do impacto no build.

---

## 11. Mock API oficial

O frontend deve ter `src/services/mock-api.ts` ou equivalente.

FunÃƒÂ§ÃƒÂµes esperadas:

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
- deve retornar estrutura prÃƒÂ³xima ÃƒÂ  futura API;
- deve filtrar por `channelId` quando aplicÃƒÂ¡vel;
- nÃƒÂ£o deve chamar APIs externas;
- nÃƒÂ£o deve usar segredos;
- deve facilitar substituiÃƒÂ§ÃƒÂ£o por `api-client.ts` real.

---

## 12. Design system Aralume

### 12.1. Objetivo visual

O frontend deve parecer uma plataforma SaaS empresarial premium, com alta densidade de informaÃƒÂ§ÃƒÂ£o, identidade prÃƒÂ³pria e leitura operacional clara.

As referÃƒÂªncias visuais usadas nas conversas devem orientar a direÃƒÂ§ÃƒÂ£o de arte: sidebar limpa, cards compactos, fontes pequenas, KPIs no topo, painel lateral de detalhes, tabs compactas, ÃƒÂ­cones consistentes, linhas de workflow e status visÃƒÂ­veis.

A Aralume nÃƒÂ£o deve parecer template genÃƒÂ©rico, landing page ou dashboard vazio.

### 12.2. PrincÃƒÂ­pios visuais

- Tema claro como padrÃƒÂ£o.
- Alta densidade, sem poluiÃƒÂ§ÃƒÂ£o.
- Fonte pequena e legÃƒÂ­vel.
- Pouca sombra, mais borda suave.
- Azul como cor primÃƒÂ¡ria.
- Verde para OK.
- Amarelo ou laranja para alerta.
- Vermelho para bloqueio/falha.
- Roxo para handoff ou agentes especiais.
- Cinza para neutro e pausado.
- Cards compactos.
- Tabelas densas.
- Sidebar fixa e recolhÃƒÂ­vel.
- Topbar com busca, filtros e aÃƒÂ§ÃƒÂ£o principal.
- Painel lateral para detalhes.
- Layout desktop responsivo.

### 12.3. Tipografia

PadrÃƒÂ£o recomendado:

- TÃƒÂ­tulo de pÃƒÂ¡gina: 22px a 26px.
- SubtÃƒÂ­tulo ou breadcrumb: 12px a 13px.
- TÃƒÂ­tulo de card: 13px a 14px.
- Texto comum: 12px a 13px.
- Labels: 10px a 12px.
- Tabelas: 11px a 12px.
- Badges: 10px a 11px.
- NÃƒÂºmeros de KPI: 20px a 28px.

### 12.4. Componentes obrigatÃƒÂ³rios

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

Se o Lovable tiver criado nomes diferentes, o Codex deve mapear equivalentes antes de renomear. Renomear por estÃƒÂ©tica ÃƒÂ© proibido na Sprint 0.

### 12.5. Logo e iconografia

A marca Aralume deve transmitir:

- luz;
- clareza;
- automaÃƒÂ§ÃƒÂ£o;
- controle;
- inteligÃƒÂªncia;
- operaÃƒÂ§ÃƒÂ£o editorial;
- multiagentes;
- rastreabilidade;
- tecnologia premium;
- confianÃƒÂ§a empresarial.

O logo deve ter:

- sÃƒÂ­mbolo prÃƒÂ³prio;
- wordmark Ã¢â‚¬Å“AralumeÃ¢â‚¬Â;
- versÃƒÂ£o completa para sidebar expandida;
- versÃƒÂ£o compacta para sidebar recolhida;
- boa leitura em tamanho pequeno;
- estÃƒÂ©tica SaaS premium;
- ausÃƒÂªncia de aparÃƒÂªncia infantil ou genÃƒÂ©rica.

ÃƒÂcones devem ser consistentes, com traÃƒÂ§o fino, cantos arredondados e boa leitura em 16px, 18px e 20px.

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

NÃƒÂ£o criar:

- landing page;
- pÃƒÂ¡gina pÃƒÂºblica;
- login real;
- rotas aleatÃƒÂ³rias;
- fluxos externos.

---

## 14. Telas principais

### 14.1. Dashboard

Objetivo: visÃƒÂ£o executiva e operacional.

Deve exibir:

- canais ativos;
- conteÃƒÂºdos em produÃƒÂ§ÃƒÂ£o;
- conteÃƒÂºdos aguardando aprovaÃƒÂ§ÃƒÂ£o;
- publicaÃƒÂ§ÃƒÂµes programadas;
- custo do mÃƒÂªs;
- falhas recentes;
- alertas de conformidade;
- produÃƒÂ§ÃƒÂ£o por status;
- indicadores de audiÃƒÂªncia;
- recomendaÃƒÂ§ÃƒÂµes do agente analista.

### 14.2. Canais

Objetivo: administrar canais e entender se estÃƒÂ£o prontos para operar.

Layout recomendado:

- lista de canais ÃƒÂ  esquerda;
- detalhe do canal no centro;
- painÃƒÂ©is operacionais ÃƒÂ  direita.

Abas esperadas:

- VisÃƒÂ£o geral;
- Perfil editorial;
- Identidade visual;
- Voz e narraÃƒÂ§ÃƒÂ£o;
- Regras editoriais;
- Plataformas;
- OrÃƒÂ§amento;
- HistÃƒÂ³rico.

A tela de Canais nÃƒÂ£o deve ser apenas CRUD. Ela deve mostrar readiness operacional.

### 14.3. EscritÃƒÂ³rio de Agentes

Objetivo: cockpit operacional da fÃƒÂ¡brica editorial.

Layout:

- KPIs no topo;
- board central com fases e agentes;
- handoffs visuais entre agentes;
- painel lateral do agente selecionado;
- tabelas inferiores com handoffs, timeline, fila e bloqueios.

O cockpit deve responder em 30 segundos:

- quem estÃƒÂ¡ trabalhando;
- em qual conteÃƒÂºdo;
- em qual etapa;
- o que foi entregue;
- o que estÃƒÂ¡ bloqueando;
- qual ÃƒÂ© o prÃƒÂ³ximo agente.

### 14.4. ProduÃƒÂ§ÃƒÂ£o

Deve mostrar conteÃƒÂºdos em andamento por canal, etapa, agente atual, progresso, custo acumulado, risco e prÃƒÂ³xima aÃƒÂ§ÃƒÂ£o.

### 14.5. Pautas

Deve permitir visualizar oportunidades, score editorial, nicho, canal, fonte da ideia, risco e aÃƒÂ§ÃƒÂµes simuladas.

### 14.6. Pesquisas

Deve exibir sessÃƒÂµes de pesquisa, fontes, claims, confianÃƒÂ§a, divergÃƒÂªncias, risco de desatualizaÃƒÂ§ÃƒÂ£o e data de acesso.

### 14.7. Roteiros

Deve exibir roteiros, versÃƒÂµes, status, duraÃƒÂ§ÃƒÂ£o estimada, estrutura narrativa, CTA, ideias de cortes e histÃƒÂ³rico.

### 14.8. Ativos de MÃƒÂ­dia

Deve exibir narraÃƒÂ§ÃƒÂµes, imagens, vÃƒÂ­deos, thumbnails, trilhas, legendas, origem, licenÃƒÂ§a, prompt, modelo, status, risco e custo.

### 14.9. VÃƒÂ­deos

Deve exibir vÃƒÂ­deos principais, render status, duraÃƒÂ§ÃƒÂ£o, formato, resoluÃƒÂ§ÃƒÂ£o, canal, roteiro vinculado, custo, qualidade e conformidade.

### 14.10. Cortes

Deve exibir cortes derivados, vÃƒÂ­deo-mÃƒÂ£e, gancho, duraÃƒÂ§ÃƒÂ£o, plataforma sugerida, status, risco e potencial.

### 14.11. AprovaÃƒÂ§ÃƒÂµes

Deve exibir fila de aprovaÃƒÂ§ÃƒÂ£o, canal, conteÃƒÂºdo, roteiro, fontes, vÃƒÂ­deo/corte, custo, risco, alertas, recomendaÃƒÂ§ÃƒÂ£o dos agentes e aÃƒÂ§ÃƒÂµes simuladas.

### 14.12. PublicaÃƒÂ§ÃƒÂµes

Deve exibir calendÃƒÂ¡rio ou fila, plataforma, status, canal, conteÃƒÂºdo, data planejada, tipo e alertas de token/conexÃƒÂ£o, sem publicaÃƒÂ§ÃƒÂ£o real.

### 14.13. MÃƒÂ©tricas

Deve exibir visÃƒÂ£o por canal, vÃƒÂ­deo, tema, retenÃƒÂ§ÃƒÂ£o, views, alcance, comentÃƒÂ¡rios, compartilhamentos, seguidores e recomendaÃƒÂ§ÃƒÂµes editoriais mockadas.

### 14.14. Custos

Deve exibir custo por canal, etapa, fornecedor, mÃƒÂªs, orÃƒÂ§amento, limites, alertas e custo por conteÃƒÂºdo.

### 14.15. Conformidade

Deve exibir alertas, bloqueios, riscos, conteÃƒÂºdos reprovados, claims sem fonte, uso de terceiros, tema proibido e necessidade de revisÃƒÂ£o humana.

### 14.16. AdministraÃƒÂ§ÃƒÂ£o

Deve exibir usuÃƒÂ¡rios mockados, perfis, permissÃƒÂµes, integraÃƒÂ§ÃƒÂµes futuras, provedores futuros, modos operacionais e configuraÃƒÂ§ÃƒÂµes globais, sem autenticaÃƒÂ§ÃƒÂ£o real.

### 14.17. Logs e Auditoria

Deve exibir eventos, ator, canal, workflow, agente, aÃƒÂ§ÃƒÂ£o, timestamp, status, erro, custo e metadados.

---

## 15. Modelo de dados futuro do backend

### 15.1. Regra de `channel_id`

- Entidades editoriais e operacionais terÃƒÂ£o `channel_id`.
- Entidades globais de configuraÃƒÂ§ÃƒÂ£o da plataforma nÃƒÂ£o terÃƒÂ£o `channel_id`.
- Entidades globais e por canal devem ser separadas quando tiverem semÃƒÂ¢ntica diferente.

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

Quando o backend comeÃƒÂ§ar, a fase inicial deve conter:

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

NÃƒÂ£o criar todas as tabelas da V1.0 em uma ÃƒÂºnica sprint sem necessidade.

---

## 16. Workflows e agentes

### 16.1. Agentes esperados

- InteligÃƒÂªncia de Nicho;
- Pesquisador;
- Editorial;
- Roteirista;
- DireÃƒÂ§ÃƒÂ£o Visual;
- NarraÃƒÂ§ÃƒÂ£o;
- ProduÃƒÂ§ÃƒÂ£o Visual;
- Editor de VÃƒÂ­deo;
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
9. Gerar ou registrar narraÃƒÂ§ÃƒÂ£o.
10. Gerar ou registrar ativos visuais.
11. Montar vÃƒÂ­deo principal.
12. Gerar cortes.
13. Validar qualidade.
14. Validar conformidade.
15. Solicitar aprovaÃƒÂ§ÃƒÂ£o humana.
16. Preparar publicaÃƒÂ§ÃƒÂ£o.
17. Publicar ou gerar rascunho autorizado.
18. Coletar mÃƒÂ©tricas.
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

## 17. SeguranÃƒÂ§a, credenciais e conformidade

Regras obrigatÃƒÂ³rias:

- nunca commitar `.env`;
- nunca imprimir token;
- nunca colar senha em prompt;
- nunca registrar segredo em audit log;
- usar `.env.example`;
- mascarar valores sensÃƒÂ­veis;
- rotacionar segredo exposto;
- nÃƒÂ£o publicar conteÃƒÂºdo sem aprovaÃƒÂ§ÃƒÂ£o;
- nÃƒÂ£o usar automaÃƒÂ§ÃƒÂ£o que burle plataformas;
- nÃƒÂ£o copiar e republicar conteÃƒÂºdo de terceiros sem direito;
- conteÃƒÂºdo factual precisa de fonte;
- conteÃƒÂºdo bloqueado nÃƒÂ£o publica.

---

## 18. MÃƒÂ­dia, storage e renderizaÃƒÂ§ÃƒÂ£o

Esta seÃƒÂ§ÃƒÂ£o ÃƒÂ© futura. NÃƒÂ£o deve ser implementada na Sprint 0.

Regras futuras:

- todo ativo deve ser registrado antes de uso;
- renderizador sÃƒÂ³ pode usar arquivos dentro do storage root autorizado;
- caminhos externos devem ser rejeitados;
- todo render deve ser job;
- todo render deve registrar entrada, saÃƒÂ­da, comando, logs, status, erro e duraÃƒÂ§ÃƒÂ£o.

---

## 19. Testes e validaÃƒÂ§ÃƒÂ£o

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

### 19.2. QA visual obrigatÃƒÂ³rio

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
- status crÃƒÂ­tico;
- sem overflow horizontal;
- sem sobreposiÃƒÂ§ÃƒÂ£o;
- sem botÃƒÂ£o quebrado;
- sem texto ilegÃƒÂ­vel.

Na Sprint 0, se screenshots nÃƒÂ£o forem possÃƒÂ­veis, registrar pendÃƒÂªncia formal.

---

## 20. Ordem atualizada de construÃƒÂ§ÃƒÂ£o atÃƒÂ© a V1.0

Nota operacional atualizada:

- A Sprint 8 foi encerrada em Media Assets and Storage.
- A Sprint 9 foi encerrada e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- A Sprint 10 foi encerrada e integrada ao `main` via PR #17.
- As fases abaixo continuam como roadmap conceitual e nao precisam coincidir numericamente com a sequencia operacional das sprints entregues.

### Fase 0 Ã¢â‚¬â€ Documento Mestre e contexto oficial

**Status:** concluÃƒÂ­da parcialmente.

Entregas:

- Documento Mestre V2 criado;
- Documento Mestre V2.1 pÃƒÂ³s-Lovable criado;
- visÃƒÂ£o consolidada;
- erros do projeto anterior documentados;
- estratÃƒÂ©gia de frontend primeiro definida;
- backend futuro no Codex definido.

PendÃƒÂªncia:

- consolidar este documento no repositÃƒÂ³rio como `docs/PROJECT_MASTER.md`.

### Fase 1 Ã¢â‚¬â€ Frontend Lovable criado

**Status:** criado fora do Codex.

Entregas esperadas:

- AppShell;
- sidebar;
- topbar;
- logo Aralume;
- rotas principais;
- Dashboard;
- Canais;
- EscritÃƒÂ³rio de Agentes;
- pÃƒÂ¡ginas administrativas;
- mocks;
- contratos TypeScript;
- mock-api;
- design system;
- documentaÃƒÂ§ÃƒÂ£o inicial.

Gate:

- sÃƒÂ³ serÃƒÂ¡ aprovada apÃƒÂ³s auditoria do Codex.

### Fase 1.1 Ã¢â‚¬â€ Sprint 0: Auditoria e estabilizaÃƒÂ§ÃƒÂ£o do frontend Lovable

**PrÃƒÂ³xima fase obrigatÃƒÂ³ria.**

Objetivo:

- auditar e estabilizar o frontend gerado pelo Lovable.

Escopo:

- verificar build;
- verificar rotas;
- verificar contratos;
- verificar mocks;
- verificar mock-api;
- verificar design system;
- verificar pÃƒÂ¡ginas;
- verificar `channelId`;
- verificar seletor de canal;
- verificar ausÃƒÂªncia de backend real indevido;
- verificar ausÃƒÂªncia de Supabase obrigatÃƒÂ³rio;
- verificar ausÃƒÂªncia de segredos;
- criar/atualizar documentaÃƒÂ§ÃƒÂ£o;
- abrir PR.

Fora do escopo:

- backend real;
- banco;
- autenticaÃƒÂ§ÃƒÂ£o;
- IA real;
- publicaÃƒÂ§ÃƒÂ£o real;
- vÃƒÂ­deo real;
- integraÃƒÂ§ÃƒÂµes externas.

Gate:

- frontend compila ou erros estÃƒÂ£o documentados;
- rotas principais existem;
- contratos e mocks auditados;
- documentaÃƒÂ§ÃƒÂ£o mÃƒÂ­nima criada;
- nenhum backend real criado;
- PR aberto.

### Fase 2 Ã¢â‚¬â€ Backend Foundation

Objetivo:

- criar backend inicial seguindo contratos aprovados do frontend.

Entregas:

- Express;
- Drizzle;
- PostgreSQL;
- Zod;
- health check;
- padrÃƒÂ£o de erro;
- migrations iniciais;
- seed demo;
- endpoints base.

Gate:

- backend sobe;
- migrations aplicam em banco limpo;
- health check responde;
- contratos compatÃƒÂ­veis com frontend.

### Fase 3 Ã¢â‚¬â€ Canais reais

Objetivo:

- substituir mocks de canais por API real.

Entregas:

- CRUD real de canais;
- channel settings;
- regras editoriais;
- orÃƒÂ§amento;
- integraÃƒÂ§ÃƒÂ£o da tela Canais com backend.

Gate:

- criar dois canais reais;
- comprovar isolamento de dados por canal.

### Fase 4 Ã¢â‚¬â€ Dashboard real inicial

Objetivo:

- conectar Dashboard a dados reais de canais, custos, workflows e aprovaÃƒÂ§ÃƒÂµes iniciais.

### Fase 5 Ã¢â‚¬â€ EscritÃƒÂ³rio de Agentes persistido

Objetivo:

- persistir `agent_definitions`, `workflow_runs`, `agent_runs` e `agent_handoffs`.

Gate:

- iniciar workflow demo e ver handoff no frontend.

### Fase 6 Ã¢â‚¬â€ Pipeline Editorial

Objetivo:

- pauta, pesquisa, fonte, claim, roteiro e versÃƒÂµes.

Gate:

- criar pauta, registrar fonte, criar roteiro versionado e enviar para aprovaÃƒÂ§ÃƒÂ£o.

### Fase 7 Ã¢â‚¬â€ AprovaÃƒÂ§ÃƒÂ£o, Qualidade e Conformidade

Objetivo:

- bloquear riscos antes de mÃƒÂ­dia real.

Gate:

- conteÃƒÂºdo com risco alto fica bloqueado atÃƒÂ© decisÃƒÂ£o humana.

### Fase 8 Ã¢â‚¬â€ Custos e Modos Operacionais

Objetivo:

- governar execuÃƒÂ§ÃƒÂ£o real.

Gate:

- modo demo bloqueia IA real e publicaÃƒÂ§ÃƒÂ£o real.

### Fase 9 Ã¢â‚¬â€ Ativos de MÃƒÂ­dia

Objetivo:

- registrar mÃƒÂ­dia corretamente.

Gate:

- todo ativo usado por conteÃƒÂºdo tem origem e URI interna vÃƒÂ¡lida.

### Fase 10 Ã¢â‚¬â€ RenderizaÃƒÂ§ÃƒÂ£o Controlada

**Status:** concluÃƒÂ­da.

Objetivo:

- gerar vÃƒÂ­deo demo reproduzÃƒÂ­vel.

Gate:

- renderizar vÃƒÂ­deo curto de teste com logs e validaÃƒÂ§ÃƒÂ£o.

### Fase 11 Ã¢â‚¬â€ Cortes

**Status:** em andamento.

Objetivo:

- gerar e rastrear derivados.

Gate:

- gerar pelo menos um corte vinculado ao vÃƒÂ­deo principal.

### Fase 12 Ã¢â‚¬â€ PublicaÃƒÂ§ÃƒÂ£o Assistida

**Status:** materializada na Sprint 11 e encerrada.

Objetivo:

- preparar publicaÃƒÂ§ÃƒÂ£o sem risco externo.

Gate:

- pacote de publicaÃƒÂ§ÃƒÂ£o pronto, sem envio externo automÃƒÂ¡tico.

### Fase 13 Ã¢â‚¬â€ IntegraÃƒÂ§ÃƒÂµes Reais Autorizadas

Objetivo:

- conectar provedores com governanÃƒÂ§a.

Sprint alvo:

- Sprint 12.

Gate:

- integraÃƒÂ§ÃƒÂ£o oficial funcionando sem expor segredo.

### Fase 14 Ã¢â‚¬â€ MÃƒÂ©tricas e Aprendizado

Objetivo:

- fechar ciclo editorial.

Sprint alvo:

- Sprint 13.

Gate:

- mÃƒÂ©tricas geram recomendaÃƒÂ§ÃƒÂ£o editorial por canal.

### Fase 15 Ã¢â‚¬â€ Hardening V1.0

**Status:** planejada.

Objetivo:

- transformar MVP em V1.0 funcional.

Sprint alvo:

- Sprint 14.

Gate:

- demonstraÃƒÂ§ÃƒÂ£o ponta a ponta pelo frontend;
- aceite binÃƒÂ¡rio documentado como V1.0 aceita ou V1.0 nÃƒÂ£o aceita na Sprint 14;
- esta fase ÃƒÂ© validada pela Sprint 14 e pela spec `docs/specs/012-v1-acceptance.md`, sem reclassificar a Fase 12 historica.

### Mapa de identificadores

- **Fase do roadmap do produto**: linha histÃƒÂ³rica de capacidade do produto no Documento Mestre.
- **Sprint de execuÃƒÂ§ÃƒÂ£o**: unidade sequencial de entrega, integraÃƒÂ§ÃƒÂ£o e validaÃƒÂ§ÃƒÂ£o.
- **Spec**: contrato normativo que governa a execuÃƒÂ§ÃƒÂ£o da sprint.
- Os identificadores podem divergir numericamente.
- A Fase 12 do roadmap materializou-se na Sprint 11 e permanece encerrada.
- A Sprint 12 materializa o E13 - Integracoes Reais Autorizadas e e regida pela spec `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 13 materializa o E14 - Metricas e Aprendizado e e regida pela spec `docs/specs/014-metrics-learning.md`.
- A Sprint 14 formaliza o gate de Hardening/V1 Acceptance da V1.0 e e regida pela spec `docs/specs/012-v1-acceptance.md`.
- A relacao entre fase, sprint e spec deve permanecer explicitada.

---

## 21. V1.0 Ã¢â‚¬â€ critÃƒÂ©rios obrigatÃƒÂ³rios

A V1.0 existe quando um operador consegue:

1. Criar ou selecionar canal.
2. Configurar perfil editorial.
3. Criar pauta.
4. Registrar pesquisa e fontes.
5. Criar roteiro versionado.
6. Planejar cenas.
7. Registrar narraÃƒÂ§ÃƒÂ£o ou gerar narraÃƒÂ§ÃƒÂ£o autorizada.
8. Registrar ativos visuais.
9. Renderizar vÃƒÂ­deo demo ou real controlado.
10. Gerar pelo menos um corte.
11. Validar qualidade.
12. Validar conformidade.
13. Submeter ÃƒÂ  aprovaÃƒÂ§ÃƒÂ£o humana.
14. Preparar publicaÃƒÂ§ÃƒÂ£o ou rascunho.
15. Registrar custos.
16. Registrar mÃƒÂ©tricas.
17. Gerar recomendaÃƒÂ§ÃƒÂ£o editorial.
18. Ver todo o histÃƒÂ³rico no frontend.

NÃƒÂ£o ÃƒÂ© V1.0 se:

- sÃƒÂ³ funciona por CLI;
- sÃƒÂ³ tem backend;
- sÃƒÂ³ tem mock visual;
- nÃƒÂ£o tem canal real;
- nÃƒÂ£o tem aprovaÃƒÂ§ÃƒÂ£o humana;
- nÃƒÂ£o tem rastreabilidade;
- nÃƒÂ£o tem controle de custo;
- nÃƒÂ£o tem validaÃƒÂ§ÃƒÂ£o visual;
- nÃƒÂ£o tem fluxo ponta a ponta.

---

A decisÃƒÂ£o final de V1.0 ÃƒÂ© binÃƒÂ¡ria: V1.0 aceita ou V1.0 nÃƒÂ£o aceita.

## 22. Sprint 0 Ã¢â‚¬â€ Prompt normativo para Codex

Use este prompt para a primeira rodada do Codex apÃƒÂ³s o frontend Lovable:

```text
VocÃƒÂª atuarÃƒÂ¡ como engenheiro de software sÃƒÂªnior e guardiÃƒÂ£o tÃƒÂ©cnico da Aralume Studio.

RepositÃƒÂ³rio:
https://github.com/aralumemedia-lab/aralume-studio.git

Contexto obrigatÃƒÂ³rio:
O frontend inicial da Aralume Studio jÃƒÂ¡ foi criado via Lovable.

NÃƒÂ£o recrie o frontend do zero.
NÃƒÂ£o substitua a identidade visual sem necessidade.
NÃƒÂ£o implemente backend real nesta rodada.
NÃƒÂ£o conecte Supabase.
NÃƒÂ£o crie banco.
NÃƒÂ£o implemente autenticaÃƒÂ§ÃƒÂ£o real.
NÃƒÂ£o implemente IA real.
NÃƒÂ£o implemente vÃƒÂ­deo real.
NÃƒÂ£o implemente publicaÃƒÂ§ÃƒÂ£o real.
NÃƒÂ£o crie integraÃƒÂ§ÃƒÂµes externas.

Sua tarefa ÃƒÂ© executar a Sprint 0 Ã¢â‚¬â€ Auditoria e EstabilizaÃƒÂ§ÃƒÂ£o do Frontend Lovable.

Antes de qualquer alteraÃƒÂ§ÃƒÂ£o:
1. Localize e leia o Documento Mestre V2.1.
2. Trate esse documento como fonte oficial de verdade.
3. Audite o estado real do repositÃƒÂ³rio.
4. Compare o frontend gerado pelo Lovable com o Documento Mestre V2.1.
5. Corrija apenas problemas estruturais, bloqueadores ou desalinhamentos crÃƒÂ­ticos.

Objetivos:
- consolidar docs/PROJECT_MASTER.md;
- verificar build;
- verificar rotas;
- verificar contratos TypeScript;
- verificar mocks;
- verificar mock-api;
- verificar se pÃƒÂ¡ginas consomem services/mock-api e nÃƒÂ£o mocks crus;
- verificar se dados operacionais possuem channelId;
- verificar se seletor de canal filtra contexto;
- verificar design system;
- verificar documentaÃƒÂ§ÃƒÂ£o;
- verificar ausÃƒÂªncia de segredos;
- verificar ausÃƒÂªncia de backend/Supabase/API externa indevida;
- gerar relatÃƒÂ³rio final preciso.

Branch:
codex/sprint-0-audit-stabilize-lovable-frontend

PR:
chore: audit and stabilize Lovable frontend foundation
```

---

## 23. Regras de sprint e PR

Toda sprint deve comeÃƒÂ§ar com:

- branch atual;
- SHA local;
- SHA remoto;
- divergÃƒÂªncia;
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
- screenshots, se houver alteraÃƒÂ§ÃƒÂ£o visual;
- pendÃƒÂªncias;
- riscos;
- recomendaÃƒÂ§ÃƒÂ£o;
- confirmaÃƒÂ§ÃƒÂ£o de que nenhum segredo foi exposto.

NÃƒÂ£o misturar:

- limpeza administrativa com feature;
- design premium com backend pesado;
- IA real com fundaÃƒÂ§ÃƒÂ£o;
- publicaÃƒÂ§ÃƒÂ£o real com protÃƒÂ³tipo;
- refatoraÃƒÂ§ÃƒÂ£o grande com feature nova.

---

## 24. AntipadrÃƒÂµes proibidos

- Recriar o frontend Lovable do zero sem autorizaÃƒÂ§ÃƒÂ£o.
- Criar backend antes de auditar contratos.
- Criar a plataforma inteira em uma ÃƒÂºnica solicitaÃƒÂ§ÃƒÂ£o.
- Criar tela bonita sem dados estruturados.
- Criar backend sem tela correspondente.
- Criar entidade operacional sem `channelId` no frontend ou `channel_id` no backend.
- Criar polÃƒÂ­tica global com campos de canal.
- Usar arquivo de mÃƒÂ­dia fora do storage oficial.
- Publicar sem aprovaÃƒÂ§ÃƒÂ£o.
- Usar automaÃƒÂ§ÃƒÂ£o que burle plataforma.
- Colar token ou senha em prompt.
- Considerar sprint concluÃƒÂ­da sem teste.
- Considerar frontend aprovado sem build e auditoria.
- AvanÃƒÂ§ar para IA real antes de custo e modo operacional.
- AvanÃƒÂ§ar para vÃƒÂ­deo real antes de asset registry.
- Expandir canais antes de estabilizar o primeiro.

---

## 25. Indicadores de sucesso

### 25.1. Produto

- operador entende a situaÃƒÂ§ÃƒÂ£o em menos de 30 segundos;
- fluxo principal funciona pelo frontend;
- canais nÃƒÂ£o misturam dados;
- conteÃƒÂºdo tem rastreabilidade;
- aprovaÃƒÂ§ÃƒÂ£o humana funciona;
- custos aparecem corretamente;
- conformidade bloqueia riscos.

### 25.2. Engenharia

- build passa;
- typecheck passa;
- contratos sÃƒÂ£o claros;
- mocks sÃƒÂ£o realistas;
- mock-api simula futura API;
- sem segredo no repositÃƒÂ³rio;
- sem logs locais commitados;
- arquitetura modular;
- endpoints futuros documentados.

### 25.3. OperaÃƒÂ§ÃƒÂ£o

- tempo de criaÃƒÂ§ÃƒÂ£o de conteÃƒÂºdo reduzido;
- baixa taxa de retrabalho;
- custo previsÃƒÂ­vel;
- aprovaÃƒÂ§ÃƒÂ£o em lote possÃƒÂ­vel;
- falhas visÃƒÂ­veis;
- reprocessamento seguro.

---

## 26. ConclusÃƒÂ£o

A Aralume Studio deve ser construÃƒÂ­da com menos ansiedade e mais critÃƒÂ©rio.

A etapa Lovable acelerou a criaÃƒÂ§ÃƒÂ£o visual, mas nÃƒÂ£o substitui engenharia, auditoria, contratos e governanÃƒÂ§a. O prÃƒÂ³ximo passo correto ÃƒÂ© estabilizar o frontend no Codex, documentar a base real e sÃƒÂ³ entÃƒÂ£o criar backend.

A decisÃƒÂ£o fundamental agora ÃƒÂ©:

**O frontend Lovable ÃƒÂ© a base inicial, mas o Codex deve transformÃƒÂ¡-lo em fundaÃƒÂ§ÃƒÂ£o confiÃƒÂ¡vel. O backend sÃƒÂ³ comeÃƒÂ§a depois que contratos, mocks, rotas e documentaÃƒÂ§ÃƒÂ£o estiverem auditados.**

Este documento passa a ser a fonte principal de informaÃƒÂ§ÃƒÂ£o do projeto a partir do estado pÃƒÂ³s-Lovable.

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

| Ordem                            | Epic                                                   | Escopo principal | Resultado                                                                          |
| -------------------------------- | ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| Sprint 15 (entregue)             | E16 - Pipeline Editorial Operavel pelo Frontend        | V1-02 a V1-04    | perfil editorial, pautas, pesquisa, fontes e claims operaveis no frontend          |
| Sprint 16 (entregue)             | E16 - Pipeline Editorial Operavel pelo Frontend        | V1-05 a V1-06    | roteiro versionado e plano visual com cenas operaveis no frontend                  |
| Sprint 17 (entregue pela PR #28) | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-07 a V1-08    | narracao e ativos visuais operaveis no frontend com reload, auditoria e isolamento |
| Sprint 18 (entregue pela PR #30) | E17 - Pipeline Midia e Producao Operavel pelo Frontend | V1-09 a V1-10    | render e cortes operaveis no frontend com reload, auditoria e isolamento           |
| Sprint 19 (mergeada pela PR #32) | E18 - Governanca e Publicacao Assistida pelo Frontend  | V1-11 a V1-13    | qualidade, compliance e aprovacao humana operaveis pelo frontend                   |
| Sprint 20 (entregue pela PR #33) | E18 - Governanca e Publicacao Assistida pelo Frontend  | V1-14            | pacote de publicacao com confirmacao humana, readiness e sem auto-send             |
| Sprint 21 (mergeada pela PR #34) | E19 - Cockpits Reais e Evidencias Transversais         | R14-T01, R14-T02 | dashboard e escritorio de agentes reais, mais evidencias reutilizaveis             |
| Gate final                       | R14-REACCEPT                                           | V1-01..V1-18     | novo V1 Acceptance com prova nova no mesmo head                                    |

- Sprint 15 foi executada na PR #26 e a Sprint 16 concluiu H16.3 e H16.4; E16 esta fechado.
- E17 passa a ser executado em duas sprints: Sprint 17 para H17.1/H17.2 e Sprint 18 para H17.3/H17.4.
- H17.1 a H17.4 estao integradas em `main` pelas PRs #28 e #30; E17 esta concluido em `main`.
- E18 foi executado em duas fatias: Sprint 19 para H18.1-H18.3 e Sprint 20 para H18.4. As duas estao integradas em `main` pelas PRs #32 e #33; E18 esta concluido.
- Sprint 21 concluiu H19.1, H19.2 e H19.3 pela PR #34; E19 esta concluido em `main` com evidencia suplementar reutilizavel.

### Mapa de remediacao

| CritÃƒÂ©rio V1             | R14     | Epic | Sprint sugerida |
| -------------------------- | ------- | ---- | --------------- |
| V1-02                      | R14-02  | E16  | Sprint 15       |
| V1-03                      | R14-03  | E16  | Sprint 15       |
| V1-04                      | R14-04  | E16  | Sprint 15       |
| V1-05                      | R14-05  | E16  | Sprint 16       |
| V1-06                      | R14-06  | E16  | Sprint 16       |
| V1-07                      | R14-07  | E17  | Sprint 17       |
| V1-08                      | R14-08  | E17  | Sprint 17       |
| V1-09                      | R14-09  | E17  | Sprint 18       |
| V1-10                      | R14-10  | E17  | Sprint 18       |
| V1-11                      | R14-11  | E18  | Sprint 19       |
| V1-12                      | R14-12  | E18  | Sprint 19       |
| V1-13                      | R14-13  | E18  | Sprint 19       |
| V1-14                      | R14-14  | E18  | Sprint 20       |
| Dashboard real             | R14-T01 | E19  | Sprint 21       |
| Escritorio de Agentes real | R14-T02 | E19  | Sprint 21       |

### R14-REACCEPT

- Gate final somente depois de E16, E17, E18 e E19 evidenciados.
- O reaceite usa a mesma matriz de 18 criterios com evidencia nova no mesmo head.
- Nenhuma remediacao funcional comeca sem a documentacao desta sequencia.
- A primeira sprint recomendada foi a Sprint 19; a Sprint 20 iniciou somente apos o gate da Sprint 19.
- E18 foi concluido apos os gates das duas sprints; Sprint 21 concluiu E19 pela PR #34.

### Sprint 22 - Remediacao dos findings do reaceite

A Sprint 22 e uma unidade tecnica do E15 - Hardening V1.0, governada por `docs/specs/023-sprint-22-v1-remediation-findings.md`. Ela corrige auditoria estruturada, isolamento de leituras editoriais e reproducibilidade dos runners E2E das Sprints 15 a 21. Nao executa o `R14-REACCEPT`, nao altera a matriz historica e nao autoriza release, tag ou deploy.

- E19 esta evidenciado em `docs/acceptance/v1/V1_SPRINT21_EVIDENCE.md`; `R14-REACCEPT` permanece bloqueado ate a execucao formal do novo aceite.

### R14 concluido e Sprint 23 - Release Readiness

O R14 foi concluido e integrado pela PR #37 com `V1.0 ACCEPTED` e 18/18 criterios `PASS`. O SHA funcional aceito e `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`; o merge documental e `61d313bdb35dd0228a2bf4f5af3454263f588155`.

A Sprint 23 permanece vinculada ao E15 - Hardening V1.0 e e governada por `docs/specs/024-sprint-23-v1-release-readiness.md`. Ela prepara a release 1.0.0, valida seguranca, configuracao, persistencia, backup, rollback, observabilidade e quality gates, mas nao executa deploy, tag ou GitHub Release. A Sprint 24 vigente e governada por `docs/specs/025-sprint-24-security-isolation.md` e remedia autenticacao, autorizacao, isolamento multicanal, midia e importacao antes de qualquer unidade posterior de implantacao.
