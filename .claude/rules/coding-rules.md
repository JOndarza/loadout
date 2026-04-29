# Coding rules — global

<!-- auto-generated from codebase scan -->

- **Code language**: english — identifiers, comments, logs
- **Extension host**: CommonJS only (`require`/`module.exports`); no `import`/`export` in `.js` root files
- **Angular components**: standalone only, `OnPush` change detection mandatory
- **Signals**: use `signal()`, `computed()`, `input()`, `output()` for Angular state and I/O; avoid Subjects for local state
- **File size**: split files that exceed ~400 lines; keep components focused on a single responsibility
- **Naming**: `kebab-case` for Angular files (`*.component.ts`, `*.service.ts`), `camelCase` for extension JS variables/functions
- **No VSCode API in webview**: never `import vscode` or call `vscode.*` from any `webview/` file
- **No HTTP in webview**: the webview is sandboxed; all data comes from the extension via `postMessage`
- **Comments**: only explain *why*, never *what*
- **Commits**: conventional format, imperative mood, no AI attribution
