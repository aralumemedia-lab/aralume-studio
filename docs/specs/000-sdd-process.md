# 000 - SDD Process

## Purpose
Spec Driven Development (SDD) is the permanent operating model for Aralume Studio. No implementation work starts before the relevant spec is reviewed and aligned with the current roadmap, handoff, and project master documents.

## Permanent workflow
1. Spec review.
2. Gap analysis against the repository state and the request.
3. Implementation plan with scope, out-of-scope items, files, risks, and validations.
4. Approval gate when the task is broad, risky, or ambiguous.
5. Implementation only within the approved scope.
6. Validation with the available commands and any task-specific checks.
7. Spec update when the implementation changes the long-term rule set or operating assumptions.
8. Pull request with a concise, source-backed summary.

## Sources of truth
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- The relevant sprint or domain spec under `docs/specs/`

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
