# Loadout — Webview

The Angular 21 application that renders the Loadout panel inside VSCode. It runs in a sandboxed webview context: no filesystem access, no network, no VSCode API calls. All data flows through `postMessage` to and from the extension host.

---

## Quick start

```bash
cd webview
npm install
npm run build       # production build → ../webview-dist/
npm run watch       # incremental rebuild on file change
npm run lint        # Prettier format check
npm test            # vitest unit tests
```

After `npm run watch` picks up a change, reload the VSCode window or run **Loadout: Refresh** (`Cmd+Shift+P → Loadout: Refresh`) to see it in the panel.

> `ng serve` starts a browser dev server at `http://localhost:4200/` but the webview bridge (`VsCodeBridgeService`) will not function outside VSCode. Use it only for isolated component work.

---

## Architecture

### Two-process boundary

The webview never touches the filesystem or VSCode APIs. Every side effect is a message:

```text
Webview (Angular)  ──postMessage──►  extension.js  ──fs.*──►  disk / ~/.claude/
                   ◄──postMessage──                ◄──────────
```

The message contract is the single source of truth: `src/app/core/messages.ts`.

### State layer

Four signal-based state services live in `src/app/core/state/`:

| Service | Owns |
| --- | --- |
| `workspace.state.ts` | Active and stored agents, skills, commands for the current workspace |
| `profiles.state.ts` | Saved profiles list, currently applied profile |
| `catalog.state.ts` | Global catalog items, hash-based update flags |
| `settings.state.ts` | User preferences (density, theme, default tab, registry URL) |

`VsCodeBridgeService` receives the `initialData` message on load and the `dataUpdate` message after any mutation, then pushes values into these services. Components read from the services via signals; they never subscribe to the bridge directly.

`UiStateService` handles arbitrary UI flags (e.g., onboarding checklist completion) that are persisted to `ui-state.json` in the workspace storage path.

`claude-settings.state.ts` holds the deserialized Claude Code `settings.json` surface shown in the Config tab.

### Component rules

- All components are **standalone** and use **`OnPush`** change detection.
- Components inject a feature BLoC or a state service — never `VsCodeBridgeService` directly.
- Use `signal()`, `computed()`, `input()`, and `output()` for all state and I/O. Avoid `Subject` for local state.
- Keep components under ~400 lines; split at single-responsibility boundaries.

### Feature BLoC pattern

Each feature directory contains a `<name>.bloc.ts` that owns all `bridge.send()` calls and inbound message subscriptions for that feature. The component stays declarative and delegates mutations to the BLoC.

```text
features/
├── workspace/
│   ├── workspace.bloc.ts       # all send() calls, toggle logic
│   └── workspace.component.ts  # injects WorkspaceState + WorkspaceBloc
├── profiles/
├── catalog/
├── config/
└── settings/
```

### Shared primitives and overlays

```text
shared/
├── primitives/
│   ├── cm-card, cm-toggle, cm-button, cm-segmented   # reusable UI atoms
│   ├── cm-token-bar                                   # token budget bar
│   ├── cm-sync-pill                                   # catalog sync indicator
│   ├── highlight-match.pipe.ts                        # fuzzy match highlights (no innerHTML)
│   └── copy-to-clipboard.directive.ts
└── overlays/
    ├── apply-confirm.component.ts    # bottom-sheet profile apply confirmation
    ├── command-palette.component.ts  # Cmd+K palette
    ├── context-menu.component.ts     # right-click row menus (CDK Overlay)
    ├── context-menu.service.ts
    ├── import-profile.component.ts
    └── toast.component.ts            # undo toasts with countdown
```

---

## Key services

| Service | File | Purpose |
| --- | --- | --- |
| `VsCodeBridgeService` | `core/vscode-bridge.service.ts` | Wraps `acquireVsCodeApi()`, exposes `send()` and an RxJS `messages$` stream |
| `ThemeService` | `core/theme.service.ts` | Resolves Dark/Light/Auto theme; reacts to `vscodeThemeChanged` messages |
| `ShortcutsService` | `core/shortcuts.service.ts` | Global keyboard shortcuts (`1`–`4` tabs, `/` search, `Cmd+K` palette) |
| `SearchService` | `core/search.service.ts` | `@leeoniya/ufuzzy` wrapper; produces ranked results and match ranges |
| `ToastService` | `core/toast.service.ts` | `show()` and `showWithAction()` for undo toasts with a countdown timer |
| `ContextMenuService` | `shared/overlays/context-menu.service.ts` | Opens a CDK Overlay context menu at pointer position |
| `UiStateService` | `core/state/ui-state.service.ts` | Persists UI flags to `ui-state.json` via the bridge |

---

## Fuzzy search and filter tokens

`SearchService` wraps `@leeoniya/ufuzzy` (4 KB bundle impact). The search box accepts free text and structured tokens that are parsed before the fuzzy pass:

| Token | Example | Effect |
| --- | --- | --- |
| `type:` | `type:agent` | Restrict to item type |
| `active:` | `active:true` | Show only active or inactive items |
| `tok>` / `tok<` | `tok>500` | Filter by token count |

`HighlightMatchPipe` renders matched character ranges as `<mark>` elements without using `innerHTML`, keeping CSP compliance intact.

---

## CDK usage

`@angular/cdk` is used in three places:

- **`@angular/cdk/overlay`** — `ContextMenuComponent` and the bottom-sheet apply confirmation use CDK Overlay for positioning and focus trapping.
- **`@angular/cdk/collections`** — `SelectionModel` replaces manual `Set<string>` tracking for multi-select in Workspace and Catalog rows. Checkbox affordance appears on hover.
- **`@angular/cdk/a11y`** — focus management inside overlays.

`CSP_NONCE` is wired in `app.config.ts` so the CDK's runtime style injection respects the extension's nonce-based Content Security Policy.

---

## SCSS design system

Component styles use CSS custom properties defined by `ThemeService` at the `:root` level. The design tokens follow VSCode's variable naming conventions (`--vscode-*`) where possible, supplemented by Loadout-specific tokens for spacing, radius, and animation timing.

Key conventions:

- Density modes (Compact / Comfortable) adjust `--row-height` and `--spacing-sm` at the shell level; components inherit automatically.
- The status strip (token budget bar) is visible only when the Workspace tab is active.
- Bottom-sheet entrance uses a CSS `max-height` + `translate` spring animation (no JS animation library).
- Profile card hover reveals created-date and apply-count via a pure CSS `max-height` transition.

---

## Testing

Tests use **vitest** (not Jest). Configuration is in `vitest.config.ts`.

```bash
npm test              # run all tests once
npm test -- --watch   # watch mode
```

State services have unit tests in `core/state/*.spec.ts`. Components are tested at the service boundary; there are no DOM-heavy integration tests currently.

---

## Adding a new tab or feature

1. Create `features/<name>/<name>.bloc.ts` — owns all `bridge.send()` calls and message subscriptions.
2. Create `features/<name>/<name>.component.ts` — `OnPush`, standalone, injects state and BLoC only.
3. Add a state service in `core/state/` if the feature owns persisted domain data.
4. Register new message types in `core/messages.ts`.
5. Add the handler in `extension.js` `handleMessage()`.
6. Import the component in `ShellComponent`, add a `@case` in the tab switch, and assign a number key in `ShortcutsService`.

---

## Constraints

- No `import vscode` or `vscode.*` calls anywhere under `webview/`.
- No `HttpClient`, `fetch`, or `XMLHttpRequest` — the webview is network-sandboxed.
- No inline scripts or external resource loads — the extension enforces a strict nonce-based CSP.
- CommonJS (`require`/`module.exports`) is for extension host files only; the webview is pure ESM TypeScript compiled by the Angular build.
