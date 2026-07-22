# Aralume Studio V1.0.0 — Validation Matrix

| Gate | Criterion | Command or flow | Evidence | Result | Risk |
| --- | --- | --- | --- | --- | --- |
| RLS-01 | artifact and staging topology | Docker / compose build and smoke | build log, smoke log, `RELEASE_GATE_CLOSURE.md` | VERIFIED_CLOSED | promotion still needs later independent release decision |
| RLS-02 | hosted CI and ownership | GitHub Actions and CODEOWNERS | workflow files, run logs, remote snapshots, `RELEASE_GATE_CLOSURE.md` | VERIFIED_CLOSED | single-maintainer governance is an organizational constraint |
| RLS-03 | configuration and secrets | startup validation and env inventory | env docs, startup output, `RELEASE_GATE_CLOSURE.md` | VERIFIED_CLOSED | no material current gate risk |
| RLS-04 | runbooks | executable docs with real commands | runbook docs, recovery command validation | VERIFIED_CLOSED | runbooks still need future drift management |
| RLS-05 | monitoring | dashboards / alerts / owners | versioned definitions and readiness docs | VERIFIED_CLOSED | ownership remains documented, not socialized |
| RLS-07 | consolidated evidence | browser / runner matrix | evidence report, browser logs, runner logs | VERIFIED_CLOSED | candidate-specific evidence only |
