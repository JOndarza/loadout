# Backlog

Story registry. Individual files in `docs/stories/` (created when work starts).

| ID | Title | Size | Status |
| --- | --- | --- | --- |
| B-001 | Rules file toggle (`rules/*.md`) | M | Planned |
| B-002 | Drag-drop profile reorder | M | Planned |
| B-003 | Catalog-to-workspace drag transfer | M | Planned |
| B-004 | CDK Overlay: apply-preview diff on hover | S | Planned |
| B-005 | CDK Virtual Scroll for Catalog tab | M | Planned |
| B-006 | CDK Accordion: expandable item cards | S | Planned |
| B-007 | Expand command palette to toggle items and adopt catalog entries | M | Planned |
| B-008 | Accessibility pass: LiveAnnouncer, FocusMonitor, role="switch" | M | Planned |
| B-009 | FocusKeyManager for arrow-key list navigation | S | Planned |
| B-010 | Profile card hover-reveal metadata | S | Planned |
| B-011 | Registry items surfaced inline in Catalog tab | M | Planned |
| B-012 | Status strip moved into Workspace tab sub-header | S | Planned |
| B-013 | Inline profile rename on double-click | S | Planned |
| B-014 | Skeleton loader while initialData arrives | S | Planned |
| B-015 | Storybook setup for shared primitives | L | Planned |
| B-016 | Custom editor for agent/skill/command `.md` files | L | Planned |

---

## Quick wins (S)

### B-004 — CDK Overlay: apply-preview diff on hover

Show a connected overlay on the Apply button in the Profiles tab that displays `willActivate` / `willDeactivate` item counts before the user commits. `previewApplyProfile` already exists in `messages.ts`; only the overlay component and positioning are missing.

Acceptance: hovering Apply shows counts; clicking still opens the bottom-sheet for confirmation.

### B-006 — CDK Accordion: expandable item cards

Add `cdkAccordionItem` to workspace and catalog rows. Expanded state reveals token count, full description, and sync status. Collapse/expand via CSS `max-height` transition — no JavaScript animation needed.

Acceptance: click expands row; second click collapses; only one row expanded at a time per list.

### B-009 — FocusKeyManager for arrow-key list navigation

Wire `FocusKeyManager` from `@angular/cdk/a11y` on workspace and catalog lists. Arrow keys move focus between rows; Space toggles the focused item; Shift+Arrow extends the selection when SelectionModel is active.

Acceptance: full keyboard navigation without a mouse; no regression on existing shortcut bindings.

### B-010 — Profile card hover-reveal metadata

Show name, active badge, and item counts at rest. On CSS `:hover` reveal description, created date, and applied count. On explicit card-body click expand the full agent/skill chip list.

Acceptance: rest state is uncluttered; hover state adds context without layout shift.

### B-012 — Status strip moved into Workspace tab sub-header

Wrap the status strip in `@if (activeTab() === 'workspace')`. Removes one persistent horizontal band of chrome from all non-Workspace tabs.

Acceptance: strip visible only in Workspace tab; no layout shift when switching tabs.

### B-013 — Inline profile rename on double-click

Double-clicking a profile card name shows an `<input>` pre-filled with the current name. `(blur)` and `(keydown.enter)` commit; `(keydown.escape)` reverts. `renameProfile` is already wired in `messages.ts`.

Acceptance: rename without opening a modal; Escape always reverts.

### B-014 — Skeleton loader while initialData arrives

Add a shimmer placeholder (CSS `linear-gradient` + `animation`) behind an `@if (loaded())` gate. No additional library. Covers the blank-flash between panel open and first data.

Acceptance: shimmer visible for the duration before `initialData` arrives; no regression on fast loads.

---

## Medium (M)

### B-001 — Rules file toggle (`rules/*.md`)

Add a distinct "Rules" section in the Workspace tab. Apply the same move-to-store toggle pattern used for agents/skills. Files live in `.claude/rules/`; the store path is `context.storageUri/.claude-store/rules/`. Do not merge with the Skills section — rules are always-on instructions, not invokable skills.

Acceptance: rules files can be toggled on/off; toggling moves files correctly; section label clearly distinguishes rules from skills.

### B-002 — Drag-drop profile reorder

Wire `cdkDropList` + `cdkDrag` + `CdkDragHandle` on the Profiles tab list. `reorderProfiles` is already handled in `messages.ts` and `data.js`. Missing: SCSS drag-handle cursor, ghost styling, and the `draggable` attribute on non-editing cards.

Note: CDK drag-drop has no built-in keyboard support (upstream issue open since 2022). Keep Up/Down arrow buttons as a keyboard fallback. Use `previewContainer: 'global'` to avoid clipping inside `overflow: hidden` scroll panels.

Acceptance: profiles can be reordered by drag; keyboard alternative (arrow buttons) still works; order is persisted via `reorderProfiles`.

### B-003 — Catalog-to-workspace drag transfer

Add a second `cdkDropList` on the Workspace tab that accepts items dragged from the Catalog tab list. Use copy semantics (`copyArrayItem`) so the catalog item stays in place. `addFromGlobal` is already wired. Reject duplicates via `cdkDropListEnterPredicate`.

Acceptance: dragging a catalog item into the workspace list calls `addFromGlobal`; the item is not removed from the catalog; duplicates are rejected with a visual cue.

### B-005 — CDK Virtual Scroll for Catalog tab

Replace the Catalog tab scroll container with `CdkVirtualScrollViewport` and a fixed `itemSize`. Requires a fixed CSS height on the viewport (not `auto`) and enforced 2-line description truncation on catalog cards to prevent scroll-position jitter.

Acceptance: Catalog tab renders 200+ items without layout jank; scroll position is stable.

### B-007 — Expand command palette to toggle items and adopt catalog entries

Add workspace items (toggleable) and catalog items (adoptable) as command categories in the Cmd/Ctrl+K palette. Result rows show: icon, name, current state badge, and a hint. Selecting a row calls the appropriate BLoC action without changing the active tab.

Acceptance: a user can toggle any agent/skill and adopt any catalog item purely from the keyboard without opening a panel tab.

### B-008 — Accessibility pass

- `LiveAnnouncer`: call `announce('Item X activated', 'polite')` after every toggle and profile apply.
- `FocusMonitor`: suppress focus rings on mouse interaction; show them on keyboard interaction. Matches native VSCode panel behavior.
- `role="switch"` + `aria-checked` on all binary toggle buttons.

Acceptance: NVDA/VoiceOver announces state changes; focus rings behave correctly; toggles have correct ARIA roles.

### B-011 — Registry items surfaced inline in Catalog tab

After the locally-adopted list, add a visual separator and a collapsible "N more available in Registry" section (CDK Accordion). Show unadopted registry items with an Adopt button. Add an "Available (N)" chip to the filter bar when unadopted registry items exist.

Acceptance: registry items are discoverable without a separate navigation step; adopted items disappear from the registry section.

---

## Large (L)

### B-015 — Storybook setup for shared primitives

Install `@storybook/angular` in the webview. Write stories for: `cm-card`, `cm-toggle`, `cm-button`, `cm-token-bar`, `cm-segmented`, `cm-sync-pill`, `cm-empty`. All are standalone `OnPush` input-driven components — ideal candidates. The main cost is toolchain setup, not the stories themselves.

Acceptance: `npm run storybook` in `webview/` launches a working Storybook with all listed components; no regression on the main build.

### B-016 — Custom editor for agent/skill/command files

Implement a `vscode.CustomEditorProvider` for `.md` files under `~/.claude/agents/`, `~/.claude/skills/`, and `~/.claude/commands/`. Opens a structured form (name, description, model, tools) instead of raw markdown. Requires a second webview, frontmatter parsing, and two-way file sync. Effectively a second mini-app within the extension.

Acceptance: double-clicking an agent file in the Explorer opens the structured editor; saving writes valid frontmatter back to disk; the text editor fallback still works.
