# 000 - SDD Process

## Purpose

Spec Driven Development (SDD) is the permanent operating model for Aralume Studio. No implementation work starts before the relevant spec is reviewed and aligned with the current roadmap, handoff, project master, and backlog documents.

## Hierarquia normativa

The document stack is normative in descending order:

Documento Mestre
-> Roadmap
-> Epico
-> Sprint
-> Historias
-> Tarefas
-> PR
-> Evidencias
-> Gate

Lower-level documents cannot contradict higher-level normative documents. If a lower-level document conflicts with a higher-level one, the higher-level document prevails and the lower-level document must be updated before implementation continues.

## Sources of truth

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- The relevant sprint or domain spec under `docs/specs/`

## Permanent workflow

1. Spec review.
2. Gap analysis against the repository state and the request.
3. Implementation plan with scope, out-of-scope items, files, risks, and validations.
4. Approval gate when the task is broad, risky, or ambiguous.
5. Implementation only within the approved scope.
6. Validation with the available commands and any task-specific checks.
7. Spec update when the implementation changes the long-term rule set or operating assumptions.
8. Pull request with a concise, source-backed summary.

## Definition of Ready for historias

A historia can enter a sprint only when all of the following are true:

- it is linked to an epic;
- it has an objective description;
- it has acceptance criteria;
- its dependencies are identified;
- its affected contracts are identified;
- its expected evidence is defined;
- it does not conflict with the current documentation;
- its scope is compatible with the sprint.

## Definition of Done for historias

A historia can be marked complete only when all of the following are true:

- the expected implementation is complete;
- the acceptance criteria are met;
- relevant tests have passed;
- required documentation has been updated;
- security, audit, and cost implications have been reviewed;
- evidence is available;
- material pending items are explicitly recorded.

## Rules for technical historias

Technical historias are allowed when they are necessary for:

- security;
- infrastructure;
- migration;
- observability;
- reliability;
- performance;
- technical debt;
- mandatory preparation for a future capability.

A technical historia must declare:

- the reason for existence;
- the impact it unlocks;
- the dependency it unblocks;
- the acceptance criterion;
- the evidence;
- why it does not produce a direct visual delivery.

## Rules for scope change

- No historia can be added silently.
- No historia can be removed without a record.
- Acceptance criteria cannot be weakened after implementation begins.
- Any material change must happen first in the spec.
- Material changes must appear in the PR and in the final report.
- Scope changes must be reflected in the roadmap, backlog, spec, and prompt before implementation continues.

## Historical rule

- Sprints 0 to 10 follow the historical model.
- They do not need retrospective conversion into the new model.
- Their specs, PRs, and reports remain valid.
- The new model takes effect from Sprint 11 onward.
- This rule does not authorize rewriting published history or renumbering previous sprints.

## SDD rules

- Read the governing documents before editing files.
- Record branch, SHA, remote, divergence, and working tree state before changes.
- Stop if the working tree is dirty and the task requires a clean baseline.
- Do not invent product behavior outside the spec or roadmap.
- Do not mix unrelated work into a focused sprint.
- Do not expose secrets, copy real credentials, or commit secret-bearing files.
- Resolve conflicts in favor of the repo documentation, not the prompt.

## Approval gate

An approval gate is required when the task:

- spans multiple domains;
- introduces a new operational phase;
- changes the long-term process;
- carries a meaningful security, product, or migration risk.

## Validation gate

Before completion, run the available validation commands and confirm:

- the requested files changed only within scope;
- no secret values were introduced;
- the repository remains in a clean or intentionally documented state;
- the final report includes the requested metadata.
