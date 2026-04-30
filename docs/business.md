# Business Context

## Product purpose

Loadout is a VSCode extension that replaces manual file-shuffling in `~/.claude/` with a GUI panel. Without it, developers toggle Claude Code agents, skills, and commands by copying or deleting files in `~/.claude/agents/`, `~/.claude/skills/`, and `~/.claude/commands/` by hand. Loadout moves that work into a sidebar panel with one-click toggles, named profiles, a global catalog, and a full Claude Code configuration surface.

## Core actors

| Actor | Role |
|---|---|
| **Extension host** | Node.js process inside VSCode. Has full filesystem access. Owns all reads and writes to `.claude/` directories. Entry point: `extension.js` + `data.js`. |
| **Webview** | Angular 21 UI running in a sandboxed iframe. No direct filesystem access. Sends commands to the extension host via `postMessage`; receives state snapshots back. |
| **Claude Code** | Reads `~/.claude/agents/`, `~/.claude/skills/`, and `~/.claude/commands/` at session start. Loadout controls which files land there. |
| **Global catalog** | `~/.claude/` (or a user-configured path). Shared across all workspaces. Agents, skills, and commands here can be adopted into a workspace or pushed back from it. |

## Main user flows

### 1 — Toggle agents, skills, and commands

- User opens the Workspace tab.
- Each agent, skill, and command shows its active/inactive state with an optimistic toggle: the item flips state immediately without waiting for the extension host bridge response.
- Toggling an item moves its file between the active directory and the workspace store (see rules below).
- The extension host replies with a `dataUpdate` message; the webview reconciles signals-based state.
- Multi-select via `SelectionModel` (CDK) lets the user bulk-activate or bulk-deactivate a range of items at once.
- A right-click context menu on item rows exposes Toggle, Copy name, Find in Catalog, and Add to current profile without navigating away.

### 2 — Search and filter

- A fuzzy search bar (powered by `uFuzzy`) sits at the top of the Workspace and Catalog tabs.
- Filter tokens (`type:agent`, `active:true`, `tok>500`) can be typed inline; active filters render as dismissible chips.
- Match characters are highlighted using `HighlightMatchPipe`, which returns `MatchSegment[]` rendered safely in the template — no `innerHTML`.

### 3 — Save a named profile

- User arranges their desired active set in the Workspace tab.
- User opens the Profiles tab and saves a new profile with a name.
- The extension host writes a snapshot to `profiles.json` containing only the list of active filenames — not file content.

### 4 — Apply a profile

- User selects a saved profile in the Profiles tab and clicks Apply (the primary CTA on each card).
- A bottom-sheet slides up from the bottom of the panel showing the profile name, a count of items that will be activated, and a count that will be deactivated. The user confirms or cancels. ESC cancels.
- The extension host reads the profile's filename lists and toggles agents, skills, and commands to match.
- Replies with `dataUpdate`.
- Secondary actions (Edit, Rename, Duplicate, Export, Delete) are in a `⋯` overflow menu on the card to reduce clutter.
- Delete is a soft-delete: the card disappears immediately and a toast appears with a 5-second countdown and an Undo button. The permanent delete fires only after the timer expires.

### 5 — Command palette (Cmd/Ctrl+K)

- Opens an in-panel command palette that lists all saved profiles and toggleable items.
- Selecting a profile applies it; selecting an item toggles it — all without switching tabs or using a mouse.

### 6 — Catalog sync

- The Catalog tab shows all items in the global catalog (`~/.claude/` or a custom path).
- SHA-256 hashes in `~/.claude/.claude-hashes.json` detect catalog updates. A `sharedUpdated` sync badge surfaces when a global item has changed since it was last adopted into the workspace.
- Adopt moves a catalog item into the workspace. Push promotes a local item to the global catalog.

### 7 — Configure Claude Code (Config tab)

- The Config tab exposes the Claude Code configuration file without requiring direct file editing.
- Sections: permissions (allow/deny/ask rules), environment variables, hooks (enable/disable), sandbox mode, additional directories, memory files, and MCP servers.
- MCP servers show user-scope entries as toggleable. Project-scope entries are displayed read-only.
- The `_disabledMcpServers` key preserves server config when disabling so credentials do not need to be re-entered.

## Hard business rules

- **Active items live in the active directories.** Items in `.claude/agents/`, `.claude/skills/`, and `.claude/commands/` (under the workspace root) are "active" and visible to Claude Code. Toggling inactive moves them to the corresponding `context.storageUri/.claude-store/` subdirectory. Toggling active moves them back.
- **Profiles store filenames only.** A profile snapshot is a list of agent, skill, and command filenames (`agents: string[]`, `skills: string[]`, `commands: string[]`). File content is never duplicated into profiles. The actual files always live in the catalog or workspace store.
- **Hash-based sync.** SHA-256 hashes in `~/.claude/.claude-hashes.json` detect when a global catalog item has been updated. The extension compares these hashes without reading full file content, then surfaces a `sharedUpdated` sync status in the Catalog tab.
- **Optimistic toggle.** The webview flips an item's state immediately in local signals; the extension host reconciles on the next `dataUpdate`. If the host returns a conflicting state, the UI corrects itself. This removes the 50–200ms visual lag on every click.
- **Soft-delete with undo.** Deleting a profile is a two-phase operation: optimistic removal from the UI (signals) + a 5-second cancellable timer. The permanent delete message is sent only when the timer expires without an Undo action.
- **No VSCode API from the webview.** All filesystem operations are performed exclusively by the extension host. The webview may only call `VsCodeBridgeService.send()`.
- **CSP compliance.** A strict nonce-based Content Security Policy is injected at webview load time. No inline scripts, no external resources. All CDK modules that inject dynamic styles must receive the `CSP_NONCE` injection token wired from the webview `main.ts`.

## Out of scope

- Cloud sync or remote backup of profiles and catalog items
- Marketplace publishing or sharing of agents/skills between users
- Multi-user collaboration
- Editing agent, skill, or command file content from within Loadout
- `.claude/rules/*.md` file toggling (planned; not yet implemented)
