# E18 - Traceability

| Critério V1 | R14 | Historia | Aceite | Tarefa | Contrato | Componente | Endpoint | Teste | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1-11 Qualidade tecnica | R14-11 | H18.1 | Qualidade revisada e visivel depois de reload | Implementar gate de qualidade e preservar o resultado | `QualityCheck`, `GET/POST /api/quality-checks` | `/approvals` | `GET/POST /api/quality-checks` | `server/test/governance.test.ts`, `src/tests/administration-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-12 Conformidade e direitos | R14-12 | H18.2 | Conformidade revisada e bloqueada quando necessario | Implementar gate de conformidade e preservar o bloqueio | `ComplianceCheck`, `GET/POST /api/compliance-checks` | `/compliance` | `GET/POST /api/compliance-checks` | `server/test/governance.test.ts`, `src/tests/administration-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-13 Aprovacao humana | R14-13 | H18.3 | Decisao humana persistida e visivel depois de reload | Implementar decisao humana com historico imutavel | `HumanApproval`, approval endpoints | `/approvals` | `POST /api/approvals/:id/approve`, `POST /api/approvals/:id/reject`, `POST /api/approvals/:id/request-changes` | `server/test/governance.test.ts`, `src/tests/administration-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |
| V1-14 Publicacao assistida | R14-14 | H18.4 | Rascunho ou pacote de publicacao visivel depois de reload | Implementar readiness e pacote sem auto-send | `PublicationTarget`, `PublicationJob`, `POST /api/publications` | `/publications` | `POST /api/publications`, `GET /api/publications`, `GET /api/publication-targets` | `server/test/publications.test.ts`, `src/services/publications-api.test.ts`, `src/tests/publications-route.test.ts`, `src/tests/audit-route.test.ts`, browser E2E | `docs/acceptance/v1/V1_ACCEPTANCE_MATRIX.md`, `V1_ACCEPTANCE_REPORT.md`, `V1_EVIDENCE_INDEX.md` |

## Dependency note

- E17 must be complete before E18 starts because governance depends on media, render and clip artifacts.
