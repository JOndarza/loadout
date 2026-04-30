# UI Design System

## Contents
- [SCSS Architecture](#scss-architecture-7-1-pattern)
- [Design Tokens (theme-agnostic)](#design-tokens-theme-agnostic-root)
- [Color Palettes](#color-palettes)
- [Rings (border replacement)](#rings-border-replacement)
- [Shadows & Glow](#shadows--glow)
- [Key Mixins](#key-mixins)
- [Responsive (container queries)](#responsive-container-queries-not-media-queries)
- [Keyframe Animations](#keyframe-animations)
- [Toggle Component Visual Spec](#toggle-component-visual-spec)
- [Accessibility](#accessibility)
- [Anti-patterns](#anti-patterns)

## SCSS Architecture (7-1 pattern)

```
webview/src/styles/
├── main.scss                  # imports all partials via index files
├── abstracts/                 # compile-time SCSS only ($vars, mixins, functions)
│   ├── _variables.scss        # breakpoints ($bp-xs/sm/md/lg), easing curves
│   └── _mixins.scss           # all reusable mixins (see Mixins section)
├── base/                      # global element defaults
│   ├── _reset.scss
│   ├── _typography.scss
│   ├── _animations.scss       # single source of truth for all @keyframes
│   └── _accessibility.scss
├── themes/
│   ├── _tokens.scss           # theme-agnostic CSS custom properties (:root)
│   ├── _dark.scss             # :root[data-theme='dark']
│   ├── _light.scss            # :root[data-theme='light']
│   └── _transitions.scss
├── components/                # one file per shared primitive
│   ├── _toggle.scss, _card.scss, _button.scss, _token-bar.scss, ...
├── layout/
│   └── _shell.scss            # header, tab bar, status strip
└── pages/
    └── _workspace.scss, _profiles.scss, _catalog.scss, _settings.scss
```

**Rule**: CSS custom properties (`--foo`) belong in `themes/`; Sass compile-time variables (`$foo`) belong in `abstracts/`.

---

## Design Tokens (theme-agnostic, `:root`)

### Typography
```scss
--font-headline, --font-display, --font-body: 'Roboto', system-ui, sans-serif
--font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace
--tracking-tight: -0.02em   --tracking-display: -0.03em
--tracking-wide:   0.06em   --tracking-uppercase: 0.1em
```

### Spacing scale (4px base)
```scss
--sp-1: 0.25rem  --sp-2: 0.5rem   --sp-3: 0.75rem  --sp-4: 1rem
--sp-5: 1.25rem  --sp-6: 1.5rem   --sp-7: 1.75rem  --sp-8: 2rem
--sp-10: 2.5rem  --sp-12: 3rem    --sp-16: 4rem
```

### Radii
```scss
--r-sm: 0.5rem  --r-md: 0.75rem  --r-lg: 1rem  --r-xl: 1.5rem  --r-full: 9999px
```

### Motion
```scss
--t-fast:   150ms ease
--t-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1)   /* material standard */
--t-slow:   500ms cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* overshoot spring */
```

### Z-index layers
```scss
--z-base: 1  --z-overlay: 100  --z-modal: 200  --z-toast: 300
```

### Component dimensions
```scss
--header-pad-x: var(--sp-5)   --content-pad-x: var(--sp-5)
--touch-min: 36px              --glass-blur: 28px
```

---

## Color Palettes

### Dark theme (`:root[data-theme='dark']`) — deep navy + lavender

| Token | Value | Use |
|---|---|---|
| `--bg` | `#06060a` | Page background |
| `--surface` | `#0e0e18` | Card background |
| `--surface-2` | `#141420` | Nested surface |
| `--surface-3` | `#1c1c2a` | Tertiary surface |
| `--surface-glass` | `rgba(8,8,16,0.85)` | Frosted overlay |
| `--text` | `#ffffff` | Body text |
| `--text-muted` | `#b0acac` | Secondary text |
| `--text-dim` | `#767575` | Disabled / hint |
| **`--primary`** | `#c4adff` | Accent (lavender) |
| `--primary-dim` | `#9070ff` | Darker accent |
| `--primary-rgb` | `196, 173, 255` | For rgba() usage |
| `--secondary` | `#00e3fd` | Cyan highlight |
| `--tertiary` | `#ff96bb` | Pink highlight |
| **`--gold`** | `#d4af37` | **Toggle ON, wordmark** |
| `--gold-bright` | `#e8c246` | Hover gold |
| `--gold-on` | `#1a1000` | Text ON gold bg |
| `--gold-rgb` | `212, 175, 55` | For rgba() usage |
| `--success` | `#34d399` | |
| `--warning` | `#fbbf24` | |
| `--error` | `#ff6e84` | |
| `--info` | `#3b82f6` | |
| `--token-low/mid/high` | primary-dim / primary / error | Token bar gradient |

### Light theme (`:root[data-theme='light']`) — warm cream + violet

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f9f7f3` | Warm off-white |
| `--surface` | `#fffdf8` | Cream |
| `--surface-2` | `#f1ece3` | |
| `--surface-3` | `#e0d9ce` | |
| **`--primary`** | `#6834eb` | Violet |
| **`--gold`** | `#a07800` | Toggle ON (muted gold) |
| `--gold-on` | `#ffffff` | |
| `--success` | `#16a34a` | |
| `--error` | `#dc2626` | |

**Light theme is warm, never cold gray.** All surfaces use warm tones.

---

## Rings (border replacement)

**Rule: never use `border:` — use `ring()` mixin or `box-shadow` only.**

```scss
@include ring($color, $width: 1px);          // box-shadow: 0 0 0 $width $color
@include ring-with-shadow($ring, $shadow);   // ring + shadow combined

// Pre-defined ring tokens:
--ring-soft:    0 0 0 1px rgba(255,255,255,0.08)
--ring-medium:  0 0 0 1px rgba(255,255,255,0.14)
--ring-strong:  0 0 0 1px rgba(255,255,255,0.22)
--ring-primary: 0 0 0 1px rgba(196,173,255,0.4)
--ring-gold:    0 0 0 1px rgba(212,175,55,0.4)
--ring-error:   0 0 0 1px rgba(255,110,132,0.35)
```

---

## Shadows & Glow

```scss
--shadow-soft:         0 4px 20px rgba(0,0,0,0.4)
--shadow-ambient:      0 24px 48px rgba(0,0,0,0.6)
--shadow-glow-primary: 0 0 32px rgba(196,173,255,0.18)
--shadow-glow-gold:    0 0 32px rgba(212,175,55,0.22)
```

---

## Key Mixins

```scss
// Glass surface — frosted card with primary tint
@include glass-surface($alpha: 0.06)   // rgba(--primary-rgb, alpha) + blur
@include glass-premium                 // var(--surface-glass) + blur

// Wordmark gradient (white → gold)
@include wordmark-gradient             // static
@include animated-wordmark            // flowing animation (32s)

// Focus ring (gold by default, WCAG AA)
@include focus-ring($color: var(--gold))   // 2px outline, 2px offset on :focus-visible

// Truncation
@include truncate-1                    // single line ellipsis
@include truncate-n($lines)           // multi-line clamp

// Layout
@include button-reset                 // zero out browser button styles
@include stagger-list($count, $delay: 28ms)  // staggered card-in animation
```

---

## Responsive (container queries, not media queries)

Loadout uses container queries on `cm-root` — the root container. Never use `@media`.

```scss
@include at-xs    { /* max-width: 320px */ }
@include at-sm    { /* max-width: 479px */ }
@include at-md-up { /* min-width: 480px */ }
@include at-lg-up { /* min-width: 720px */ }
@include at-xl-up { /* min-width: 960px */ }
```

---

## Keyframe Animations

All keyframes live in `base/_animations.scss`. Never define `@keyframes` in component files.

| Keyframe | Use |
|---|---|
| `cm-card-in` | Item card enter (opacity + translateY 6px) — 220ms |
| `cm-card-activate` | Flash on toggle-on (primary glow fade) |
| `cm-toast-in/out` | Toast slide from right |
| `cm-spin` | Loading spinner |
| `cm-page-in` | Tab page enter |
| `cm-wordmark-flow` | Animated gradient wordmark |
| `cm-shimmer` | Skeleton loading shimmer |
| `cm-copy-confirm` | Copy button bounce feedback |
| `cm-empty-in` | Empty state enter |
| `cm-tb-pulse` | Token bar overflow pulse (red glow) |

**Always wrap animations with `@media (prefers-reduced-motion: reduce) { animation: none }`.**

---

## Toggle Component Visual Spec

Active toggle uses **gold** (not primary) — this is the brand's signature interaction color.

```
OFF state: track = rgba(white, 0.08) with ring; knob = white circle
ON  state: track = var(--gold) with gold glow; knob slides right 18px
           knob color = var(--gold-on) (#1a1000 dark / #ffffff light)
```

Dimensions: 42×24px track, 18×18px knob, 2px inset, --r-full radius.
Transition: knob uses `--t-normal` + `--ease-spring` (overshoot bounce).

---

## Accessibility

- **Focus ring**: gold `2px solid`, `2px offset`, `:focus-visible` only — via `@include focus-ring`
- **Touch target minimum**: `--touch-min: 36px` (all interactive elements)
- **Color contrast**: WCAG AA — all text/bg combinations validated per theme
- **Reduced motion**: every animation wrapped in `prefers-reduced-motion: reduce` guard
- **Selection color**: `rgba(var(--primary-rgb), 0.35)` with `var(--text)` text

---

## Anti-patterns

| Wrong | Correct |
|---|---|
| `border: 1px solid ...` | `@include ring(...)` or `box-shadow: var(--ring-soft)` |
| `@media (max-width: 480px)` | `@include at-sm { ... }` |
| `@keyframes foo {}` in component | Define in `base/_animations.scss` |
| Hard-coded colors (`#c4adff`) | Use token (`var(--primary)`) |
| `border-radius: 8px` | `border-radius: var(--r-md)` |
| Font imports in component | Roboto loaded globally in `styles/vendors/_fonts.scss` |
