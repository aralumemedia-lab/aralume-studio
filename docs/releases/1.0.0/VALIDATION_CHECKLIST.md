# Aralume Studio V1.0.0 — Validation Checklist

Status: **NOT READY**

## Build and code gates

- [x] `git diff --check`
- [x] lint
- [x] backend typecheck
- [x] frontend/global `npx tsc --noEmit`
- [x] official test suite
- [x] build
- [x] dependency audit captured
- [ ] production configuration validation
- [ ] backup/restore drill
- [ ] rollback drill
- [ ] authenticated ingress and API authorization test
- [ ] readiness/metrics/alerts test

## Security and runtime gates

- [x] no hardcoded secret found by initial pattern scan
- [x] local anonymous HTTP probe captured
- [ ] close 55 deferred security worklist rows
- [ ] resolve or formally accept dependency advisories
- [ ] verify filesystem permissions and storage isolation in production topology
- [ ] verify external integration credentials and redirect policy
- [ ] verify no orphaned processes and required ports after smoke execution

## V1 functional preservation

The R14 evidence remains the governing functional acceptance: V1-01 through V1-18 are accepted at the functional SHA. This checklist does not supersede or overwrite that historical matrix.
