# Ideas

Raw ideas inbox. No commitment — capture now, evaluate later.
Group related ideas and promote to a story in `backlog.md` when ready.

<!-- Add ideas below as they come up. One bullet per idea. -->

## Claude Code config surface

Features sourced from Claude Code official docs — items stored in `~/.claude/` or `.claude/` that Loadout could manage beyond agents/skills/commands.

### Fits well

- **MCP Servers toggle** — servers live in `~/.claude.json → mcpServers` (user/local scope) and `.mcp.json` (project scope). New MCP tab listing servers per scope with enable/disable toggles; connection details (transport type, URL/command, env var names but not values) shown read-only. Profile snapshots include the active server list. No content editing.
- **Hooks toggle** — hooks live in `settings.json → hooks` (any scope), keyed by event (`PreToolUse`, `PostToolUse`, `SessionStart`, etc.). Hooks section listing event name, matcher, type (command/http/mcp_tool), and command string. Toggle individual hooks active/inactive via a `disabled` flag — no deletion needed. A `disableAllHooks: true` master switch fits as a single toggle.
- **Permissions rules** — `settings.json → permissions.allow`, `permissions.deny`, `permissions.ask`. Chip lists per array with an "Add rule" input pre-populated with common templates (`Bash(npm run *)`, `Read(.env)`, `WebFetch`). This is structured config editing, not document content editing.
- **Session env vars** — `settings.json → env` (plain key-value JSON). Key list with masked values in the Settings tab. Per-profile env var sets would let developers switch between staging and production API targets by switching profiles.
- **CLAUDE.md / rules file browser** — list all `~/.claude/CLAUDE.md`, `./CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, and `.claude/rules/*.md` with scope labels (User / Project / Local). Each row shows path, scope, and an "Open in editor" button (extension host `openTextDocument`). Loadout does not edit content — it browses and launches. Rules files show their `paths:` glob as metadata.
- **Auto-memory toggle + MEMORY.md viewer** — `settings.json → autoMemoryEnabled` toggle per scope, plus a read-only preview of the first few lines of `~/.claude/projects/<project>/memory/MEMORY.md` with an "Open folder" and "Clear memory" action.

### Fits with caveats

- **`.claude/rules/*.md` toggle** — same move-to-store pattern as agents/skills. Complication: rules files live in `.claude/rules/` and are semantically different from skills (always-on instructions vs. invokable skills). Needs a distinct section to avoid user confusion.
- **Model + effort level** — `settings.json → model` and `effortLevel` dropdowns in the Settings tab. Per-profile model selection is the power feature (Haiku for fast-iteration, Opus for deep-review profiles). Caveat: available model list changes; Loadout would need to maintain or fetch aliases.
- **`permissions.additionalDirectories`** — path list in the Permissions section with a folder-picker dialog. Caveat: paths are machine-specific and should be excluded from shared profile snapshots.
- **Subagent memory scope badge** — parse the `memory:` frontmatter field already in agent files; display a badge on each agent card showing `user`/`project`/`local`/none scope. Add a "View memory" (open folder) and "Clear memory" (delete MEMORY.md) action. Small addition to the existing agent detail surface.
- **Sandbox settings** — `settings.json → sandbox` object (~20 fields). Minimal version: just the `enabled` master toggle + read-only display of current allow/deny path rules. Full editor is medium-large scope and should show explicit confirmation dialogs to avoid accidental permission escalation.
- **`.mcp.json` project-scoped MCP servers** — show in MCP tab with a "Project (shared)" scope label and a prominent warning that this file is version-controlled and edits are team-wide.

## VSCode API integrations

### Small (extension host only, no webview changes)

- **LogOutputChannel** — `vscode.window.createOutputChannel('Loadout', { log: true })` in `activate()`. Logs every toggle, profile apply, hash-sync event, and migration step to the Output panel with timestamps and log-level filtering. Today silent failures (hash mismatch, missing file on apply) leave no diagnostic surface.
- **Activity Bar badge** — store the `WebviewView` reference returned by `registerWebviewViewProvider` and set `.badge = { value: N, tooltip: 'N catalog updates available' }` after each hash-sync. Mirrors how Source Control shows uncommitted-change counts. Clears when the user opens the panel or resolves updates. Zero webview changes.
- **Workspace trust declaration** — add `"capabilities": { "untrustedWorkspaces": { "supported": true } }` to `package.json`. Without it VSCode disables Loadout entirely in restricted-mode workspaces even though Loadout only touches `~/.claude/` (global, not workspace files). Two lines of JSON, zero code changes.
- **Progress indicator** — wrap `applyProfile` and `runUpdate` (catalog hash sync) in `vscode.window.withProgress({ location: ProgressLocation.Window, title: 'Applying profile…' })`. Adds a status-bar spinner for the duration; today both operations complete with no host-side feedback.
- **Explorer context menu** — `contributes.menus["explorer/context"]` with `"when": "resourceExtname == .md && resourcePath =~ /\\.claude/"`. Adds "Loadout: Adopt into Catalog" on right-click for agent/skill/command files in the Explorer, without opening the panel. Reuses the existing adopt logic in `data.js`.

### Medium (extension host work)

- **Tasks API** — register a `TaskProvider` in `src/task-provider.js` that reads `profiles.json` and exposes one `vscode.Task` (ShellExecution) per saved profile (e.g., "Loadout: Apply — coding-mode"). Tasks appear in "Run Task", can be bound to keyboard shortcuts, and can be chained from other build tasks. Refresh the provider after save/delete. Zero webview changes.
- **File decorations** — `vscode.window.registerFileDecorationProvider` returning `{ badge: 'A'|'S'|'↑', tooltip }` for `.md` files under `~/.claude/`. Badge shows active/stored/update-available status in the Explorer at a glance without opening the panel. Requires firing `onDidChangeFileDecorations` after every toggle and sync.
- **Walkthrough onboarding** — `contributes.walkthroughs` in `package.json` with 4 steps: open panel → toggle an item → save a profile → configure catalog path. Completes automatically via `onView` / `onCommand` events. Zero TS changes; only manifest + SVG illustrations + command registration for steps that currently only fire via `postMessage`.

### Large (new surface required)

- **Custom editor** — `vscode.CustomEditorProvider` for `.md` files under `~/.claude/agents|skills|commands/`. Opens a structured form (name, description, model, tools) instead of raw markdown when the user opens an agent/skill file. Requires a second webview, frontmatter parsing, and two-way file sync. Effectively a second mini-app.

## Quick wins

- **Orphan filter keyboard shortcut** — wire `p` (or `n`) key in `ShortcutsService` to toggle the "not in profile" filter, mirroring how `a` toggles `activeOnly`. One-file change + one subscription in `workspace.component.ts`. Evidence: `shortcuts.service.ts` has no orphan shortcut.
- **`CMD` type badge in workspace card** — the item card renders `AGT`/`SKL` but falls through to `SKL` for commands. Add a ternary branch for `CMD`. Evidence: `workspace.component.html:67`.
- **"Clear restore point" button** — `__restore_point__` persists indefinitely; only another apply overwrites it. A "Clear" action sends a new `clearRestorePoint` message; extension host does `delete profiles[RESTORE_POINT_KEY]` + `saveProfiles` + `refresh`. Evidence: `profiles.component.html:17-21`.
- **Cross-platform "Open folder" label** — `settings.component.html:96` hard-codes "Open in Finder". Should read "Open in Explorer" on Windows and a generic label on Linux, detected via `navigator.userAgent` (pattern already used in `shortcuts.service.ts:20`).
- **Remove or wire `enableAll`/`disableAll` messages** — declared in `messages.ts:73-74` and in the protocol docs but never sent from the UI. Either add a "Enable all" bulk action or remove the dead message types.

## Medium

- **Drag-and-drop visual affordance for profile reorder** — the backend (`reorderProfiles` in `data.js:261`, handler in `message-handler.js:125`) and Angular drag events (`onDragStart/Over/Drop` in `profiles.component.ts:245`) are fully wired. Only missing: SCSS drag handle cursor, ghost styling, and the `draggable` attribute on non-editing cards. Evidence: `roadmap.md` marks this as planned.
- **"Adopt pending" action on profile card** — profile cards already show a warning badge when `pendingItems` is non-empty (`profiles.component.html:65-69`), but there is no action to resolve them. A button could fire `bulkAddFromGlobal` with `p.pendingItems` as the payload, then clear the field. `bulkAddFromGlobal` handler already exists at `message-handler.js:297`.
- **`s` shortcut → focus name input** — `ShortcutsService` emits `{ type: 'saveProfile' }` on `s` (`shortcuts.service.ts:64`) but `profiles.component.ts` has no subscription for it; the Save button is the only trigger. Subscribe in the component and `viewChild`-focus the `cm-profiles-input` field.
- **`skipRestorePoint` flag for palette apply** — rapid profile switching from `command-palette.component.ts:86` writes a `__restore_point__` on every apply, creating a noisy undo stack. A `skipRestorePoint?: boolean` on the `applyProfile` message + a one-line guard in `message-handler.js:84` would fix it.
- **Vitest coverage for state services** — `WorkspaceState`, `ProfilesState`, `CatalogState`, `SettingsState` have zero tests. All are plain classes with `signal()`/`computed()`, testable without Angular TestBed. Explicitly listed in `roadmap.md:25`.

## Larger

- **File watcher on `.claude/`** — panel goes stale if the user manually drops files into `.claude/agents|skills|commands/` via Finder or another tool. Register a `vscode.workspace.createFileSystemWatcher` in `panel.js` to call `refresh()` on any add/change/delete. Pure extension-host change, no webview impact.
- **Persist last-applied profile name** — `data-sync.service.ts:47-57` resolves `activeName` by comparing item sets; it goes `null` as soon as the user toggles one item after applying. Store `lastApplied` in `ui-state.json`, update it on `applyProfile`, and surface it in `InitialData` so the badge survives drift.
- **VSCode command `loadout.applyProfile`** — register a command in `extension.js` that opens a `vscode.window.showQuickPick` populated from `getProfiles()`. Lets users switch loadouts from `Cmd+Shift+P` without opening the panel. Only two commands are registered today (`extension.js:15-33`).
- **Profile `lastAppliedAt` + `appliedCount`** — add fields to the `Profile` schema (`messages.ts:28-36`) and increment them in the `applyProfile` handler. The profile card already has a meta row rendering `createdAt` (`profiles.component.html:98-103`) — the display slot exists.
- **Storybook for shared primitives** — `cm-card`, `cm-toggle`, `cm-button`, `cm-token-bar`, `cm-segmented`, `cm-sync-pill`, `cm-empty` are all standalone `OnPush` input-driven components — ideal Storybook candidates. Largest cost is `@storybook/angular` toolchain setup, not the stories themselves. Listed in `roadmap.md:27`.
