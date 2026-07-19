# V1 Sprint 22 - Remediation Evidence

Status of this evidence package: `REMEDIATION COMPLETE; R14-REACCEPT PENDING`.

This document supplements, and does not overwrite, the historical V1 acceptance
report and matrix. The governing unit is Sprint 22, under E15, with
[`023-sprint-22-v1-remediation-findings.md`](../../specs/023-sprint-22-v1-remediation-findings.md)
as its governing spec.

## Reproducible commands

All commands were run from the effective Git root with a clean, isolated E2E
evidence destination:

```text
git diff --check                                      PASS
npm run lint                                          PASS
npm run backend:check                                PASS
npm test                                              PASS (78/78)
node --import tsx --test server/test/metrics.test.ts server/test/sprint22-remediation.test.ts
                                                       PASS (6/6)
npx tsc --noEmit                                     FAIL (pre-existing unrelated errors)
npm run build                                         PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint15-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint16-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint17-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint18-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint19-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint20-browser-e2e.mjs
                                                       PASS
ARALUME_EVIDENCE_DIR=screenshots/sprint-22-remediation node scripts/sprint21-browser-e2e.mjs
                                                       PASS
```

The E2E runners produced 56 PNG artifacts under
`screenshots/sprint-22-remediation/sprint-15` through `sprint-21`. Historical
`screenshots/sprint-15` through `screenshots/sprint-21` directories were not
overwritten.

## Finding coverage

| Finding / criterion | Evidence |
| --- | --- |
| `AuditLog.requestId` is structured | `server/test/sprint22-remediation.test.ts`, `server/test/metrics.test.ts`, and Sprint 15 E2E audit readback assert direct `requestId` and absence of `metadata.requestId`. |
| Audit for pauta/research/script/version/visual plan/scene create/update | Sprint 22 regression and Sprint 15–16 E2E flows assert the expected action set and request correlation. |
| Detailed script/version/visual-plan/scene reads require active `channelId` | Sprint 22 regression covers missing channel (`400`), active channel (`200`), and mismatched channel (`404`). |
| Sanitized cross-channel rejection | Sprint 22 regression asserts generic `NOT_FOUND`, no expected/received channel identifiers, and no stack trace. |
| Missing Sprint 15 runner | `scripts/sprint15-browser-e2e.mjs`, passed; covers V1-03 and V1-04 browser mutations and channel isolation. |
| Sprint 17 exit and teardown | Runner uses direct child processes, hidden Windows processes, recursive teardown, and explicit `runE2E` exit propagation; passed. |
| Sprint 18 timeout/assertion/cleanup | Runner uses explicit browser timeouts, deterministic enabled-button assertion, and recursive teardown; passed. |
| E2E teardown for Sprints 15–21 | All seven runners use `finally` cleanup; process/port verification below found no runner process or listening E2E port. |

## V1 flow evidence

- V1-03 and V1-04: Sprint 15 created and altered a pauta, created a research
  session, source and claim, reloaded, checked audit correlation, and verified
  that the record did not appear in the second channel.
- V1-05 and V1-06: Sprint 16 created a versioned script, a visual plan and two
  scenes, reloaded the production flow, and exercised duplicate/conflict and
  channel-isolation paths.
- V1-07 and V1-08: Sprint 17 created narration and visual assets with the
  existing provenance/integrity assertions and checked channel isolation.
- V1-09 and V1-10: Sprint 18 executed a controlled render and derived clip,
  asserted completion/audit correlation, replay conflict, reload, and
  cross-channel rejection.
- V1-01, V1-02 and V1-11 through V1-18 remain outside this remediation change;
  their existing evidence and the Sprint 19–21 supplemental runs are preserved.
  The historical formal statuses remain unchanged until R14-REACCEPT.

## Process and port check

After the E2E suite, a Windows process query found no `vite`, `tsx`, or Sprint
15–21 runner process, and a listening-port query found no process on ports
`3001`, `4173`, or `8080`. Temporary Sprint 18–21 storage roots were removed by
their runners.

## Known limitation

The repository-wide `npx tsc --noEmit` remains red on unrelated type errors in
clips tests, publication mocks, metrics tests and media-assets routes. The
required backend typecheck, lint, official tests and production build pass.
Those errors are outside this Sprint 22 remediation package and were not
changed.

No release, tag, deploy, external publication, or final V1 reaccept was run.
