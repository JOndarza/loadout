# Loadout — Project Rules

## Context
VSCode extension that manages Claude Code agents, skills, and profiles as swappable loadouts.
The extension host (Node.js/CommonJS) communicates with an Angular 21 webview via `postMessage`.

## Hard NOs
- NEVER call VSCode APIs (`vscode.*`, `fs.*`) from inside the webview — all filesystem ops go through `postMessage` to the extension host
- NEVER use `git add -A` or `git add .` — always stage specific files by name
- NEVER `git push --force` to main
- NEVER skip pre-commit hooks (`--no-verify`)
- NEVER use `--amend` without explicit user request

## Conventions
- **Documentation language**: english
- **Code language**: english
- Extension host files (`extension.js`, `data.js`) use CommonJS — no ESM, no `import`

## Process
- **Branches**: `feature/<slug>` → `main`
- **Commits**: conventional format, imperative mood, no AI attribution
- **Build**: `cd webview && npm run build` before committing UI changes

## Where context comes from
- **Always-loaded rules**: `.claude/rules/*.md` without `paths:` frontmatter — load every session
- **Auto-loaded rules**: `.claude/rules/*.md` with `paths:` frontmatter — load only when Claude reads matching files
- **Full docs**: `docs/*.md` — read on-demand when detail is needed beyond what the rules carry
- **Governance**: `docs/README.md` — doc-folder rules, story/bug workflows
