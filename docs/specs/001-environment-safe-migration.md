# 001 - Environment Safe Migration

## Objective
Prepare Aralume Studio V2 to receive environment variables safely by extracting only the names of variables from the legacy `.env.local`, classifying them, and documenting safe manual migration steps. No real values are copied, logged, hashed, or committed.

## Scope
- Read the legacy `.env.local` locally.
- Extract variable names only.
- Classify the variables by category and expected use.
- Create or update `.env.example` with empty placeholders.
- Harden `.gitignore` for environment and secret files.
- Create or update `docs/ENVIRONMENT.md`.
- Create or update `docs/CODEX_HANDOFF.md` and `docs/NEXT_SPRINTS.md` with the sprint outcome.
- Create `docs/specs/000-sdd-process.md` if it is missing.

## Out of scope
- No backend implementation.
- No database creation or migration.
- No Supabase, auth, AI, video, publication, or external integration setup.
- No credential validation or network calls.
- No frontend functional changes.
- No copying of real secret values into any tracked file.

## Sources of truth
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- The legacy `.env.local` for names only

## Safety rules
- Extract names only.
- Never print or store real values.
- Never infer secret contents from length, entropy, or format.
- Never transform secret values into hashes or fingerprints.
- Never commit `.env.local`.
- Rotate any secret that is known to have been exposed in the legacy project.
- Search modified files for obvious secret patterns before commit.

## Allowed files
- `.env.example`
- `.gitignore`
- `docs/ENVIRONMENT.md`
- `docs/CODEX_HANDOFF.md`
- `docs/NEXT_SPRINTS.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/001-environment-safe-migration.md`

## Inventory format
Use a table with:
- Variable
- Category
- Expected use
- Status

Status values:
- `Necessaria agora`
- `Futura`
- `Legado / revisar`

## Acceptance criteria
- The legacy file was read without exposing values.
- Only variable names were extracted.
- The inventory is documented with categories and status.
- `.env.example` contains placeholders only.
- `.gitignore` blocks environment and secret files.
- Documentation states how to migrate values manually.
- The sprint report confirms that no secret values were copied or printed.

## Validations
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Next steps
After this sprint is merged and the repository remains clean, the next recommended phase is Backend Foundation.
