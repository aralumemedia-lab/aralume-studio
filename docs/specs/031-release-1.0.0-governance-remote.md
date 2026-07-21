# Release 1.0.0 - Governance remote and promotion authorization

## Normative identification

- Unit: Release 1.0.0 governance remote and promotion authorization
- Spec: `docs/specs/031-release-1.0.0-governance-remote.md`
- Governing epic: E15 - Hardening V1.0
- Base: `27ef340038d8929e3728ee2d97bb9d1ad65dd689`
- Branch: `codex/release-1.0.0-governance-remote`
- Decision: this is the next normative release-level unit after the operational readiness remediation. It does not invent a new sprint number.
- Release state: V1.0 remains functionally accepted; release 1.0.0 remains NOT_READY until this unit is validated and the later independent release-readiness review completes.

## Objective

Close the remote governance blockers for release promotion by making branch protection, rulesets, protected promotion environment and owner coverage executable and reproducible from repository evidence, while keeping the policy executable for a single-maintainer repository and without authorizing release, tag or deploy.

## Scope

Included:

- main branch protection with PR obligation, required checks, and conversation resolution.
- main branch ruleset that blocks deletion and non-fast-forward updates.
- protected production environment for promotion authorization.
- CODEOWNERS coverage for release-governance surfaces.
- repository evidence for the GitHub API state.

Excluded:

- product feature changes.
- CI workflow implementation beyond existing checks.
- release publication.
- tag creation.
- deploy execution.
- production secret values.

## Remediation items

### GR31-01 - Main branch protection

- Ensure main requires pull requests, zero required human approvals, stale review dismissal, no code owner review gate, conversation resolution, and required checks.
- Block force pushes, deletions, and direct pushes to main.

Acceptance:

- Branch protection is active and queryable.
- Required checks use the real workflow names present in the repository.

### GR31-02 - Main ruleset

- Create an active branch ruleset for `refs/heads/main`.
- Block deletion and non-fast-forward changes.
- Keep bypass actors empty.

Acceptance:

- Ruleset is active and visible through the GitHub API.
- Ruleset does not contradict branch protection.

### GR31-03 - Protected promotion environment

- Create a protected production environment for promotion authorization.
- Require reviewers and disallow administrator bypass.
- Keep the deployment branch policy restricted to protected branches.

Acceptance:

- The environment exists and is protected.
- Promotion requires the documented approval gate.

### GR31-04 - Ownership surface

- Maintain CODEOWNERS coverage for workflows, release documentation, runbooks, security-sensitive backend surfaces, and recovery/deploy surfaces.
- CODEOWNERS remains an attribution and responsibility surface, not a merge gate in the single-maintainer model.

Acceptance:

- CODEOWNERS exists and maps the governance surface to a verifiable owner.

## Validation

This unit validates the repository artifacts and GitHub state with the available local and remote commands, including:

- `git diff --check`
- GitHub API queries for branch protection, rulesets, environments, and PR state
- `npm run lint`
- `npm run backend:check`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `bun install --frozen-lockfile`
- `bun audit`
- `npm run secret:scan`
- release smoke / browser acceptance
- port and orphan-process checks

## Evidence expected

- `docs/releases/1.0.0/GOVERNANCE_REMOTE_READINESS.md`
- updated release notes, checklist, handoff, roadmap and backlog references
- branch protection snapshot
- ruleset snapshot
- production environment snapshot
- CODEOWNERS snapshot

## Definition of done

- `main` is protected with the documented checks and PR rules.
- The `main-governance` ruleset is active.
- The production environment is protected and promotion is gated.
- CODEOWNERS covers the governance surfaces with a verifiable owner, without creating an impossible human-approval gate.
- No release, tag or deploy is authorized by this unit.
