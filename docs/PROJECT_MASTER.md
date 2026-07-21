# ARALUME STUDIO ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â DOCUMENTO MESTRE V2.1 PÃƒÆ’Ã¢â‚¬Å“S-LOVABLE

**Documento principal do novo projeto Aralume Studio**
**VersÃƒÆ’Ã‚Â£o:** 2.1
**Status:** Fonte oficial de verdade do projeto apÃƒÆ’Ã‚Â³s criaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o inicial do frontend via Lovable
**Uso obrigatÃƒÆ’Ã‚Â³rio:** Codex, GitHub, agentes de desenvolvimento, documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, roadmap, critÃƒÆ’Ã‚Â©rios de aceite, revisÃƒÆ’Ã‚Âµes tÃƒÆ’Ã‚Â©cnicas e prompts de sprint
**RepositÃƒÆ’Ã‚Â³rio oficial:** `https://github.com/aralumemedia-lab/aralume-studio.git`
**Contexto local informado:** `C:\Users\carol\Documents\aralume-studio V2`

---

## 0. MudanÃƒÆ’Ã‚Â§a de contexto em relaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â  V2.0

Este documento substitui o Documento Mestre V2.0 como orientaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o operacional do projeto Aralume Studio.

A V2.0 foi criada para orientar a reconstruÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do projeto do zero. Depois disso, o frontend inicial foi criado via Lovable. Portanto, o plano nÃƒÆ’Ã‚Â£o comeÃƒÆ’Ã‚Â§a mais em ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œcriar o frontend do zeroÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. O plano correto agora ÃƒÆ’Ã‚Â©:

1. Preservar o frontend criado via Lovable como base inicial.
2. Auditar rigorosamente esse frontend no Codex.
3. Corrigir contratos, mocks, rotas, documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, estrutura e problemas de build.
4. Congelar contratos TypeScript aprovados.
5. Criar o backend no Codex seguindo exatamente os contratos do frontend.
6. Integrar tela por tela, sem refazer a plataforma inteira.

A regra central permanece: **a Aralume deve nascer como uma plataforma operacional rastreÃƒÆ’Ã‚Â¡vel, nÃƒÆ’Ã‚Â£o como apenas um gerador de vÃƒÆ’Ã‚Â­deo**.

A regra nova ÃƒÆ’Ã‚Â©: **o frontend Lovable nÃƒÆ’Ã‚Â£o estÃƒÆ’Ã‚Â¡ automaticamente aprovado; ele precisa passar por auditoria e estabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o no Codex antes de ser considerado a base oficial do produto**.

---

## 1. PropÃƒÆ’Ã‚Â³sito deste documento

Este documento ÃƒÆ’Ã‚Â© a fonte principal de informaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o para conduzir a Aralume Studio a partir do estado atual: frontend inicial jÃƒÆ’Ã‚Â¡ criado via Lovable e backend ainda nÃƒÆ’Ã‚Â£o implementado.

Ele existe para impedir a repetiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o dos erros do projeto anterior:

- muitas sprints sem resultado operacional claro;
- backend avanÃƒÆ’Ã‚Â§ando antes do frontend ser usÃƒÆ’Ã‚Â¡vel;
- uso excessivo de CLI como validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de produto;
- escopo amplo demais por sprint;
- ausÃƒÆ’Ã‚Âªncia de design system consolidado;
- problemas de ambiente, banco, credenciais e paths de mÃƒÆ’Ã‚Â­dia;
- ambiguidade entre entidades globais e entidades por canal;
- dificuldade de chegar a uma V1.0 demonstrÃƒÆ’Ã‚Â¡vel;
- construÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de funcionalidades sem validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o visual;
- mocks e contratos frÃƒÆ’Ã‚Â¡geis ou improvisados.

A partir deste documento, qualquer agente, plataforma ou desenvolvedor deve entender:

- o que a Aralume Studio ÃƒÆ’Ã‚Â©;
- o que ela nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â©;
- qual ÃƒÆ’Ã‚Â© o estado atual do projeto;
- como tratar o frontend criado pelo Lovable;
- como auditar e estabilizar a base atual;
- quais contratos devem orientar o backend futuro;
- qual stack usar;
- como estruturar frontend e backend;
- como desenhar a experiÃƒÆ’Ã‚Âªncia operacional;
- como modelar os dados;
- como implementar workflows e agentes;
- qual ordem de construÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o seguir;
- quais gates precisam ser cumpridos antes de avanÃƒÆ’Ã‚Â§ar;
- o que define uma V1.0 real e funcional.

---

## 2. DecisÃƒÆ’Ã‚Â£o executiva atualizada

A Aralume Studio serÃƒÆ’Ã‚Â¡ reconstruÃƒÆ’Ã‚Â­da com uma abordagem mais curta, objetiva e verificÃƒÆ’Ã‚Â¡vel.

A decisÃƒÆ’Ã‚Â£o anterior de comeÃƒÆ’Ã‚Â§ar pelo frontend foi mantida e executada parcialmente: **o frontend inicial jÃƒÆ’Ã‚Â¡ foi criado via Lovable**.

A decisÃƒÆ’Ã‚Â£o executiva atual ÃƒÆ’Ã‚Â©:

- Lovable foi usado como acelerador visual e gerador inicial do frontend.
- Codex serÃƒÆ’Ã‚Â¡ o ambiente principal de auditoria, estabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, backend, integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, testes e evoluÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o por PRs.
- GitHub serÃƒÆ’Ã‚Â¡ a fonte de verdade do cÃƒÆ’Ã‚Â³digo.
- O frontend atual nÃƒÆ’Ã‚Â£o deve ser recriado do zero sem autorizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- O backend serÃƒÆ’Ã‚Â¡ criado depois, seguindo os contratos TypeScript aprovados no frontend.
- A prÃƒÆ’Ã‚Â³xima fase obrigatÃƒÆ’Ã‚Â³ria ÃƒÆ’Ã‚Â© a **Sprint 0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Auditoria e EstabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do Frontend Lovable**.
- Nenhum backend real serÃƒÆ’Ã‚Â¡ criado antes da Sprint 0 estar concluÃƒÆ’Ã‚Â­da.
- Nenhum banco, Drizzle, Supabase, autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real, IA real, vÃƒÆ’Ã‚Â­deo real ou publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real deve ser implementado na Sprint 0.
- Python serÃƒÆ’Ã‚Â¡ usado apenas como worker futuro, se necessÃƒÆ’Ã‚Â¡rio, para mÃƒÆ’Ã‚Â­dia, FFmpeg, LangGraph, IA pesada ou jobs assÃƒÆ’Ã‚Â­ncronos.

O novo projeto deve ser validado por tela, por fluxo, por contrato, por build e por PR. NÃƒÆ’Ã‚Â£o basta criar arquivos. NÃƒÆ’Ã‚Â£o basta parecer bonito. NÃƒÆ’Ã‚Â£o basta compilar uma vez. O sistema precisa ser progressivamente operÃƒÆ’Ã‚Â¡vel.

---

## 3. VisÃƒÆ’Ã‚Â£o do produto

A Aralume Studio ÃƒÆ’Ã‚Â© uma plataforma SaaS empresarial para operaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de uma fÃƒÆ’Ã‚Â¡brica editorial multicanal baseada em agentes de inteligÃƒÆ’Ã‚Âªncia artificial.

A plataforma deverÃƒÆ’Ã‚Â¡ pesquisar oportunidades, criar pautas, organizar fontes, escrever roteiros, planejar cenas, gerar ou organizar narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, produzir ativos visuais, montar vÃƒÆ’Ã‚Â­deos, gerar cortes, validar qualidade, validar conformidade, submeter conteÃƒÆ’Ã‚Âºdos ÃƒÆ’Ã‚Â  aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana, preparar publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes, coletar mÃƒÆ’Ã‚Â©tricas e alimentar um ciclo de aprendizado editorial.

Ela deve comeÃƒÆ’Ã‚Â§ar com um canal, mas nascer preparada para mÃƒÆ’Ã‚Âºltiplos canais. Cada canal terÃƒÆ’Ã‚Â¡ nicho, pÃƒÆ’Ã‚Âºblico, linguagem, identidade visual, voz, regras editoriais, calendÃƒÆ’Ã‚Â¡rio, plataformas, orÃƒÆ’Ã‚Â§amento e mÃƒÆ’Ã‚Â©tricas prÃƒÆ’Ã‚Â³prias.

A infraestrutura, os agentes, o motor de workflows, o banco, o armazenamento, as validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes, a auditoria, os custos e as integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes serÃƒÆ’Ã‚Â£o compartilhados, mas os dados editoriais e operacionais devem ser isolados por canal.

A Aralume nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© uma ferramenta simples para gerar vÃƒÆ’Ã‚Â­deo automÃƒÆ’Ã‚Â¡tico. O produto correto ÃƒÆ’Ã‚Â© uma operaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o editorial automatizada, auditÃƒÆ’Ã‚Â¡vel, segura, escalÃƒÆ’Ã‚Â¡vel, controlada por custos, supervisionada por humanos e orientada por mÃƒÆ’Ã‚Â©tricas.

---

## 4. Estado atual do projeto

### 4.1. O que jÃƒÆ’Ã‚Â¡ existe

O frontend inicial foi criado via Lovable no repositÃƒÆ’Ã‚Â³rio:

`https://github.com/aralumemedia-lab/aralume-studio.git`

Esse frontend deve conter, ou deverÃƒÆ’Ã‚Â¡ ser auditado para confirmar se contÃƒÆ’Ã‚Â©m:

- aplicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o React/TypeScript/Vite;
- identidade visual Aralume;
- layout administrativo;
- sidebar;
- topbar;
- rotas administrativas;
- Dashboard;
- Canais;
- EscritÃƒÆ’Ã‚Â³rio de Agentes;
- pÃƒÆ’Ã‚Â¡ginas para os demais mÃƒÆ’Ã‚Â³dulos;
- dados mockados;
- contratos TypeScript;
- mock-api ou camada equivalente;
- design system ou componentes visuais reutilizÃƒÆ’Ã‚Â¡veis;
- documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o inicial, se o Lovable tiver criado.

### 4.2. O que ainda nÃƒÆ’Ã‚Â£o existe e nÃƒÆ’Ã‚Â£o deve ser inventado na Sprint 0

Na Sprint 0, ainda nÃƒÆ’Ã‚Â£o deve existir:

- backend real;
- banco real;
- Drizzle schema;
- migrations;
- Supabase;
- autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real;
- IA real;
- geraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de vÃƒÆ’Ã‚Â­deo real;
- publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real;
- OAuth;
- integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o com plataformas externas;
- workers Python;
- renderizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real via FFmpeg.

### 4.3. InterpretaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o correta do frontend Lovable

O frontend criado pelo Lovable ÃƒÆ’Ã‚Â© uma base inicial. Ele nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© automaticamente a arquitetura oficial aprovada.

O Codex deve auditar:

- se compila;
- se as rotas existem;
- se os contratos estÃƒÆ’Ã‚Â£o corretos;
- se os mocks sÃƒÆ’Ã‚Â£o tipados;
- se a mock-api existe;
- se as pÃƒÆ’Ã‚Â¡ginas consomem serviÃƒÆ’Ã‚Â§os e nÃƒÆ’Ã‚Â£o mocks crus;
- se `channelId` existe em dados operacionais;
- se o seletor de canal filtra contexto;
- se a experiÃƒÆ’Ã‚Âªncia visual estÃƒÆ’Ã‚Â¡ alinhada ao padrÃƒÆ’Ã‚Â£o SaaS premium;
- se nÃƒÆ’Ã‚Â£o hÃƒÆ’Ã‚Â¡ dependÃƒÆ’Ã‚Âªncia indevida de Supabase, backend, autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ou API externa;
- se nÃƒÆ’Ã‚Â£o hÃƒÆ’Ã‚Â¡ segredo exposto.

---

## 5. O que deu errado no projeto anterior e como bloquear agora

### 5.1. Escopo grande demais por sprint

Erro anterior: o projeto avanÃƒÆ’Ã‚Â§ou em muitas frentes ao mesmo tempo: agentes, backend, migrations, publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, vÃƒÆ’Ã‚Â­deo, OAuth, mÃƒÆ’Ã‚Â©tricas, conformidade, frontend e testes.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- cada sprint deve ter escopo pequeno;
- o que estÃƒÆ’Ã‚Â¡ fora do escopo deve ser declarado;
- uma sprint nÃƒÆ’Ã‚Â£o pode misturar design premium, backend, banco, IA, vÃƒÆ’Ã‚Â­deo e publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- Sprint 0 ÃƒÆ’Ã‚Â© apenas auditoria e estabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do frontend Lovable.

### 5.2. Backend avanÃƒÆ’Ã‚Â§ou mais que frontend

Erro anterior: o backend ficou tecnicamente denso, mas o operador nÃƒÆ’Ã‚Â£o tinha uma experiÃƒÆ’Ã‚Âªncia visual equivalente para usar o sistema.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- frontend foi criado primeiro;
- backend serÃƒÆ’Ã‚Â¡ criado depois seguindo contratos do frontend;
- toda funcionalidade real futura precisa aparecer na interface ou ter motivo tÃƒÆ’Ã‚Â©cnico claro.

### 5.3. Frontend sem design system consolidado

Erro anterior: telas com densidade inadequada, colisÃƒÆ’Ã‚Â£o visual, quebra de textos longos, headers apertados e aparÃƒÆ’Ã‚Âªncia abaixo do esperado.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- design system precisa ser auditado;
- componentes reutilizÃƒÆ’Ã‚Â¡veis precisam existir;
- telas premium precisam ser validadas visualmente;
- Lovable nÃƒÆ’Ã‚Â£o deve ser considerado suficiente sem revisÃƒÆ’Ã‚Â£o do Codex.

### 5.4. ValidaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o por CLI em vez de produto operÃƒÆ’Ã‚Â¡vel

Erro anterior: muitos testes e comandos, mas pouca validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o operacional em tela.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- build e testes continuam obrigatÃƒÆ’Ã‚Â³rios;
- UI navegÃƒÆ’Ã‚Â¡vel ÃƒÆ’Ã‚Â© critÃƒÆ’Ã‚Â©rio de produto;
- Dashboard, Canais e EscritÃƒÆ’Ã‚Â³rio de Agentes sÃƒÆ’Ã‚Â£o telas prioritÃƒÆ’Ã‚Â¡rias.

### 5.5. Problemas de ambiente, banco e credenciais

Erro anterior: atrito com PostgreSQL local, variÃƒÆ’Ã‚Â¡veis de ambiente, senhas, migrations e exposiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de segredo em texto operacional.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- `.env.example` sem segredos;
- nenhum segredo em log, prompt, documento ou cÃƒÆ’Ã‚Â³digo;
- qualquer segredo exposto deve ser rotacionado;
- banco sÃƒÆ’Ã‚Â³ entra quando a Sprint de backend/banco comeÃƒÆ’Ã‚Â§ar.

### 5.6. Ambiguidade entre global e canal

Erro anterior: confusÃƒÆ’Ã‚Â£o entre polÃƒÆ’Ã‚Â­tica global e polÃƒÆ’Ã‚Â­tica por canal.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- entidade global nÃƒÆ’Ã‚Â£o recebe `channelId`;
- entidade operacional por canal recebe `channelId`;
- contratos do frontend devem refletir essa regra;
- backend futuro deve implementar a mesma semÃƒÆ’Ã‚Â¢ntica.

### 5.7. Pipeline de mÃƒÆ’Ã‚Â­dia antes de storage maduro

Erro anterior: falha por arquivo de entrada fora do `storage_root`.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- mÃƒÆ’Ã‚Â­dia real sÃƒÆ’Ã‚Â³ depois de asset registry, storage root, jobs e validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de paths;
- Sprint 0 nÃƒÆ’Ã‚Â£o toca em mÃƒÆ’Ã‚Â­dia real.

### 5.8. Prompt grande usado para construir tudo

Erro anterior: prompts amplos demais geraram sprints longas e difÃƒÆ’Ã‚Â­ceis de validar.

CorreÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o agora:

- Documento Mestre ÃƒÆ’Ã‚Â© contexto e norma;
- prompts de execuÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o devem ser pequenos e especÃƒÆ’Ã‚Â­ficos;
- Sprint 0 tem escopo fechado.

---

## 6. PrincÃƒÆ’Ã‚Â­pios inegociÃƒÆ’Ã‚Â¡veis

1. Multicanal desde o inÃƒÆ’Ã‚Â­cio.
2. Canal como raiz operacional do conteÃƒÆ’Ã‚Âºdo.
3. SeparaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o entre configuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o e regra de negÃƒÆ’Ã‚Â³cio.
4. Rastreabilidade completa.
5. Auditoria de eventos e decisÃƒÆ’Ã‚Âµes.
6. Controle de custos por canal, etapa e fornecedor.
7. AprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana em decisÃƒÆ’Ã‚Âµes de risco.
8. ConteÃƒÆ’Ã‚Âºdo original como padrÃƒÆ’Ã‚Â£o.
9. Fontes rastreÃƒÆ’Ã‚Â¡veis para conteÃƒÆ’Ã‚Âºdo factual.
10. IntegraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes autorizadas, sem simulaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de comportamento humano.
11. Nenhuma credencial em cÃƒÆ’Ã‚Â³digo, log, prompt ou documento pÃƒÆ’Ã‚Âºblico.
12. Design system antes de multiplicar novas telas.
13. Frontend operacional como critÃƒÆ’Ã‚Â©rio de produto.
14. Workers especializados somente quando a fundaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o estiver madura.
15. Testes e screenshots como parte do Definition of Done.
16. Nenhuma expansÃƒÆ’Ã‚Â£o de canais antes de estabilidade do primeiro canal.
17. Nenhuma publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real sem conformidade, aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana e autorizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
18. Nenhum ativo de mÃƒÆ’Ã‚Â­dia sem origem, licenÃƒÆ’Ã‚Â§a ou geraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o rastreada.
19. Nenhum workflow sem status, eventos, custo, erro e idempotÃƒÆ’Ã‚Âªncia.
20. Nenhuma fase concluÃƒÆ’Ã‚Â­da sem evidÃƒÆ’Ã‚Âªncias.
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
- sem backend real obrigatÃƒÆ’Ã‚Â³rio;
- sem Supabase obrigatÃƒÆ’Ã‚Â³rio;
- sem autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real obrigatÃƒÆ’Ã‚Â³ria;
- sem chamadas externas obrigatÃƒÆ’Ã‚Â³rias.

### 7.2. Backend futuro

O backend serÃƒÆ’Ã‚Â¡ criado posteriormente no Codex, seguindo os contratos do frontend.

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

Python serÃƒÆ’Ã‚Â¡ permitido apenas como worker desacoplado para:

- FFmpeg;
- renderizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- processamento de mÃƒÆ’Ã‚Â­dia;
- LangGraph;
- IA pesada;
- jobs assÃƒÆ’Ã‚Â­ncronos.

Python nÃƒÆ’Ã‚Â£o serÃƒÆ’Ã‚Â¡ a aplicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o principal nesta fase.

---

## 8. Estrutura de repositÃƒÆ’Ã‚Â³rio recomendada apÃƒÆ’Ã‚Â³s auditoria

A estrutura real pode variar por causa do Lovable, mas o Codex deve convergir para a separaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o abaixo sempre que possÃƒÆ’Ã‚Â­vel, sem reescrever o projeto inteiro na Sprint 0.

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

Quando o backend comeÃƒÆ’Ã‚Â§ar, a estrutura recomendada serÃƒÆ’Ã‚Â¡:

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

- **AppShell:** layout global, sidebar, topbar, seletor de canal e ÃƒÆ’Ã‚Â¡rea principal.
- **Pages:** composiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o das telas.
- **Components:** peÃƒÆ’Ã‚Â§as reutilizÃƒÆ’Ã‚Â¡veis.
- **Contracts:** tipos e status oficiais.
- **Services:** mock-api agora; api-client real depois.
- **Mocks:** dados demo isolados.
- **Design system:** tokens, badges, cards, tabelas, ÃƒÆ’Ã‚Â­cones e estados.

Regras:

- pÃƒÆ’Ã‚Â¡ginas devem consumir funÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes de serviÃƒÆ’Ã‚Â§o;
- pÃƒÆ’Ã‚Â¡ginas nÃƒÆ’Ã‚Â£o devem importar mocks crus diretamente;
- componentes visuais nÃƒÆ’Ã‚Â£o devem conhecer a origem dos dados;
- status devem usar tipos oficiais;
- badges devem ser padronizados;
- dados operacionais devem ter `channelId`;
- seletor de canal deve alterar o contexto visual;
- mocks nÃƒÆ’Ã‚Â£o sÃƒÆ’Ã‚Â£o lixo temporÃƒÆ’Ã‚Â¡rio; eles sÃƒÆ’Ã‚Â£o a simulaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o inicial do domÃƒÆ’Ã‚Â­nio.

---

## 10. Contratos TypeScript oficiais esperados

### 10.1. Regras gerais

- Use `camelCase` no frontend.
- Todos os IDs sÃƒÆ’Ã‚Â£o `string`.
- Todas as datas sÃƒÆ’Ã‚Â£o strings ISO 8601.
- Valores monetÃƒÆ’Ã‚Â¡rios sÃƒÆ’Ã‚Â£o inteiros em centavos com sufixo `Cents`.
- DuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes sÃƒÆ’Ã‚Â£o em segundos com sufixo `Seconds`.
- Dados operacionais por canal devem conter `channelId`.
- Entidades globais nÃƒÆ’Ã‚Â£o devem conter `channelId` sem necessidade.
- O backend futuro deve respeitar esses contratos ou propor alteraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o formal.

### 10.2. Status obrigatÃƒÆ’Ã‚Â³rios

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

Se esses tipos nÃƒÆ’Ã‚Â£o existirem no frontend Lovable, a Sprint 0 deve criÃƒÆ’Ã‚Â¡-los ou documentar a pendÃƒÆ’Ã‚Âªncia, dependendo do impacto no build.

---

## 11. Mock API oficial

O frontend deve ter `src/services/mock-api.ts` ou equivalente.

FunÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes esperadas:

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
- deve retornar estrutura prÃƒÆ’Ã‚Â³xima ÃƒÆ’Ã‚Â  futura API;
- deve filtrar por `channelId` quando aplicÃƒÆ’Ã‚Â¡vel;
- nÃƒÆ’Ã‚Â£o deve chamar APIs externas;
- nÃƒÆ’Ã‚Â£o deve usar segredos;
- deve facilitar substituiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o por `api-client.ts` real.

---

## 12. Design system Aralume

### 12.1. Objetivo visual

O frontend deve parecer uma plataforma SaaS empresarial premium, com alta densidade de informaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, identidade prÃƒÆ’Ã‚Â³pria e leitura operacional clara.

As referÃƒÆ’Ã‚Âªncias visuais usadas nas conversas devem orientar a direÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de arte: sidebar limpa, cards compactos, fontes pequenas, KPIs no topo, painel lateral de detalhes, tabs compactas, ÃƒÆ’Ã‚Â­cones consistentes, linhas de workflow e status visÃƒÆ’Ã‚Â­veis.

A Aralume nÃƒÆ’Ã‚Â£o deve parecer template genÃƒÆ’Ã‚Â©rico, landing page ou dashboard vazio.

### 12.2. PrincÃƒÆ’Ã‚Â­pios visuais

- Tema claro como padrÃƒÆ’Ã‚Â£o.
- Alta densidade, sem poluiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- Fonte pequena e legÃƒÆ’Ã‚Â­vel.
- Pouca sombra, mais borda suave.
- Azul como cor primÃƒÆ’Ã‚Â¡ria.
- Verde para OK.
- Amarelo ou laranja para alerta.
- Vermelho para bloqueio/falha.
- Roxo para handoff ou agentes especiais.
- Cinza para neutro e pausado.
- Cards compactos.
- Tabelas densas.
- Sidebar fixa e recolhÃƒÆ’Ã‚Â­vel.
- Topbar com busca, filtros e aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o principal.
- Painel lateral para detalhes.
- Layout desktop responsivo.

### 12.3. Tipografia

PadrÃƒÆ’Ã‚Â£o recomendado:

- TÃƒÆ’Ã‚Â­tulo de pÃƒÆ’Ã‚Â¡gina: 22px a 26px.
- SubtÃƒÆ’Ã‚Â­tulo ou breadcrumb: 12px a 13px.
- TÃƒÆ’Ã‚Â­tulo de card: 13px a 14px.
- Texto comum: 12px a 13px.
- Labels: 10px a 12px.
- Tabelas: 11px a 12px.
- Badges: 10px a 11px.
- NÃƒÆ’Ã‚Âºmeros de KPI: 20px a 28px.

### 12.4. Componentes obrigatÃƒÆ’Ã‚Â³rios

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

Se o Lovable tiver criado nomes diferentes, o Codex deve mapear equivalentes antes de renomear. Renomear por estÃƒÆ’Ã‚Â©tica ÃƒÆ’Ã‚Â© proibido na Sprint 0.

### 12.5. Logo e iconografia

A marca Aralume deve transmitir:

- luz;
- clareza;
- automaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- controle;
- inteligÃƒÆ’Ã‚Âªncia;
- operaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o editorial;
- multiagentes;
- rastreabilidade;
- tecnologia premium;
- confianÃƒÆ’Ã‚Â§a empresarial.

O logo deve ter:

- sÃƒÆ’Ã‚Â­mbolo prÃƒÆ’Ã‚Â³prio;
- wordmark ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œAralumeÃƒÂ¢Ã¢â€šÂ¬Ã‚Â;
- versÃƒÆ’Ã‚Â£o completa para sidebar expandida;
- versÃƒÆ’Ã‚Â£o compacta para sidebar recolhida;
- boa leitura em tamanho pequeno;
- estÃƒÆ’Ã‚Â©tica SaaS premium;
- ausÃƒÆ’Ã‚Âªncia de aparÃƒÆ’Ã‚Âªncia infantil ou genÃƒÆ’Ã‚Â©rica.

ÃƒÆ’Ã‚Âcones devem ser consistentes, com traÃƒÆ’Ã‚Â§o fino, cantos arredondados e boa leitura em 16px, 18px e 20px.

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

NÃƒÆ’Ã‚Â£o criar:

- landing page;
- pÃƒÆ’Ã‚Â¡gina pÃƒÆ’Ã‚Âºblica;
- login real;
- rotas aleatÃƒÆ’Ã‚Â³rias;
- fluxos externos.

---

## 14. Telas principais

### 14.1. Dashboard

Objetivo: visÃƒÆ’Ã‚Â£o executiva e operacional.

Deve exibir:

- canais ativos;
- conteÃƒÆ’Ã‚Âºdos em produÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- conteÃƒÆ’Ã‚Âºdos aguardando aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes programadas;
- custo do mÃƒÆ’Ã‚Âªs;
- falhas recentes;
- alertas de conformidade;
- produÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o por status;
- indicadores de audiÃƒÆ’Ã‚Âªncia;
- recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes do agente analista.

### 14.2. Canais

Objetivo: administrar canais e entender se estÃƒÆ’Ã‚Â£o prontos para operar.

Layout recomendado:

- lista de canais ÃƒÆ’Ã‚Â  esquerda;
- detalhe do canal no centro;
- painÃƒÆ’Ã‚Â©is operacionais ÃƒÆ’Ã‚Â  direita.

Abas esperadas:

- VisÃƒÆ’Ã‚Â£o geral;
- Perfil editorial;
- Identidade visual;
- Voz e narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- Regras editoriais;
- Plataformas;
- OrÃƒÆ’Ã‚Â§amento;
- HistÃƒÆ’Ã‚Â³rico.

A tela de Canais nÃƒÆ’Ã‚Â£o deve ser apenas CRUD. Ela deve mostrar readiness operacional.

### 14.3. EscritÃƒÆ’Ã‚Â³rio de Agentes

Objetivo: cockpit operacional da fÃƒÆ’Ã‚Â¡brica editorial.

Layout:

- KPIs no topo;
- board central com fases e agentes;
- handoffs visuais entre agentes;
- painel lateral do agente selecionado;
- tabelas inferiores com handoffs, timeline, fila e bloqueios.

O cockpit deve responder em 30 segundos:

- quem estÃƒÆ’Ã‚Â¡ trabalhando;
- em qual conteÃƒÆ’Ã‚Âºdo;
- em qual etapa;
- o que foi entregue;
- o que estÃƒÆ’Ã‚Â¡ bloqueando;
- qual ÃƒÆ’Ã‚Â© o prÃƒÆ’Ã‚Â³ximo agente.

### 14.4. ProduÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

Deve mostrar conteÃƒÆ’Ã‚Âºdos em andamento por canal, etapa, agente atual, progresso, custo acumulado, risco e prÃƒÆ’Ã‚Â³xima aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.

### 14.5. Pautas

Deve permitir visualizar oportunidades, score editorial, nicho, canal, fonte da ideia, risco e aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes simuladas.

### 14.6. Pesquisas

Deve exibir sessÃƒÆ’Ã‚Âµes de pesquisa, fontes, claims, confianÃƒÆ’Ã‚Â§a, divergÃƒÆ’Ã‚Âªncias, risco de desatualizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o e data de acesso.

### 14.7. Roteiros

Deve exibir roteiros, versÃƒÆ’Ã‚Âµes, status, duraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o estimada, estrutura narrativa, CTA, ideias de cortes e histÃƒÆ’Ã‚Â³rico.

### 14.8. Ativos de MÃƒÆ’Ã‚Â­dia

Deve exibir narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes, imagens, vÃƒÆ’Ã‚Â­deos, thumbnails, trilhas, legendas, origem, licenÃƒÆ’Ã‚Â§a, prompt, modelo, status, risco e custo.

### 14.9. VÃƒÆ’Ã‚Â­deos

Deve exibir vÃƒÆ’Ã‚Â­deos principais, render status, duraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, formato, resoluÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, canal, roteiro vinculado, custo, qualidade e conformidade.

### 14.10. Cortes

Deve exibir cortes derivados, vÃƒÆ’Ã‚Â­deo-mÃƒÆ’Ã‚Â£e, gancho, duraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, plataforma sugerida, status, risco e potencial.

### 14.11. AprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes

Deve exibir fila de aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, canal, conteÃƒÆ’Ã‚Âºdo, roteiro, fontes, vÃƒÆ’Ã‚Â­deo/corte, custo, risco, alertas, recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o dos agentes e aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes simuladas.

### 14.12. PublicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes

Deve exibir calendÃƒÆ’Ã‚Â¡rio ou fila, plataforma, status, canal, conteÃƒÆ’Ã‚Âºdo, data planejada, tipo e alertas de token/conexÃƒÆ’Ã‚Â£o, sem publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.

### 14.13. MÃƒÆ’Ã‚Â©tricas

Deve exibir visÃƒÆ’Ã‚Â£o por canal, vÃƒÆ’Ã‚Â­deo, tema, retenÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, views, alcance, comentÃƒÆ’Ã‚Â¡rios, compartilhamentos, seguidores e recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes editoriais mockadas.

### 14.14. Custos

Deve exibir custo por canal, etapa, fornecedor, mÃƒÆ’Ã‚Âªs, orÃƒÆ’Ã‚Â§amento, limites, alertas e custo por conteÃƒÆ’Ã‚Âºdo.

### 14.15. Conformidade

Deve exibir alertas, bloqueios, riscos, conteÃƒÆ’Ã‚Âºdos reprovados, claims sem fonte, uso de terceiros, tema proibido e necessidade de revisÃƒÆ’Ã‚Â£o humana.

### 14.16. AdministraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

Deve exibir usuÃƒÆ’Ã‚Â¡rios mockados, perfis, permissÃƒÆ’Ã‚Âµes, integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes futuras, provedores futuros, modos operacionais e configuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes globais, sem autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.

### 14.17. Logs e Auditoria

Deve exibir eventos, ator, canal, workflow, agente, aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, timestamp, status, erro, custo e metadados.

---

## 15. Modelo de dados futuro do backend

### 15.1. Regra de `channel_id`

- Entidades editoriais e operacionais terÃƒÆ’Ã‚Â£o `channel_id`.
- Entidades globais de configuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o da plataforma nÃƒÆ’Ã‚Â£o terÃƒÆ’Ã‚Â£o `channel_id`.
- Entidades globais e por canal devem ser separadas quando tiverem semÃƒÆ’Ã‚Â¢ntica diferente.

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

Quando o backend comeÃƒÆ’Ã‚Â§ar, a fase inicial deve conter:

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

NÃƒÆ’Ã‚Â£o criar todas as tabelas da V1.0 em uma ÃƒÆ’Ã‚Âºnica sprint sem necessidade.

---

## 16. Workflows e agentes

### 16.1. Agentes esperados

- InteligÃƒÆ’Ã‚Âªncia de Nicho;
- Pesquisador;
- Editorial;
- Roteirista;
- DireÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Visual;
- NarraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- ProduÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Visual;
- Editor de VÃƒÆ’Ã‚Â­deo;
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
9. Gerar ou registrar narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
10. Gerar ou registrar ativos visuais.
11. Montar vÃƒÆ’Ã‚Â­deo principal.
12. Gerar cortes.
13. Validar qualidade.
14. Validar conformidade.
15. Solicitar aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana.
16. Preparar publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
17. Publicar ou gerar rascunho autorizado.
18. Coletar mÃƒÆ’Ã‚Â©tricas.
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

## 17. SeguranÃƒÆ’Ã‚Â§a, credenciais e conformidade

Regras obrigatÃƒÆ’Ã‚Â³rias:

- nunca commitar `.env`;
- nunca imprimir token;
- nunca colar senha em prompt;
- nunca registrar segredo em audit log;
- usar `.env.example`;
- mascarar valores sensÃƒÆ’Ã‚Â­veis;
- rotacionar segredo exposto;
- nÃƒÆ’Ã‚Â£o publicar conteÃƒÆ’Ã‚Âºdo sem aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- nÃƒÆ’Ã‚Â£o usar automaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o que burle plataformas;
- nÃƒÆ’Ã‚Â£o copiar e republicar conteÃƒÆ’Ã‚Âºdo de terceiros sem direito;
- conteÃƒÆ’Ã‚Âºdo factual precisa de fonte;
- conteÃƒÆ’Ã‚Âºdo bloqueado nÃƒÆ’Ã‚Â£o publica.

---

## 18. MÃƒÆ’Ã‚Â­dia, storage e renderizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

Esta seÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© futura. NÃƒÆ’Ã‚Â£o deve ser implementada na Sprint 0.

Regras futuras:

- todo ativo deve ser registrado antes de uso;
- renderizador sÃƒÆ’Ã‚Â³ pode usar arquivos dentro do storage root autorizado;
- caminhos externos devem ser rejeitados;
- todo render deve ser job;
- todo render deve registrar entrada, saÃƒÆ’Ã‚Â­da, comando, logs, status, erro e duraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.

---

## 19. Testes e validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

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

### 19.2. QA visual obrigatÃƒÆ’Ã‚Â³rio

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
- status crÃƒÆ’Ã‚Â­tico;
- sem overflow horizontal;
- sem sobreposiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- sem botÃƒÆ’Ã‚Â£o quebrado;
- sem texto ilegÃƒÆ’Ã‚Â­vel.

Na Sprint 0, se screenshots nÃƒÆ’Ã‚Â£o forem possÃƒÆ’Ã‚Â­veis, registrar pendÃƒÆ’Ã‚Âªncia formal.

---

## 20. Ordem atualizada de construÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o atÃƒÆ’Ã‚Â© a V1.0

Nota operacional atualizada:

- A Sprint 8 foi encerrada em Media Assets and Storage.
- A Sprint 9 foi encerrada e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 e `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- A Sprint 10 foi encerrada e integrada ao `main` via PR #17.
- As fases abaixo continuam como roadmap conceitual e nao precisam coincidir numericamente com a sequencia operacional das sprints entregues.

### Fase 0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Documento Mestre e contexto oficial

**Status:** concluÃƒÆ’Ã‚Â­da parcialmente.

Entregas:

- Documento Mestre V2 criado;
- Documento Mestre V2.1 pÃƒÆ’Ã‚Â³s-Lovable criado;
- visÃƒÆ’Ã‚Â£o consolidada;
- erros do projeto anterior documentados;
- estratÃƒÆ’Ã‚Â©gia de frontend primeiro definida;
- backend futuro no Codex definido.

PendÃƒÆ’Ã‚Âªncia:

- consolidar este documento no repositÃƒÆ’Ã‚Â³rio como `docs/PROJECT_MASTER.md`.

### Fase 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Frontend Lovable criado

**Status:** criado fora do Codex.

Entregas esperadas:

- AppShell;
- sidebar;
- topbar;
- logo Aralume;
- rotas principais;
- Dashboard;
- Canais;
- EscritÃƒÆ’Ã‚Â³rio de Agentes;
- pÃƒÆ’Ã‚Â¡ginas administrativas;
- mocks;
- contratos TypeScript;
- mock-api;
- design system;
- documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o inicial.

Gate:

- sÃƒÆ’Ã‚Â³ serÃƒÆ’Ã‚Â¡ aprovada apÃƒÆ’Ã‚Â³s auditoria do Codex.

### Fase 1.1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sprint 0: Auditoria e estabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do frontend Lovable

**PrÃƒÆ’Ã‚Â³xima fase obrigatÃƒÆ’Ã‚Â³ria.**

Objetivo:

- auditar e estabilizar o frontend gerado pelo Lovable.

Escopo:

- verificar build;
- verificar rotas;
- verificar contratos;
- verificar mocks;
- verificar mock-api;
- verificar design system;
- verificar pÃƒÆ’Ã‚Â¡ginas;
- verificar `channelId`;
- verificar seletor de canal;
- verificar ausÃƒÆ’Ã‚Âªncia de backend real indevido;
- verificar ausÃƒÆ’Ã‚Âªncia de Supabase obrigatÃƒÆ’Ã‚Â³rio;
- verificar ausÃƒÆ’Ã‚Âªncia de segredos;
- criar/atualizar documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- abrir PR.

Fora do escopo:

- backend real;
- banco;
- autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- IA real;
- publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real;
- vÃƒÆ’Ã‚Â­deo real;
- integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes externas.

Gate:

- frontend compila ou erros estÃƒÆ’Ã‚Â£o documentados;
- rotas principais existem;
- contratos e mocks auditados;
- documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o mÃƒÆ’Ã‚Â­nima criada;
- nenhum backend real criado;
- PR aberto.

### Fase 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Backend Foundation

Objetivo:

- criar backend inicial seguindo contratos aprovados do frontend.

Entregas:

- Express;
- Drizzle;
- PostgreSQL;
- Zod;
- health check;
- padrÃƒÆ’Ã‚Â£o de erro;
- migrations iniciais;
- seed demo;
- endpoints base.

Gate:

- backend sobe;
- migrations aplicam em banco limpo;
- health check responde;
- contratos compatÃƒÆ’Ã‚Â­veis com frontend.

### Fase 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Canais reais

Objetivo:

- substituir mocks de canais por API real.

Entregas:

- CRUD real de canais;
- channel settings;
- regras editoriais;
- orÃƒÆ’Ã‚Â§amento;
- integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o da tela Canais com backend.

Gate:

- criar dois canais reais;
- comprovar isolamento de dados por canal.

### Fase 4 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Dashboard real inicial

Objetivo:

- conectar Dashboard a dados reais de canais, custos, workflows e aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes iniciais.

### Fase 5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â EscritÃƒÆ’Ã‚Â³rio de Agentes persistido

Objetivo:

- persistir `agent_definitions`, `workflow_runs`, `agent_runs` e `agent_handoffs`.

Gate:

- iniciar workflow demo e ver handoff no frontend.

### Fase 6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pipeline Editorial

Objetivo:

- pauta, pesquisa, fonte, claim, roteiro e versÃƒÆ’Ã‚Âµes.

Gate:

- criar pauta, registrar fonte, criar roteiro versionado e enviar para aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.

### Fase 7 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â AprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o, Qualidade e Conformidade

Objetivo:

- bloquear riscos antes de mÃƒÆ’Ã‚Â­dia real.

Gate:

- conteÃƒÆ’Ã‚Âºdo com risco alto fica bloqueado atÃƒÆ’Ã‚Â© decisÃƒÆ’Ã‚Â£o humana.

### Fase 8 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Custos e Modos Operacionais

Objetivo:

- governar execuÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.

Gate:

- modo demo bloqueia IA real e publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.

### Fase 9 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Ativos de MÃƒÆ’Ã‚Â­dia

Objetivo:

- registrar mÃƒÆ’Ã‚Â­dia corretamente.

Gate:

- todo ativo usado por conteÃƒÆ’Ã‚Âºdo tem origem e URI interna vÃƒÆ’Ã‚Â¡lida.

### Fase 10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â RenderizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Controlada

**Status:** concluÃƒÆ’Ã‚Â­da.

Objetivo:

- gerar vÃƒÆ’Ã‚Â­deo demo reproduzÃƒÆ’Ã‚Â­vel.

Gate:

- renderizar vÃƒÆ’Ã‚Â­deo curto de teste com logs e validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.

### Fase 11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Cortes

**Status:** em andamento.

Objetivo:

- gerar e rastrear derivados.

Gate:

- gerar pelo menos um corte vinculado ao vÃƒÆ’Ã‚Â­deo principal.

### Fase 12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â PublicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Assistida

**Status:** materializada na Sprint 11 e encerrada.

Objetivo:

- preparar publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o sem risco externo.

Gate:

- pacote de publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o pronto, sem envio externo automÃƒÆ’Ã‚Â¡tico.

### Fase 13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â IntegraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes Reais Autorizadas

Objetivo:

- conectar provedores com governanÃƒÆ’Ã‚Â§a.

Sprint alvo:

- Sprint 12.

Gate:

- integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o oficial funcionando sem expor segredo.

### Fase 14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â MÃƒÆ’Ã‚Â©tricas e Aprendizado

Objetivo:

- fechar ciclo editorial.

Sprint alvo:

- Sprint 13.

Gate:

- mÃƒÆ’Ã‚Â©tricas geram recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o editorial por canal.

### Fase 15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Hardening V1.0

**Status:** planejada.

Objetivo:

- transformar MVP em V1.0 funcional.

Sprint alvo:

- Sprint 14.

Gate:

- demonstraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ponta a ponta pelo frontend;
- aceite binÃƒÆ’Ã‚Â¡rio documentado como V1.0 aceita ou V1.0 nÃƒÆ’Ã‚Â£o aceita na Sprint 14;
- esta fase ÃƒÆ’Ã‚Â© validada pela Sprint 14 e pela spec `docs/specs/012-v1-acceptance.md`, sem reclassificar a Fase 12 historica.

### Mapa de identificadores

- **Fase do roadmap do produto**: linha histÃƒÆ’Ã‚Â³rica de capacidade do produto no Documento Mestre.
- **Sprint de execuÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o**: unidade sequencial de entrega, integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o e validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- **Spec**: contrato normativo que governa a execuÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o da sprint.
- Os identificadores podem divergir numericamente.
- A Fase 12 do roadmap materializou-se na Sprint 11 e permanece encerrada.
- A Sprint 12 materializa o E13 - Integracoes Reais Autorizadas e e regida pela spec `docs/specs/015-authorized-real-integrations.md`.
- A Sprint 13 materializa o E14 - Metricas e Aprendizado e e regida pela spec `docs/specs/014-metrics-learning.md`.
- A Sprint 14 formaliza o gate de Hardening/V1 Acceptance da V1.0 e e regida pela spec `docs/specs/012-v1-acceptance.md`.
- A relacao entre fase, sprint e spec deve permanecer explicitada.

---

## 21. V1.0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â critÃƒÆ’Ã‚Â©rios obrigatÃƒÆ’Ã‚Â³rios

A V1.0 existe quando um operador consegue:

1. Criar ou selecionar canal.
2. Configurar perfil editorial.
3. Criar pauta.
4. Registrar pesquisa e fontes.
5. Criar roteiro versionado.
6. Planejar cenas.
7. Registrar narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ou gerar narraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o autorizada.
8. Registrar ativos visuais.
9. Renderizar vÃƒÆ’Ã‚Â­deo demo ou real controlado.
10. Gerar pelo menos um corte.
11. Validar qualidade.
12. Validar conformidade.
13. Submeter ÃƒÆ’Ã‚Â  aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana.
14. Preparar publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ou rascunho.
15. Registrar custos.
16. Registrar mÃƒÆ’Ã‚Â©tricas.
17. Gerar recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o editorial.
18. Ver todo o histÃƒÆ’Ã‚Â³rico no frontend.

NÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© V1.0 se:

- sÃƒÆ’Ã‚Â³ funciona por CLI;
- sÃƒÆ’Ã‚Â³ tem backend;
- sÃƒÆ’Ã‚Â³ tem mock visual;
- nÃƒÆ’Ã‚Â£o tem canal real;
- nÃƒÆ’Ã‚Â£o tem aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana;
- nÃƒÆ’Ã‚Â£o tem rastreabilidade;
- nÃƒÆ’Ã‚Â£o tem controle de custo;
- nÃƒÆ’Ã‚Â£o tem validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o visual;
- nÃƒÆ’Ã‚Â£o tem fluxo ponta a ponta.

---

A decisÃƒÆ’Ã‚Â£o final de V1.0 ÃƒÆ’Ã‚Â© binÃƒÆ’Ã‚Â¡ria: V1.0 aceita ou V1.0 nÃƒÆ’Ã‚Â£o aceita.

## 22. Sprint 0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Prompt normativo para Codex

Use este prompt para a primeira rodada do Codex apÃƒÆ’Ã‚Â³s o frontend Lovable:

```text
VocÃƒÆ’Ã‚Âª atuarÃƒÆ’Ã‚Â¡ como engenheiro de software sÃƒÆ’Ã‚Âªnior e guardiÃƒÆ’Ã‚Â£o tÃƒÆ’Ã‚Â©cnico da Aralume Studio.

RepositÃƒÆ’Ã‚Â³rio:
https://github.com/aralumemedia-lab/aralume-studio.git

Contexto obrigatÃƒÆ’Ã‚Â³rio:
O frontend inicial da Aralume Studio jÃƒÆ’Ã‚Â¡ foi criado via Lovable.

NÃƒÆ’Ã‚Â£o recrie o frontend do zero.
NÃƒÆ’Ã‚Â£o substitua a identidade visual sem necessidade.
NÃƒÆ’Ã‚Â£o implemente backend real nesta rodada.
NÃƒÆ’Ã‚Â£o conecte Supabase.
NÃƒÆ’Ã‚Â£o crie banco.
NÃƒÆ’Ã‚Â£o implemente autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.
NÃƒÆ’Ã‚Â£o implemente IA real.
NÃƒÆ’Ã‚Â£o implemente vÃƒÆ’Ã‚Â­deo real.
NÃƒÆ’Ã‚Â£o implemente publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real.
NÃƒÆ’Ã‚Â£o crie integraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes externas.

Sua tarefa ÃƒÆ’Ã‚Â© executar a Sprint 0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Auditoria e EstabilizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do Frontend Lovable.

Antes de qualquer alteraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o:
1. Localize e leia o Documento Mestre V2.1.
2. Trate esse documento como fonte oficial de verdade.
3. Audite o estado real do repositÃƒÆ’Ã‚Â³rio.
4. Compare o frontend gerado pelo Lovable com o Documento Mestre V2.1.
5. Corrija apenas problemas estruturais, bloqueadores ou desalinhamentos crÃƒÆ’Ã‚Â­ticos.

Objetivos:
- consolidar docs/PROJECT_MASTER.md;
- verificar build;
- verificar rotas;
- verificar contratos TypeScript;
- verificar mocks;
- verificar mock-api;
- verificar se pÃƒÆ’Ã‚Â¡ginas consomem services/mock-api e nÃƒÆ’Ã‚Â£o mocks crus;
- verificar se dados operacionais possuem channelId;
- verificar se seletor de canal filtra contexto;
- verificar design system;
- verificar documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- verificar ausÃƒÆ’Ã‚Âªncia de segredos;
- verificar ausÃƒÆ’Ã‚Âªncia de backend/Supabase/API externa indevida;
- gerar relatÃƒÆ’Ã‚Â³rio final preciso.

Branch:
codex/sprint-0-audit-stabilize-lovable-frontend

PR:
chore: audit and stabilize Lovable frontend foundation
```

---

## 23. Regras de sprint e PR

Toda sprint deve comeÃƒÆ’Ã‚Â§ar com:

- branch atual;
- SHA local;
- SHA remoto;
- divergÃƒÆ’Ã‚Âªncia;
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
- screenshots, se houver alteraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o visual;
- pendÃƒÆ’Ã‚Âªncias;
- riscos;
- recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- confirmaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de que nenhum segredo foi exposto.

NÃƒÆ’Ã‚Â£o misturar:

- limpeza administrativa com feature;
- design premium com backend pesado;
- IA real com fundaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o;
- publicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real com protÃƒÆ’Ã‚Â³tipo;
- refatoraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o grande com feature nova.

### 23.1. Uso controlado de subagentes

O Codex deve considerar subagentes quando houver ganho real de cobertura,
independencia, paralelismo ou reducao de risco. Tarefas simples, lineares ou
fortemente acopladas podem permanecer com um unico agente. O coordenador deve
definir o escopo, consolidar resultados, reproduzir findings materiais, revisar
o diff final e emitir o unico veredito.

Subagentes devem ter escopos claros e nao sobrepostos, operar com evidencia
reproduzivel e registrar comandos e resultados. Revisoes sao somente leitura e
nao autorizam alteracao de arquivos, commit, push, merge, release, tag ou
deploy. Cada arquivo de implementacao possui um proprietario unico; trabalho
paralelo usa worktrees isoladas e alteracoes concorrentes no mesmo arquivo
exigem coordenacao explicita. A concorrencia deve ser limitada para preservar
rastreabilidade; findings duplicados sao consolidados e `BLOCKER`/`HIGH` sao
reproduzidos pelo coordenador.

Nenhum agente aprova a propria implementacao. Revisao tecnica independente nao
substitui aprovacao formal humana nem as regras do GitHub, incluindo branch
protection, rulesets, CODEOWNERS e required reviews. O uso de subagentes nao
autoriza bypass dessas regras. Conflitos, decisoes descartadas e limitacoes
devem ser registrados. Casos favoraveis, casos desfavoraveis e o fluxo
operacional completo estao em `docs/architecture/adrs/004-controlled-multi-agent-execution.md`.

---

## 24. AntipadrÃƒÆ’Ã‚Âµes proibidos

- Recriar o frontend Lovable do zero sem autorizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- Criar backend antes de auditar contratos.
- Criar a plataforma inteira em uma ÃƒÆ’Ã‚Âºnica solicitaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- Criar tela bonita sem dados estruturados.
- Criar backend sem tela correspondente.
- Criar entidade operacional sem `channelId` no frontend ou `channel_id` no backend.
- Criar polÃƒÆ’Ã‚Â­tica global com campos de canal.
- Usar arquivo de mÃƒÆ’Ã‚Â­dia fora do storage oficial.
- Publicar sem aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
- Usar automaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o que burle plataforma.
- Colar token ou senha em prompt.
- Considerar sprint concluÃƒÆ’Ã‚Â­da sem teste.
- Considerar frontend aprovado sem build e auditoria.
- AvanÃƒÆ’Ã‚Â§ar para IA real antes de custo e modo operacional.
- AvanÃƒÆ’Ã‚Â§ar para vÃƒÆ’Ã‚Â­deo real antes de asset registry.
- Expandir canais antes de estabilizar o primeiro.

---

## 25. Indicadores de sucesso

### 25.1. Produto

- operador entende a situaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o em menos de 30 segundos;
- fluxo principal funciona pelo frontend;
- canais nÃƒÆ’Ã‚Â£o misturam dados;
- conteÃƒÆ’Ã‚Âºdo tem rastreabilidade;
- aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o humana funciona;
- custos aparecem corretamente;
- conformidade bloqueia riscos.

### 25.2. Engenharia

- build passa;
- typecheck passa;
- contratos sÃƒÆ’Ã‚Â£o claros;
- mocks sÃƒÆ’Ã‚Â£o realistas;
- mock-api simula futura API;
- sem segredo no repositÃƒÆ’Ã‚Â³rio;
- sem logs locais commitados;
- arquitetura modular;
- endpoints futuros documentados.

### 25.3. OperaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

- tempo de criaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de conteÃƒÆ’Ã‚Âºdo reduzido;
- baixa taxa de retrabalho;
- custo previsÃƒÆ’Ã‚Â­vel;
- aprovaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o em lote possÃƒÆ’Ã‚Â­vel;
- falhas visÃƒÆ’Ã‚Â­veis;
- reprocessamento seguro.

---

## 26. ConclusÃƒÆ’Ã‚Â£o

A Aralume Studio deve ser construÃƒÆ’Ã‚Â­da com menos ansiedade e mais critÃƒÆ’Ã‚Â©rio.

A etapa Lovable acelerou a criaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o visual, mas nÃƒÆ’Ã‚Â£o substitui engenharia, auditoria, contratos e governanÃƒÆ’Ã‚Â§a. O prÃƒÆ’Ã‚Â³ximo passo correto ÃƒÆ’Ã‚Â© estabilizar o frontend no Codex, documentar a base real e sÃƒÆ’Ã‚Â³ entÃƒÆ’Ã‚Â£o criar backend.

A decisÃƒÆ’Ã‚Â£o fundamental agora ÃƒÆ’Ã‚Â©:

**O frontend Lovable ÃƒÆ’Ã‚Â© a base inicial, mas o Codex deve transformÃƒÆ’Ã‚Â¡-lo em fundaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o confiÃƒÆ’Ã‚Â¡vel. O backend sÃƒÆ’Ã‚Â³ comeÃƒÆ’Ã‚Â§a depois que contratos, mocks, rotas e documentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o estiverem auditados.**

Este documento passa a ser a fonte principal de informaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do projeto a partir do estado pÃƒÆ’Ã‚Â³s-Lovable.

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

| CritÃƒÆ’Ã‚Â©rio V1             | R14     | Epic | Sprint sugerida |
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

A Sprint 24 foi implementada na branch `codex/sprint-24-production-security-isolation`. A evidencia `docs/acceptance/v1/V1_SPRINT24_SECURITY_ISOLATION_EVIDENCE.md` registra os controles fail-closed, os testes negativos, os runners 15-21 e as limitacoes remanescentes. O estado e `READY_FOR_REVIEW`; a release permanece `NOT_READY` e nao ha autorizacao de merge, release, tag ou deploy nesta unidade.

### Sprint 25 - Hardening tecnico de release readiness

A Sprint 25 e a prÃ³xima unidade normativa do E15. A decisÃ£o foi registrada porque a Sprint 24/Spec 025 era a maior unidade formalizada e nenhuma unidade posterior estava reservada nos documentos normativos. A spec Ã© `docs/specs/026-sprint-25-release-readiness-hardening.md`.

O escopo Ã© limitado Ã  eliminaÃ§Ã£o dos diagnÃ³sticos TypeScript globais, remediaÃ§Ã£o ou classificaÃ§Ã£o dos advisories transitivos e validaÃ§Ã£o inequÃ­voca da identidade dos serviÃ§os iniciados pelos runners. ConfiguraÃ§Ã£o produtiva, secrets, backup, restore, rollback, observabilidade ampla, topologia/ingress, nova avaliaÃ§Ã£o integral, release, tag e deploy permanecem fora de escopo. A release continua `NOT_READY`.

### Sprint 28 - Observabilidade, topologia e readiness produtivo

A Sprint 28 Ã© a prÃ³xima unidade normativa do E15 apÃ³s a Sprint 27. A decisÃ£o foi registrada porque a Sprint 27/Spec 028 fechou configuraÃ§Ã£o produtiva, backup, restore e rollback sem reservar uma unidade posterior. A spec Ã© `docs/specs/029-sprint-28-observability-readiness-topology-ingress.md`.

O escopo Ã© limitado a health, readiness e liveness distintos, logs estruturados e sanitizados, mÃ©tricas operacionais mÃ­nimas, shutdown gracioso, topologia produtiva documentada, requisitos de ingress/HTTPS/proxy/headers, e smoke tests de ambiente produtivo simulado. Release, tag, deploy, CI hospedado, branch protection, backup, restore e rollback permanecem fora de escopo. A release continua `NOT_READY`.

### RemediaÃ§Ã£o de prontidÃ£o operacional da release 1.0.0

A etapa seguinte apÃ³s a Sprint 28 nÃ£o introduz uma nova sprint numerada. Ela formaliza a remediaÃ§Ã£o de release 1.0.0 como unidade normativa de nÃ­vel de release, governada por `docs/specs/030-release-1.0.0-operational-readiness-remediation.md`.

Essa unidade existe para fechar os bloqueadores documentados na avaliaÃ§Ã£o de release sem alterar a linha funcional do produto:

- artefato e topologia de implantaÃ§Ã£o executÃ¡veis;
- CI hospedado, ownership e controles de branch;
- configuraÃ§Ã£o produtiva e segredos;
- runbooks executÃ¡veis de operaÃ§Ã£o e recuperaÃ§Ã£o;
- monitoramento, alertas e ownership operacional;
- evidÃªncia browser / runner consolidada.

O risco residual `RLS-06` permanece separado atÃ© uma triaagem reproduzÃ­vel e formal o absorver ou descartÃ¡-lo. A release 1.0.0 continua `NOT_READY` atÃ© a conclusÃ£o independente desta unidade.
