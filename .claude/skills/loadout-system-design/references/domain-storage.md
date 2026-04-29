# Domain & Storage

## Contents
- [Item Types](#item-types)
- [WorkspaceItem Fields](#workspaceitem-fields)
- [Profile Shape](#profile-shape)
- [Storage Paths](#storage-paths)
- [Hash-Based Sync Detection](#hash-based-sync-detection)
- [Description Field Convention](#description-field-convention)
- [Token Estimation](#token-estimation)
- [Settings Defaults](#settings-defaults)
- [Registry / update-claude.mjs](#registry--update-claudemjs)

## Item Types

Three item types exist, each with identical toggle mechanics but different file formats:

| Type | File format | Active location | Inactive location |
|---|---|---|---|
| `agents` | Single `.md` file | `workspace/.claude/agents/<name>.md` | `storageUri/.claude-store/agents/<name>.md` |
| `skills` | **Directory** containing `SKILL.md` | `workspace/.claude/skills/<name>/` | `storageUri/.claude-store/skills/<name>/` |
| `commands` | Single `.md` file | `workspace/.claude/commands/<name>.md` | `storageUri/.claude-store/commands/<name>.md` |

`toggleItem()` calls `fs.renameSync` on the whole entry (file or directory). Skills being directories is the key distinction — the directory itself is the atomic unit.

Claude Code reads from `.claude/agents/`, `.claude/skills/`, `.claude/commands/` at session start. Loadout controls what lands there.

---

## WorkspaceItem Fields

```typescript
{
  name: string;        // basename without .md, or directory name for skills
  file: string;        // exact filename/dirname — used as identifier in all messages
  active: boolean;     // true = in workspace/.claude/<type>/
  tokens: number;      // Math.ceil(utf8ByteLength / 4) — display heuristic only
  description: string; // YAML frontmatter description, max 110 chars (truncated with …)
}
```

---

## Profile Shape

```typescript
interface Profile {
  agents: string[];      // filenames ONLY — never file content
  skills: string[];
  commands?: string[];
  createdAt: string;     // ISO 8601 timestamp
  order?: number;        // display order (ascending)
  description?: string;  // max 500 chars (enforced in updateProfileDescription)
  pendingItems?: PendingItems; // items referenced in profile but not present locally
}
```

**Special key** `__restore_point__` — system-managed profile saved automatically before every `applyProfile`. Not shown in the UI (`ProfilesState.entries` filters it out). `ProfilesState.hasRestorePoint` exposes it as a boolean. Order is always `-1`.

---

## Storage Paths

| Path | Purpose |
|---|---|
| `workspace/.claude/agents/` | Active agents — Claude Code reads from here |
| `workspace/.claude/skills/` | Active skills — Claude Code reads from here |
| `workspace/.claude/commands/` | Active commands — Claude Code reads from here |
| `context.storageUri/.claude-store/agents/` | Inactive agents (toggled off) |
| `context.storageUri/.claude-store/skills/` | Inactive skills |
| `context.storageUri/.claude-store/commands/` | Inactive commands |
| `context.storageUri/profiles.json` | Named profile snapshots (filenames only) |
| `context.storageUri/ui-state.json` | Settings: density, theme, defaultTab, registryUrl |
| `~/.claude/agents/` | Global catalog agents |
| `~/.claude/skills/` | Global catalog skills |
| `~/.claude/commands/` | Global catalog commands |
| `~/.claude/.claude-hashes.json` | SHA-256 hash baseline for catalog sync detection |
| `context.storageUri/.migrated` | One-time migration marker (legacy store → storageUri) |

`globalRoot` defaults to `~/.claude/` but can be overridden by VSCode setting `claudeManager.globalCatalogPath`. **Always call `getGlobalRoot()` — never hardcode the path.**

---

## Hash-Based Sync Detection

When a catalog item is adopted into a project (`copyFromGlobal`) or pushed to catalog (`pushToGlobal`), the hash of the source file is saved to `~/.claude/.claude-hashes.json` as `"<type>/<file>": "<sha256>"`.

On every `dataUpdate`, `getSyncStatus(localHash, sharedHash, savedHash)` is called for each project item that has a corresponding catalog file:

| `localHash == savedHash` | `sharedHash == savedHash` | Result |
|---|---|---|
| ✓ | ✓ | `synced` |
| ✓ | ✗ | `sharedUpdated` (catalog changed upstream) |
| ✗ | ✓ | `localModified` (local copy diverged) |
| ✗ | ✗ | `diverged` (both changed) |

When `savedHash` is null (item was not adopted via Loadout): returns `synced` if local === shared, else `localModified`.

`computeHashCached(filePath)` avoids re-hashing on every refresh using an in-memory `Map` keyed by `"${mtime}:${size}:${path}"`. The cache lives for the extension host process lifetime.

---

## Description Field Convention

Agents, commands (`.md` files) and skills (`SKILL.md`) can declare a description in YAML frontmatter:

```markdown
---
description: "Short description shown in the Loadout panel"
---
```

`readDescription(filePath)`:
- Reads up to 16,384 bytes
- Parses the frontmatter block (`---\n...\n---`)
- Supports quoted (`"..."`), single-quoted (`'...'`), and bare values
- Collapses whitespace and `\n` escapes
- Truncates at 110 characters with `…`
- Returns `''` on any error

---

## Token Estimation

```javascript
estimateTokens(filePath) = Math.ceil(utf8Content.length / 4)
```

This is a **display heuristic only** — not billing-accurate. Used for:
- Showing token counts on item cards
- Computing `WorkspaceState.totalActiveTokens`
- The Workspace tab "Heavy" filter chip (cutoff: **1,000 tokens**)

---

## Settings Defaults

```typescript
{
  density: 'comfortable',
  theme: 'auto',
  defaultTab: 'workspace',
  registryUrl: 'https://www.aitmpl.com/components.json'
}
```

Persisted to `context.storageUri/ui-state.json`. `getSettings()` merges the stored partial over these defaults.

---

## Registry / update-claude.mjs

The registry is a remote `components.json` endpoint (user-configurable).

- `checkRegistryStatus(root, storePath, url)` — fetches the JSON, compares item names/versions against local catalog, returns `RegistryItem[]` with `status: 'updatable' | 'custom'`
- `runUpdateScript(root)` — spawns `update-claude.mjs` as a child process; this script does the actual file-level sync
- `parseUpdateOutput(out)` — parses stdout lines into `{ updated, skipped, failed }` arrays

Registry URL is validated with `isAllowedExternalUrl()` (must be `https://`) before any fetch.
