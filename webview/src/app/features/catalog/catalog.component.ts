import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CatalogState } from '@state/catalog.state';
import { WorkspaceState } from '@state/workspace.state';
import { TabFiltersState, type CatalogFilter } from '@state/tab-filters.state';
import { CatalogBloc } from './catalog.bloc';
import { SearchService } from '@core/search.service';
import { ContextMenuService } from '@shared/overlays/context-menu.service';
import {
  CmButtonComponent,
  CmCardComponent,
  CmEmptyComponent,
  CmSyncPillComponent,
  CmTokenBarComponent,
  CopyToClipboardDirective,
} from '@shared/primitives';
import type { CatalogItem, ItemType, WorkspaceItem } from '@core/messages';

type FilterChip = CatalogFilter;

interface CatalogRow extends CatalogItem {
  type: ItemType;
}

interface LocalOnlyRow extends WorkspaceItem {
  type: ItemType;
}

@Component({
  selector: 'cm-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CmCardComponent,
    CmButtonComponent,
    CmTokenBarComponent,
    CmSyncPillComponent,
    CmEmptyComponent,
    CopyToClipboardDirective,
  ],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  protected readonly state = inject(CatalogState);
  protected readonly workspace = inject(WorkspaceState);
  protected readonly filters = inject(TabFiltersState);
  private readonly bloc = inject(CatalogBloc);
  private readonly search = inject(SearchService);
  private readonly contextMenu = inject(ContextMenuService);

  readonly searchQuery = input<string>('');
  protected readonly registryOpen = signal(false);
  protected readonly registryItems = this.bloc.registryItems;
  protected readonly registryLoading = this.bloc.registryLoading;
  protected readonly registryError = this.bloc.registryError;
  protected readonly updateRunning = this.bloc.updateRunning;
  protected readonly updateResult = this.bloc.updateResult;
  protected readonly selected = signal<Set<string>>(new Set());

  protected readonly catalogRows = computed<CatalogRow[]>(() =>
    this.state
      .all()
      .map((i) => ({ ...i }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  // Items present in project but NOT in catalog → "local-only"
  protected readonly localOnlyRows = computed<LocalOnlyRow[]>(() => {
    const catalogFiles = new Set(this.state.all().map((i) => i.file));
    const local: LocalOnlyRow[] = [
      ...this.workspace.agents().map((a)   => ({ ...a, type: 'agents'   as const })),
      ...this.workspace.skills().map((s)   => ({ ...s, type: 'skills'   as const })),
      ...this.workspace.commands().map((c) => ({ ...c, type: 'commands' as const })),
    ];
    return local.filter((i) => !catalogFiles.has(i.file));
  });

  protected readonly visibleCatalog = computed<CatalogRow[]>(() => {
    const f = this.filters.catalog().filter;
    const { fuzzy } = this.search.parseQuery(this.searchQuery().trim());
    let rows = this.catalogRows();

    switch (f) {
      case 'agents':
      case 'skills':
      case 'commands':
        rows = rows.filter((r) => r.type === f);
        break;
      case 'updated':
        rows = rows.filter((r) => r.syncStatus === 'sharedUpdated');
        break;
      case 'local-only':
        return [];
    }

    if (fuzzy) {
      rows = this.search.fuzzyFilter(rows, (r) => `${r.name} ${r.description} ${r.file}`, fuzzy);
    }
    return rows;
  });

  protected readonly visibleLocalOnly = computed<LocalOnlyRow[]>(() => {
    if (this.filters.catalog().filter !== 'local-only') return [];
    const { fuzzy } = this.search.parseQuery(this.searchQuery().trim());
    let rows = this.localOnlyRows();
    if (fuzzy) {
      rows = this.search.fuzzyFilter(rows, (r) => `${r.name} ${r.description} ${r.file}`, fuzzy);
    }
    return rows;
  });

  protected readonly counts = computed(() => {
    const rows = this.catalogRows();
    let agents = 0, skills = 0, commands = 0, updated = 0;
    for (const r of rows) {
      if (r.type === 'agents')        agents++;
      else if (r.type === 'skills')   skills++;
      else if (r.type === 'commands') commands++;
      if (r.syncStatus === 'sharedUpdated') updated++;
    }
    return { all: rows.length, agents, skills, commands, updated, localOnly: this.localOnlyRows().length };
  });

  protected setFilter(f: FilterChip): void {
    this.filters.patch('catalog', { filter: f });
    this.selected.set(new Set());
  }

  protected key(item: { type: string; file: string }): string {
    return `${item.type}:${item.file}`;
  }

  protected pull(item: CatalogRow | LocalOnlyRow): void {
    this.bloc.addFromGlobal(item.type, item.file);
  }

  protected pushLocal(item: CatalogRow | LocalOnlyRow): void {
    this.bloc.pushToGlobal(item.type, item.file);
  }

  protected toggleSelect(item: CatalogRow): void {
    const k = this.key(item);
    const next = new Set(this.selected());
    if (next.has(k)) next.delete(k);
    else next.add(k);
    this.selected.set(next);
  }

  protected isSelected(item: { type: string; file: string }): boolean {
    return this.selected().has(this.key(item));
  }

  protected bulkAdopt(): void {
    const items = this.visibleCatalog()
      .filter((i) => this.isSelected(i) && !i.inProject)
      .map((i) => ({ itemType: i.type, file: i.file }));
    if (!items.length) return;
    this.bloc.bulkAddFromGlobal(items);
    this.selected.set(new Set());
  }

  protected toggleRegistry(): void {
    this.registryOpen.update((v) => !v);
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected checkRegistry(): void {
    this.bloc.checkRegistry();
  }

  protected runUpdate(): void {
    this.bloc.runUpdate();
  }

  protected onItemContextMenu(e: MouseEvent, item: CatalogRow): void {
    e.preventDefault();
    this.contextMenu.open({
      x: e.clientX,
      y: e.clientY,
      items: [
        ...(!item.inProject
          ? [{ label: '↓ Adopt', action: () => this.pull(item) }]
          : []),
        { label: '⎘ Copy name', action: () => navigator.clipboard.writeText(item.name) },
      ],
    });
  }
}
