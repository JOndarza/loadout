# Business Context

## Product purpose

Loadout is a VSCode extension that replaces manual file-shuffling in `~/.claude/` with a GUI panel. Without it, developers toggle Claude Code agents and skills by copying or deleting files in `~/.claude/agents/` and `~/.claude/skills/` by hand. Loadout moves that work into a sidebar panel with one-click toggles and named profiles.

## Core actors

| Actor | Role |
|---|---|
| **Extension host** | Node.js process inside VSCode. Has full filesystem access. Owns all reads and writes to `.claude/` directories. Entry point: `extension.js` + `data.js`. |
| **Webview** | Angular 21 UI running in a sandboxed iframe. No direct filesystem access. Sends commands to the extension host via `postMessage`; receives state snapshots back. |
| **Claude Code** | Reads `~/.claude/agents/` and `~/.claude/skills/` at session start. Loadout controls which files land there. |
| **Global catalog** | `~/.claude/` (or a user-configured path). Shared across all workspaces. Agents and skills here can be adopted into a workspace or pushed back from it. |

## Main user flows

### 1 — Toggle agents and skills

- User opens the Workspace tab.
- Each agent and skill shows its active/inactive state.
- Toggling an item moves its file between the active directory and the workspace store (see rules below).
- The extension host replies with a `dataUpdate` message; the webview updates signals-based state.

### 2 — Save a named profile

- User arranges their desired active set in the Workspace tab.
- User opens the Profiles tab and saves a new profile with a name.
- The extension host writes a snapshot to `profiles.json` containing only the list of active filenames — not file content.

### 3 — Apply a profile

- User selects a saved profile in the Profiles tab and applies it.
- The extension host reads the profile's filename lists, then toggles agents and skills to match: activating those in the list, deactivating those not in it.
- Replies with `dataUpdate`.

## Hard business rules

- **Active items live in the active directories.** Items in `.claude/agents/` and `.claude/skills/` (under the workspace root) are "active" and visible to Claude Code. Toggling inactive moves them to `context.storageUri/.claude-store/agents|skills/`. Toggling active moves them back.
- **Profiles store filenames only.** A profile snapshot is a list of agent and skill filenames (`agents: string[]`, `skills: string[]`). File content is never duplicated into profiles. The actual files always live in the catalog or workspace store.
- **Hash-based sync.** SHA-256 hashes in `~/.claude/.claude-hashes.json` detect when a global catalog item has been updated. The extension compares these hashes without reading full file content, then surfaces a `sharedUpdated` sync status in the Catalog tab.
- **No VSCode API from the webview.** All filesystem operations are performed exclusively by the extension host. The webview may only call `VsCodeBridgeService.send()`.

## Out of scope

- Cloud sync or remote backup of profiles and catalog items
- Marketplace publishing or sharing of agents/skills between users
- Multi-user collaboration
- Editing agent or skill file content from within Loadout
