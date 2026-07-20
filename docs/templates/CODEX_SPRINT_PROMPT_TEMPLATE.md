# Codex Sprint Prompt Template

Use this prompt template for a single sprint execution.

## Context required

- Repository:
- Current branch:
- Current sprint:
- Current epic:
- Sprint objective:
- Request type:

## Normative documents

Read and obey:

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/specs/000-sdd-process.md`
- The sprint spec for this sprint
- Any directly related specs referenced by the sprint spec

## Epic

- Epic ID:
- Epic name:
- Epic objective:
- Epic gate:

## Sprint

- Sprint number:
- Sprint name:
- Sprint objective:
- Sprint gate:

## Stories

List only the stories in scope for this sprint.

- Story ID:
- Story type:
- Story objective:
- Acceptance criteria:
- Evidence expected:

## Dependencies

- Upstream documents:
- Technical dependencies:
- Operational dependencies:
- Approval dependencies:

## Out of scope

- Explicit exclusions:
- Future stories not included:

## Preflight

Before any edit, record:

- Root Git
- Current branch
- Current SHA
- Remote configuration
- `main` SHA
- `origin/main` SHA
- Divergence between `main` and `origin/main`
- Working tree state
- Staged files
- Tracked modified files
- Untracked files
- Existing worktrees
- Related local branches
- Related remote branches
- Open PRs related to the scope
- Real location of `AGENTS.md`
- Real location of the normative docs
- Complete spec inventory
- Validation scripts available
- Risks identified before the change

## Plan before editing

Before editing any file, provide a plan containing:

- Current state found
- Conflicts identified
- Proposed methodological decision
- Files to update
- Files to create
- Files not to alter
- Epic convention
- Story convention
- Sprint convention
- Spec convention
- Treatment of historical sprints
- Treatment of the current sprint
- Numbering conflict resolution
- Validations to run
- Risks
- Definition of Done

## Controlled multi-agent execution

Decide explicitly whether subagents provide real coverage, independence,
parallelism, or risk reduction. Record the decision and justification.

- Coordinator:
- Subagents and isolated scopes:
- Execution mode: single agent / read-only review / parallel implementation
- Worktrees:
- File ownership map:
- Coordination and conflict policy:
- Findings consolidation and reproduction plan:
- Independent validation plan:

Subagents must not receive overlapping scopes. Review agents are read-only and
cannot edit, commit, push, merge, release, tag, or deploy. No agent may approve
its own implementation. Human approval and GitHub branch protection, rulesets,
CODEOWNERS, and required reviews remain mandatory. See
`docs/architecture/adrs/004-controlled-multi-agent-execution.md`.

## Implementation rules

- Do not implement outside the spec.
- Do not anticipate future stories.
- Do not widen scope silently.
- Update the spec first if scope changes materially.
- Keep the work limited to documentation unless the sprint spec explicitly says otherwise.
- Prefer vertical slices when the story spans frontend, backend, persistence, audit, and tests.
- Block immediately if documentation conflicts cannot be resolved.

## Validations

- Review the full diff.
- Confirm only allowed files changed.
- Run available lint or markdown validation scripts.
- Validate relative links.
- Search again for the conflict terms used in preflight.
- Confirm no duplicate identifiers.
- Confirm roadmap, backlog, and sprint spec are aligned.
- Confirm historical sprints remain preserved.
- Confirm no secret or `.env` file was added.
- Confirm no published history was rewritten.

## Evidence

- Screenshots:
- Logs:
- Diff summary:
- Links validated:
- Notes:

## Branch

- Start branch:
- End branch:
- Branch naming rule:

## Commit

- Commit message:
- Commit SHA:

## PR

- PR title:
- PR link:
- Base branch:
- Head branch:

## Final report

The final report must include:

- Root Git
- Initial branch
- Final branch
- Initial SHA
- Final SHA
- Initial working tree state
- Final working tree state
- Epic
- Sprint
- Planned stories
- Completed stories
- Partial stories
- Blocked stories
- Criteria met
- Criteria not met
- Files changed
- Commands executed
- Tests
- Screenshots
- Contracts
- Migrations
- Risks
- Pending items
- Gate
- Next sprint recommendation
- Confirmation of no secret exposure
