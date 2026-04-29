# Messaging Protocol

## Contents
- [Source of Truth](#source-of-truth)
- [Shared Types](#shared-types)
- [Extension → Webview](#extension--webview-extensionmessage)
- [Webview → Extension](#webview--extension-webviewmessage)
- [NO_ROOT_OK](#no_root_ok)

## Source of Truth

`webview/src/app/core/messages.ts` is the **only** place where shared types live. Update it whenever a message is added on either side — never duplicate type definitions elsewhere.

---

## Shared Types

```typescript
type ItemType = 'agents' | 'skills' | 'commands';

interface WorkspaceItem {
  name: string;       // filename without .md, or directory name for skills
  file: string;       // exact filename/dirname used as identifier
  active: boolean;    // true if in workspace/.claude/<type>/
  tokens: number;     // Math.ceil(utf8Length / 4)
  description: string; // YAML frontmatter description, max 110 chars
}

interface CatalogItem {
  name: string;
  file: string;
  tokens: number;
  description: string;
  inProject: boolean; // true if file exists in workspace (active or store)
  syncStatus: 'synced' | 'localModified' | 'sharedUpdated' | 'diverged' | null;
}

interface PendingItems { agents: string[]; skills: string[]; commands: string[]; }

interface Profile {
  agents: string[];      // ← filenames only, NEVER file content
  skills: string[];
  commands?: string[];
  createdAt: string;     // ISO timestamp
  order?: number;
  description?: string;
  pendingItems?: PendingItems; // items that were in the profile but missing locally
}

interface Settings {
  density: 'compact' | 'comfortable';
  theme: 'dark' | 'light' | 'auto';
  defaultTab: 'workspace' | 'profiles' | 'catalog' | 'last';
  registryUrl: string;
}

interface InitialData {
  root: string;
  agents: WorkspaceItem[];
  skills: WorkspaceItem[];
  commands: WorkspaceItem[];
  profiles: Record<string, Profile>;
  catalogAgents: CatalogItem[];
  catalogSkills: CatalogItem[];
  catalogCommands: CatalogItem[];
  globalRoot: string;
  settings: Settings;
  vscodeThemeKind: 'dark' | 'light';
  extensionVersion: string;
}

interface RegistryItem {
  name: string;
  file: string;
  itemType: ItemType;
  status: 'updatable' | 'custom';
}
```

---

## Extension → Webview (`ExtensionMessage`)

| Command | Payload | When |
|---|---|---|
| `initialData` | `{ data: InitialData }` | Response to `ready`; first load |
| `dataUpdate` | `{ data: InitialData }` | After any filesystem mutation |
| `vscodeThemeChanged` | `{ kind: 'dark' \| 'light' }` | User changes VSCode theme |
| `registryStatus` | `{ items: RegistryItem[], error?: string }` | After `checkRegistry` |
| `updateStarted` | _(none)_ | Registry sync begins |
| `updateDone` | `{ result: { updated, skipped, failed: string[] } }` | Registry sync complete |
| `testRegistryResult` | `{ ok: boolean, status?: number, error?: string }` | After `testRegistry` |
| `notify` | `{ level: 'info' \| 'warn' \| 'error', text: string }` | Toast notification |
| `applyProfilePreview` | `{ name, willActivate: PendingItems, willDeactivate: PendingItems }` | After `previewApplyProfile` |
| `profileImportPreview` | `{ originalName, profile: {...}, found: PendingItems, missing: PendingItems }` | After `importProfileRequest` file pick |

---

## Webview → Extension (`WebviewMessage`)

| Command | Key payload fields | Handler action |
|---|---|---|
| `ready` | — | Posts `initialData` back |
| `setTab` | `tab: string` | Saves active tab to ui-state.json |
| `toggle` | `type, file, wasActive` | `toggleItem()` + refresh |
| `bulkToggle` | `items: Array<{type, file, wasActive}>` | `toggleItem()` for each + refresh |
| `enableAll` | `type: ItemType` | Activates all items of type + refresh |
| `disableAll` | `type: ItemType` | Deactivates all items of type + refresh |
| `addFromGlobal` | `itemType, file` | `copyFromGlobal()` + refresh |
| `bulkAddFromGlobal` | `items: Array<{itemType, file}>` | `copyFromGlobal()` for each + refresh |
| `pushToGlobal` | `itemType, file` | `pushToGlobal()` + refresh + info toast |
| `saveProfile` | `name` | Snapshot active items → `profiles.json` + refresh |
| `applyProfile` | `name, silent?` | Saves restore point, bulk-toggles to match profile + refresh |
| `deleteProfile` | `name` | Removes key from `profiles.json` + refresh |
| `renameProfile` | `from, to` | `renameProfile()` + refresh |
| `reorderProfiles` | `order: string[]` | `reorderProfiles()` + refresh |
| `updateProfileItems` | `name, agents, skills, commands` | `updateProfileItems()` + refresh |
| `duplicateProfile` | `from, to` | `duplicateProfile()` + refresh |
| `updateProfileDescription` | `name, description` | `updateProfileDescription()` + refresh |
| `updateSettings` | `settings: Partial<Settings>` | `saveSettings()` + refresh |
| `revealCatalog` | — | `revealFileInOS` on globalRoot |
| `testRegistry` | `url` | `fetch(url)` → posts `testRegistryResult` |
| `checkRegistry` | — | `checkRegistryStatus()` → posts `registryStatus` |
| `runUpdate` | — | Posts `updateStarted`, spawns `update-claude.mjs`, posts `updateDone` |
| `refresh` | — | `buildInitialData()` + posts `dataUpdate` |
| `openExternal` | `url` | `vscode.env.openExternal()` (https only) |
| `previewApplyProfile` | `name` | Computes will-activate/will-deactivate diff → posts `applyProfilePreview` |
| `exportProfile` | `name` | VSCode save dialog → writes `.loadout.json` file |
| `importProfileRequest` | — | VSCode open dialog → reads file → posts `profileImportPreview` |
| `importProfileConfirm` | `name, profile, missing` | Saves imported profile to `profiles.json` + refresh |

---

## NO_ROOT_OK

Commands that proceed even when no workspace folder is open (root is null):

```javascript
const NO_ROOT_OK = new Set(['ready', 'updateSettings', 'openExternal', 'revealCatalog', 'testRegistry']);
```

All other commands post a `notify` warn and return early if `root` is null.
