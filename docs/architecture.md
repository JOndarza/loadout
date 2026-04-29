# Architecture

## Overview

Loadout is a VSCode extension with two separate runtime processes:

```
┌─────────────────────────────┐        postMessage        ┌──────────────────────────┐
│  Extension Host (Node.js)   │ ◄────────────────────────► │  Webview (Angular 21)    │
│  extension.js + data.js     │                            │  webview/src/app/        │
│  Full filesystem access     │                            │  Sandboxed — no fs/vscode│
└─────────────────────────────┘                            └──────────────────────────┘
              │
              ▼
   ~/.claude/ (global catalog)
   context.storageUri (per-workspace state)
```

## Extension host

**Entry point**: `extension.js`
- Registers the `loadout.sidebarView` webview panel
- Handles all incoming `WebviewMessage` commands via `handleMessage()`
- Owns theme detection (`detectVscodeThemeKind`) and propagates changes via `vscodeThemeChanged`
- Calls `data.js` for every filesystem operation

**Data layer**: `data.js`
- All reads/writes to `.claude/agents/`, `.claude/skills/`, `profiles.json`, `ui-state.json`, and catalog
- `toggleItem()` — moves files between active dir and managed store in `context.storageUri`
- `getCatalogItems()` — lists global catalog items with hash-based sync status
- `pushToGlobal()` / `copyFromGlobal()` — catalog promotion/adoption flows
- Hash store: `.claude-hashes.json` in `globalRoot` — SHA-256 per item, detects catalog updates

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
|---|---|---|
| `initialData` | `InitialData` | First load, after `ready` |
| `dataUpdate` | `InitialData` | After any filesystem mutation |
| `vscodeThemeChanged` | `{ kind }` | User changes VSCode theme |
| `registryStatus` | `RegistryItem[]` | After `checkRegistry` |
| `updateStarted` | — | Registry sync begins |
| `updateDone` | `{ updated, skipped, failed }` | Registry sync complete |
| `notify` | `{ level, text }` | Toast/notification |

**Webview → Extension:**
| Command | When |
|---|---|
| `ready` | Angular app bootstrapped |
| `toggle` | User enables/disables an agent or skill |
| `saveProfile` | User clicks "Save loadout" |
| `applyProfile` | User clicks a profile |
| `renameProfile` / `deleteProfile` / `reorderProfiles` | Profile management |
| `addFromGlobal` / `pushToGlobal` | Catalog adopt/promote |
| `runUpdate` | Registry sync triggered |
| `updateSettings` | Settings change |

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

- Webview uses a strict nonce-based CSP injected by `loadWebviewHtml()` in `extension.js`
- No external network requests from the webview (sandboxed `connect-src`)
- The registry URL is user-configurable and validated via `testRegistry` before use
