# Deployment

<!-- auto-generated from codebase scan -->

## Local install (development)

**Option A — symlink (fastest):**

```bash
git clone <repo-url> loadout
cd loadout
ln -s "$(pwd)" "$HOME/.vscode/extensions/loadout"
# Reload VSCode — the Loadout activity bar icon appears
```

The compiled webview (`webview-dist/`) is committed to the repo, so no build step is required for basic use.

**Option B — copy with `deploy.js`:**

```bash
node deploy.js
# Reload VSCode — Developer: Reload Window
```

`deploy.js` copies the following into `~/.vscode/extensions/loadout/`:

- `extension.js`, `data.js`, `update-claude.mjs`, `package.json`, `icon-activity.svg`
- `src/` — the extension-host modules split from `extension.js`
- `webview-dist/` — the pre-built Angular bundle

Use the copy approach when you need a clean, self-contained install without a symlink (e.g., testing the exact files that would ship).

## Development workflow

```bash
cd webview
npm install
npm run watch        # rebuild on file change (outputs to ../webview-dist/)
```

After `npm run watch` picks up changes, run the **Loadout: Refresh** command (`Cmd+Shift+P → Loadout: Refresh`) or reload the VSCode window.

## Production build

```bash
cd webview
npm run build        # production build → ../webview-dist/
```

Commit the updated `webview-dist/` alongside your source changes.

## Opening the panel

- Activity bar icon (left sidebar) — click
- Command palette — `Loadout: Open Panel`
- Keyboard shortcut: `Cmd+Shift+Alt+C` (mac) / `Ctrl+Shift+Alt+C` (win/linux)

## Extension manifest key points

| Field | Value |
| --- | --- |
| `main` | `./extension.js` |
| `engines.vscode` | `^1.80.0` |
| `contributes.views` | `loadout.sidebarView` (webview panel) |
| `contributes.walkthroughs` | `loadout.gettingStarted` (4-step native onboarding) |
| `contributes.taskDefinitions` | `loadout-apply` (one task per saved profile) |
| `configuration` | `loadout.globalCatalogPath` — custom catalog path |

## Configuration

**`loadout.globalCatalogPath`** — string, default `~/.claude/`

Overrides the global catalog location. Useful for teams sharing a catalog stored at a non-default path (e.g., a mounted network drive or a company-wide dotfiles directory). Set it via **VSCode Settings UI** (`Preferences: Open Settings (UI)` → search `globalCatalogPath`) or directly in `settings.json`:

```json
"loadout.globalCatalogPath": "/shared/team/.claude"
```

If the value is blank or missing, Loadout falls back to `~/.claude/`.

## Registry sync

The default registry URL is `https://www.aitmpl.com/components.json`. Users can override it in Settings → Registry URL.

```bash
# Test the registry URL before running an update
# (via Loadout Settings tab → Test URL)
```

## VSCode Marketplace

Not yet published. Update `package.json` fields (`publisher`, `repository`, `icon`) before publishing. MIT license is in place.

## Extracting to its own repo (when needed)

```bash
# Filter git history to the extension directory
git subtree split --prefix=<current-dir> -b loadout-history

# Create new repo
mkdir ../loadout && cd ../loadout
git init
git pull ../<host-repo> loadout-history

# Push
git remote add origin <new-remote-url>
git push -u origin main
```
