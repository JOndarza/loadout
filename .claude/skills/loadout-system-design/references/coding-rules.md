# Coding Rules

## Universal Rules

| Rule | Detail |
|---|---|
| **Language** | English only — all identifiers, comments, logs, error messages |
| **File size** | ~400 lines max; split into a new `src/` module or Angular subcomponent when approaching the limit |
| **Comments** | Explain *why*, never *what*; one short line max; no multi-line comment blocks |

---

## Extension Host Rules

- **CommonJS only** — `require()` / `module.exports` in all `.js` root files
- `update-claude.mjs` is the sole ESM exception
- **Zero npm runtime deps** — only `vscode` API and Node.js built-ins (`fs`, `path`, `os`, `crypto`, `child_process`)
- Functions: camelCase, small and focused (aim for <80 lines per function)
- `data.js` is the **only** file allowed to touch item-related `fs` operations — no ad-hoc `fs.writeFileSync` in `src/` modules

---

## Angular Rules

- `standalone: true` + `ChangeDetectionStrategy.OnPush` on every component — no exceptions
- `kebab-case` filenames: `workspace.component.ts`, `workspace.state.ts`
- `*.state.ts` suffix for state services
- `cm-` prefix for shared primitive components (`cm-toggle`, `cm-card`, etc.)
- **Signals** for all state: `signal()`, `computed()`, `input()`, `output()`
- **RxJS** only for `VsCodeBridgeService.messages$` and `takeUntilDestroyed` cleanup
- No `BehaviorSubject` / `ReplaySubject` for state
- No `HttpClient`, `fetch`, or `XHR` in webview (sandboxed)
- No `import vscode` from any `webview/` file
- Every interactive element needs `aria-label` or visible text label

---

## Naming Conventions

| Thing | Convention | Correct | Wrong |
|---|---|---|---|
| Extension module functions | camelCase | `handleMessage`, `buildInitialData` | `HandleMessage`, `build_initial` |
| Angular component files | kebab-case | `workspace.component.ts` | `WorkspaceComponent.ts` |
| Angular state services | `*.state.ts` | `workspace.state.ts` | `workspace.service.ts` |
| Shared primitives | `cm-` prefix | `cm-toggle.component.ts` | `toggle.component.ts` |
| Message commands (string literals) | camelCase | `'saveProfile'`, `'bulkToggle'` | `'save_profile'`, `'BulkToggle'` |
| Item types | lowercase | `'agents'`, `'skills'`, `'commands'` | `'Agents'`, `'SKILLS'` |

---

## Git Rules

- **Stage specific files by name** — never `git add -A` or `git add .`
- Conventional commit format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Imperative mood: "add toggle animation" not "added toggle animation"
- No AI attribution in commit messages
- No `--force`, `--no-verify`, `--amend` on published commits
- Branches: `feature/<slug>` → `main`

---

## Formatting (webview)

Prettier config (`.prettierrc` in `webview/`):

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all"
}
```

Run `cd webview && npm run format` before committing. Angular HTML parser is applied to `.html` files.

---

## Build Gate

Run before committing any webview change:

```bash
cd webview && npm run build
```

Verify `webview-dist/` has updated timestamps and stage the changed files. `webview-dist/` is committed to the repo.
