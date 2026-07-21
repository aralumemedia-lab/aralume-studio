# Aralume Studio V1.0.0 - Governance Remote Readiness

Status: READY FOR REVIEW
Release status: NOT READY

## Summary

This document records the remote governance remediation for release 1.0.0. It closes the repository-level blockers that prevented an executable promotion gate:

- `main` lacked branch protection.
- `main` lacked an active ruleset.
- production promotion lacked a protected environment contract.
- the governance surfaces were covered only by a wildcard owner mapping.

The controls were applied without creating a release, tag or deploy.

## Baseline before remediation

- Branch: `codex/release-1.0.0-governance-remote`
- Base: `27ef340038d8929e3728ee2d97bb9d1ad65dd689`
- `main` protection: absent
- `main` rulesets: absent
- `production` environment: absent
- required status checks on `main`: not enforced by branch protection
- CODEOWNERS: wildcard-only owner map

## Controls applied

### Branch protection on `main`

- required pull request reviews: 0
- dismiss stale reviews: enabled
- code owner reviews: not required as a merge gate
- conversation resolution: required
- checks required: `gates`, `security`, `smoke`
- enforce administrators: enabled
- force pushes: blocked
- deletions: blocked

### Ruleset on `main`

- ruleset name: `main-governance`
- target: branch
- ref scope: `refs/heads/main`
- enforcement: active
- rules:
  - deletion
  - non_fast_forward
- bypass actors: none
- current user bypass: never

### Protected production environment

- environment name: `production`
- protected branches only: enabled
- custom branch policies: disabled
- administrator bypass: disabled
- required reviewers: the repository owner account available in this repository context
- self-review prevention: disabled so the gate remains executable with the single verifiable collaborator available in this repo

### Single-maintainer compensating model

- The repository has one verifiable human maintainer in the current context.
- PR obligation, required checks, conversation resolution, protected branch rules, and the protected production environment remain in force.
- Review assistance from an agent or subagent is evidence and analysis only; it is not a GitHub approval.
- When a second legitimate maintainer is added later, the human approval gate should be re-evaluated and re-enabled if the repository policy can support it without creating an impossible merge gate.

### CODEOWNERS

- Governance surfaces were updated to use explicit owner mappings for workflows, release documentation, runbooks, security-sensitive backend surfaces, and recovery/deploy paths.
- The repository only exposes one verifiable collaborator (`aralumemedia-lab`), so the owner mapping uses that identity consistently.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| Branch protection | PASS | GitHub API snapshot for `branches/main/protection` |
| Ruleset | PASS | GitHub API snapshot for `rulesets` |
| Production environment | PASS | GitHub API snapshot for `environments/production` |
| CODEOWNERS coverage | PASS | `.github/CODEOWNERS` |
| Repository diff hygiene | PASS | `git diff --check` |

## Residual risk

- The repository has a single verifiable collaborator, so the promotion reviewer gate is formalized but not distributed across multiple distinct human owners in the current repo context.
- The current policy is intentionally executable for a single-maintainer repository; it does not claim segregation of duties that the repository cannot support.
- This unit does not authorize release, tag or deploy.
- Release 1.0.0 remains NOT READY until the later independent release-readiness review is executed.
