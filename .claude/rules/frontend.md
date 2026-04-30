---
paths:
  - "webview/**/*.ts"
  - "webview/**/*.html"
  - "webview/**/*.scss"
---

# Frontend rules (auto-load on webview/ file match)

<!-- mirrors: docs/architecture.md, docs/coding-rules.md -->

- **Components**: standalone only, `OnPush` change detection mandatory
- **Signals**: `input()` / `output()` for I/O; `signal()` / `computed()` for local reactive state; prefer over Subjects
- **State**: dumb components — state lives in `core/state/*.state.ts` services, not in components; components inject and read signals only
- **BLoC layer**: each feature has a `*.bloc.ts` service (`@Injectable({ providedIn: 'root' })`) that owns all `bridge.send()` calls and inbound `messages$` subscriptions for that feature; components inject the BLoC, never `VsCodeBridgeService` directly
- **Bridge**: `VsCodeBridgeService` is the channel to the extension host — BLoCs and core infrastructure (`DataSyncService`, `ThemeService`) are the only callers; never inject it in components or overlays
- **Icons**: `lucide-angular` only — never import or inline SVGs directly
- **No HTTP**: webview is sandboxed; no `HttpClient`, no `fetch`, no XHR
- **Fonts**: Roboto via `@fontsource/roboto` — already loaded globally; no additional font imports
- **Styling**: SCSS per component; use CSS custom properties for theming (dark/light follows VSCode theme via `ThemeService`)
- **Forms**: reactive forms only when needed; prefer signal-driven state for simple interactions
- **a11y**: every interactive element needs `aria-label` or visible text

**Before any UI change**: invoke the `/loadout-system-design` skill — it carries the live design tokens (dark/light palettes, spacing, radii, motion), SCSS mixin API, component visual specs, and the full Angular state/bridge patterns.

Full reference: `docs/architecture.md`, `docs/coding-rules.md`.
