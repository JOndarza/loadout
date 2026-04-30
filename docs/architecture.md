# Architecture

## Overview

Loadout is a VSCode extension with two separate runtime processes:

```
┌─────────────────────────────────┐        postMessage        ┌──────────────────────────┐
│  Extension Host (Node.js)       │ ◄────────────────────────► │  Webview (Angular 21)    │
│  extension.js + src/ + data.js  │                            │  webview/src/app/        │
│  Full filesystem access         │                            │  Sandboxed — no fs/vscode│
└─────────────────────────────────┘                            └──────────────────────────┘
              │
              ▼
   ~/.claude/ (global catalog)
   context.storageUri (per-workspace state)
```

## Extension host

**Entry point**: `extension.js`

- Registers the `loadout.openPanel` and `loadout.refresh` commands
- Registers the `loadout.sidebarView` webview panel via `LoadoutSidebarProvider`
- Runs the one-time legacy store migration (`migrateLegacyStore`) on activation
- Delegates all panel lifecycle and message wiring to `src/panel.js`

**`src/` modules** (split from the original monolithic `extension.js`):

| Module | Responsibility |
| --- | --- |
| `src/panel.js` | `LoadoutPanel`, `LoadoutSidebarProvider`, `attachWebview` — panel lifecycle and wiring |
| `src/message-handler.js` | Full `handleMessage()` dispatch switch — all webview → extension commands |
| `src/webview-loader.js` | Reads `webview-dist/index.html`, injects nonce, rewrites asset URIs, sets CSP |
| `src/theme.js` | `detectVscodeThemeKind()` — maps VSCode color theme enum to `'dark' \| 'light'` |
| `src/snapshot.js` | `buildInitialData()` — assembles the full state snapshot sent on `ready` / `dataUpdate` |
| `src/settings-host.js` | `getSettings()` / `saveSettings()` — reads and writes settings from `ui-state.json` |
| `src/validators.js` | `isSafeName()`, `isSafeArray()`, `isAllowedExternalUrl()` — input guards |
| `src/registry.js` | `checkRegistryStatus()`, `runUpdateScript()`, `parseUpdateOutput()` — registry sync |
| `src/constants.js` | `DEFAULT_REGISTRY_URL` |

**Data layer**: `data.js`
- All reads/writes to `.claude/agents/`, `.claude/skills/`, `profiles.json`, `ui-state.json`, and catalog
- `toggleItem()` — moves files between active dir and managed store in `context.storageUri`
- `getCatalogItems()` — lists global catalog items with hash-based sync status
- `pushToGlobal()` / `copyFromGlobal()` — catalog promotion/adoption flows
- Hash store: `.claude-hashes.json` in `globalRoot` — SHA-256 per item, detects catalog updates
- Hash cache: SHA-256 results are cached in memory (`Map`) keyed on `mtime + size + path`; avoids redundant I/O on repeated webview refreshes within the same extension host process lifetime
- Token estimation: `estimateTokens()` reads file bytes and returns `Math.ceil(length / 4)`; `characters ÷ 4 ≈ tokens` is a rough heuristic for display only — not a billing-accurate count; exposed as `tokens: number` on `WorkspaceItem` and `CatalogItem`; the Workspace tab "Heavy" filter chip uses 1 000 tok as its cutoff
- Description field: agent `.md` files and skill `SKILL.md` files may include a `description:` key in YAML frontmatter; `readDescription()` reads up to the first 16 384 chars, parses the frontmatter block (supports quoted and bare values), and truncates to 110 chars with `…`; the value is displayed in the panel item card

  ```markdown
  ---
  description: "Short description shown in the Loadout panel"
  ---
  ```

**Registry sync**: `update-claude.mjs`
- Fetches `components.json` from registry URL
- Downloads/updates agents, skills, commands from a remote catalog

## Webview (Angular 21)

### File structure
```
webview/src/app/
├── core/
│   ├── state/
│   │   ├── workspace.state.ts    # agents + skills toggle state
│   │   ├── profiles.state.ts     # profile list + apply/save
│   │   ├── catalog.state.ts      # catalog items + sync status
│   │   └── settings.state.ts     # density, theme, defaultTab, registryUrl
│   ├── vscode-bridge.service.ts  # postMessage wrapper
│   ├── messages.ts               # all message type definitions (source of truth)
│   ├── theme.service.ts          # dark/light/auto resolution
│   ├── shortcuts.service.ts      # keyboard shortcut bindings
│   ├── data-sync.service.ts      # feeds state services from bridge messages
│   └── toast.service.ts          # toast notifications
├── layout/
│   └── shell/                    # ShellComponent — header + tabs + status strip
├── features/
│   ├── workspace/                # Workspace tab: toggle agents/skills
│   ├── profiles/                 # Profiles tab: save/apply/rename profiles
│   ├── catalog/                  # Catalog tab: global catalog browsing
│   └── settings/                 # Settings tab: density, theme, registry
└── shared/
    ├── primitives/               # cm-card, cm-toggle, and other base components
    └── overlays/                 # modal, toast, command palette
```

### Communication protocol

Message types are defined in `messages.ts` and are the single source of truth.

**Extension → Webview:**

| Command | Payload | When |
| --- | --- | --- |
| `initialData` | `InitialData` | First load, after `ready` |
| `dataUpdate` | `InitialData` | After any filesystem mutation |
| `vscodeThemeChanged` | `{ kind }` | User changes VSCode theme |
| `registryStatus` | `RegistryItem[]` | After `checkRegistry` |
| `updateStarted` | — | Registry sync begins |
| `updateDone` | `{ updated, skipped, failed }` | Registry sync complete |
| `testRegistryResult` | `{ ok, status?, error? }` | After `testRegistry` |
| `notify` | `{ level, text }` | Toast/notification |

**Webview → Extension:**

| Command | When |
| --- | --- |
| `ready` | Angular app bootstrapped |
| `toggle` | User enables/disables a single agent or skill |
| `bulkToggle` | User enables/disables multiple items at once |
| `saveProfile` | User saves the current state as a named profile |
| `applyProfile` | User applies a saved profile |
| `renameProfile` / `deleteProfile` / `reorderProfiles` | Profile management |
| `updateProfileItems` | Edits the agent/skill list of an existing profile |
| `duplicateProfile` | Copies an existing profile under a new name |
| `addFromGlobal` / `pushToGlobal` | Catalog adopt/promote |
| `checkRegistry` | Fetches registry and compares against local items |
| `testRegistry` | Validates a registry URL (HEAD check) |
| `runUpdate` | Runs `update-claude.mjs` to sync from registry |
| `updateSettings` | Settings change |
| `revealCatalog` | Opens the global catalog folder in the OS file manager |
| `openExternal` | Opens a validated HTTPS URL in the default browser |
| `refresh` | Forces a `dataUpdate` reply without any mutation |
| `setTab` | Persists the active tab to `ui-state.json` |
| `enableAll` / `disableAll` | Activates or deactivates all items of a given type |

### State pattern

All state lives in `core/state/*.state.ts` signal services. Components are dumb — they inject the state service and read its signals; they never mutate state directly. Mutations flow via `VsCodeBridgeService.send()`.

```
VsCodeBridgeService.messages$ (Observable<ExtensionMessage>)
       ↓ DataSyncService subscribes and routes
WorkspaceStateService / ProfilesStateService / CatalogStateService / SettingsStateService
       ↓ expose signals
  Components (read-only, dumb)
       ↓ user actions → VsCodeBridgeService.send()
  Extension host (mutates filesystem, replies with dataUpdate)
```

## Storage

| Location | What lives there |
|---|---|
| `.claude/agents/` (workspace) | Active agents for this workspace |
| `.claude/skills/` (workspace) | Active skills for this workspace |
| `context.storageUri/.claude-store/agents/` | Inactive agent files |
| `context.storageUri/.claude-store/skills/` | Inactive skill files |
| `context.storageUri/profiles.json` | Named loadout snapshots |
| `context.storageUri/ui-state.json` | Last active tab, density, etc. |
| `~/.claude/agents/` (globalRoot) | Global catalog agents |
| `~/.claude/skills/` (globalRoot) | Global catalog skills |
| `~/.claude/.claude-hashes.json` | Hash store for sync detection |

## Security

- Webview uses a strict nonce-based CSP injected by `loadWebviewHtml()` in `src/webview-loader.js`
- No external network requests from the webview (sandboxed `connect-src`)
- The registry URL is user-configurable and validated via `testRegistry` before use
