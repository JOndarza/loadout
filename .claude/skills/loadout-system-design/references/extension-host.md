# Extension Host

## Contents
- [Stack](#stack)
- [src/ Module Reference](#src-module-reference)
- [data.js — Complete API](#datajs--complete-api)
- [Security Model](#security-model)
- [How to Add a New Message Handler](#how-to-add-a-new-message-handler)

## Stack

- **Runtime**: Node.js (CommonJS) — `require()` / `module.exports` everywhere
- **Dependencies**: zero npm runtime deps; only `vscode` API and Node.js built-ins (`fs`, `path`, `os`, `crypto`, `child_process`)
- **ESM exception**: `update-claude.mjs` only — all other files use CommonJS

---

## src/ Module Reference

### panel.js
- `LoadoutPanel` — tracks the single active webview panel instance
- `LoadoutSidebarProvider` — implements `WebviewViewProvider`, calls `attachWebview()`
- `attachWebview(webviewView, context)` — sets HTML, sets up message listener, registers `loadout.refresh` command, fires `vscodeThemeChanged` on theme change

### message-handler.js
- `handleMessage(msg, refresh, postToWebview, root, storePath)` — main dispatch switch for all 26 `WebviewMessage` commands
- `NO_ROOT_OK` set — commands that proceed even without an open workspace: `ready`, `updateSettings`, `openExternal`, `revealCatalog`, `testRegistry`
- All other commands no-op with a `notify` warn when `root` is null
- **Always** calls `isSafeName()` / `isSafeArray()` / `isAllowedExternalUrl()` on user input before acting

### snapshot.js
- `buildInitialData(root, storePath)` → `InitialData` — assembles the full snapshot posted on `ready` and after every mutation (`dataUpdate`)
- Reads: `getItems()` for all three types, `getProfiles()`, `getCatalogItems()` for all three types, `getGlobalRoot()`, `getSettings()`, `detectVscodeThemeKind()`

### webview-loader.js
- `loadWebviewHtml(webviewView, context)` — reads `webview-dist/index.html`, generates a nonce, rewrites asset URIs to `webviewView.webview.asWebviewUri()`, injects nonce on all `<script>` tags, sets `Content-Security-Policy`

### settings-host.js
- `getSettings(storePath)` → `Settings` (merges from `ui-state.json` over defaults)
- `saveSettings(storePath, partial)` — merges partial and writes `ui-state.json`

### validators.js
- `ALLOWED_ITEM_TYPES` — `Set(['agents', 'skills', 'commands'])`
- `isSafeName(name)` — returns `true` if name is a non-empty string with no path separators or shell metacharacters
- `isSafeArray(arr)` — returns `true` if array of strings all pass `isSafeName`
- `isAllowedExternalUrl(url)` — returns `true` only for `https://` URLs

### registry.js
- `checkRegistryStatus(root, storePath, url)` → `Promise<RegistryItem[]>` — fetches registry JSON, compares against local items, returns array with status `'updatable'` or `'custom'`
- `runUpdateScript(root)` → `Promise<{ code, out }>` — spawns `update-claude.mjs` as child process
- `parseUpdateOutput(out)` → `{ updated: string[], skipped: string[], failed: string[] }` — parses script stdout

### constants.js
- `DEFAULT_REGISTRY_URL = 'https://www.aitmpl.com/components.json'`

### theme.js
- `detectVscodeThemeKind()` → `'dark' | 'light'` — maps VSCode `ColorThemeKind` enum

---

## data.js — Complete API

`data.js` is the **only** file that performs item-related filesystem I/O. All `src/` modules call it; no module writes item data directly.

### Workspace helpers
```javascript
getWorkspaceRoot()             // → string | null (first workspace folder)
getGlobalRoot()                // → string (~/.claude or claudeManager.globalCatalogPath)
```

### Hash helpers (internal — not exported)
```javascript
computeHash(filePath)          // SHA-256 of file or directory tree → hex | null
computeHashCached(filePath)    // same, cached by mtime+size+path
getHashStore(globalRoot)       // parse ~/.claude/.claude-hashes.json → {}
saveHashStore(globalRoot, store) // write hash store
getSyncStatus(localHash, sharedHash, savedHash)
  // → 'synced' | 'localModified' | 'sharedUpdated' | 'diverged'
```

### Filesystem helpers
```javascript
ensureDir(dir)                 // mkdirSync recursive if not exists
estimateTokens(filePath)       // Math.ceil(utf8ByteLength / 4) — display heuristic
readDescription(filePath)      // parse YAML frontmatter description, truncate to 110 chars
```

### Project items
```javascript
getItems(root, storePath, type)
  // → WorkspaceItem[] — reads activeDir + storeDir, includes skills-as-directories
  // skills match if SKILL.md exists inside the directory entry

toggleItem(root, storePath, type, file, currentlyActive)
  // fs.renameSync(from, to); EXDEV cross-device fallback: cpSync + rmSync
```

### Global catalog
```javascript
getCatalogItems(type, projectRoot, storePath, globalRoot)
  // → CatalogItem[] — reads globalDir, computes syncStatus via hash comparison

copyFromGlobal(globalRoot, projectRoot, type, file)
  // cpSync src→dest (activates in project); saves hash baseline to store

pushToGlobal(globalRoot, projectRoot, storePath, type, file)
  // cpSync from active or store → globalDir; saves hash baseline
```

### Profiles
```javascript
getProfiles(storePath)         // parse profiles.json → Record<string, Profile>
saveProfiles(storePath, profiles) // write profiles.json
renameProfile(storePath, from, to)
reorderProfiles(storePath, names) // sets order by index in names array
updateProfileItems(storePath, name, { agents, skills, commands })
duplicateProfile(storePath, from, to)
updateProfileDescription(storePath, name, description) // truncated at 500 chars
```

### UI state
```javascript
getUiState(storePath)          // parse ui-state.json → {}
saveUiState(storePath, state)  // write ui-state.json
```

### Legacy migration
```javascript
migrateLegacyStore(root, storePath)
  // one-time cpSync from <root>/.claude-store/ → storePath
  // guarded by .migrated marker file; never re-runs
```

---

## Security Model

- **Nonce-based CSP** — `webview-loader.js` injects a fresh nonce on every panel open; `script-src` is locked to this nonce; `connect-src` is locked to the VSCode CSP source
- **Input validation** — every `WebviewMessage` handler calls `isSafeName()` or `isSafeArray()` before any filesystem operation; invalid names return early silently
- **URL validation** — `isAllowedExternalUrl()` gates `openExternal` and `testRegistry`; only `https://` URLs are permitted
- **No webview filesystem access** — all data reads/writes go through `data.js` called from `message-handler.js`

---

## How to Add a New Message Handler

1. Add the `WebviewMessage` union variant to `webview/src/app/core/messages.ts`
2. Add a `case 'yourCommand':` to the switch in `src/message-handler.js`
3. Call `isSafeName()` / `isSafeArray()` on any user-supplied string/array before acting
4. Call the relevant `data.js` function(s)
5. Call `refresh()` if filesystem state changed (triggers `dataUpdate` to webview)
