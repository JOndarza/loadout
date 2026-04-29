# Roadmap

## Current state (v2.0.0)

Core extension is functional with four tabs: Workspace, Profiles, Catalog, Settings.
Per-workspace state migrated from legacy `.claude-store/` to VSCode `context.storageUri`.

## Phases

### Phase 1 — Core (done)
- [x] Workspace tab: toggle agents/skills/commands active/inactive
- [x] Profiles tab: save, apply, rename, reorder, duplicate loadouts (agents, skills, and commands)
- [x] Catalog tab: adopt from global catalog, push local items to global, hash-based sync detection
- [x] Settings tab: density, theme, default tab, registry URL
- [x] Angular 21 standalone + signals architecture
- [x] Dark/light/auto theme following VSCode
- [x] Keyboard shortcuts inside panel
- [x] v2 storage migration (legacy `.claude-store/` → `context.storageUri`)

### Phase 2 — Polish and VSCode integration (done)
- [x] Quick polish: CMD badge, cross-platform Open folder label, workspace trust, clear restore point, skipRestorePoint, shortcut `s`, drag handle SCSS
- [x] VSCode-native observability: LogOutputChannel, Activity Bar badge, withProgress, file watcher on `.claude/`, Explorer context menu
- [x] Profile power: `lastApplied` persistence, `loadout.applyProfile` QuickPick command, Tasks API, adopt-pending button, shortcut `p`
- [x] Settings expansion: Claude Code model/effort dropdowns, auto-memory toggle, session env vars, CLAUDE.md browser, memory scope badge on agents
- [x] Config tab (tab 4): permissions allow/deny/ask, hooks toggle, sandbox toggle, additional directories
- [x] MCP servers: user-scope toggle + project-scope read-only display in Config tab
- [x] Platform: 20 Vitest tests for state services, FileDecorationProvider (A/S/↑ badges), walkthrough onboarding

### Phase 3 — Extended (planned)
- [ ] `.claude/rules/*.md` toggle (move-to-store pattern, same as agents/skills)
- [ ] UX: command palette full-toggle, profile card overflow menu, bottom-sheet diff, delete undo toast
- [ ] UX: fuzzy search with match highlighting (uFuzzy), token budget bar, first-run checklist
- [ ] CDK: SelectionModel bulk toolbar, drag-drop reorder + catalog transfer, virtual scroll, CDK Overlay
- [ ] Accessibility: LiveAnnouncer, FocusMonitor, role="switch" on toggles
- [ ] Storybook for shared primitives
- See `docs/ideas.md` for full inbox

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04 | Angular 21 standalone + signals (no NgModules, no NgRx) | Simpler state for a single-panel UI; signals eliminate subscription boilerplate |
| 2026-04 | Commit `webview-dist/` to repo | Zero-build install for users; acceptable for a local-only extension |
| 2026-04 | Hash-based catalog sync (SHA-256) | Detect upstream updates without diffing full file content |
| 2026-04 | VSCode `context.storageUri` for per-workspace state | Managed by VSCode, survives extension updates, not accidentally committed |
| 2026-04 | BLoC layer between components and bridge | Keeps components dumb; all bridge.send() calls centralized per feature |
| 2026-04 | MCP toggle via `_disabledMcpServers` key | Preserves server config when disabling; reversible without re-typing credentials |
