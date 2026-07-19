# Comandos e resultados do R14 — V1.0

Execução em 2026-07-19, sobre o SHA funcional `d2b53c9e7bfe15c8116c07375ca4b604fce03e97`.

| Comando/validação | Resultado |
|---|---|
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `node --import tsx --test ...` testes adicionais de auditoria/isolamento | PASS — 7/7 |
| `npm test` | PASS — 78/78, sem skip/cancel/todo |
| `npm run build` | PASS |
| `npx tsc --noEmit` | FAIL conhecido — 18 diagnósticos preexistentes e idênticos ao baseline |
| Runner Sprint 15 | PASS — exit 0; 3 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 16 | PASS — exit 0; 8 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 17 | PASS — exit 0; 6 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 18 | PASS — exit 0; 11 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 19 | PASS — exit 0; 7 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 20 | PASS — exit 0; 7 screenshots; 0 órfãos; 0 portas |
| Runner Sprint 21 | PASS — exit 0; 14 screenshots; 0 órfãos; 0 portas |
| Prova frontend suplementar V1-02/V1-15–V1-18 | PASS — 5 screenshots; persistência, isolamento, custos, métricas, recomendação e histórico |
| Verificação final de processos | PASS — nenhum processo da aplicação; apenas o kernel do Codex |
| Verificação final de portas 3001/4173/8080 | PASS — nenhuma porta em listen |

Os sete runners foram executados sequencialmente com:

```powershell
$env:ARALUME_EVIDENCE_DIR="screenshots/r14-reaccept-20260719-d2b53c9"
node scripts/sprint15-browser-e2e.mjs
node scripts/sprint16-browser-e2e.mjs
node scripts/sprint17-browser-e2e.mjs
node scripts/sprint18-browser-e2e.mjs
node scripts/sprint19-browser-e2e.mjs
node scripts/sprint20-browser-e2e.mjs
node scripts/sprint21-browser-e2e.mjs
```

O diretório exclusivo contém 61 PNGs: 56 dos runners e 5 da prova frontend suplementar. A matriz histórica [`V1_ACCEPTANCE_MATRIX.md`](V1_ACCEPTANCE_MATRIX.md) não foi sobrescrita.

## Diagnósticos TypeScript globais

Os 18 diagnósticos são os mesmos do baseline: `server/test/clips.test.ts` (6), `server/test/editorial.test.ts` (4), `server/test/metrics.test.ts` (1), `src/mocks/mock-metrics.ts` (4), `src/routes/media-assets.tsx` (2) e `src/routes/production.tsx` (1). A PR de remediação apenas acrescentou asserções de auditoria em `server/test/metrics.test.ts`; o diagnóstico permanece em linha não relacionada. Em `src/routes/production.tsx`, o diagnóstico em linha 270 já existia no baseline e a alteração da PR foi em outra chamada. Não há diagnóstico novo nem agravado em contrato funcional alterado.
