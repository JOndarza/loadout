# Webview — Angular 21

## Contents
- [Stack](#stack)
- [Component Pattern](#component-pattern)
- [4 State Services](#4-state-services)
- [VsCodeBridgeService](#vscodebridgeservice)
- [DataSyncService](#datasyncservice)
- [Feature Components](#feature-components)
- [Shared Primitives](#shared-primitives-sharedprimitives)
- [Icons](#icons)
- [Styling](#styling)
- [How to Add a New Component](#how-to-add-a-new-component)

## Stack

- **Framework**: Angular 21.2.7 / TypeScript 5.9.x
- **State**: signals (`signal()`, `computed()`, `input()`, `output()`)
- **Reactive**: RxJS 7.8 — only for `VsCodeBridgeService.messages$` and `takeUntilDestroyed`
- **Icons**: `lucide-angular ^1.0.0` — the only icon library
- **Fonts**: `@fontsource/roboto ^5.2.10` — loaded globally, do not add more font imports
- **Build**: `@angular/build` (Vite-based) — `cd webview && npm run build`
- **Forbidden**: `HttpClient`, `fetch`, `XHR`, SVG file imports, `@NgModule`, `BehaviorSubject`

---

## Component Pattern

Every component must follow this skeleton:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WorkspaceState } from '../../core/state/workspace.state';
import { VsCodeBridgeService } from '../../core/vscode-bridge.service';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `...`,
})
export class MyFeatureComponent {
  private readonly state = inject(WorkspaceState);
  private readonly bridge = inject(VsCodeBridgeService);

  readonly agents = this.state.agents; // read-only signal

  onToggle(file: string, wasActive: boolean): void {
    this.bridge.send({ command: 'toggle', type: 'agents', file, wasActive });
  }
}
```

**Forbidden patterns:**
- `@Input()` / `@Output()` / `EventEmitter` — use `input()` / `output()` signals instead
- Component-local `signal<Domain[]>()` for items that belong in a state service
- Calling `bridge.send()` from a template event binding — always wrap in a method
- `ngOnInit` + subscribe — use `DataSyncService` which feeds state services

---

## 4 State Services

All services: `@Injectable({ providedIn: 'root' })`, private `signal<T>()`, exposed via `.asReadonly()`.

### WorkspaceState (`core/state/workspace.state.ts`)

| Signal | Type | Description |
|---|---|---|
| `agents` | `Signal<WorkspaceItem[]>` | All agents (active + inactive) |
| `skills` | `Signal<WorkspaceItem[]>` | All skills |
| `commands` | `Signal<WorkspaceItem[]>` | All commands |
| `activeAgents` | `Signal<WorkspaceItem[]>` | computed — filtered active |
| `activeSkills` | `Signal<WorkspaceItem[]>` | computed — filtered active |
| `activeCommands` | `Signal<WorkspaceItem[]>` | computed — filtered active |
| `totalActiveTokens` | `Signal<number>` | sum of tokens on active items |
| `totalCount` | `Signal<number>` | all items across all types |
| `activeCount` | `Signal<number>` | active items across all types |

Setter: `setAll(agents: WorkspaceItem[], skills: WorkspaceItem[], commands: WorkspaceItem[])`

### ProfilesState (`core/state/profiles.state.ts`)

| Signal | Type | Description |
|---|---|---|
| `profiles` | `Signal<Record<string, Profile>>` | All profiles keyed by name |
| `activeName` | `Signal<string \| null>` | Currently applied profile name |
| `entries` | `Signal<ProfileEntry[]>` | computed — sorted by order, excludes `__restore_point__` |
| `hasRestorePoint` | `Signal<boolean>` | computed — whether undo snapshot exists |
| `allProfileItemFiles` | `Signal<Set<string>>` | computed — all filenames referenced across profiles |

Setters: `setAll(profiles: Record<string, Profile>)`, `setActiveName(name: string | null)`

`ProfileEntry` interface: `{ name, agents, skills, commands, createdAt, order, description, pendingItems }`

### CatalogState (`core/state/catalog.state.ts`)

| Signal | Type | Description |
|---|---|---|
| `agents` | `Signal<CatalogItem[]>` | Catalog agents |
| `skills` | `Signal<CatalogItem[]>` | Catalog skills |
| `commands` | `Signal<CatalogItem[]>` | Catalog commands |
| `globalRoot` | `Signal<string>` | Path to global catalog dir |
| `all` | `Signal<(CatalogItem & { type: ItemType })[]>` | computed — all three types flattened |
| `totalCount` | `Signal<number>` | computed — total across all types |

Setter: `setAll(agents: CatalogItem[], skills: CatalogItem[], commands: CatalogItem[], globalRoot: string)`

### SettingsState (`core/state/settings.state.ts`)

| Signal | Type | Description |
|---|---|---|
| `settings` | `Signal<Settings>` | density, theme, defaultTab, registryUrl |

Defaults: `{ density: 'comfortable', theme: 'auto', defaultTab: 'workspace', registryUrl: 'https://www.aitmpl.com/components.json' }`

Setter: `setAll(partial: Partial<Settings>)` — merges over current value

---

## VsCodeBridgeService

The only channel to the extension host.

```typescript
// Inbound stream — subscribe in DataSyncService, not in components
messages$: Observable<ExtensionMessage>

// Outbound — call from component methods, never from templates
send(msg: WebviewMessage): void

// Sends { command: 'ready' } — called once by DataSyncService.init()
ready(): void
```

Wraps `window.acquireVsCodeApi()`. The API can only be acquired once; the service holds the singleton.

---

## DataSyncService

Initialises once at `AppComponent.ngOnInit()`. Subscribes to `bridge.messages$` (with `takeUntilDestroyed`), routes messages to state services:

- `'initialData'` / `'dataUpdate'` → calls all four `setAll()` setters; resolves `activeName` by comparing active item file sets against each profile's lists using `Set` equality (order-independent)
- `'vscodeThemeChanged'` → forwarded to `ThemeService`
- `'notify'` → forwarded to `ToastService`

---

## Feature Components

| Component | Injects | Sends |
|---|---|---|
| `workspace.component.ts` | `WorkspaceState`, `bridge` | `toggle`, `bulkToggle`, `enableAll`, `disableAll` |
| `profiles.component.ts` | `ProfilesState`, `WorkspaceState`, `bridge` | `saveProfile`, `applyProfile`, `deleteProfile`, `renameProfile`, `reorderProfiles`, `updateProfileItems`, `duplicateProfile`, `previewApplyProfile`, `exportProfile`, `importProfileRequest`, `importProfileConfirm` |
| `catalog.component.ts` | `CatalogState`, `WorkspaceState`, `bridge` | `addFromGlobal`, `bulkAddFromGlobal`, `pushToGlobal`, `checkRegistry`, `runUpdate`, `testRegistry` |
| `settings.component.ts` | `SettingsState`, `CatalogState`, `bridge` | `updateSettings`, `revealCatalog`, `openExternal` |

---

## Shared Primitives (`shared/primitives/`)

Import from the barrel: `import { CmCardComponent } from '../../shared/primitives'`

| Component / Directive | Selector | Purpose |
|---|---|---|
| `CmCardComponent` | `cm-card` | Item card wrapper with slot for content |
| `CmToggleComponent` | `cm-toggle` | Toggle switch; `checked` input, `toggled` output |
| `CmTokenBarComponent` | `cm-token-bar` | Token count progress bar |
| `CmSegmentedComponent` | `cm-segmented` | Filter chip row (Active, Heavy, etc.) |
| `CmButtonComponent` | `cm-button` | Styled button with variant input |
| `CmEmptyComponent` | `cm-empty` | Empty state placeholder |
| `CmSyncPillComponent` | `cm-sync-pill` | Sync status badge (synced, localModified, sharedUpdated, diverged) |
| `CopyToClipboardDirective` | `[cmCopyToClipboard]` | Copies target value on click |

---

## Icons

```typescript
import { SearchIcon } from 'lucide-angular';

@Component({ ... })
export class MyComponent {
  readonly searchIcon = SearchIcon; // assign to property
}
```

```html
<lucide-icon [img]="searchIcon" [size]="16" />
```

Never: `import SearchSvg from 'assets/search.svg'` or inline `<svg>`.

---

## Styling

- SCSS per component (Angular `styleUrl`)
- **Theming**: CSS custom properties resolved by `ThemeService` from `vscodeThemeChanged` messages; use `var(--vscode-*)` tokens or the component-level theme classes
- **Fonts**: Roboto already loaded via `@fontsource/roboto` in `styles.scss` — do not add `@import` in components

---

## How to Add a New Component

1. Create `kebab-case.component.ts` in the appropriate `features/` or `shared/` folder
2. Declare `standalone: true` + `ChangeDetectionStrategy.OnPush`
3. Use `inject()` to access the state service — never own domain state locally in the component
4. I/O via `input()` / `output()` signals; avoid `@Input()` / `@Output()`
5. Add `aria-label` on every interactive element (button, toggle, input)
