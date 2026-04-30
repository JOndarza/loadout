---
description: Migrate v1 docs-architect (_lite/ pattern) to v2 (.claude/rules/)
---

Run the `docs-architect` skill in **migrate mode**. Non-destructive: originals are preserved as `.deprecated`, nothing is deleted automatically.

Flow:

1. Scan `docs/_lite/*.summary.md` and list all summary files found.
2. For each summary, propose a target in `.claude/rules/`:
   - `business-context.md` → `.claude/rules/business-context.md` (always-loaded)
   - `architecture.summary.md` → `.claude/rules/architecture.md` (always-loaded)
   - `coding-rules.summary.md` → ask: split into `backend.md`+`frontend.md` (path-scoped) or keep as single `coding-rules.md` (always-loaded)?
   - `api-contracts.summary.md` → `.claude/rules/api.md` (path-scoped to `**/Controllers/**`, `**/routes/**`)
   - `database-schema.summary.md` → `.claude/rules/database.md` (path-scoped to `**/Entities/**`, `**/migrations/**`)
   - `tech-stack.summary.md` → `.claude/rules/tech-stack.md` (always-loaded)
   - `deployment.summary.md` → `.claude/rules/deployment.md` (path-scoped to `docker-compose*`, `Dockerfile*`, `.env*`)
   - `roadmap.summary.md`, `backlog.summary.md`, `bugs.summary.md`, `ideas.summary.md`, `ai-rules.summary.md` → **NOT migrated** (session-volatile or human-only)
3. Show the full mapping to the user and ask for confirmation or edits.
4. Copy content from each `_lite/*.summary.md` into its new `.claude/rules/*.md` target, adding `paths:` frontmatter where applicable. Strip `Source: docs/...md` lines and replace with `<!-- mirrors: docs/<file>.md -->`.
5. Rename the originals: `docs/_lite/<file>.summary.md` → `docs/_lite/<file>.summary.md.deprecated`. **Never delete.**
6. Update `CLAUDE.md`: remove the "Where to look" table pointing to `_lite/`, replace with `<!-- subsystem rules live in .claude/rules/ -->`.
7. Update `docs/README.md`: replace the "3 levels" explanation with the "2 layers" explanation.
8. Run `/docs-audit` to verify the migration.
9. Tell the user: "Migration complete. Originals preserved as `.deprecated`. Run `rm docs/_lite/*.deprecated` after verifying a fresh Claude Code session loads context correctly."

Safety: never writes outside `docs/_lite/`, `.claude/rules/`, `CLAUDE.md`, and `docs/README.md`. Never deletes. Never runs git commands.
