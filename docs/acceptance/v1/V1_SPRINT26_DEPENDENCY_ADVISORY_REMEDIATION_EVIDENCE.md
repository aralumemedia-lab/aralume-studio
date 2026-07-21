# V1.0.0 - Sprint 26 dependency advisory remediation evidence

Status: **READY FOR REVIEW; RELEASE NOT_READY**

Date: 2026-07-20
Base: `7a4c082ea7a3b78d1aa58fcccbf699cafe42b016`
Documental/final HEAD: `cf772c1`
Functional code HEAD before this documentation-only update: `63cbe77`
Branch: `codex/sprint-26-dependency-advisory-remediation`

This evidence covers only the two Bun audit advisories. It does not authorize
configuration, secrets, backup, restore, rollback, observability, topology,
CI, branch protection, tag, release, deployment, or integral release
readiness.

## Normative decision

The preflight reviewed the repository instructions, SDD process, project
master, roadmap, backlog, handoff, Sprint 25 evidence, release-readiness
documents, package manifest and lockfile. Sprint 25 / Spec 026 was the latest
formalized unit and no later unit was reserved. Sprint 26 / Spec 027 was
registered before dependency changes:

- Spec: [`027-sprint-26-dependency-advisory-remediation.md`](../../specs/027-sprint-26-dependency-advisory-remediation.md)
- Base: Sprint 25 merge `7a4c082ea7a3b78d1aa58fcccbf699cafe42b016`
- Scope: only `brace-expansion`, `js-yaml`, lockfile, compatibility gates and evidence

## Preflight and lifecycle

| Check | Result |
|---|---|
| Git root | `C:/Users/carol/Documents/aralume-studio V2/aralume-studio` |
| Initial branch / HEAD | `main` / `7a4c082ea7a3b78d1aa58fcccbf699cafe42b016` |
| Initial base alignment | `main = origin/main`, divergence `0/0` |
| Initial working tree | clean |
| Bun | `1.3.14` |
| Related open PRs | none before branch creation |
| Agent lifecycle | one read-only dependency-tree agent created, report collected, then closed; no implementation delegated |
| Branch | `codex/sprint-26-dependency-advisory-remediation` |

## Baseline and dependency chains

The baseline `bun audit` reported two high advisories and exited non-zero:

| Package | Installed | Fixed | Advisory | Chain / scope |
|---|---:|---:|---|---|
| `brace-expansion` | 5.0.6 | 5.0.7 | GHSA-3jxr-9vmj-r5cp | `eslint -> @eslint/eslintrc -> minimatch`; `typescript-eslint -> typescript-estree -> minimatch`; lint/development tooling |
| `js-yaml` | 4.2.0 | 4.3.0 | GHSA-52cp-r559-cp3m | `eslint -> @eslint/eslintrc`; `@tanstack/react-start -> @tanstack/start-plugin-core -> xmlbuilder2`; lint/build/tooling |

`brace-expansion` is affected by exponential-time expansion of consecutive
non-expanding groups. `js-yaml` is affected by quadratic CPU use in YAML
merge-key chains. Both are transitive, neither is imported directly by the
application, and neither is a new runtime feature of this unit.

## Correction and lockfile review

The existing exact overrides were updated without changing the package manager:

```json
"brace-expansion": "5.0.7",
"js-yaml": "4.3.0"
```

`package.json` changed only those two values. `bun.lock` changed only the two
override values and the two package records, including their integrity hashes.
No package-lock was created, no release candidate was used, and no unrelated
package version changed. `bun pm why` confirmed the chains above and the
effective installed versions are `brace-expansion@5.0.7` and `js-yaml@4.3.0`.

## Reproducible gates

| Command / check | Result |
|---|---|
| `bun install --frozen-lockfile` | PASS; 583 installs across 701 packages, no changes |
| `bun audit` | PASS; exit 0, zero vulnerabilities |
| minimatch + brace expansion compatibility | PASS; glob extension, numeric expansion and bounded input |
| YAML tooling compatibility | PASS; valid YAML parsed and malformed YAML rejected |
| `npm run lint` | PASS |
| `npm run backend:check` | PASS |
| `npx tsc --noEmit` | PASS; zero diagnostics |
| `npm test` | PASS; 93/93 |
| `node --test scripts/e2e-process-utils.test.mjs` | PASS; 20/20 |
| `npm run build` | PASS |
| runners 15-21 | PASS; all exit 0 |
| runner HMAC | PASS; exit 0 |
| secret scan | PASS; zero high-confidence hits and no real secret found |
| `git diff --check` | PASS |
| ports 3001, 4173, 8080 | free after execution |
| project orphan processes | none after execution |

The first lifecycle run was accidentally started concurrently with other
heavy gates and produced three pre-handshake timing failures. The lifecycle
file was then rerun in isolation and passed 20/20; no source change was made
for that environmental run-order effect.

## Git and release state

- Spec commit: `5cc47f5` (`docs: formalize Sprint 26 dependency advisory remediation`).
- Dependency commit: `6e34ad6` (`fix: remediate transitive dependency advisories`).
- Push: completed to `origin/codex/sprint-26-dependency-advisory-remediation`.
- Pull request: [#42](https://github.com/aralumemedia-lab/aralume-studio/pull/42), open and draft; base `main`; mergeability pending independent review.
- Documentation commit: `79b1070` contains the evidence and release-document updates; this publication update is a normal follow-up commit.
- No merge, tag, release or deploy was performed by this unit.
- V1.0 remains functionally accepted.
- Release 1.0.0 remains **NOT_READY** because productive configuration/secrets, recovery and rollback, observability, topology/ingress and final readiness evaluation remain outside this unit.
