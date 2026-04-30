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
| `src/claude-settings.js` | `getClaudeSettings()` — reads and writes `~/.claude/settings.json` |
| `src/decoration-provider.js` | `vscode.FileDecorationProvider` — decorates `.md` files under `.claude/` in the Explorer |
| `src/logger.js` | `vscode.window.createOutputChannel('Loadout', { log: true })` — structured output channel |
| `src/mcp-host.js` | Reads MCP server configs from `.claude.json` and `.mcp.json` |
| `src/memory-files.js` | Scans for `CLAUDE.md` and rules files; returns `MemoryFile[]` with scope labels |
| `src/task-provider.js` | `vscode.TaskProvider` — exposes one task per saved profile |

**Data layer**: `data.js`
- All reads/writes to `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `profiles.json`, `ui-state.json`, and catalog
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
│   │   ├── workspace.state.ts    # agents + skills + commands toggle state
│   │   ├── profiles.state.ts     # profile list + apply/save
│   │   ├── catalog.state.ts      # catalog items + sync status
│   │   ├── settings.state.ts     # density, theme, defaultTab, registryUrl
│   │   └── ui-state.service.ts   # signal store for ui-state.json flags; get<T>(key, fallback) + setAll(state)
│   ├── vscode-bridge.service.ts  # postMessage wrapper
│   ├── messages.ts               # all message type definitions (source of truth)
│   ├── theme.service.ts          # dark/light/auto resolution
│   ├── shortcuts.service.ts      # keyboard shortcut bindings
│   ├── data-sync.service.ts      # feeds state services from bridge messages; calls UiStateService.setAll()
│   ├── search.service.ts         # wraps @leeoniya/ufuzzy; parseQuery(), fuzzyFilter<T>(), getMatchRanges()
│   └── toast.service.ts          # toast notifications
├── layout/
│   └── shell/                    # ShellComponent — header + tabs + status strip
├── features/
│   ├── workspace/                # workspace.component.ts + workspace.bloc.ts
│   │   └── onboarding-checklist.component.ts  # 3-step checklist; shown when totalCount === 0
│   ├── profiles/                 # profiles.component.ts  + profiles.bloc.ts
│   ├── catalog/                  # catalog.component.ts   + catalog.bloc.ts
│   └── settings/                 # settings.component.ts  + settings.bloc.ts
└── shared/
    ├── primitives/               # cm-card, cm-toggle, and other base components
    │   └── highlight-match.pipe.ts  # pure pipe returning MatchSegment[]; no innerHTML
    └── overlays/                 # modal, toast, command palette
        ├── context-menu.service.ts   # signal<ContextMenuConfig|null>; CDK-free fixed-position overlay
        ├── context-menu.component.ts # @HostListener('document:click') closes on outside click
        └── apply-confirm.component.ts # bottom-sheet (cm-sheet-scrim + cm-sheet); tabindex + keydown.escape
```

### Communication protocol

Message types are defined in `messages.ts` and are the single source of truth.

**Extension → Webview:**

| Command | Payload | When |
| --- | --- | --- |
| `initialData` | `InitialData` | First load, after `ready` |
| `dataUpdate` | `InitialData` | After any filesystem mutation |
| `vscodeThemeChanged` | `{ kind }` | User changes VSCode theme |
| `registryStatus` | `{ items }` | After `checkRegistry` |
| `updateStarted` | — | Registry sync begins |
| `updateDone` | `{ updated, skipped, failed }` | Registry sync complete |
| `testRegistryResult` | `{ ok, status?, error? }` | After `testRegistry` |
| `applyProfilePreview` | `{ diff }` | Preview diff before applying a profile |
| `profileImportPreview` | `{ ... }` | Preview data before confirming a profile import |
| `notify` | `{ level, text }` | Toast/notification |

**Webview → Extension:**

| Command | When |
| --- | --- |
| `ready` | Angular app bootstrapped |
| `toggle` | User enables/disables a single agent, skill, or command |
| `bulkToggle` | User enables/disables multiple items at once |
| `saveProfile` | User saves the current state as a named profile |
| `applyProfile` | User applies a saved profile |
| `renameProfile` / `deleteProfile` / `reorderProfiles` | Profile management |
| `updateProfileItems` | Edits the agent/skill/command list of an existing profile |
| `duplicateProfile` | Copies an existing profile under a new name |
| `addFromGlobal` / `pushToGlobal` | Catalog adopt/promote |
| `checkRegistry` | Fetches registry and compares against local items |
| `testRegistry` | Validates a registry URL (HEAD check) |
| `runUpdate` | Runs `update-claude.mjs` to sync from registry |
| `updateSettings` | Settings change |
| `setUiState` | `{ key, value }` — persists a flag to `ui-state.json`; no `dataUpdate` reply |
| `updateClaudeSetting` | `{ key, value }` — writes a field in `~/.claude/settings.json` |
| `openMemoryFile` | `{ path }` — opens a file in the VSCode editor |
| `addEnvVar` / `removeEnvVar` | Config tab: manage environment variables |
| `addPermissionRule` / `removePermissionRule` | Config tab: manage permission rules |
| `pickAndAddDirectory` / `removeDirectory` | Config tab: manage allowed directories |
| `toggleHook` / `setSandboxEnabled` | Config tab: toggle hooks and sandbox mode |
| `toggleMcpServer` | Config tab: enable/disable an MCP server |
| `revealCatalog` | Opens the global catalog folder in the OS file manager |
| `openExternal` | Opens a validated HTTPS URL in the default browser |
| `refresh` | Forces a `dataUpdate` reply without any mutation |
| `setTab` | Persists the active tab to `ui-state.json` |
| `enableAll` / `disableAll` | Activates or deactivates all items of a given type |

### State pattern

All domain state lives in `core/state/*.state.ts` signal services. A **BLoC layer** (`*.bloc.ts`, one per feature) sits between components and the bridge: it owns all `bridge.send()` calls, inbound `messages$` subscriptions, and feature-local reactive state. Components are dumb — they read state signals and call BLoC methods; they never touch the bridge directly.

```
VsCodeBridgeService.messages$ (Observable<ExtensionMessage>)
       ↓ DataSyncService subscribes → routes domain data
WorkspaceState / ProfilesState / CatalogState / SettingsState / UiStateService  (signal services)
       ↓ expose readonly signals
  Components (read-only, dumb views)
       ↓ user actions → *.bloc.ts methods
  Feature BLoCs (WorkspaceBloc / ProfilesBloc / CatalogBloc / SettingsBloc)
       ↓ bridge.send()  /  subscribe to messages$ for feature-specific inbound
  Extension host (mutates filesystem, replies with dataUpdate)
```

`UiStateService` is fed by `DataSyncService.applyData()` via `setAll(state)` when `initialData` or `dataUpdate` arrives. Components call `uiState.get<T>(key, fallback)` for individual flags (e.g. `'onboarding.dismissed'`). Mutations go through `WorkspaceBloc.setUiState()` → `bridge.send('setUiState', { key, value })` — no `dataUpdate` round-trip.

**BLoC responsibilities:**
- Action methods that wrap `bridge.send()` calls
- Feature-local reactive state (`private signal<T>()` exposed via `.asReadonly()`)
- Inbound message subscriptions (`takeUntilDestroyed()` in constructor)

**Only these services may inject `VsCodeBridgeService` directly:** the four feature BLoCs, `DataSyncService` (domain routing + `refresh()`), and `ThemeService` (theme change subscription).

### Angular CDK integration

`@angular/cdk/collections` is used in `WorkspaceComponent`: `SelectionModel<string>` replaces the manual `Set<string>` for multi-select state. The `selectionModel.changed` observable is wired to a `selected` signal via `takeUntilDestroyed()`.

CDK injects styles at runtime, which requires a CSP nonce. `app.config.ts` provides it:

```ts
{ provide: CSP_NONCE, useFactory: () => document.querySelector('meta[name="csp-nonce"]')?.content }
```

This reads the nonce from the `<meta>` tag injected by `src/webview-loader.js`, keeping CDK style injection compatible with the strict nonce-based CSP.

### Search

`SearchService` wraps `@leeoniya/ufuzzy`. `parseQuery(raw)` strips typed filter tokens (`type:`, `active:`, `tok>`) before passing the remainder to uFuzzy. `fuzzyFilter<T>(items, getHaystack, query)` returns filtered items; `getMatchRanges(text, query)` returns character ranges for highlight rendering. `HighlightMatchPipe` consumes those ranges and returns `MatchSegment[]` — no `innerHTML` is used.

## Storage

| Location | What lives there |
|---|---|
| `.claude/agents/` (workspace) | Active agents for this workspace |
| `.claude/skills/` (workspace) | Active skills for this workspace |
| `.claude/commands/` (workspace) | Active commands for this workspace |
| `context.storageUri/.claude-store/agents/` | Inactive agent files |
| `context.storageUri/.claude-store/skills/` | Inactive skill files |
| `context.storageUri/.claude-store/commands/` | Inactive command files |
| `context.storageUri/profiles.json` | Named loadout snapshots |
| `context.storageUri/ui-state.json` | Last active tab, density, UI flags (e.g. `onboarding.dismissed`) |
| `~/.claude/agents/` (globalRoot) | Global catalog agents |
| `~/.claude/skills/` (globalRoot) | Global catalog skills |
| `~/.claude/commands/` (globalRoot) | Global catalog commands |
| `~/.claude/.claude-hashes.json` | Hash store for sync detection |
| `~/.claude/settings.json` | Claude Code settings; read/written by `src/claude-settings.js` |

`InitialData` now includes `uiState?: Record<string, unknown>` — the full `ui-state.json` object (not just `lastApplied`). `DataSyncService` passes it to `UiStateService.setAll()` on every `initialData` and `dataUpdate`.

## Security

- Webview uses a strict nonce-based CSP injected by `loadWebviewHtml()` in `src/webview-loader.js`
- No external network requests from the webview (sandboxed `connect-src`)
- The registry URL is user-configurable and validated via `testRegistry` before use
