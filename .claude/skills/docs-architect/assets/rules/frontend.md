---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.html"
  - "frontend/**/*.scss"
  - "src/frontend/**"
  - "**/*.component.ts"
---

# Frontend rules (auto-load on frontend/ file match)

- **Components**: standalone only, `OnPush` change detection mandatory
- **Signals**: `input()` / `output()` for I/O. Prefer signals over observables for local state
- **State**: dumb components (BLoC pattern). Container components own state, presentational components receive inputs
- **Icons**: `IconsService` + `<i-lucide>`. Never import SVGs directly
- **Imports**: use path aliases `@common/*`, `@components/*`, `@pages/*`. No deep relative paths
- **Styling**: SCSS per component, use design tokens (never hard-code colors/sizes)
- **Auth**: JWT in `localStorage['token']`, intercepted by `AuthInterceptor`
- **HTTP**: use typed services, never call `HttpClient` from components directly
- **Forms**: reactive forms only, never template-driven
- **a11y**: every interactive element needs `aria-label` or visible text, `data-testid` for e2e

Full reference: `docs/architecture.md`, `docs/coding-rules.md`.
