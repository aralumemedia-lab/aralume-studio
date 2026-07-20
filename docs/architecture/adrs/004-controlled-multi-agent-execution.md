# ADR 004 - Controlled multi-agent execution

- Status: Accepted
- Date: 2026-07-19
- Context: Aralume Studio
- Scope: Codex execution governance, documentation, review, and implementation coordination

## Context

The project already uses Spec Driven Development, explicit ownership, isolated
branches, formal review, human approval, and GitHub governance. Some tasks can
benefit from independent discovery or safe parallel validation, while other
tasks are small, linear, transactional, or tightly coupled. Uncontrolled use of
subagents would increase duplicate work, conflicting edits, self-review risk,
and loss of traceability.

## Decision

The Codex must consider controlled subagent use whenever it can produce real
gain in coverage, independence, parallelism, or risk reduction. Subagents are
not mandatory for simple, linear, or strongly coupled tasks when one agent can
execute and validate the work with adequate evidence.

One coordinator is mandatory whenever subagents are used. The coordinator owns
the preflight, scope, plan, decisions, consolidation, material-finding
reproduction, final diff review, and final verdict.

## Normative rules

- Every subagent has a clear, isolated, non-overlapping scope and records the
  commands executed, results, and reproducible evidence.
- Review subagents operate read-only. They cannot edit files, commit, push,
  merge, release, tag, or deploy.
- Each implementation file has exactly one owner. Parallel implementation must
  use isolated worktrees. Concurrent edits to the same file are prohibited
  unless the coordinator explicitly coordinates them.
- Concurrency is limited to the level that preserves traceability and avoids
  duplicated work.
- Duplicate findings are consolidated. Opinions without reproduction, impact,
  and evidence are not accepted as findings.
- Findings classified as `BLOCKER` or `HIGH` must be reproduced by the
  coordinator before they affect the final decision.
- No agent may approve its own implementation. Independent technical review
  does not replace formal human approval or GitHub rules.
- Subagent use never authorizes bypassing branch protection, rulesets,
  CODEOWNERS, required reviews, or any existing commit/PR/release/deploy rule.
- The coordinator records conflicts, discarded decisions, limitations, and the
  final rationale.
- The final report identifies the coordinator, subagents, scopes, execution
  mode, worktrees, file ownership, consolidated findings, validations, and
  final decision.

## Favorable use cases

Subagents are usually favorable for:

- security review;
- broad pull request review;
- full reacceptance;
- release readiness;
- independent analysis across multiple domains;
- parallel execution of non-conflicting tests;
- comparison of independent evidence; and
- work with material self-assessment or implementation-bias risk.

## Unfavorable use cases

Subagents are usually unfavorable for:

- a small, localized change;
- a low-risk linear task;
- strongly coupled files;
- absence of real parallelism;
- conflict risk greater than the expected benefit;
- a single transactional sequence;
- lack of a safe worktree or isolation mechanism; and
- a task where parallel analysis cannot improve a central decision.

## Operational flow

1. The coordinator performs the preflight and defines the plan.
2. Subagents perform discovery or read-only review within isolated scopes.
3. The coordinator consolidates results and removes duplicate findings.
4. The coordinator reproduces `BLOCKER` and `HIGH` findings.
5. Implementation is assigned to one owner per file and uses isolated
   worktrees when parallel.
6. Independent validations are executed according to the plan.
7. The coordinator reviews the final diff and records conflicts, discarded
   decisions, and limitations.
8. Only the coordinator issues the final verdict.
9. Commit, PR, merge, release, and deploy follow the existing project rules and
   formal human/GitHub approvals.

## Consequences

Positive consequences include broader independent coverage where it matters,
safer parallel validation, explicit ownership, and reproducible decisions.
The cost is additional coordination and reporting. That cost is accepted only
when the expected gain is real and documented.

This ADR does not change SDD, product criteria, the published historical record,
branch protection, Lovable rules, or formal approval requirements. It does not
authorize functional implementation, a new product capability, or any release,
tag, deploy, merge, reset, rebase, amend, squash, or force push.

## Validation and review

The coordinator must validate the final scope, inspect the complete diff, run
available documentation checks, confirm no functional files or secrets changed,
and report any unavailable check as unavailable. This ADR and its references
must be reviewed independently before merge; that review is advisory until the
formal human approval and repository rules are satisfied.
