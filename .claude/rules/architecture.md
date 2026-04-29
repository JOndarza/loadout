# Architecture — key patterns

<!-- auto-generated from codebase scan -->

- **Style**: two-process — Extension Host (Node.js) ↔ Webview (Angular 21) via `postMessage`
- **Dependency rule**: Webview never accesses VSCode APIs or filesystem directly; all side effects flow through the bridge
- **Communication protocol**: typed messages in `webview/src/app/core/messages.ts`
  - `extension → webview`: `initialData` on load, `dataUpdate` after mutations, `vscodeThemeChanged`, `notify`
  - `webview → extension`: `ready`, `toggle`, `saveProfile`, `applyProfile`, `runUpdate`, etc.
- **Webview state**: 4 signal-based state services in `core/state/` (workspace, profiles, catalog, settings); `VsCodeBridgeService` feeds them; components are dumb; workspace and catalog state each carry agents, skills, and commands signals
- **Storage**:
  - Per-workspace: `context.storageUri` — inactive items store, profiles.json, ui-state.json
  - Global: `~/.claude/` (or `claudeManager.globalCatalogPath`) — shared agents/skills/commands catalog, `.claude-hashes.json`
- **Hash sync**: SHA-256 hashes in `.claude-hashes.json` detect catalog item updates without content diffing
- **CSP**: strict nonce-based CSP injected at webview load time; no inline scripts, no external resources
- **Legacy migration**: one-time move from `.claude-store/` → `context.storageUri` on first activation (v2 migration)

Full diagrams and flows: `docs/architecture.md`.
