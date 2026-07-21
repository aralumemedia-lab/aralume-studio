# Aralume Studio V1.0.0 — Validation Matrix

| Gate | Criterion | Command or flow | Evidence | Result | Risk |
| --- | --- | --- | --- | --- | --- |
| RLS-01 | artifact and staging topology | Docker / compose build and smoke | build log, smoke log | NOT YET VALIDATED | deployability |
| RLS-02 | hosted CI and ownership | GitHub Actions and CODEOWNERS | workflow files and run logs | NOT YET VALIDATED | unvalidated integration |
| RLS-03 | configuration and secrets | startup validation and env inventory | env docs and startup output | PARTIALLY VALIDATED | fail-open config |
| RLS-04 | runbooks | executable docs with real commands | runbook docs | NOT YET VALIDATED | operator error |
| RLS-05 | monitoring | dashboards / alerts / owners | versioned definitions | NOT YET VALIDATED | blind operation |
| RLS-07 | consolidated evidence | browser / runner matrix | evidence report | NOT YET VALIDATED | fragmented review |
