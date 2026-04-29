# Project Documentation

## Structure

```
docs/
├── README.md           # this file — governance + index
├── architecture.md     # extension host, webview, communication protocol, storage
├── coding-rules.md     # naming, signals, CommonJS rules, commit format
├── tech-stack.md       # package catalog with versions
├── deployment.md       # local install, dev workflow, build, registry
├── roadmap.md          # phases, decisions log
├── backlog.md          # user story registry
├── bugs.md             # bug registry
├── ideas.md            # raw ideas inbox
├── stories/            # individual story files (created when work starts)
├── bugs/               # individual bug files
├── plans/              # implementation plans
└── research/           # deep reference docs, on-demand

.claude/
├── rules/
│   ├── business-context.md   # always-loaded
│   ├── coding-rules.md       # always-loaded
│   ├── tech-stack.md         # always-loaded
│   ├── architecture.md       # always-loaded
│   └── frontend.md           # path-scoped: webview/**
├── agents/doc-explorer.md    # subagent for doc research
└── commands/                 # /docs-audit, /docs-sync, /docs-migrate
```

## How to use this documentation

### For humans
Read files in `docs/` directly. Full docs are the source of truth.

### For AI assistants (Claude Code)
Documentation is organized in **two layers**:

1. **`.claude/rules/*.md`** — lean AI-facing distillations. Frontmatter-less files load at every session start. Files with `paths:` frontmatter load only when Claude reads matching files.
2. **`docs/*.md`** — full human-readable references. Read on-demand when the rules don't carry enough detail.

**Rule for the AI**: use `.claude/rules/` to orient, then read one specific `docs/*.md` when detail is needed. Never load multiple full docs at once.

## Rules for AI assistants

### Documentation management
- **Documentation language**: English. Do not mix languages within a single file.
- No `.md` files outside `docs/`. Only exceptions: `CLAUDE.md`, `.claude/rules/*.md`, `.claude/agents/*.md`, `.claude/commands/*.md`.

### Dual update rule
When you update a `.claude/rules/*.md` that mirrors a `docs/*.md`, update the full doc in the same commit. Never drift.

### Stories and bugs
- Each story in `docs/stories/`, each bug in `docs/bugs/`.
- **Priority/Severity is mandatory** — ask before proceeding if not provided.
- When changing status, update **both**: the individual file AND the registry (`backlog.md` / `bugs.md`).
- Create individual story/bug files only when work starts. While `Pending`, the registry entry is sufficient.

### Git and code safety
- Do NOT use `git add -A` or `git add .` — always stage specific files by name.
- Do NOT `git push --force` to main.
- Do NOT skip pre-commit hooks (`--no-verify`).
- Do NOT use `--amend` without explicit user request.
- Do NOT call VSCode APIs from webview code — all filesystem ops go through `postMessage`.

## When to update each document

| Change | Update |
|---|---|
| New Angular component pattern or signal convention | `.claude/rules/frontend.md` + `.claude/rules/coding-rules.md` + `docs/coding-rules.md` |
| New package or version bump | `.claude/rules/tech-stack.md` + `docs/tech-stack.md` |
| Message type added to `messages.ts` | `.claude/rules/architecture.md` + `docs/architecture.md` |
| Extension host flow changed | `.claude/rules/architecture.md` + `docs/architecture.md` |
| New storage location or migration | `docs/architecture.md` + `docs/deployment.md` |
| New story or status change | `docs/backlog.md` + `docs/stories/{NNNNN}-{slug}.story.md` |
| New bug or status change | `docs/bugs.md` + `docs/bugs/{NNNNN}-{slug}.bug.md` |
| Product decision or phase change | `docs/roadmap.md` |

## Index

| File | Content |
|---|---|
| [architecture.md](architecture.md) | Two-process model, communication protocol, state pattern, storage map |
| [coding-rules.md](coding-rules.md) | CommonJS rules, Angular signals/standalone rules, naming, formatting |
| [tech-stack.md](tech-stack.md) | Package catalog with versions |
| [deployment.md](deployment.md) | Local install, dev workflow, build, registry sync |
| [roadmap.md](roadmap.md) | Phases, decisions log |
| [backlog.md](backlog.md) | User story registry |
| [bugs.md](bugs.md) | Bug registry |
| [ideas.md](ideas.md) | Raw ideas inbox |
| [stories/](stories/) | Individual story files |
| [bugs/](bugs/) | Individual bug files |
| [plans/](plans/) | Implementation plans |
| [research/](research/) | Deep reference docs |
