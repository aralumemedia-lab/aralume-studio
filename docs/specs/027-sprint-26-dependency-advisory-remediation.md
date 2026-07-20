# Sprint 26 - Dependency advisory remediation

## Normative identification

- Sprint: Sprint 26
- Spec: `docs/specs/027-sprint-26-dependency-advisory-remediation.md`
- Governing epic: E15 - V1.0 hardening
- Base: `7a4c082ea7a3b78d1aa58fcccbf699cafe42b016`
- Branch: `codex/sprint-26-dependency-advisory-remediation`
- Decision: the normative records end at Sprint 25 / Spec 026 and reserve no later unit. Sprint 26 / Spec 027 is therefore registered as the next unit before implementation.
- Release state: V1.0 remains functionally accepted; release 1.0.0 remains `NOT_READY`.

## Objective

Remediate only the two currently reproducible Bun audit advisories with the
smallest compatible dependency change:

- `brace-expansion` `5.0.6` to `5.0.7`;
- `js-yaml` `4.2.0` to `4.3.0`.

The change must preserve the existing dependency manager, package contracts,
lockfile reproducibility, lint/build behavior, and application functionality.

## Scope

Included:

- dependency-tree confirmation and advisory baseline;
- exact override updates in `package.json`;
- corresponding minimal `bun.lock` update;
- audit, frozen-install, compatibility, and project quality gates;
- reproducible evidence and review-ready draft PR.

Excluded:

- productive configuration or secrets;
- backup, restore, rollback, observability, topology, ingress, CI, or branch protection;
- tag, release, deployment, or integral release-readiness reassessment;
- unrelated package upgrades or package-manager changes.

## Dependency analysis

The baseline chains are tooling-oriented and transitive:

- `brace-expansion`: `eslint -> @eslint/eslintrc -> minimatch -> brace-expansion` and `typescript-eslint -> typescript-estree -> minimatch -> brace-expansion`;
- `js-yaml`: `eslint -> @eslint/eslintrc -> js-yaml` and `@tanstack/react-start -> @tanstack/start-plugin-core -> xmlbuilder2 -> js-yaml`.

The application does not import either package directly. The minimum safe
strategy is to update the existing exact overrides, regenerate only the
corresponding lockfile records, and reject unrelated lockfile churn.

## Acceptance gates

- `bun audit` exits 0 with zero vulnerabilities;
- `bun install --frozen-lockfile` succeeds;
- `package.json` and `bun.lock` resolve `brace-expansion@5.0.7` and `js-yaml@4.3.0`;
- lint, backend check, typecheck, tests, build, lifecycle, identity/readiness, and runners 15-21 plus HMAC pass;
- minimatch/brace expansion and YAML tooling compatibility checks pass with bounded inputs;
- no package-lock, release, tag, deploy, or unrelated dependency update is introduced;
- evidence records commands, exit codes, versions, chains, risks, and the unchanged `NOT_READY` release state.

## Residual release work

This unit does not authorize production. Productive configuration and secrets,
recovery and rollback, observability, topology/ingress, and final release
readiness evaluation remain separate units.
