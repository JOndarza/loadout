# Roadmap

## Current state (v2.0.0)

Core extension is functional with five tabs: Workspace, Profiles, Catalog, Settings, Config.
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
- [x] Config tab (tab 5): permissions allow/deny/ask, hooks toggle, sandbox toggle, additional directories
- [x] MCP servers: user-scope toggle + project-scope read-only display in Config tab
- [x] Platform: 20 Vitest tests for state services, FileDecorationProvider (A/S/↑ badges), walkthrough onboarding

### Phase 3 — UX and CDK (done)

- [x] Fuzzy search with filter tokens (`type:agent`, `active:true`, `tok>500`) and match highlighting via `HighlightMatchPipe`
- [x] Profile card overflow menu (`⋯`): Apply as primary CTA; Edit/Rename/Duplicate/Export/Delete in dropdown
- [x] Delete undo toast: 5-second soft-delete with Undo button (`ToastService.showWithAction`)
- [x] Apply confirmation bottom-sheet: slide-up panel replacing blocking modal
- [x] Right-click context menu on workspace rows, profile cards, and catalog items (`ContextMenuService`)
- [x] `SelectionModel` (CDK) for multi-select with visual checkbox affordance and bulk toolbar
- [x] Optimistic toggle: items flip state immediately without waiting for bridge response
- [x] Token budget bar: visual fill bar in status strip (green/amber/red zones)
- [x] Onboarding checklist: shown on first use (empty workspace), persisted in `ui-state.json`
- [x] `@angular/cdk` installed; `CSP_NONCE` wired in `main.ts`

### Phase 4 — Extended (planned)

#### Rules and content
- [ ] `.claude/rules/*.md` toggle — move-to-store pattern, same as agents/skills; distinct UI section to avoid confusion with skills

#### CDK — remaining modules
- [ ] Drag-drop profile reorder (`cdkDropList` + `cdkDrag` + `CdkDragHandle`)
- [ ] Catalog → Workspace drag transfer (copy semantics; `addFromGlobal` already wired)
- [ ] CDK Overlay: apply-preview diff panel on hover of Apply button (`previewApplyProfile` already in `messages.ts`)
- [ ] CDK Virtual Scroll: `CdkVirtualScrollViewport` for Catalog tab on large item lists
- [ ] CDK Accordion: expandable item detail cards (token count, full description, sync status)

#### Command palette
- [ ] Expand Cmd/Ctrl+K palette to show toggleable agents/skills and adoptable catalog items in addition to profiles

#### Accessibility
- [ ] `LiveAnnouncer`: announce toggle/apply results to screen readers
- [ ] `FocusMonitor`: suppress focus rings on mouse interaction
- [ ] `role="switch"` + `aria-checked` on all toggle buttons
- [ ] `FocusKeyManager` for arrow-key list navigation + Space to toggle

#### Progressive disclosure
- [ ] Profile card: hover to reveal metadata (description, created date, applied count); click to expand full item chip list
- [ ] Registry items surfaced inline in Catalog tab (accordion section after local list; "N more available" chip in filter bar)
- [ ] Status strip moved into Workspace tab sub-header (reduces persistent chrome)
- [ ] Inline profile rename on double-click

#### Platform
- [ ] Storybook for shared primitives (`cm-card`, `cm-toggle`, `cm-button`, `cm-token-bar`, `cm-segmented`, `cm-sync-pill`, `cm-empty`)
- [ ] Skeleton loader while `initialData` arrives (shimmer CSS, no library)

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04 | Angular 21 standalone + signals (no NgModules, no NgRx) | Simpler state for a single-panel UI; signals eliminate subscription boilerplate |
| 2026-04 | Commit `webview-dist/` to repo | Zero-build install for users; acceptable for a local-only extension |
| 2026-04 | Hash-based catalog sync (SHA-256) | Detect upstream updates without diffing full file content |
| 2026-04 | VSCode `context.storageUri` for per-workspace state | Managed by VSCode, survives extension updates, not accidentally committed |
| 2026-04 | BLoC layer between components and bridge | Keeps components dumb; all bridge.send() calls centralized per feature |
| 2026-04 | MCP toggle via `_disabledMcpServers` key | Preserves server config when disabling; reversible without re-typing credentials |
| 2026-04 | `@angular/cdk` with `CSP_NONCE` | CDK modules inject dynamic styles; nonce must be provided or styles silently fail under strict CSP |
| 2026-04 | Soft-delete with undo toast (no confirmation modal) | Eliminates accidental-delete anxiety without blocking interaction; aligns with modern UX patterns |
| 2026-04 | `HighlightMatchPipe` returning `MatchSegment[]` instead of `innerHTML` | Safe under strict CSP; no `DomSanitizer` bypass needed; renders in template with `@for` |
