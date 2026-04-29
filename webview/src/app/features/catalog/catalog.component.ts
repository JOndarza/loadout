import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogState } from '../../core/state/catalog.state';
import { WorkspaceState } from '../../core/state/workspace.state';
import { VsCodeBridgeService } from '../../core/vscode-bridge.service';
import {
  CmButtonComponent,
  CmCardComponent,
  CmEmptyComponent,
  CmSyncPillComponent,
  CmTokenBarComponent,
  CopyToClipboardDirective,
} from '../../shared/primitives';
import type { CatalogItem, ItemType, RegistryItem, WorkspaceItem } from '../../core/messages';

type FilterChip = 'all' | ItemType | 'updated' | 'local-only';

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
  private readonly bridge = inject(VsCodeBridgeService);

  readonly searchQuery = input<string>('');

  protected readonly filter = signal<FilterChip>('all');
  protected readonly registryOpen = signal(false);
  protected readonly registryItems = signal<RegistryItem[]>([]);
  protected readonly registryLoading = signal(false);
  protected readonly registryError = signal<string | null>(null);
  protected readonly updateRunning = signal(false);
  protected readonly updateResult = signal<{ updated: string[]; skipped: string[]; failed: string[] } | null>(null);
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
    const f = this.filter();
    const q = this.searchQuery().toLowerCase().trim();
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

    if (q) {
      rows = rows.filter((r) =>
        `${r.name} ${r.description} ${r.file}`.toLowerCase().includes(q),
      );
    }
    return rows;
  });

  protected readonly visibleLocalOnly = computed<LocalOnlyRow[]>(() => {
    if (this.filter() !== 'local-only') return [];
    const q = this.searchQuery().toLowerCase().trim();
    let rows = this.localOnlyRows();
    if (q) {
      rows = rows.filter((r) =>
        `${r.name} ${r.description} ${r.file}`.toLowerCase().includes(q),
      );
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

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((m) => {
      if (m.command === 'registryStatus') {
        this.registryLoading.set(false);
        this.registryError.set(m.error ?? null);
        this.registryItems.set(m.items ?? []);
      } else if (m.command === 'updateStarted') {
        this.updateRunning.set(true);
      } else if (m.command === 'updateDone') {
        this.updateRunning.set(false);
        this.updateResult.set(m.result);
      }
    });
  }

  protected setFilter(f: FilterChip): void {
    this.filter.set(f);
    this.selected.set(new Set());
  }

  protected key(item: { type: string; file: string }): string {
    return `${item.type}:${item.file}`;
  }

  protected pull(item: CatalogRow | LocalOnlyRow): void {
    this.bridge.send({ command: 'addFromGlobal', itemType: item.type, file: item.file });
  }

  protected pushLocal(item: CatalogRow | LocalOnlyRow): void {
    this.bridge.send({ command: 'pushToGlobal', itemType: item.type, file: item.file });
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
    const items = this.visibleCatalog().filter((i) => this.isSelected(i) && !i.inProject);
    for (const it of items) {
      this.bridge.send({ command: 'addFromGlobal', itemType: it.type, file: it.file });
    }
    this.selected.set(new Set());
  }

  protected toggleRegistry(): void {
    this.registryOpen.update((v) => !v);
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected checkRegistry(): void {
    this.registryLoading.set(true);
    this.registryError.set(null);
    this.registryItems.set([]);
    this.bridge.send({ command: 'checkRegistry' });
  }

  protected runUpdate(): void {
    this.updateResult.set(null);
    this.bridge.send({ command: 'runUpdate' });
  }
}
