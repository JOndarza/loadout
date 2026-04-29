# Architecture

## Contents
- [System Overview](#system-overview)
- [Extension Host File Map](#extension-host-file-map)
- [Webview File Map](#webview-file-map)
- [State Flow](#state-flow-full-round-trip)
- [Build Pipeline](#build-pipeline)

## System Overview

Loadout is a VSCode extension with a strict two-process split. The Extension Host has full Node.js filesystem access; the Webview is a sandboxed Angular 21 iframe with zero direct API or filesystem access.

```
┌──────────────────────────────────────────────────┐
│  Extension Host (Node.js / CommonJS)             │
│  extension.js  data.js  src/ (9 modules)         │
│                                                  │
│  Filesystem access:                              │
│  • ~/.claude/           ← global catalog         │
│  • context.storageUri/  ← per-workspace store    │
│  • workspace/.claude/   ← active items           │
└──────────────────┬───────────────────────────────┘
                   │  window.postMessage (typed)
                   │  ExtensionMessage ↓  WebviewMessage ↑
┌──────────────────┴───────────────────────────────┐
│  Webview (Angular 21 / sandboxed iframe)         │
│  VsCodeBridgeService → DataSyncService           │
│  → 4 signal-based state services                │
│  → dumb feature components                      │
└──────────────────────────────────────────────────┘
```

All side effects (toggle, save profile, sync catalog) travel right-to-left: webview sends a `WebviewMessage`, extension host mutates filesystem via `data.js`, then sends back a `dataUpdate` with fresh `InitialData`.

---

## Extension Host File Map

| File | Responsibility | ~Lines |
|---|---|---|
| `extension.js` | Entry point — registers commands, sidebar provider, runs legacy migration | 36 |
| `data.js` | **All** filesystem operations — the only file that touches `fs` for item data | 320 |
| `src/panel.js` | `LoadoutPanel` class, `LoadoutSidebarProvider`, webview panel lifecycle | 150 |
| `src/message-handler.js` | `handleMessage()` — dispatches all 26 WebviewMessage commands | 310 |
| `src/snapshot.js` | `buildInitialData()` — assembles the full `InitialData` snapshot | ~100 |
| `src/webview-loader.js` | `loadWebviewHtml()` — reads dist HTML, injects nonce, rewrites URIs, sets CSP | ~80 |
| `src/settings-host.js` | `getSettings()` / `saveSettings()` — reads/writes `ui-state.json` | ~50 |
| `src/validators.js` | `isSafeName()`, `isSafeArray()`, `isAllowedExternalUrl()`, `ALLOWED_ITEM_TYPES` | ~40 |
| `src/registry.js` | `checkRegistryStatus()`, `runUpdateScript()`, `parseUpdateOutput()` | ~100 |
| `src/constants.js` | `DEFAULT_REGISTRY_URL` | ~5 |
| `src/theme.js` | `detectVscodeThemeKind()` | ~30 |
| `update-claude.mjs` | ESM script spawned as child process to sync catalog from registry | ~100 |

---

## Webview File Map

```
webview/src/app/
├── app.ts                         # Root component — bootstraps DataSyncService + ThemeService
├── app.config.ts                  # Angular providers (no router, no HttpClient)
├── core/
│   ├── messages.ts                # ← Single source of truth for all shared types
│   ├── vscode-bridge.service.ts   # postMessage wrapper (send / messages$ observable)
│   ├── data-sync.service.ts       # Routes bridge messages → 4 state services
│   ├── theme.service.ts           # Resolves dark/light/auto via vscodeThemeChanged
│   ├── shortcuts.service.ts       # Keyboard shortcuts (1/2/3, /, a/s/c…)
│   ├── toast.service.ts           # Notification queue
│   └── state/
│       ├── workspace.state.ts     # Active/inactive items in workspace
│       ├── profiles.state.ts      # Named loadout snapshots
│       ├── catalog.state.ts       # Global catalog items + syncStatus
│       └── settings.state.ts      # density, theme, defaultTab, registryUrl
├── layout/
│   └── shell.component.ts         # Header + tab bar + status strip
├── features/
│   ├── workspace/                 # Workspace tab
│   ├── profiles/                  # Profiles tab
│   ├── catalog/                   # Catalog tab
│   └── settings/                  # Settings tab
└── shared/
    ├── primitives/                # cm-* base components + directives (barrel index.ts)
    └── overlays/                  # Toast, command palette, modal
```

---

## State Flow (full round-trip)

```
Extension sends initialData / dataUpdate
    ↓
VsCodeBridgeService.messages$ (Observable<ExtensionMessage>)
    ↓
DataSyncService.applyData(data: InitialData)
    → WorkspaceState.setAll(agents, skills, commands)
    → ProfilesState.setAll(profiles) + setActiveName(resolvedName)
    → CatalogState.setAll(agents, skills, commands, globalRoot)
    → SettingsState.setAll(partial)
    ↓
Feature components inject state services → read .asReadonly() signals
    ↓
User action (e.g., toggle switch)
    ↓
Component method calls bridge.send({ command: 'toggle', ... })
    ↓
Extension host: message-handler.js dispatch → data.js mutation → refresh()
    ↓
Extension sends dataUpdate → cycle repeats
```

`activeName` is resolved by `DataSyncService` via Set comparison of active item filenames against each profile's lists — order-independent.

---

## Build Pipeline

```bash
cd webview && npm run build    # Vite-based, outputs to webview-dist/
```

`src/webview-loader.js::loadWebviewHtml()`:
1. Reads `webview-dist/index.html`
2. Injects a random nonce on all `<script>` tags
3. Rewrites asset `src`/`href` paths to `vscode-resource:` URIs
4. Sets a strict `Content-Security-Policy` header locking `script-src` and `connect-src` to the nonce and CSP source (no external network from webview)

`webview-dist/` is **committed to the repo** — zero build step for end-users installing the extension.
