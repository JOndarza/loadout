# Tech stack — hard constraints

<!-- auto-generated from codebase scan -->

- **Extension host**: Node.js / CommonJS — `extension.js`, `data.js`, `update-claude.mjs`; VSCode API `^1.80.0`
- **Frontend**: Angular 21.2.7 / TypeScript 5.9.x — standalone components, signals-based state
- **CDK**: `@angular/cdk ^19.x` — `SelectionModel<string>` from `@angular/cdk/collections`; CSP_NONCE provided in `app.config.ts` for CDK style injection
- **Fuzzy search**: `@leeoniya/ufuzzy` — wrapped by `SearchService`; `parseQuery()` strips filter tokens before passing to uFuzzy
- **Icons**: lucide-angular `^1.0.0` — the only icon library; never import raw SVGs
- **Fonts**: `@fontsource/roboto` `^5.2.10`
- **RxJS**: `~7.8.0` — for `VsCodeBridgeService` message stream only; prefer signals for local state
- **Test runner**: vitest (webview only; no extension host tests currently)
- **Package manager**: npm 11.12.1 (webview); npm for extension root
- **Prettier**: printWidth 100, singleQuote, trailingComma all
- **Prohibited alternatives**: no MediatR, no backend framework, no HTTP client in webview (sandboxed), no ESM in extension host files

Full package tables and versions: `docs/tech-stack.md`.
