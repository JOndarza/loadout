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

### Phase 2 — Polish (planned)
- [ ] Marketplace publish (requires LICENSE + publisher setup)
- [ ] Test coverage for webview state services
- [ ] Storybook component documentation
- [ ] Drag-and-drop profile reordering

### Phase 3 — Extended (ideas)
- See `docs/ideas.md` for raw inbox

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04 | Angular 21 standalone + signals (no NgModules, no NgRx) | Simpler state for a single-panel UI; signals eliminate subscription boilerplate |
| 2026-04 | Commit `webview-dist/` to repo | Zero-build install for users; acceptable for a local-only extension |
| 2026-04 | Hash-based catalog sync (SHA-256) | Detect upstream updates without diffing full file content |
| 2026-04 | VSCode `context.storageUri` for per-workspace state | Managed by VSCode, survives extension updates, not accidentally committed |
