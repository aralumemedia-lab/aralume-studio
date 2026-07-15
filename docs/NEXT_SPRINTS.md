# Next Sprints

## Modelo de planejamento a partir da Sprint 11

- O Documento Mestre passa a ser lido por épicos, não por sprints.
- Epico, sprint, fase e spec são identificadores diferentes.
- Não assumir que o número de sprint corresponde ao número da spec.
- Não assumir que a fase do Documento Mestre corresponde ao número da sprint.
- A Fase 12 do roadmap materializou-se na Sprint 11 e está encerrada.
- A Sprint 12 é a próxima sprint formal de execução.
- A Sprint 12 não é uma renumeração silenciosa da Fase 12.
- `docs/specs/011-publication-assisted.md` é o identificador correto da Sprint 11.
- `docs/specs/012-v1-acceptance.md` é o identificador correto da Sprint 12.

## Resolução do conflito de numeração

| Roadmap phase | Sprint de execução | Spec normativa | Estado | Observação |
| --- | --- | --- | --- | --- |
| Fase 12 - Publicação Assistida | Sprint 11 | `docs/specs/011-publication-assisted.md` | completed | Capacidade materializada e encerrada via PR #19. |
| Fase 15 - Hardening V1.0 | Sprint 12 | `docs/specs/012-v1-acceptance.md` | planned | Gate de hardening e aceite da V1.0, não a antiga Fase 12. |

## Sprint 11 encerrada

- Sprint 11 foi implementada na branch `codex/sprint-11-publication-assisted`.
- PR: `https://github.com/aralumemedia-lab/aralume-studio/pull/19`.
- Merge commit: `966e5bef50446f81701cedd861689b3e07b14a7d`.
- A rota `/publications` consome backend real de publicações, com alvos, jobs, aprovação humana, conformidade, auditoria e bloqueio de envio externo automático.
- A capa normativa desta sprint é `docs/specs/011-publication-assisted.md`.
- A sprint 11 encerra a materialização da Fase 12 do roadmap.

## Sprint 12 formalizada

| Campo | Valor |
| --- | --- |
| Número | Sprint 12 |
| Nome | V1 Acceptance |
| Epic principal | E15 - Hardening V1.0 |
| Spec governante | `docs/specs/012-v1-acceptance.md` |
| Objetivo | Integrar, verificar, endurecer e decidir o aceite da V1.0 com evidência operacional pelo frontend. |
| Estado | planned |
| Gate de início | `main` limpo e alinhado com `origin/main`, normalização documental mergeada, Sprint 11 encerrada, spec 012 formalizada, pré-requisitos da V1.0 identificados e sem conflito documental. |
| Escopo | Verificar o fluxo ponta a ponta pelo frontend; validar integração entre frontend, backend e persistência; validar isolamento por canal; validar rastreabilidade, auditoria e custos; validar renderização e cortes; validar qualidade, conformidade e aprovação humana; validar preparação de publicação assistida; validar métricas e recomendações quando já implementadas; corrigir defeitos que bloqueiem o aceite; produzir evidências de aceite ou rejeição. |
| Fora de escopo | Grandes módulos novos; redefinição de arquitetura; recriação do frontend; substituição do design system; funcionalidades de sprints posteriores; publicação externa sem autorização; novos provedores sem spec; segredos em código, docs, commits ou logs; aceitação baseada só em CLI; aceitação mascarada por mocks; declaração de aceite sem evidência reproduzível. |
| Bloqueios remanescentes | Integrações Reais Autorizadas (E13) e Métricas e Aprendizado (E14) permanecem planejadas; a V1.0 não pode ser declarada aceita enquanto esses gates obrigatórios não forem evidenciados ou formalmente reclassificados pela documentação. |
| Gate de conclusão | A decisão final é binária: `V1.0 aceita` ou `V1.0 não aceita`. A aceitação só pode ocorrer se um operador conseguir executar, pelo frontend, o fluxo aplicável definido no Documento Mestre. |

## Epicos e dependências

| ID | Epico | Status | Gate final | Relação com a Sprint 12 |
| --- | --- | --- | --- | --- |
| E10 | Renderizacao Controlada | completed | Renderizar vídeo curto de teste com logs, custos e validação. | Base histórica concluída. |
| E11 | Cortes Derivados Controlados | completed | Gerar pelo menos um corte válido vinculado ao vídeo principal. | Base histórica concluída. |
| E12 | Publicacao Assistida | completed | Pacote de publicação pronto, sem envio externo automático. | Materializado na Sprint 11. |
| E13 | Integracoes Reais Autorizadas | planned | Integração oficial funcionando sem expor segredo. | Bloqueio remanescente para aceitação da V1.0. |
| E14 | Metricas e Aprendizado | planned | Métricas geram recomendação editorial por canal. | Bloqueio remanescente para aceitação da V1.0. |
| E15 | Hardening V1.0 | planned | Demonstração ponta a ponta pelo frontend. | Gate principal da Sprint 12. |

## Histórico preservado

- Sprint 10 - Cortes Derivados Controlados foi concluída e integrada ao `main` via PR #17.
- O merge commit oficial da Sprint 10 é `dffd197449176fffab6ad6b93b6dfb0904cca513`.
- Sprint 9 - Renderização Controlada foi concluída e integrada ao `main` via PR #16.
- O merge commit oficial da Sprint 9 é `26e28c2f7ada057b0901e81b16e1bc0eb420a31c`.
- Sprint 5 - Editorial Pipeline foi concluída formalmente e integrada ao `main`.
- O merge commit oficial é `9d6393738cb26264b876fe6b9e43f1435fc3a229`.
- Sprint 4 - Channels Frontend Integration foi concluída e integrada ao `main` via PR #10.
- O merge commit oficial é `3ee439ca7e0ae414a68a459ab9fcba650e076148`.
- Sprint 3 - Channels Domain Foundation foi concluída e integrada ao `main` via PR #8.
- O merge commit oficial é `6bf1bfec40cafaa7d2228f040745127e7ede9041`.
- Sprint 2 - Backend Foundation foi concluída e integrada ao `main` via PR #6.
- O merge commit oficial é `20b7c503761840910d78ceec604d9f8de55c3e84`.
- Sprint 0.3 foi documental e não introduziu backend ou alteração funcional de frontend.
- Sprint 0.2 consolidou a preparação segura de variáveis de ambiente.

## Observações

- Esta página de planejamento não substitui specs.
- Mudança de escopo exige atualização documental antes de implementação.
- Não registrar conclusão de sprint sem evidência concreta.
- Não antecipar histórias futuras fora da Sprint 12 sem atualizar a spec e o backlog.
- Referências a fases posteriores permanecem downstream e não alteram a formalização da Sprint 12.
