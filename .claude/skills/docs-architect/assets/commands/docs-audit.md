---
description: Audit docs structure and .claude/rules/ for token-efficiency violations
---

Run the `docs-architect` skill in **audit mode**. Check:

- `CLAUDE.md` over 100 lines (v2 tight limit)
- `.claude/rules/*.md` files over 40 lines or missing frontmatter where expected
- `.claude/rules/*.md` with `paths:` patterns that match zero files in the repo (dead scopes)
- Presence of legacy `docs/_lite/*.summary.md` → suggest `/docs-migrate`
- Missing always-loaded rules (`business-context.md`, `coding-rules.md`, `tech-stack.md`, `architecture.md`)
- Missing `.claude/agents/doc-explorer.md` when `docs/` has more than 10 files
- Missing `/docs-audit`, `/docs-sync`, `/docs-migrate` slash commands in `.claude/commands/`
- `CLAUDE.md` containing `@docs/_lite/*` imports (stale v1 pattern)
- Full-doc files (`docs/*.md`) over 150 lines without segmentation
- Orphaned story/bug files not referenced in `backlog.md` / `bugs.md`
- Registry entries pointing to missing files
- `docs/README.md` missing or over 200 lines

After the report, offer to auto-fix each issue. Group fixes by type and ask confirmation before applying.
