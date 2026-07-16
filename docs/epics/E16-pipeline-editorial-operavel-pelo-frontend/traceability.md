# E16 - Traceability

| CritÃ©rio V1 | R14 | Historia | Aceite | Tarefa | Contrato | Componente | Endpoint | Teste | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1-02 Perfil editorial | R14-02 | H16.0 | Abrir o perfil do canal, salvar e ver o mesmo estado apos reload | Implementar mutacao de perfil e remover qualquer mascaramento mock | `Channel`, `ChannelSettings`, `GET/PATCH /api/channels/:id` | `/channels` | `GET/PATCH /api/channels/:id`, `GET /api/channels/:id/settings` | `server/test/channels.test.ts`, `src/services/channels-api.test.ts`, `src/tests/channels-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-03 Pauta | R14-03 | H16.1 | Criar ideia, recarregar e ver o mesmo ID no mesmo canal | Implementar mutacao de pauta e remover mock da acao primaria | `ContentIdea`, `POST/PATCH /api/content-ideas`, error envelope | `/ideas` | `POST /api/content-ideas`, `PATCH /api/content-ideas/:id`, `GET /api/content-ideas?channelId=` | `server/test/editorial.test.ts`, `src/services/editorial-api.test.ts`, `src/tests/editorial-route-integrations.test.ts`, route tests, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-04 Pesquisa e fontes | R14-04 | H16.2 | Criar sessao, fonte e claim e reabrir o mesmo recorte | Implementar mutacoes de pesquisa e validacao de URL/vinculo | `ResearchSession`, `ResearchSource`, `ClaimEvidence` | `/research` | `POST /api/research-sessions`, `POST /api/research-sessions/:id/sources`, `POST /api/research-sessions/:id/claims`, `GET /api/research-sessions?channelId=` | `server/test/editorial.test.ts`, `src/services/editorial-api.test.ts`, `src/tests/editorial-route-integrations.test.ts`, route tests, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-05 Roteiro versionado | R14-05 | H16.3 | Criar roteiro, criar segunda versao e preservar a primeira | Implementar criacao/versionamento e historia navegavel | `Script`, `ScriptVersion`, `POST/PATCH /api/scripts`, `GET/POST /api/scripts/:id/versions` | `/scripts` | `GET/POST /api/scripts`, `GET/POST /api/scripts/:id/versions` | `server/test/editorial.test.ts`, `src/services/editorial-api.test.ts`, `src/tests/editorial-route-integrations.test.ts`, route tests, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-06 Planejamento visual | R14-06 | H16.4 | Criar plano visual, criar cenas e reabrir o mesmo plano ordenado | Definir e expor a superficie visual do fluxo editorial | `VisualPlan`, `ScenePlan`, `POST/PATCH /api/visual-plans`, `POST /api/visual-plans/:id/scenes` | `/production` ou painel editorial equivalente | `GET/POST /api/visual-plans`, `GET/PATCH /api/visual-plans/:id`, `POST /api/visual-plans/:id/scenes` | `server/test/editorial.test.ts`, `src/services/editorial-api.test.ts`, `src/tests/editorial-route-integrations.test.ts`, route/panel tests, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |

## Dependency note

- V1-02 / R14-02 is an upstream dependency for channel context and editorial profile alignment.
- It is included in the first epic bundle as H16.0 because the editorial flow depends on it.

## Sprint 15 note

- Covered now: V1-02, V1-03 and V1-04.
- Covered now: V1-05 and V1-06.
- H16.3 and H16.4 are delivered in the Sprint 16 slice.
