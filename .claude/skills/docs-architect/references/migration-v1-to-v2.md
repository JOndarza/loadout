# Migration guide: v1 (`_lite/`) → v2 (`.claude/rules/`)

Loaded only during `/docs-architect migrate`. Step-by-step reference for converting a project on the v1 `docs/_lite/*.summary.md` pattern to the v2 `.claude/rules/*.md` pattern.

## Table of contents

1. [Why migrate](#why-migrate)
2. [Mapping table](#mapping-table)
3. [Deciding always-loaded vs path-scoped](#deciding-always-loaded-vs-path-scoped)
4. [Before/after examples](#beforeafter-examples)
5. [paths: glob recipes](#paths-glob-recipes)
6. [Safety and preservation](#safety-and-preservation)
7. [Rollback](#rollback)

---

## Why migrate

v1 `_lite/*.summary.md` is a custom pattern where CLAUDE.md manually points the AI to summaries. v2 `.claude/rules/*.md` uses Claude Code's native loading mechanism:

- **Always-loaded rules** (no frontmatter) → load at session start automatically. No CLAUDE.md pointer needed.
- **Path-scoped rules** (`paths:` frontmatter) → load **only** when Claude reads matching files. Zero startup token cost. v1 has no equivalent.

Token savings on a typical project with backend + frontend + database rules: **20-40% reduction in startup instruction tokens**, because path-scoped rules stop loading unconditionally.

---

## Mapping table

| v1 file | v2 target | Loading mode |
|---|---|---|
| `docs/_lite/business-context.md` | `.claude/rules/business-context.md` | always-loaded |
| `docs/_lite/coding-rules.summary.md` | `.claude/rules/coding-rules.md` OR split into `backend.md` + `frontend.md` | always-loaded OR path-scoped |
| `docs/_lite/tech-stack.summary.md` | `.claude/rules/tech-stack.md` | always-loaded |
| `docs/_lite/architecture.summary.md` | `.claude/rules/architecture.md` | always-loaded |
| `docs/_lite/api-contracts.summary.md` | `.claude/rules/api.md` | path-scoped: `**/Controllers/**`, `**/routes/**` |
| `docs/_lite/database-schema.summary.md` | `.claude/rules/database.md` | path-scoped: `**/Entities/**`, `**/migrations/**` |
| `docs/_lite/deployment.summary.md` | `.claude/rules/deployment.md` | path-scoped: `docker-compose*`, `Dockerfile*`, `.env*` |
| `docs/_lite/roadmap.summary.md` | **NOT migrated** — full doc is enough |  |
| `docs/_lite/backlog.summary.md` | **NOT migrated** — session-volatile, regenerate on demand |  |
| `docs/_lite/bugs.summary.md` | **NOT migrated** — session-volatile |  |
| `docs/_lite/ideas.summary.md` | **NOT migrated** — inbox only |  |
| `docs/_lite/ai-rules.summary.md` | **NOT migrated** — rules now live in `.claude/rules/` |  |

---

## Deciding always-loaded vs path-scoped

Ask: "does this rule apply only when Claude touches a specific subtree?"

- **Yes** → path-scoped. Write `paths:` frontmatter with the glob patterns that identify the subtree.
- **No, it's global** → always-loaded. Skip the frontmatter entirely.

Examples:
- `business-context` → global, every session needs it → always-loaded
- `api contract rules` → only when touching controllers/routes → path-scoped
- `tech stack` → global, every package choice affects it → always-loaded
- `database schema rules` → only when touching entities/migrations → path-scoped
- `coding conventions` → usually global, but if backend and frontend diverge significantly, split into `backend.md` + `frontend.md` path-scoped

**When in doubt**, ask the user during migration. The AI shouldn't guess.

---

## Before/after examples

### Example 1: architecture summary → always-loaded rule

**v1** (`docs/_lite/architecture.summary.md`):
```markdown
# Architecture — Summary
Source: docs/architecture.md

- Clean Architecture: Domain ← Application ← Infrastructure ← Api
- Dependency rule: Domain has zero references
- CQRS via Mediator
- Problem Details RFC 7807 for errors
...
```

**v2** (`.claude/rules/architecture.md`):
```markdown
<!-- mirrors: docs/architecture.md -->

# Architecture — key patterns

- Clean Architecture: Domain ← Application ← Infrastructure ← Api
- Dependency rule: Domain has zero references
- CQRS via Mediator
- Problem Details RFC 7807 for errors
...
```

Differences: no `Source:` line (replaced with HTML comment), no frontmatter (always-loaded), same bullets.

### Example 2: api summary → path-scoped rule

**v1** (`docs/_lite/api-contracts.summary.md`):
```markdown
# API Contracts — Summary
Source: docs/api-contracts.md

- All endpoints under /api/v1/
- Authorize by default
- Problem Details for errors
...
```

**v2** (`.claude/rules/api.md`):
```markdown
---
paths:
  - "**/Controllers/**"
  - "**/Endpoints/**"
  - "**/*Controller.cs"
---
<!-- mirrors: docs/api-contracts.md -->

# API rules (auto-load on controller/endpoint files)

- All endpoints under /api/v1/
- Authorize by default
- Problem Details for errors
...
```

Differences: `paths:` frontmatter added, header updated to reflect auto-load behavior.

---

## paths: glob recipes

Common patterns for path-scoped rules:

| Subtree | Glob patterns |
|---|---|
| Backend (.NET) | `backend/**/*.cs`, `**/*.csproj`, `src/backend/**` |
| Backend (Node/TS) | `backend/**/*.ts`, `src/server/**/*.ts` |
| Backend (Python) | `backend/**/*.py`, `src/api/**/*.py` |
| Frontend (Angular) | `frontend/**/*.ts`, `**/*.component.ts`, `**/*.component.html` |
| Frontend (React) | `frontend/**/*.tsx`, `src/components/**`, `src/pages/**` |
| Frontend (Vue) | `frontend/**/*.vue`, `src/**/*.vue` |
| Controllers / API | `**/Controllers/**`, `**/Endpoints/**`, `**/routes/**`, `**/*Controller.cs` |
| Database | `**/Entities/**`, `**/Migrations/**`, `**/migrations/**`, `**/*.sql`, `**/DbContext*.cs` |
| Tests | `**/*.test.ts`, `**/*.spec.ts`, `**/*Tests.cs`, `**/tests/**`, `**/e2e/**` |
| Deployment | `docker-compose*.yml`, `Dockerfile*`, `.env*`, `**/*.dockerfile` |
| SCSS / styles | `**/*.scss`, `**/*.css`, `**/styles/**` |

Be as specific as possible — overly broad patterns (e.g. `**/*.ts`) cause the rule to load everywhere, defeating the purpose.

---

## Safety and preservation

The migration mode:

- ✅ Creates new `.claude/rules/*.md` files from content in `docs/_lite/*.summary.md`
- ✅ Renames originals to `docs/_lite/*.summary.md.deprecated` (never deletes)
- ✅ Updates `CLAUDE.md` to remove the `_lite/` pointer table
- ✅ Updates `docs/README.md` to describe the 2-layer v2 flow
- ❌ NEVER deletes files
- ❌ NEVER writes to `.claude/settings.json` (hook snippet is print-only)
- ❌ NEVER runs git commands on behalf of the user
- ❌ NEVER modifies `docs/*.md` full files

After migration, the user verifies with a fresh Claude Code session, then can manually delete `.deprecated` files with `rm docs/_lite/*.deprecated`.

---

## Rollback

If the migration didn't behave as expected:

1. Delete the new `.claude/rules/*.md` files (only the ones migrated — keep any pre-existing ones).
2. Rename the originals back: `for f in docs/_lite/*.deprecated; do mv "$f" "${f%.deprecated}"; done`
3. Restore CLAUDE.md from git: `git checkout CLAUDE.md`
4. Restore docs/README.md from git: `git checkout docs/README.md`

Since the migration is additive and non-destructive, rollback is always possible until you manually delete the `.deprecated` files.
