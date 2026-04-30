---
description: Detect docs drift from code changes since the last docs-touching commit
---

Run the `docs-architect` skill in **sync mode**.

1. Find the last commit that touched `docs/` or `.claude/rules/`:
   `git log --oneline --all -- docs/ .claude/rules/ | head -1`
2. List all files changed since that commit:
   `git diff --name-only <last>..HEAD`
3. **Delegate** the file-change analysis to the `doc-explorer` subagent (isolated context) if the list is longer than 20 files.
4. Map changed code files to affected docs and rules:
   - `*.csproj`, `package.json`, `Cargo.toml` → `.claude/rules/tech-stack.md` + `docs/tech-stack.md`
   - `docker-compose*`, `Dockerfile*`, `.env*` → `docs/deployment.md`
   - Controllers / routes / endpoints → `.claude/rules/api.md` + `docs/api-contracts.md`
   - Entities / migrations → `.claude/rules/database.md` + `docs/database-schema.md`
   - Domain layer / patterns / middleware → `.claude/rules/architecture.md` + `docs/architecture.md`
   - Naming / validators / test files → `.claude/rules/coding-rules.md` + `docs/coding-rules.md`
5. Output a sync report listing docs-needing-update vs. docs-still-current.
6. Ask the user: update affected docs now? [yes / pick individually / skip]
7. If yes, update each affected rule AND doc file (dual update).
