# E17 - Traceability

| Critério V1 | R14 | Historia | Aceite | Tarefa | Contrato | Componente | Endpoint | Teste | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1-07 Narracao autorizada | R14-07 | H17.1 | Narracao criada ou atualizada e visivel depois de reload | Implementar mutacao de narracao e remover qualquer mascaramento mock | `MediaAssetBase`, `NarrationAsset`, `POST/PATCH /api/media-assets` | `/media-assets` | `POST/PATCH /api/media-assets`, `GET /api/media-assets?channelId=` | `server/test/media-assets.test.ts`, `src/services/media-assets-api.test.ts`, `src/tests/media-assets-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-08 Ativos rastreaveis | R14-08 | H17.2 | Ativo visual novo e visivel depois de reload | Implementar registro de ativo e validar procedencia/integridade | `MediaAssetBase`, `VisualAsset`, `POST/PATCH /api/media-assets` | `/media-assets` | `POST/PATCH /api/media-assets`, `GET /api/media-assets?channelId=` | `server/test/media-assets.test.ts`, `src/services/media-assets-api.test.ts`, `src/tests/media-assets-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-09 Render controlado | R14-09 | H17.3 | Render iniciado e visivel depois de reload | Implementar inicio de render e remover dependencia de mock | `RenderJob`, `POST /api/renders`, `GET /api/renders` | `/videos` | `POST /api/renders`, `GET /api/renders`, `GET /api/videos` | `server/test/renders.test.ts`, `src/services/renders-api.test.ts`, `src/tests/videos-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-10 Corte derivado | R14-10 | H17.4 | Corte criado e visivel depois de reload | Implementar criacao de corte e validar intervalo | `DerivedClip`, `POST /api/clips`, `GET /api/clips/:id` | `/clips` | `POST /api/clips`, `GET /api/clips/:id` | `server/test/clips.test.ts`, `src/routes/clips.tsx`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |

## Dependency note

- E16 must be complete before E17 starts because the media flow depends on editorial context.
