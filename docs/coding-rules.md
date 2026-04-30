# Coding Rules

## Language

- **Documentation language**: English
- **Code language**: English — all identifiers, comments, log messages, error messages

## File size

- Files must not exceed ~400 lines. Split any file that grows beyond this limit — extract focused modules or subcomponents.
- This applies to both extension host files (e.g. `extension.js` was split into 9 modules under `src/`) and Angular components.
- Keep each file focused on a single responsibility.

## Extension host (`extension.js`, `src/`, `data.js`, `update-claude.mjs`)

- CommonJS only: `require()` and `module.exports`. No `import`/`export`.
- `update-claude.mjs` is the one exception — it is a standalone script using ESM (`.mjs` extension).
- No npm runtime dependencies — only Node.js built-ins and the `vscode` API.
- Functions should be named clearly in camelCase: `getWorkspaceRoot`, `toggleItem`, `handleMessage`.
- Keep functions small and focused. If a dispatch function grows beyond ~80 lines, split by command group into a new `src/` module.

## Angular webview (`webview/`)

### Components

- Standalone only — `standalone: true` is mandatory, no NgModules.
- `ChangeDetectionStrategy.OnPush` mandatory on every component.
- File naming: `kebab-case` — `workspace.component.ts`, `cm-toggle.component.ts`.

### Signals

- Use `signal()`, `computed()`, `input()`, `output()` for all reactive state.
- Do not introduce `BehaviorSubject` or `ReplaySubject` for local state — signals replace them.
- RxJS observables are acceptable only for the bridge message stream (`VsCodeBridgeService.messages$`) and for CDK `SelectionModel.changed` streams converted with `toSignal()`.

### State ownership

- Domain state lives in `core/state/*.state.ts` services — not in components.
- Components inject state services (read signals) and their feature BLoC (call action methods).
- Never inject `VsCodeBridgeService` in a component or overlay — use the feature BLoC.

### BLoC layer

Each feature folder (`workspace/`, `profiles/`, `catalog/`, `settings/`) contains a `*.bloc.ts`:

- `@Injectable({ providedIn: 'root' })`, injects `VsCodeBridgeService` privately.
- Exposes **action methods** (wraps `bridge.send()` calls).
- Owns **feature-local reactive state** (`private signal<T>()` → `.asReadonly()`).
- Subscribes to inbound `bridge.messages$` in the constructor with `takeUntilDestroyed()`.
- `DataSyncService` and `ThemeService` are the only other callers of `VsCodeBridgeService`.

Never call `bridge.send()` or subscribe to `bridge.messages$` from a template event binding or component constructor.

### Angular CDK

`@angular/cdk` is installed in the webview. The following modules are in active use or reserved for upcoming work:

| Module | Use |
| --- | --- |
| `@angular/cdk/collections` | `SelectionModel<T>` for multi-select in list views |
| `@angular/cdk/overlay` | `ContextMenuService` positioned overlays; apply-preview diff panel (planned) |
| `@angular/cdk/drag-drop` | Profile reorder; catalog-to-workspace drag transfer (planned) |
| `@angular/cdk/a11y` | `LiveAnnouncer`, `FocusMonitor`, `FocusKeyManager` (planned) |
| `@angular/cdk/scrolling` | `CdkVirtualScrollViewport` for Catalog tab (planned) |
| `@angular/cdk/accordion` | Expandable item detail cards (planned) |

**CSP_NONCE is required.** Every CDK module that injects dynamic styles (drag-drop animations, overlays, virtual scroll) will fail silently under the existing strict nonce-based CSP unless the `CSP_NONCE` injection token is wired in `webview/src/main.ts`. This is already done — do not remove it.

### SelectionModel pattern

Use `SelectionModel<T>` from `@angular/cdk/collections` for any list that supports multi-select. Do not use a raw `Set<string>` for tracking selected items.

```typescript
// In the BLoC
readonly selection = new SelectionModel<WorkspaceItem>(true /* multi */);
readonly hasSelection = toSignal(
  this.selection.changed.pipe(map(() => this.selection.hasValue())),
  { initialValue: false },
);
```

- Expose `selection` as a readonly reference from the BLoC; components call `selection.toggle(item)`, `selection.clear()`, etc.
- Drive the bulk-action toolbar visibility from `hasSelection()`.
- Shift-click range select and a visual checkbox column are the affordance that multi-select is active.

### Search and highlight pattern

Use `SearchService` for fuzzy search and filter-token parsing. Do not use `[innerHTML]` or `DomSanitizer` for rendering search highlights — it is unsafe under the strict CSP and violates the no-innerHTML rule.

Instead, use `HighlightMatchPipe`, which returns `MatchSegment[]`:

```typescript
interface MatchSegment {
  text: string;
  highlighted: boolean;
}
```

Render in the template with `@for`:

```html
@for (seg of item.name | highlightMatch: query; track seg.text) {
  <span [class.search-match]="seg.highlighted">{{ seg.text }}</span>
}
```

Filter tokens (`type:agent`, `active:true`, `tok>500`) are parsed by `SearchService` and applied before fuzzy scoring. Active tokens render as dismissible chips in the toolbar.

### UiStateService pattern

`UiStateService` persists lightweight UI flags across sessions by reading/writing `ui-state.json` via the extension host. Use it for:

- Onboarding step completion (`onboardingDismissed`, `onboardingStep`)
- Per-tab collapse/expand state
- Any boolean flag that should survive a panel reload but does not belong in a profile or settings

Do not store domain data (item state, profile content) in `ui-state.json` — that belongs in `data.js`-managed files.

### Soft-delete pattern (undo toast)

Destructive list removals (e.g. delete profile) use a two-phase soft-delete:

1. Remove the item from the local signal immediately (optimistic).
2. Call `ToastService.showWithAction(message, 'Undo', callback)` to show a toast with a countdown and an Undo button.
3. Start a `setTimeout` (5 seconds). Store the timer ID in the BLoC so it can be cancelled.
4. If Undo is clicked, restore the item to the signal and cancel the timer. Do not send any message to the host.
5. If the timer expires, send the permanent delete message (`bridge.send({ command: 'deleteProfile', ... })`).

Never send the delete command before the undo window expires.

### Bottom-sheet pattern for destructive confirmations

Replace blocking confirmation modals with a bottom-sheet for actions that modify significant state (e.g. applying a profile):

- Render a `@if (sheetVisible())` block at the component root — not in a portal.
- Use a CSS `translateY` transition: hidden state is `translateY(100%)`, visible state is `translateY(0)`.
- Trap focus inside the sheet while open using `cdkTrapFocus`.
- ESC dismisses the sheet (bind to `(keydown.escape)` on the host element).
- The sheet shows a summary of consequences (e.g. "Will activate N / Will deactivate N") so the user can make an informed decision without reading a wall of text.

### ContextMenuService pattern

`ContextMenuService` opens a CDK `GlobalPositionStrategy` overlay at the cursor position in response to `(contextmenu)` events on rows and cards.

- One service, one positioned overlay component — not per-feature copies.
- The service receives a `ContextMenuConfig` describing which actions apply to the item.
- The overlay closes on next click anywhere or on Escape.
- Bind `(contextmenu)="onContextMenu($event, item)"` on the host element; call `$event.preventDefault()` to suppress the browser default menu.

### Optimistic toggle pattern

Do not wait for `dataUpdate` before updating toggle state in the UI. Flip the item's active signal immediately, then send the toggle message to the host. On `dataUpdate`, reconcile the full list — if the host state differs from the local optimistic state, the signal corrects itself automatically.

### Accessibility

- Every interactive element (buttons, toggles, inputs) in `webview/src/app/` must have an `aria-label` or visible label text.
- Use `role="switch"` and `aria-checked` on binary toggle buttons.
- Planned: `LiveAnnouncer` for toggle/apply confirmations; `FocusMonitor` to suppress focus rings on mouse interaction.

### No-VSCode-in-webview rule

- Never `import vscode` or reference `vscode.*` in any `webview/` file.
- Never call `fs`, `path`, `os` from webview code.
- All side effects (toggle, save, delete) go through a BLoC, which calls `VsCodeBridgeService.send()`.

- Keep state services focused on one domain (workspace, profiles, catalog, settings).

## Comments

- Only explain *why*, never *what* — the code shows what.
- No multi-line comment blocks explaining obvious logic.
- Acceptable: a short comment on a non-obvious workaround or VSCode API quirk.

## Commits

- Conventional commit format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc.
- Imperative mood: "add toggle animation" not "added toggle animation".
- No AI attribution in commit messages.

## Formatting

Prettier handles all formatting. Config lives in `webview/package.json`:
- `printWidth: 100`, `singleQuote: true`, `trailingComma: all`
- Run `npm run format` before committing webview changes.
