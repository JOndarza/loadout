# Audit Report Format (v2)

```
## Docs Architect — Audit Report

### CLAUDE.md
- Lines: X (v2 target: <100)
- Documentation language: [declared / MISSING]
- Contains @docs/_lite/* imports: [YES → stale v1 pattern / NO]
- Status: OK / NEEDS OPTIMIZATION

### .claude/rules/
- Always-loaded rules present: [list of files with no `paths:` frontmatter]
- Missing always-loaded rules: [business-context.md, coding-rules.md, tech-stack.md, architecture.md — which ones]
- Path-scoped rules present: [list of files with `paths:` frontmatter + glob summary]
- Rules over 40 lines: [list — v2 target ≤40]
- Rules with dead path patterns (no matching files in repo): [list]
- Subtree coverage gaps: [e.g. "repo has frontend/ but no frontend.md rule"]

### Legacy v1 artifacts
- docs/_lite/*.summary.md files found: [count] → suggest /docs-migrate
- .deprecated files pending deletion: [count]

### .claude/ native artifacts
- Agents: doc-explorer.md [present / MISSING]
- Commands: /docs-audit [present / MISSING], /docs-sync [present / MISSING], /docs-migrate [present / MISSING]
- Hooks recommendation: [printed if .claude/settings.json has no SessionStart CLAUDE.md size check]

### Full docs (docs/*.md)
- Large files (>150 lines without segmentation): [list]
- Files missing from docs/README.md index: [list]

### Stories/Bugs consistency
- Backlog entries: X | Story files: Y | Mismatches: [list]
- Bugs entries: X | Bug files: Y | Mismatches: [list]
- Orphaned files (not in registry): [list]
- Broken links (registry points to missing file): [list]

### Duplicated content
- [description]

### Recommendations
1. [action, ranked by token savings impact]
2. [action]
```
