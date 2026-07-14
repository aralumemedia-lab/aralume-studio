<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history - force pushing, or rebasing/amending/squashing commits
> that are already pushed - as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Aralume Studio - Instrucoes permanentes do Codex

## Identidade do projeto

Aralume Studio e uma plataforma SaaS empresarial para operacao de uma fabrica editorial multicanal baseada em agentes de IA.

O frontend ja foi criado via Lovable e deve ser preservado, auditado e estabilizado. O backend sera criado posteriormente no Codex, seguindo contratos, specs, roadmap e handoffs aprovados. O Codex nao deve recriar o frontend do zero nem inventar produto fora da documentacao oficial.

## Spec Driven Development obrigatorio

SDD e obrigatorio em todas as sprints.

- Nenhuma sprint comeca pela implementacao.
- Toda sprint comeca por Spec Review.
- O Codex deve ler os documentos oficiais antes de alterar arquivos.
- O Codex deve identificar qual sprint ou fase o roadmap indica.
- O Codex deve identificar qual spec rege o trabalho.
- Se nao existir spec da sprint, o Codex deve criar primeiro uma spec em `docs/specs/`.
- Se houver conflito entre prompt e documentacao, o Codex deve parar e reportar.
- Se o usuario pedir algo fora do roadmap ou da spec, o Codex deve apontar o desvio antes de implementar.
- Implementacao deve seguir o escopo aprovado, nao criatividade livre.
- Roadmap e specs mandam.
- Prompt nao pode contradizer spec.
- Implementacao nao pode inventar produto.

## Documentos obrigatorios de leitura

Antes de qualquer alteracao, ler e confrontar a tarefa com:

- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/*` relevante

## Checklist obrigatorio antes de qualquer alteracao

Antes de editar arquivos, registrar e verificar:

- branch atual
- SHA atual
- remote
- divergencia com `origin/main`
- working tree
- staged
- modified
- untracked
- spec relevante
- fase ou sprint atual
- escopo
- fora de escopo
- arquivos provaveis
- riscos
- comandos de validacao
- criterios de aceite

## Regra de aprovacao antes de implementar

Se a tarefa for ampla, ambigua ou envolver nova sprint, o Codex deve apresentar um plano de implementacao antes de editar arquivos.

O plano deve conter:

- objetivo
- requisitos da spec
- arquivos a alterar
- fora de escopo
- validacoes
- riscos
- Definition of Done

## Limites permanentes do projeto

- Nao criar backend real antes da sprint backend definida.
- Nao conectar Supabase sem spec aprovada.
- Nao criar banco sem spec aprovada.
- Nao implementar IA real sem modo operacional, custos e aprovacao definidos.
- Nao implementar video real sem asset registry, storage root e render jobs.
- Nao implementar publicacao real sem OAuth autorizado, conformidade e aprovacao humana.
- Nao expor segredos.
- Nao commitar `.env`.
- Nao usar automacao que burle plataforma.
- Nao criar dados operacionais sem `channelId` quando aplicavel.
- Nao tratar frontend como detalhe.
- Nao considerar sprint concluida sem validacao.

## Regras de frontend

- O frontend existente via Lovable deve ser preservado e estabilizado, nao recriado do zero.
- Qualquer alteracao visual deve respeitar `docs/FRONTEND_DESIGN_SYSTEM.md`.
- Rotas, mocks e contratos devem respeitar `docs/FRONTEND_API_CONTRACTS.md`.
- Dashboard, Canais e Escritorio de Agentes sao telas criticas.
- Usar fontes pequenas, alta densidade e layout empresarial premium.
- Screenshots sao obrigatorias quando uma tela premium for alterada, se houver ferramenta disponivel.

## Regras de backend futuro

- O backend deve implementar os contratos ja aprovados do frontend.
- O backend nao deve inventar contrato divergente.
- O primeiro dominio real sera Canais, salvo mudanca documentada no roadmap ou na spec.
- Quando chegar a sprint backend, usar Node.js, TypeScript, Express, Drizzle, PostgreSQL e Zod.
- Python somente como worker futuro, desacoplado.

## Regras de commits e PR

- Uma sprint por branch.
- Branch nomeada como `codex/sprint-X-descricao`.
- Nao misturar limpeza administrativa com feature.
- Nao iniciar nova sprint com working tree sujo.
- Sempre rodar as validacoes disponiveis.
- PR deve conter objetivo, escopo, arquivos alterados, comandos executados, resultados, limitacoes e proximos passos.
- Relatorio final deve incluir branch, SHA, working tree, comandos, testes, pendencias, riscos e confirmacao de ausencia de segredos.

## Estrutura recomendada de specs

Quando houver novas fases ou sprints sem spec, criar e organizar em `docs/specs/` seguindo esta sequencia recomendada:

```text
docs/specs/
  000-sdd-process.md
  001-environment-safe-migration.md
  002-backend-foundation.md
  003-channels.md
  004-agent-office-workflows.md
  005-editorial-pipeline.md
  006-approvals-compliance.md
  007-costs-operational-modes.md
  008-media-assets-storage.md
  009-rendering.md
  010-derived-clips.md
  011-publication-assisted.md
  012-v1-acceptance.md
  013-channels-frontend-integration.md
  014-metrics-learning.md
```

## Relatorio final obrigatorio

Ao concluir qualquer tarefa relevante, reportar explicitamente:

- branch inicial
- branch final
- SHA inicial
- SHA final
- estado inicial do working tree
- estado final do working tree
- se `AGENTS.md` existia
- se `AGENTS.md` foi criado ou atualizado
- resumo das secoes adicionadas
- arquivos alterados
- comandos executados
- resultado dos comandos
- confirmacao de que nao criou backend
- confirmacao de que nao alterou frontend funcional sem necessidade
- confirmacao de que nao expôs segredos
- commit criado
- PR criado, se aplicavel
