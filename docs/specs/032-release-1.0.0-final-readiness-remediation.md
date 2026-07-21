# Release 1.0.0 - Final readiness remediation

## Normative identification

- Unit: Release 1.0.0 final readiness remediation
- Spec: `docs/specs/032-release-1.0.0-final-readiness-remediation.md`
- Governing epic: E15 - Hardening V1.0
- Base: `d6bac872f5bcc99b3cba38ce925832007474fa12`
- Branch: `codex/release-1.0.0-final-readiness-remediation`
- Decision: this is the next normative release-level unit after the governance remote remediation. It does not invent a new sprint number.
- Release state: V1.0 remains functionally accepted; release 1.0.0 remains NOT_READY until this unit is validated and the later independent release-readiness review completes.

## Objective

Close the three residual final-readiness findings without widening product scope:

1. canonicalize the operational recovery command;
2. eliminate the browser hydration mismatch material to the release gate;
3. reconcile governance documentation with the live remote state.

## Scope

Included:

- one canonical recovery command that works on clean installs without exposing loader details;
- browser acceptance regression that fails on hydration mismatch and validates the clean path deterministically;
- hydration fix that removes the material server/client attribute divergence;
- governance documentation aligned to the current branch protection, ruleset, environment and CODEOWNERS state;
- evidence and validation updates for the final readiness review.

Excluded:

- release publication;
- tag creation;
- deploy execution;
- product feature changes unrelated to the three findings;
- unrelated dependency or runtime hardening.

## Remediation items

### FR32-01 - Canonical recovery command

- Expose a single documented command for backup / restore / rollback validation.
- Hide loader and invocation details behind the script entry point.
- Keep the command reproducible on clean installs and on Windows / POSIX shells.

Acceptance:

- the documented command executes successfully;
- the same command appears in the runbook, checklist, and evidence;
- the helper keeps the underlying loader details out of operator-facing docs.

### FR32-02 - Hydration mismatch elimination

- Reproduce the browser mismatch against a clean run.
- Remove the material source of server/client divergence.
- Add a regression that captures browser console errors and fails on hydration mismatch.

Acceptance:

- browser acceptance passes without hydration mismatch console errors;
- the regression remains reproducible on clean runs;
- cleanup leaves no residual preview / browser processes or occupied ports.

### FR32-03 - Governance documentation alignment

- Reconcile all release-level governance documentation to the live repository state.
- Preserve the single-maintainer operating model with PR obligation, required checks, conversation resolution, admin protection, ruleset enforcement, and no broad bypass.
- Remove stale references to a required independent human approval or code owner review gate.

Acceptance:

- documentation matches the remote branch protection, ruleset, production environment, and CODEOWNERS state;
- the single-maintainer model is documented as compensating process, not as a fake GitHub approval;
- no normative document claims `READY_FOR_RELEASE`.

## Validation

This unit validates the repository artifacts and GitHub state with the available local and remote commands, including:

- `git diff --check`
- `bun install --frozen-lockfile`
- `npm run lint`
- `npm run backend:check`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `bun audit`
- `npm run secret:scan`
- canonical recovery command
- `npm run release:smoke`
- `npm run release:browser`
- hydration regression capture
- release governance snapshots via GitHub API
- port and orphan-process checks

## Evidence expected

- `docs/releases/1.0.0/FINAL_READINESS_REMEDIATION.md`
- updated rollback runbook and release readiness checklist
- aligned governance readiness documentation
- branch protection snapshot
- ruleset snapshot
- production environment snapshot
- browser acceptance logs with zero material hydration errors

## Definition of done

- the canonical recovery command is documented and executable;
- the browser acceptance regression is clean and deterministic;
- the release-level governance documentation matches the live remote state;
- the final readiness remediation evidence is recorded;
- release 1.0.0 remains NOT READY until the later independent release-readiness review is completed.
