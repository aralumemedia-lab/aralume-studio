# Release 1.0.0 - Production governance and operational readiness remediation

## Normative identification

- Unit: Release 1.0.0 operational readiness remediation
- Spec: `docs/specs/030-release-1.0.0-operational-readiness-remediation.md`
- Governing epic: E15 - Hardening V1.0
- Base: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`
- Branch: `codex/release-1.0.0-operational-readiness-remediation`
- Decision: Sprint 28 / Spec 029 remains the latest sprint unit. This release remediation is the next normative release unit and does not invent Sprint 29.
- Release state: V1.0 remains functionally accepted; release 1.0.0 remains NOT_READY until this remediation closes and a later integral release-readiness review is executed independently.

## Objective

Close the release-readiness blockers identified by PR #45 by creating repository-executable governance and operational artifacts and evidence, without authorizing release, tag or deploy.

## Scope

Included:

- RLS-01 deployment target, immutable artifact flow, staging topology, smoke and rollback drill.
- RLS-02 hosted CI workflows, CODEOWNERS, and documented branch-protection / ruleset requirements.
- RLS-03 production-like configuration and secret inventory formalization.
- RLS-04 executable runbooks for configuration, deployment, rollback, monitoring, browser acceptance and incident response.
- RLS-05 versioned monitoring dashboards, alert rules, thresholds and ownership.
- RLS-07 consolidated browser / runner acceptance evidence with explicit per-step exit codes.

Excluded:

- RLS-06 hydration triage, unless a later unit explicitly absorbs it with a reproducible regression.
- New product features, new content capabilities, or unrelated refactors.
- Release, tag, deployment, or publication authorization.
- Production infrastructure changes outside the repository evidence and configuration surface.

## Remediation items

### RLS-01 - Deployable staging topology and artifact flow

- Define a representative staging target for the current runtime.
- Add the executable artifact definition and immutable build flow.
- Provide a compose-based topology or equivalent repository-local deployment manifest.
- Document startup, smoke, shutdown, pause and rollback criteria.

Acceptance:

- A buildable artifact exists and is identified by immutable commit / digest metadata.
- The staging topology is reproducible from the repository.
- Smoke checks prove health, readiness and graceful shutdown in the staging model.

### RLS-02 - Hosted CI, ownership and branch controls

- Add hosted workflows for the required release gates.
- Add `CODEOWNERS` with verifiable owners.
- Document the exact branch-protection and ruleset settings that remain administrative if they cannot be applied from the repository.

Acceptance:

- The repository contains the required workflow definitions.
- The repository contains an actionable owner map.
- Remaining branch-protection work is explicitly documented as an external administrative dependency, not as silent approval.

### RLS-03 - Production-like configuration and secrets

- Formalize the current environment inventory and the staging / production configuration contract.
- Keep `.env.example` placeholder-only.
- Document the secret and storage surface without recording real values.
- Verify fail-closed startup against missing or invalid production-like inputs.

Acceptance:

- The configuration matrix is complete and reproducible.
- Production-like startup fails closed before listeners open when required values are missing.
- Secret handling remains redacted in logs, docs and evidence.

### RLS-04 - Executable operational runbooks

- Reconcile deployment, rollback, configuration, monitoring, browser acceptance and incident response into runnable procedures.
- Ensure commands refer to real scripts, real paths and real exit conditions.

Acceptance:

- Each runbook can be executed or validated from the repository.
- Historical templates no longer contradict the current operational evidence.

### RLS-05 - Monitoring, dashboards, alerts and ownership

- Version the monitoring surfaces and alert rules for the current runtime.
- Bind each signal to an owner or to an explicit external administrative dependency.
- Keep labels bounded and avoid high-cardinality keys.

Acceptance:

- Dashboard / alert definitions are versioned in the repository.
- Thresholds and ownership are explicit.
- The monitoring model is testable from local or disposable execution.

### RLS-07 - Consolidated acceptance evidence

- Produce a single evidence report for the remediation unit.
- Record the commands, exit codes and artifacts for the required gates.
- Ensure each browser / runner step has an independently recorded result.

Acceptance:

- The evidence is consolidated and reproducible.
- The runner / browser results are individually attributable.

## Validation

This unit validates the repository artifacts with the available local and hosted commands, including:

- `git diff --check`
- `npm run lint`
- `npm run backend:check`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `bun install --frozen-lockfile`
- `bun audit`
- secret scan
- hosted workflows for the release gates
- release smoke / staging drill commands
- port and orphan-process checks

## Evidence expected

- `docs/releases/1.0.0/OPERATIONAL_READINESS_REMEDIATION.md`
- updated release notes, checklist, scope and blocker inventory
- hosted workflow definitions and their run logs
- the executable staging / smoke manifest
- runbooks for deployment, rollback, configuration, monitoring, incident response and browser acceptance

## Definition of done

- The remediation artifacts exist and are coherent with the current repository state.
- The blockers in scope are either closed in-repo or explicitly marked as external administrative conditions.
- RLS-06 remains a separate residual risk unless a later unit proves a reproducible fix.
- No release, tag or deploy is authorized by this unit.

