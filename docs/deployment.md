# Deployment

<!-- auto-generated from codebase scan -->

## Local install (development)

```bash
git clone <repo-url> loadout
cd loadout
ln -s "$(pwd)" "$HOME/.vscode/extensions/loadout"
# Reload VSCode — the Loadout activity bar icon appears
```

The compiled webview (`webview-dist/`) is committed to the repo so no build step is required for basic use.

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

Commit the updated `webview-dist/` alongside your changes.

## Opening the panel

- Activity bar icon (left sidebar) → click
- Command palette → `Loadout: Open Panel`
- Keyboard shortcut: `Cmd+Shift+Alt+C` (mac) / `Ctrl+Shift+Alt+C` (win/linux)

## Extension manifest key points

| Field | Value |
|---|---|
| `main` | `./extension.js` |
| `engines.vscode` | `^1.80.0` |
| `contributes.views` | `loadout.sidebarView` (webview) |
| `configuration` | `claudeManager.globalCatalogPath` — custom catalog path |

## Registry sync

The default registry URL is `https://www.aitmpl.com/components.json`. Users can override it in Settings → Registry URL.

```bash
# Test the registry URL before running an update
# (via Loadout Settings tab → Test URL)
```

## VSCode Marketplace

Not yet published. Add a `LICENSE` file and update `package.json` fields (`publisher`, `repository`, `icon`) before publishing.

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
