# Aralume Studio 1.0.0 — Candidate scope

Candidate: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`

## Included, traceable capability

| Item | Type | Sprint/spec | Integration | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Editorial multichannel flow, V1-01 to V1-18 | Product | R14 / Spec 012 | PR #37 | `V1_R14_REACCEPT_*_D2B53C9` | Historical functional acceptance |
| Inbound auth, role/channel authorization and media boundary | Security | Sprint 24 / Spec 025 | PR #39 | Sprint 24 evidence; current focused auth tests | Current local regression PASS |
| Typecheck, dependency and deterministic E2E hardening | Technical | Sprints 25–26 / Specs 026–027 | PRs #41–42 | Sprint 25/26 evidence | Current lint/typecheck/audit PASS |
| Fail-closed production-like configuration and filesystem recovery | Operations | Sprint 27 / Spec 028 | PR #43 | Sprint 27 evidence; current recovery drill | Current local regression PASS |
| Liveness/readiness, structured logs, metrics and ingress policy | Operations | Sprint 28 / Spec 029 | PR #44 | Sprint 28 evidence; current observability tests | Current local regression PASS |

## Explicit exclusions from this release authorisation

- A production deployment, tag, GitHub release or external publication.
- A defined production account, DNS/TLS endpoint, secret manager or real
  production credentials.
- A deployed database/storage topology and a real deployment/rollback drill.
- Hosted CI, protected branches, rulesets, CODEOWNERS and required reviews.
- External-provider production validation and paid/real-provider execution.

## Candidate changes after functional acceptance

The post-R14 change set adds security, dependency, recovery and observability
hardening. It does not replace R14 functional evidence with a production
deployment claim. The final candidate has no untracked release artifact or
version tag.
