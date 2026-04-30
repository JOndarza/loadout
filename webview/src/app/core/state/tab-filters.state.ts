import { Injectable, computed, signal } from '@angular/core';
import type { ItemType } from '@core/messages';

export type WorkspaceKind = 'all' | ItemType;
export type CatalogFilter = 'all' | ItemType | 'updated' | 'local-only';

export interface WorkspaceFilters {
  kind: WorkspaceKind;
  activeOnly: boolean;
  heavyOnly: boolean;
}

export interface CatalogFilters {
  filter: CatalogFilter;
}

interface TabFilters {
  workspace: WorkspaceFilters;
  catalog: CatalogFilters;
}

const DEFAULTS: TabFilters = {
  workspace: { kind: 'all', activeOnly: false, heavyOnly: false },
  catalog: { filter: 'all' },
};

@Injectable({ providedIn: 'root' })
export class TabFiltersState {
  private readonly _state = signal<TabFilters>(DEFAULTS);

  readonly workspace = computed(() => this._state().workspace);
  readonly catalog = computed(() => this._state().catalog);

  patch<K extends keyof TabFilters>(tab: K, partial: Partial<TabFilters[K]>): void {
    this._state.update((s) => ({ ...s, [tab]: { ...s[tab], ...partial } }));
  }

  reset(tab?: keyof TabFilters): void {
    if (tab) {
      this._state.update((s) => ({ ...s, [tab]: DEFAULTS[tab] }));
    } else {
      this._state.set(DEFAULTS);
    }
  }
}
