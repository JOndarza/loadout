# Ideas

Raw ideas inbox. No commitment — capture now, evaluate later.
Group related ideas and promote to a story in `backlog.md` when ready.

<!-- Add ideas below as they come up. One bullet per idea. -->

## Claude Code config surface

### Pending (not yet implemented)

- **`.claude/rules/*.md` toggle** — same move-to-store pattern as agents/skills. Complication: rules files live in `.claude/rules/` and are semantically different from skills (always-on instructions vs. invokable skills). Needs a distinct section to avoid user confusion.

### Large / future

- **Custom editor** — `vscode.CustomEditorProvider` for `.md` files under `~/.claude/agents|skills|commands/`. Opens a structured form (name, description, model, tools) instead of raw markdown when the user opens an agent/skill file. Requires a second webview, frontmatter parsing, and two-way file sync. Effectively a second mini-app.

## UX — Fast switch (core goal)

Everything in this section serves the same goal: switching profiles must be instant and frictionless — zero-click from the keyboard, minimum scanning, no confirmation interruptions.

### Expand command palette to apply profiles without opening the panel

The command palette (Cmd/Ctrl+K) currently lists profiles to switch. Extend it to also show agents/skills as toggleable commands and catalog items as adoptable commands — all in one `computed()` signal from current state. Result rows: icon + name + current state badge (Active / Inactive) + hint. Selecting a toggle command calls `bridge.send({ command: 'toggle', ... })` inline. No tab change, no scrolling, no mouse.

Pain point: power users have no keyboard path to toggle a specific agent without mousing to the list.
Complexity: medium. The palette already exists; adding item categories and their BLoC calls is the main work.

### Profile card — Apply is the only primary action; everything else in overflow

Five buttons per card (Edit / Duplicate / Export / Apply / Delete) compete equally for attention. Apply is the action for 90% of visits. Move Edit, Duplicate, Export, Delete into a `⋯` (MoreHorizontal Lucide icon) CDK Menu overflow panel, leaving only Apply (gold) as the visible CTA. Card scanning becomes instant: eyes go directly to the name and Apply.

Complexity: medium. `CdkMenuTrigger` + `CdkMenu` from `@angular/cdk/menu` handles keyboard nav, Escape, and focus return.

### Replace Apply confirm modal with a bottom-sheet diff panel

The current confirm modal blocks all interaction. Replace with a slide-up sheet anchored at the bottom of the panel (200–300px, `translateY` CSS animation). Shows: profile name + "Will activate (N) / Will deactivate (N)" chips + Cancel / Apply. The profile list stays visible behind it. ESC cancels. Faster visual flow, no jarring full-screen overlay.

Complexity: medium. `@if (previewVisible())` block at root, CSS transition, `cdkTrapFocus`.

### Delete profile — undo toast instead of no-confirmation

No delete confirmation exists today. Add soft-delete: card disappears immediately (optimistic), a toast appears with a 5-second countdown progress bar and [Undo] button. If Undo is clicked, the card returns to its position. After 5 seconds, `deleteProfile` fires to the extension host. Removes accidental delete anxiety without a blocking modal.

Complexity: medium. `deletePending` signal in the BLoC, cancellable `setTimeout`, countdown bar in the toast component.

### Keyboard shortcuts: tab switching + quick apply

| Action | Shortcut |
|---|---|
| Switch to Workspace | Ctrl+1 |
| Switch to Profiles | Ctrl+2 |
| Switch to Catalog | Ctrl+3 |
| Apply focused profile | Ctrl+Enter (from Profiles tab) |
| Toggle focused item | Space or Enter |
| Dismiss any overlay | Escape |

Shortcut hints appear as `kbd` elements in tooltips and command palette result rows — passive discovery, no docs page needed.
Complexity: low. One subscription per shortcut in `ShortcutsService`.

### Fuzzy search with match highlighting (uFuzzy)

Replace substring-only search with `@leeoniya/ufuzzy` (4 KB bundle, returns range indices for each match). Render highlights as `<span class="search-match">` template segments — no `[innerHTML]` / `SafeHtml` needed, safe under the existing strict CSP.

Also: parse filter tokens directly in the search box (`type:agent`, `active:true`, `tok>500`) so power users can compose a query in one gesture instead of clicking filter chips. Active token-filters appear as dismissable chips in the toolbar.

Pain point: current search is substring-only and highlights nothing. A user typing `"cde"` won't find `"code-explainer"`.
Complexity: low. One `npm install @leeoniya/ufuzzy`; a pipe for segment splitting; a regex parser in the search state service.

## UX — Progressive disclosure and information density

Ideas that reduce clutter so the switch path stays clear.

### Profile card — hover to reveal metadata

Always visible: name, active badge, item counts (agents/skills/commands), Apply, ⋯.
On CSS `:hover`: description, created date, applied count.
On explicit card body click (expand signal): full agent/skill chip list.

Pain point: every card shows counts + date + applied count + 5 buttons at rest, creating visual noise that slows profile scanning.
Complexity: low. CSS `:hover` + one `signal<boolean>` per card + `@if (expanded())` block.

### Status strip → move into Workspace tab header

The always-visible strip (`X/Y agents · A/B skills · ~N tok · ~$0.0X/req`) occupies one full band of persistent chrome above the tabs. Move it into a sub-header that only renders when the Workspace tab is active. Reduces vertical stacking: header → tabs → content. Four competing horizontal bands collapse to three.

Complexity: low. `@if (activeTab() === 'workspace')` wrapper around the strip.

### Token budget bar

Replace the static `~N tok` text with a thin filled bar below it. Three color zones via VSCode CSS variables: green (0–70%), amber (70–90%), red (90%+). Fill = `totalTokens / configuredBudget * 100%`. A tooltip shows the raw number. Configurable budget stored in Settings (default 50,000).

Pain point: `~$0.04/req` is meaningless without knowing session volume. A bar provides immediate directional signal (loading too many heavy agents).
Complexity: low. One `computed` signal for percentage; one CSS `width` binding.

### First-run inline checklist (empty state onboarding)

When `agents.length === 0 && skills.length === 0`, render a 3-step checklist instead of a blank list:
1. "Add your first agent from the Catalog tab →" (click switches tab)
2. "Toggle at least one item Active"
3. "Save as a Profile — one click to restore anytime"

Steps auto-check on completion. State persisted in `ui-state.json`. Disappears after all steps are done. A dismiss link is available from step 1.

Pain point: new users see a blank list with no guidance on where to start.
Complexity: low. Signal-tracked `onboardingStep` in `ui-state.json`.

### Right-click context menu on item rows

`(contextmenu)` on workspace and catalog rows; a `ContextMenuService` opens a CDK `GlobalPositionStrategy` overlay at cursor position. Closes on next click or Escape. Items:

- Workspace row: Toggle / Copy name / Find in Catalog / Add to current profile
- Profile card: Apply / Duplicate / Export / Delete
- Catalog row: Adopt / Copy name

Pain point: common actions require navigating to different tabs or mousing to small buttons.
Complexity: medium. One `ContextMenuService` + one positioned overlay component.

### Registry items surfaced inline in Catalog

The Registry feature (sync from `aitmpl.com`) is hidden behind a collapsible section that most users won't discover. After the locally-adopted list, add a visual separator and an "N more available in Registry" row. Expanding it (CDK Accordion) shows unadopted registry items with an Adopt button — no separate button or section needed. An `Available (N)` chip appears in the filter bar when registry items are present and unadopted.

Pain point: the Registry is a discoverability dead end. Many users will never know it exists.
Complexity: medium. `registryStatus` result is already received; a `computed()` of unadopted items + accordion expand.

## UX / Angular CDK

Angular CDK is not yet installed (`npm install @angular/cdk` inside `webview/`). Critical prerequisite: wire `CSP_NONCE` in `main.ts` — without it every CDK module that injects inline styles (drag-drop animations, overlays, virtual scroll) fails silently under the existing strict nonce-based CSP.

### No-CDK quick wins

- **Optimistic toggle** — today `toggle` waits for `dataUpdate` before updating the UI; flip state locally via signals immediately and let the host reconcile on `dataUpdate`. Eliminates the 50–200ms lag on every click.
- **Skeleton loader** — shimmer CSS (`gradient` + `animation`) behind an `@if (loaded())` gate while `initialData` arrives. No extra library.
- **Row hover states** — `--vscode-list-hoverBackground` and `--vscode-focusBorder` are already injected by VSCode into the webview. Add `transition: background-color 120ms ease` on `.item-card`.
- **Inline profile rename (double-click)** — `editing` signal + `<input>` with `(blur)`, `(keydown.enter)`, `(keydown.escape)`. `renameProfile` already exists in `messages.ts`.
- **Last-applied timestamp on profile card** — `lastAppliedAt` and `appliedCount` already exist in `messages.ts`; only rendering is missing. The `createdAt` display slot in `profiles.component.html:98-103` is the template to follow.

### CDK Collections — SelectionModel + bulk toolbar

- **`SelectionModel<T>`** from `@angular/cdk/collections` replaces the current `Set<string>` used for `selected` in workspace and catalog. Exposes `selection.changed` as an Observable → `toSignal()` to drive the bulk toolbar.
- **Bulk action toolbar** — appears only when `hasSelection()` is true; "Activate all / Deactivate all / Clear" buttons. `bulkToggle` already exists in `messages.ts`.
- **Shift-click range select** + a **checkbox column** as a visual affordance that multi-select mode is active.
- **`FocusKeyManager`** from `@angular/cdk/a11y` for arrow-key navigation + Space to toggle + Shift+Arrow for range selection.

### CDK Drag-Drop — profile reorder and catalog transfer

- **Profile drag-to-reorder** — `cdkDropList` + `cdkDrag` + `CdkDragHandle` (grip icon). `reorderProfiles` is already wired in `messages.ts` and `data.js:261`. Missing: SCSS drag-handle cursor, ghost styling, and the `draggable` attribute on non-editing cards. Already marked as planned in `roadmap.md`.
- **Catalog → Workspace drag (copy semantics)** — source list with `cdkDropListSortingDisabled` + `cdkDropListHasAnchor`; destination with `cdkDropListEnterPredicate` to reject duplicates. `addFromGlobal` already exists. Use `copyArrayItem()` so the catalog item stays in place. The `.cdk-drop-list-anchor` outline left behind reinforces "copy, not move."
- **`.cdk-drop-list-receiving` drop-zone highlight** — dashed border using `--vscode-focusBorder` auto-applied by CDK when an item is hovering over the workspace list.
- **Gotcha**: CDK drag-drop has no built-in keyboard support (GitHub issue #25468, open since 2022). Keep Up/Down arrow buttons as a keyboard alternative. Use `previewContainer: 'global'` to avoid clipping inside `overflow: hidden` scroll panels.

### CDK Overlay — apply preview diff

- **`cdkConnectedOverlay`** on the Apply button in profiles — hover shows a panel with `willActivate` / `willDeactivate` item counts. `previewApplyProfile` already exists in `messages.ts`.

### CDK Virtual Scroll — catalog tab

- **`CdkVirtualScrollViewport`** with a fixed `itemSize` (px) on the Catalog tab for large item lists. Viewport needs a fixed CSS height (not `auto`). Enforce fixed-height catalog cards (2-line description truncation) to avoid scroll-position jitter.

### CDK Accordion — expandable item details

- **`cdkAccordionItem`** to expand cards revealing token count, full description, and sync status. CSS `max-height` + `overflow: hidden` transition — no JavaScript animation needed.

### Accessibility

- **`LiveAnnouncer`** — `announce('Agent X activated', 'polite')` after every toggle and profile apply. Screen-reader feedback without moving focus.
- **`FocusMonitor`** — show focus rings only during keyboard navigation, not on mouse click. Matches native VSCode panel behavior.
- **`role="switch"` + `aria-checked`** on toggle buttons — correct ARIA pattern for binary on/off switches.

## Platform

- **Storybook for shared primitives** — `cm-card`, `cm-toggle`, `cm-button`, `cm-token-bar`, `cm-segmented`, `cm-sync-pill`, `cm-empty` are all standalone `OnPush` input-driven components — ideal Storybook candidates. Largest cost is `@storybook/angular` toolchain setup, not the stories themselves. Listed in `roadmap.md:27`.
