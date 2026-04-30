# Coding Rules

## Language

- **Documentation language**: English
- **Code language**: English — all identifiers, comments, log messages, error messages

## File size

- Files must not exceed ~400 lines. Split any file that grows beyond this limit — extract focused modules or subcomponents.
- This applies to both extension host files (e.g. `extension.js` was split into 9 modules under `src/`) and Angular components.
- Keep each file focused on a single responsibility.

## Extension host (`extension.js`, `src/`, `data.js`, `update-claude.mjs`)

- CommonJS only: `require()` and `module.exports`. No `import`/`export`.
- `update-claude.mjs` is the one exception — it is a standalone script using ESM (`.mjs` extension).
- No npm runtime dependencies — only Node.js built-ins and the `vscode` API.
- Functions should be named clearly in camelCase: `getWorkspaceRoot`, `toggleItem`, `handleMessage`.
- Keep functions small and focused. If a dispatch function grows beyond ~80 lines, split by command group into a new `src/` module.

## Angular webview (`webview/`)

### Components

- Standalone only — `standalone: true` is mandatory, no NgModules.
- `ChangeDetectionStrategy.OnPush` mandatory on every component.
- File naming: `kebab-case` — `workspace.component.ts`, `cm-toggle.component.ts`.

### Signals

- Use `signal()`, `computed()`, `input()`, `output()` for all reactive state.
- Do not introduce `BehaviorSubject` or `ReplaySubject` for local state — signals replace them.
- RxJS observables are acceptable only for the bridge message stream (`VsCodeBridgeService.messages$`).

### State ownership

- Domain state lives in `core/state/*.state.ts` services — not in components.
- Components inject state services (read signals) and their feature BLoC (call action methods).
- Never inject `VsCodeBridgeService` in a component or overlay — use the feature BLoC.

### BLoC layer

Each feature folder (`workspace/`, `profiles/`, `catalog/`, `settings/`) contains a `*.bloc.ts`:

- `@Injectable({ providedIn: 'root' })`, injects `VsCodeBridgeService` privately.
- Exposes **action methods** (wraps `bridge.send()` calls).
- Owns **feature-local reactive state** (`private signal<T>()` → `.asReadonly()`).
- Subscribes to inbound `bridge.messages$` in the constructor with `takeUntilDestroyed()`.
- `DataSyncService` and `ThemeService` are the only other callers of `VsCodeBridgeService`.

Never call `bridge.send()` or subscribe to `bridge.messages$` from a template event binding or component constructor.

### Accessibility

- Every interactive element (buttons, toggles, inputs) in `webview/src/app/` must have an `aria-label` or visible label text.

### No-VSCode-in-webview rule

- Never `import vscode` or reference `vscode.*` in any `webview/` file.
- Never call `fs`, `path`, `os` from webview code.
- All side effects (toggle, save, delete) go through a BLoC, which calls `VsCodeBridgeService.send()`.

- Keep state services focused on one domain (workspace, profiles, catalog, settings).

## Comments

- Only explain *why*, never *what* — the code shows what.
- No multi-line comment blocks explaining obvious logic.
- Acceptable: a short comment on a non-obvious workaround or VSCode API quirk.

## Commits

- Conventional commit format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc.
- Imperative mood: "add toggle animation" not "added toggle animation".
- No AI attribution in commit messages.

## Formatting

Prettier handles all formatting. Config lives in `webview/package.json`:
- `printWidth: 100`, `singleQuote: true`, `trailingComma: all`
- Run `npm run format` before committing webview changes.
