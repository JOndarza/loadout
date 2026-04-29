# Loadout

> Swap your Claude Code setup like equipment.

A VSCode extension that lets you switch agent and skill configurations as if they were loadouts in a game. Save profiles, swap between them with one click, sync agents and skills across projects through a global catalog.

---

## What it does

| Tab | Purpose |
|---|---|
| **Workspace** | Toggle agents and skills on/off. Items in `.claude/agents/` and `.claude/skills/` are active; toggling moves them to a managed store path. |
| **Profiles** | Snapshot the current setup as a named loadout. Quick-switch with one click. Edit the included items inline. Drag to reorder. |
| **Catalog** | Bridge between projects. Items in `~/.claude/` are visible to all your workspaces. Adopt to a project, promote local items to the catalog, or pull updates when the catalog version changes. |
| **Settings** | Density (Compact/Comfortable), theme (Dark/Light/Auto follows VSCode), default tab, registry URL, keyboard shortcuts reference, and About. |

---

## Install

This repo is not yet on the VSCode Marketplace. To install locally:

```bash
git clone <repo-url> loadout
cd loadout
# Pre-built webview is committed — no build step needed for use
ln -s "$(pwd)" "$HOME/.vscode/extensions/loadout"
```

Reload VSCode. The Loadout activity bar icon appears in the sidebar.

### Open the panel

- Activity bar icon → click
- Command palette → "Loadout: Open Panel"
- Keyboard shortcut: `Cmd+Shift+Alt+C` (mac) / `Ctrl+Shift+Alt+C` (win/linux)

---

## Keyboard shortcuts (inside Loadout)

| Keys | Action |
|---|---|
| `1` `2` `3` | Switch tabs (Workspace · Profiles · Catalog) |
| `/` | Focus search |
| `⌘K` / `Ctrl+K` | Open command palette |
| `a` | Toggle "Active only" filter in Workspace |
| `s` | Save current state as new loadout |
| `Esc` | Close palette / cancel inline edits |

---

## Architecture

```
loadout/
├── extension.js          # VSCode entry: webview hosting + message routing
├── data.js               # Filesystem layer: agents, skills, profiles, catalog, hashes
├── update-claude.mjs     # Registry sync orchestrator (npx claude-code-templates)
├── deploy.js             # Local install helper
├── package.json          # Extension manifest
├── icon-activity.svg     # Activity bar icon
├── webview/              # Angular 21 standalone app (the entire UI)
│   ├── angular.json
│   ├── package.json
│   └── src/app/
│       ├── core/         # bridge, theme, shortcuts, state services (signals)
│       ├── layout/       # ShellComponent (header + tabs + status strip)
│       ├── features/     # workspace, profiles, catalog, settings
│       └── shared/       # primitives (cm-card, cm-toggle, etc.) + overlays
└── webview-dist/         # Compiled Angular bundle (committed for zero-build install)
```

**Communication**: extension.js posts an `initialData` message to the webview on `ready`. The Angular app subscribes via `VsCodeBridgeService` and routes data into signal-based state services. User actions inside the webview send typed messages back; extension.js executes filesystem mutations and replies with `dataUpdate`.

**Theme**: `ThemeService` resolves the active theme from the user's setting (Dark/Light/Auto). When set to Auto, it follows `vscode.window.activeColorTheme.kind` via `onDidChangeActiveColorTheme`. Switching is smooth (300ms transition).

**Storage**: per-workspace state lives in `context.storageUri` (managed by VSCode, not in repo). A one-time migration moves any legacy `.claude-store/` content from before v2 into the managed location.

---

## Development

```bash
cd webview
npm install
npm run build         # Production build → ../webview-dist/
npm run watch         # Rebuild on file change (development mode)
npm run lint          # Format check
```

After `npm run watch`, reload the VSCode window to see changes (or run the `Loadout: Refresh` command).

### Adding a new tab or feature

1. Create a feature component under `webview/src/app/features/<name>/`.
2. Add a state service if it owns persisted data.
3. Wire any new message types in `webview/src/app/core/messages.ts`.
4. Add the corresponding handler in `extension.js` `handleMessage()`.
5. Import the component in `ShellComponent` and add a `@case` in the tab switch.

---

## Moving to its own repo

This extension is being incubated inside a host repo. To extract it later:

```bash
# 1. Filter the git history to keep only this directory
git subtree split --prefix=.claude-manager -b loadout-history

# 2. Create the new repo
mkdir ../loadout && cd ../loadout
git init
git pull ../<host-repo> loadout-history

# 3. Push to a new remote
git remote add origin <new-remote-url>
git push -u origin main
```

After the move, this README and the directory structure are already self-contained — no edits required.

---

## License

MIT © 2026 Joaquin Ondarza Ortega
