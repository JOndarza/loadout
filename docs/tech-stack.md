# Tech Stack

<!-- auto-generated from codebase scan -->

## Extension Host

| Package | Version | Purpose |
|---|---|---|
| `vscode` API | `^1.80.0` | Extension APIs — webview, workspace, storage, commands |
| Node.js built-ins | — | `fs`, `path`, `os`, `crypto`, `child_process` |

Runtime: Node.js (CommonJS). No npm dependencies in the extension host beyond `vscode`.

## Webview (Angular)

### Core

| Package | Version | Purpose |
|---|---|---|
| `@angular/core` | `^21.2.7` | Framework, signals, DI |
| `@angular/common` | `^21.2.7` | Common directives |
| `@angular/forms` | `^21.2.7` | Reactive forms |
| `@angular/animations` | `^21.2.7` | Animation support |
| `@angular/platform-browser` | `^21.2.7` | Browser bootstrapping |
| `rxjs` | `~7.8.0` | Observable streams (bridge service only) |
| `tslib` | `^2.3.0` | TypeScript helpers |

### UI

| Package | Version | Purpose |
|---|---|---|
| `lucide-angular` | `^1.0.0` | Icon library — the only icon source |
| `@fontsource/roboto` | `^5.2.10` | Self-hosted Roboto font |

### Dev tooling

| Package | Version | Purpose |
|---|---|---|
| `@angular/cli` | `^21.2.6` | Build, serve, lint |
| `@angular/build` | `^21.2.6` | Vite-based build system |
| `@angular/compiler-cli` | `^21.2.7` | AOT compiler |
| `typescript` | `~5.9.2` | Type checking |
| `@types/node` | `^22.0.0` | Node type definitions |
| `vitest` | (see package-lock) | Test runner |

## Formatting

Prettier config (in `webview/package.json`):
- `printWidth`: 100
- `singleQuote`: true
- `trailingComma`: all
- HTML parser: `angular`

## Package manager

- Webview: npm `11.12.1` (enforced via `packageManager` field)
- Extension root: npm (no lock version pinned)

## Prohibited alternatives

- No `MediatR` or backend DI framework
- No `HttpClient` or `fetch` in webview (sandboxed, no network)
- No ESM (`import`/`export`) in `extension.js` or `data.js` — CommonJS only
- No raw SVG imports in Angular — use `lucide-angular` exclusively
