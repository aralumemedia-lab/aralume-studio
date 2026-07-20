Atue como release manager técnico e engenheiro sênior responsável pela Sprint 23 — Release Readiness e Hardening de Produção da Aralume Studio V1.0.

Estado autorizado:

- V1.0 formalmente aceita com 18/18 critérios `PASS`.
- PR documental #37: `MERGED`.
- `main` = `origin/main`.
- HEAD inicial esperado: `61d313bdb35dd0228a2bf4f5af3454263f588155`.
- Divergência esperada: `0/0`.
- Working tree esperada: limpa.
- Nenhuma release, tag ou implantação realizada.

Objetivo:

Preparar a Aralume Studio V1.0 para implantação em produção real, produzindo uma decisão formal:

- `READY_FOR_PRODUCTION_DEPLOYMENT`
- `READY_WITH_CONDITIONS`
- `NOT_READY`

Esta sprint não deve realizar deploy produtivo.

Antes de alterar arquivos:

1. Confirme root Git, branch, HEAD, `main`, `origin/main`, divergência, working tree e worktrees.
2. Confirme que não existem PRs, tags ou releases conflitantes.
3. Leia:
   - `AGENTS.md`;
   - `docs/PROJECT_MASTER.md`;
   - `docs/NEXT_SPRINTS.md`;
   - `docs/PRODUCT_BACKLOG.md`;
   - `docs/CODEX_HANDOFF.md`;
   - `docs/FRONTEND_API_CONTRACTS.md`;
   - specs de aceite e remediação da V1;
   - documentos R14;
   - `PROMPT_5_RELEASE.md`;
   - documentação de arquitetura, segurança, ambientes e operação.
4. Confirme a numeração e o vínculo correto da Sprint 23.
5. Crie ou atualize primeiro a spec da sprint antes de implementar.

Branch esperada:

`codex/sprint-23-v1-release-readiness`

Escopo obrigatório:

- criar a unidade documental da release V1.0;
- consolidar o escopo exato da release;
- identificar componentes, configurações, dependências e integrações necessárias;
- validar variáveis de ambiente sem expor valores;
- revisar gerenciamento de segredos;
- validar banco, migrations e seed aplicáveis;
- definir backup e restauração;
- definir plano de implantação;
- definir plano de rollback;
- definir smoke tests pós-implantação;
- definir critérios objetivos de pausa e rollback;
- validar health checks;
- validar logs, métricas e alertas;
- validar observabilidade dos fluxos críticos;
- revisar dependências e vulnerabilidades;
- revisar autenticação e autorização aplicáveis;
- revisar storage, paths e permissões;
- revisar integrações externas autorizadas;
- confirmar idempotência das operações críticas;
- confirmar que conteúdo bloqueado não pode ser publicado;
- validar ausência de segredos no repositório;
- avaliar os 18 diagnósticos globais de TypeScript;
- corrigir esses diagnósticos somente se a correção for segura, limitada e não alterar comportamento funcional;
- caso não sejam corrigidos, registrar justificativa, impacto e condição explícita para produção;
- documentar warnings de hydration e code splitting;
- executar todos os quality gates disponíveis.

Documentos mínimos da release:

```text
docs/releases/1.0.0/
├── RELEASE_NOTES.md
├── DEPLOYMENT_PLAN.md
├── ROLLBACK_PLAN.md
├── VALIDATION_CHECKLIST.md
└── POST_RELEASE_REPORT.md
```

O `POST_RELEASE_REPORT.md` deve ser criado como template ainda não preenchido, pois o deploy não ocorrerá nesta sprint.

Validações mínimas:

- `git diff --check`
- lint
- frontend typecheck aplicável
- backend typecheck
- `npx tsc --noEmit`
- suíte oficial completa
- testes adicionais
- build
- auditoria de dependências
- validação de migrations
- validação de configuração
- testes de segurança aplicáveis
- smoke test em ambiente local ou de homologação
- runners críticos da V1
- verificação de processos órfãos
- verificação das portas utilizadas
- inspeção de segredos e arquivos `.env`

Não declare sucesso para comandos não executados.

Fora de escopo:

- deploy em produção;
- criação de tag definitiva;
- publicação de GitHub Release;
- uso de credenciais reais sem autorização;
- publicação externa real;
- alteração dos critérios de aceite da V1;
- novas funcionalidades;
- refatoração ampla;
- reescrita de histórico Git.

Critérios de bloqueio:

Classifique como `NOT_READY` se houver:

- vulnerabilidade crítica ou alta sem aceite formal;
- segredo exposto;
- migração sem validação;
- ausência de backup ou rollback;
- fluxo crítico quebrado;
- observabilidade insuficiente;
- configuração produtiva indefinida;
- dependência externa obrigatória indisponível;
- teste crítico falhando;
- divergência entre documentação e implementação;
- diagnóstico TypeScript com risco funcional material;
- ausência de smoke test reproduzível.

PR:

Crie uma PR exclusiva da Sprint 23.

A PR deve conter:

- objetivo;
- escopo;
- itens incluídos e excluídos;
- documentos criados;
- configurações necessárias;
- quality gates;
- riscos;
- limitações;
- plano de implantação;
- plano de rollback;
- recomendação de readiness.

Não faça merge automaticamente se houver condição material ou finding pendente.

Relatório final obrigatório:

- estado inicial e final do repositório;
- sprint, épico e spec governantes;
- arquivos alterados;
- escopo da release;
- configurações e dependências avaliadas;
- análise de segurança;
- análise dos diagnósticos TypeScript;
- análise dos warnings conhecidos;
- comandos e resultados;
- testes e smoke tests;
- plano de backup;
- plano de implantação;
- plano de rollback;
- observabilidade;
- riscos residuais;
- commit e PR;
- recomendação objetiva para a Sprint 24 — remediação de segurança de entrada e isolamento multicanal antes de qualquer implantação.

Status final permitido:

- `READY_FOR_PRODUCTION_DEPLOYMENT`
- `READY_WITH_CONDITIONS`
- `NOT_READY`
- `BLOCKED`
