# Architecture — key patterns

<!-- auto-generated from codebase scan -->

- **Style**: two-process — Extension Host (Node.js) ↔ Webview (Angular 21) via `postMessage`
- **Dependency rule**: Webview never accesses VSCode APIs or filesystem directly; all side effects flow through the bridge
- **Communication protocol**: typed messages in `webview/src/app/core/messages.ts`
  - `extension → webview`: `initialData` (includes `uiState?: Record<string,unknown>`), `dataUpdate`, `vscodeThemeChanged`, `notify`, `registryStatus`, `testRegistryResult`, `applyProfilePreview`, `profileImportPreview`
  - `webview → extension`: `ready`, `toggle`, `saveProfile`, `applyProfile`, `runUpdate`, `setUiState { key, value }` (no dataUpdate reply), `updateClaudeSetting { key, value }`, `openMemoryFile { path }`, `addEnvVar`, `removeEnvVar`, `addPermissionRule`, `removePermissionRule`, `pickAndAddDirectory`, `removeDirectory`, `toggleHook`, `setSandboxEnabled`, `toggleMcpServer`, etc.
- **Webview state**: 5 signal-based state services — `core/state/` (workspace, profiles, catalog, settings) + `core/ui-state.service.ts`; `DataSyncService` feeds all of them; `UiStateService` exposes `get<T>(key, fallback)` / `setAll(state)`; components are dumb; workspace and catalog state each carry agents, skills, and commands signals
- **Storage**:
  - Per-workspace: `context.storageUri` — inactive items store, profiles.json, ui-state.json
  - Global: `~/.claude/` (or `loadout.globalCatalogPath`) — shared agents/skills/commands catalog, `.claude-hashes.json`
- **Hash sync**: SHA-256 hashes in `.claude-hashes.json` detect catalog item updates without content diffing
- **CSP**: strict nonce-based CSP injected at webview load time; no inline scripts, no external resources
- **Legacy migration**: one-time move from `.claude-store/` → `context.storageUri` on first activation (v2 migration)

Full diagrams and flows: `docs/architecture.md`.
