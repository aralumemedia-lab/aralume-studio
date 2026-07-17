# E17 - Traceability

| Critério V1 | R14 | Historia | Aceite | Tarefa | Contrato | Componente | Endpoint | Teste | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1-07 Narracao autorizada | R14-07 | H17.1 | Narracao criada ou atualizada e visivel depois de reload | Implementar mutacao de narracao e remover qualquer mascaramento mock | `MediaAssetBase`, `MediaAssetCreateInput`, `MediaAssetPatchInput` | `/media-assets` | `POST/PATCH /api/media-assets`, `GET /api/media-assets/:id`, `GET /api/media-assets?channelId=` | `server/test/media-assets.test.ts`, `src/services/media-assets-api.test.ts`, `src/tests/media-assets-route.test.ts`, `scripts/sprint17-browser-e2e.mjs` | `screenshots/sprint-17/media-assets-1600-success.png`, `screenshots/sprint-17/media-assets-1792-reload.png`, audit assertion in the browser runner; official V1 status remains in `docs/acceptance/v1/` |
| V1-08 Ativos rastreaveis | R14-08 | H17.2 | Ativo visual novo e visivel depois de reload | Implementar registro de ativo e validar procedencia/integridade | `MediaAssetBase`, `MediaAssetCreateInput`, `MediaAssetPatchInput` | `/media-assets` | `POST/PATCH /api/media-assets`, `GET /api/media-assets/:id`, `GET /api/media-assets?channelId=` | `server/test/media-assets.test.ts`, `src/services/media-assets-api.test.ts`, `src/tests/media-assets-route.test.ts`, `scripts/sprint17-browser-e2e.mjs` | `screenshots/sprint-17/media-assets-1600-error.png`, `screenshots/sprint-17/media-assets-1792-reload.png`, `screenshots/sprint-17/media-assets-1920-isolation.png`; official V1 status remains in `docs/acceptance/v1/` |

## Dependency note

- E16 must be complete before E17 starts because the media flow depends on editorial context.
- H17.3 and H17.4 remain in the next E17 slice and are intentionally excluded from this traceability block.
