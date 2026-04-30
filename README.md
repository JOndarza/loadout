# Loadout

> Swap your Claude Code setup like equipment.

A VSCode extension that lets you switch agent, skill, and command configurations as if they were loadouts in a game. Save profiles, swap between them with one click, sync items across projects through a global catalog, and configure Claude Code behavior — all from a single panel.

---

## Features

- **One-click profile switching** — snapshot your active agents, skills, and commands as a named profile; apply any profile instantly via bottom-sheet confirmation
- **Optimistic toggles** — toggle switches flip immediately without waiting for the filesystem round-trip; the UI never feels laggy
- **Fuzzy search with filter tokens** — search across all tabs with 4 KB `ufuzzy`; narrow results with inline tokens (`type:agent`, `active:true`, `tok>500`)
- **Right-click context menus** — full action set on any row in Workspace, Profiles, and Catalog without navigating away
- **Delete with undo** — soft-delete with a 5-second countdown toast and a one-click Undo button
- **Config tab** — manage Claude Code's `settings.json` surface: permissions (allow/deny/ask), session env vars, hooks, sandbox toggle, and MCP servers
- **File decorations** — Explorer badges on `.md` files show active / stored / update-available status at a glance
- **VSCode walkthrough** — 4-step native onboarding walkthrough on first install
- **Task provider** — each saved profile is exposed as a VSCode task (`Apply — <profile-name>`)
- **Token budget bar** — colored status strip shows token usage relative to a configurable limit (green → amber → red)
- **First-run checklist** — 3-step onboarding shown only on an empty workspace; dismisses automatically on completion
- **Global catalog** — share agents, skills, and commands across all workspaces via `~/.claude/` (or a custom path)
- **Hash-based sync** — detects catalog updates without re-reading file contents

---

## What each tab does

| Tab | Purpose |
|---|---|
| **Workspace** | Toggle agents, skills, and commands on/off. Items in `.claude/agents/`, `.claude/skills/`, and `.claude/commands/` are active; toggling moves them to a managed store path inside `context.storageUri`. |
| **Profiles** | Snapshot the current active set as a named loadout. Apply any profile with one click. Profile cards show a `...` overflow menu with Edit, Rename, Duplicate, Export, and Delete. Hover a card to reveal created-date and apply-count. |
| **Catalog** | Bridge between projects. Items in `~/.claude/` (or `loadout.globalCatalogPath`) are visible across all workspaces. Adopt to a project, promote local items to the catalog, or pull updates when the catalog version changes. |
| **Config** | Claude Code configuration surface: permissions allow/deny/ask rules, session environment variables, hooks toggle, sandbox toggle, and MCP servers list (with per-server enable/disable). |
| **Settings** | Density (Compact/Comfortable), theme (Dark/Light/Auto), default tab, registry URL, keyboard shortcuts reference, and About. |

---

## Install

This repo is not yet on the VSCode Marketplace. To install locally:

```bash
git clone <repo-url> loadout
cd loadout
# Pre-built webview is committed — no build step needed for basic use
ln -s "$(pwd)" "$HOME/.vscode/extensions/loadout"
```

Reload VSCode. The Loadout activity bar icon appears in the sidebar.

### Open the panel

- Activity bar icon (left sidebar) — click
- Command palette — `Loadout: Open Panel`
- Keyboard shortcut: `Cmd+Shift+Alt+C` (mac) / `Ctrl+Shift+Alt+C` (win/linux)

---

## Keyboard shortcuts (inside Loadout)

| Keys | Action |
|---|---|
| `1` `2` `3` `4` | Switch tabs (Workspace · Profiles · Catalog · Config) |
| `/` | Focus search |
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `a` | Toggle "Active only" filter in Workspace |
| `s` | Save current state as new profile |
| `Esc` | Close palette / dismiss bottom sheet / cancel inline edits |

---

## Search filter tokens

Type any token directly in the search box to narrow results:

| Token | Example | Meaning |
|---|---|---|
| `type:` | `type:agent` | Filter by item type (`agent`, `skill`, `command`) |
| `active:` | `active:true` | Show only active or only inactive items |
| `tok>` / `tok<` | `tok>500` | Filter by token count threshold |

Tokens combine with free-text fuzzy search. Matched characters are highlighted without using `innerHTML`.

---

## Architecture

```
loadout/
├── extension.js          # VSCode entry: webview hosting + message routing
├── data.js               # Filesystem layer: agents, skills, commands, profiles, catalog, hashes
├── update-claude.mjs     # Registry sync orchestrator (npx claude-code-templates)
├── deploy.js             # Local install helper
├── package.json          # Extension manifest
├── icon-activity.svg     # Activity bar icon
├── webview/              # Angular 21 standalone app (the entire UI)
│   ├── angular.json
│   ├── package.json
│   └── src/app/
│       ├── core/         # bridge, theme, shortcuts, search, toast, state services (signals)
│       ├── layout/       # ShellComponent (header + tabs + status strip)
│       ├── features/     # workspace, profiles, catalog, config, settings
│       └── shared/       # primitives (cm-card, cm-toggle, cm-token-bar, etc.) + overlays
└── webview-dist/         # Compiled Angular bundle (committed for zero-build install)
```

### Two-process communication

Extension.js posts an `initialData` message when the webview fires `ready`. The Angular app subscribes via `VsCodeBridgeService` and routes data into four signal-based state services (`workspace.state.ts`, `profiles.state.ts`, `catalog.state.ts`, `settings.state.ts`). User actions send typed messages back; `extension.js` executes filesystem mutations and replies with `dataUpdate`. The full message contract lives in `webview/src/app/core/messages.ts`.

### State and UI patterns

- All component state uses Angular signals (`signal()`, `computed()`, `input()`, `output()`) — no Subjects for local state
- Components are `OnPush` and inject state services or a feature BLoC; they never inject `VsCodeBridgeService` directly
- `SelectionModel` from `@angular/cdk/collections` manages multi-select; checkbox affordance appears on hover
- `ContextMenuService` + `ContextMenuComponent` (CDK Overlay) power right-click menus on every row
- `UiStateService` persists arbitrary UI flags to `ui-state.json` in `context.storageUri`
- `ToastService.showWithAction()` drives undo toasts with a countdown timer

### Theme

`ThemeService` resolves the active theme from the user's setting (Dark/Light/Auto). When set to Auto it follows `vscode.window.activeColorTheme.kind` via `onDidChangeActiveColorTheme`. Switching is smooth (300 ms CSS transition).

### Storage

Per-workspace state lives in `context.storageUri` (managed by VSCode, never committed). A one-time migration on first activation moves any legacy `.claude-store/` content from before v2 into the managed location. The global catalog defaults to `~/.claude/` and is overridable via the `loadout.globalCatalogPath` setting.

---

## Development

```bash
cd webview
npm install
npm run build         # Production build → ../webview-dist/
npm run watch         # Rebuild on file change (development mode)
npm run lint          # Format check (Prettier)
npm test              # Run vitest unit tests
```

After `npm run watch`, reload the VSCode window to pick up changes, or run the **Loadout: Refresh** command (`Cmd+Shift+P → Loadout: Refresh`).

### Adding a new tab or feature

1. Create `webview/src/app/features/<name>/<name>.bloc.ts` — handles all `bridge.send()` calls and inbound message subscriptions for the feature.
2. Create `webview/src/app/features/<name>/<name>.component.ts` — injects state service(s) and the BLoC; never injects `VsCodeBridgeService` directly.
3. Add a state service under `core/state/` if the feature owns persisted domain data.
4. Wire any new message types in `webview/src/app/core/messages.ts` (single source of truth for the message protocol).
5. Add the corresponding handler in `extension.js` `handleMessage()`.
6. Import the component in `ShellComponent` and add a `@case` in the tab switch; add a keyboard shortcut number to the tab list.

---

## License

MIT © 2026 Joaquin Ondarza Ortega
