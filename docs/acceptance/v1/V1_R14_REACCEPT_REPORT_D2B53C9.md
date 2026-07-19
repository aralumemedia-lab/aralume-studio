# Relatório do Reaceite Formal R14 — V1.0

## Veredito

**V1.0 ACCEPTED** — 18/18 critérios de aceite comprovados.

Não houve alteração funcional, correção de código de produto, merge, release, tag ou deploy durante o reaceite. A execução avaliou o produto no commit `d2b53c9e7bfe15c8116c07375ca4b604fce03e97` de `main`, com `main` e `origin/main` alinhados antes da prova. A documentação e as screenshots desta execução são artefatos novos, em diretório próprio.

## Governança

- Sprint: 22 — remediação dos findings da V1.
- Épico: E15.
- Spec de remediação: [`023-sprint-22-v1-remediation-findings.md`](../../specs/023-sprint-22-v1-remediation-findings.md).
- Spec de aceite: [`012-v1-acceptance.md`](../../specs/012-v1-acceptance.md).
- Histórico preservado: [`V1_ACCEPTANCE_MATRIX.md`](V1_ACCEPTANCE_MATRIX.md).

## Estado inicial

- Root Git efetivo: `C:\Users\carol\Documents\aralume-studio V2\aralume-studio`.
- Branch: `main`.
- `HEAD`, `main` e `origin/main`: `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`.
- Divergência: `0 0`; working tree limpa.
- PR #36: merged anteriormente; nenhum PR aberto para o HEAD avaliado.
- Nenhuma tag ou release apontava para o HEAD.
- Único worktree: o repositório principal.
- Nenhum processo da aplicação e nenhuma porta 3001/4173/8080 ativa.

## Findings reavaliados

Todos os findings materiais do reaceite anterior foram comprovados como remediados:

1. `AuditLog.requestId` está no campo direto, além de não depender de `metadata`.
2. Há auditoria para criação/alteração de pautas, pesquisas, roteiros, versões, planos visuais e cenas.
3. Leituras detalhadas validam o `channelId` ativo.
4. Cross-channel é rejeitado com resposta sanitizada e teste negativo.
5. Runner Sprint 15 existe e é reproduzível.
6. Runners 16–21 concluem com código correto.
7. Teardown encerra servidores e processos mesmo em falha; após cada execução houve zero órfãos e zero portas ocupadas.
8. Sprint 18 calcula o corte pela duração efetiva do vídeo; `início < fim`, `fim <= duração` e conflito/idempotência foram comprovados.
9. As asserções funcionais dos runners permanecem presentes; as operações continuam sendo feitas pelo frontend.

## Findings por severidade

- BLOCKER: nenhum.
- HIGH: nenhum.
- MEDIUM: nenhum.
- LOW / observações não bloqueantes: 18 erros globais de TypeScript preexistentes; warnings conhecidos de hydration/code-split; mensagens de encerramento de filhos durante teardown Windows. Nenhuma observação afetou o resultado funcional, o exit code ou o isolamento.

## Limitação TypeScript global

`npx tsc --noEmit` falhou com os mesmos 18 diagnósticos reproduzidos no baseline. Eles estão em testes/mocks e duas rotas já afetadas, não foram introduzidos nem agravados pela PR #36 e não atingem os contratos funcionais remediados. O backend typecheck, lint, suíte oficial (78/78), testes adicionais, build e todos os runners passaram. A limitação fica registrada e não impede o aceite formal desta V1.

## Resultado operacional

Runners 15, 16, 17, 18, 19, 20 e 21: **PASS individual**, todos com exit code `0`. Foram geradas 56 screenshots E2E, mais 5 screenshots suplementares frontend. Cada runner foi seguido de checagem com zero processo órfão e zero listener nas portas 3001, 4173 e 8080. A verificação final também encontrou zero processo da aplicação e nenhuma dessas portas ativa.

## Critérios V1

Os 18 critérios estão detalhados na [`matriz R14`](V1_R14_REACCEPT_MATRIX_D2B53C9.md), todos como `PASS`. A recomendação é iniciar a unidade de release da V1.0 apenas em fluxo separado, com revisão dos artefatos; não iniciar release, tag ou deploy como parte deste reaceite.
