import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkspaceBloc } from './workspace.bloc';
import { WorkspaceState } from '@state/workspace.state';
import { ProfilesState } from '@state/profiles.state';
import { TabFiltersState, type WorkspaceKind } from '@state/tab-filters.state';
import { ShortcutsService } from '@core/shortcuts.service';
import { SearchService } from '@core/search.service';
import { ContextMenuService } from '@shared/overlays/context-menu.service';
import {
  CmButtonComponent,
  CmCardComponent,
  CmEmptyComponent,
  CmSegmentedComponent,
  CmTokenBarComponent,
  CmToggleComponent,
  CopyToClipboardDirective,
  HighlightMatchPipe,
  type SegmentedOption,
} from '@shared/primitives';
import type { ItemType, WorkspaceItem } from '@core/messages';

type ItemKind = WorkspaceKind;
interface RowItem extends WorkspaceItem {
  type: ItemType;
}

@Component({
  selector: 'cm-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CmCardComponent,
    CmToggleComponent,
    CmTokenBarComponent,
    CmSegmentedComponent,
    CmButtonComponent,
    CmEmptyComponent,
    CopyToClipboardDirective,
    HighlightMatchPipe,
  ],
  templateUrl: './workspace.component.html',
})
export class WorkspaceComponent {
  private readonly bloc = inject(WorkspaceBloc);
  protected readonly state = inject(WorkspaceState);
  protected readonly filters = inject(TabFiltersState);
  private readonly profiles = inject(ProfilesState);
  private readonly shortcuts = inject(ShortcutsService);
  private readonly search = inject(SearchService);
  private readonly contextMenu = inject(ContextMenuService);

  readonly searchQuery = input<string>('');

  protected readonly orphanOnly = signal(false);

  constructor() {
    this.shortcuts.events$.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e.type === 'orphanOnly') this.toggleNotInProfile();
    });
  }
  protected readonly selected = signal<Set<string>>(new Set());
  private lastClickedKey = '';

  protected readonly kindOptions = computed<SegmentedOption<ItemKind>[]>(() => [
    { value: 'all', label: 'All', count: this.state.totalCount() },
    { value: 'agents', label: 'Agents', count: this.state.agents().length },
    { value: 'skills', label: 'Skills', count: this.state.skills().length },
    { value: 'commands', label: 'Commands', count: this.state.commands().length },
  ]);

  protected readonly allItems = computed<RowItem[]>(() => {
    const a = this.state.agents().map((i)   => ({ ...i, type: 'agents'   as const }));
    const s = this.state.skills().map((i)   => ({ ...i, type: 'skills'   as const }));
    const c = this.state.commands().map((i) => ({ ...i, type: 'commands' as const }));
    return [...a, ...s, ...c].sort((x, y) => x.name.localeCompare(y.name));
  });

  protected readonly parsedQuery = computed(() => this.search.parseQuery(this.searchQuery().trim()));

  protected readonly visibleItems = computed<RowItem[]>(() => {
    const { fuzzy, type: typeFilter, active: activeFilter, tokGt } = this.parsedQuery();
    const { kind, activeOnly, heavyOnly } = this.filters.workspace();
    const inAnyProfile = this.orphanOnly() ? this.profiles.allProfileItemFiles() : null;

    let items = this.allItems().filter((it) => {
      const effectiveKind = typeFilter ?? (kind !== 'all' ? kind : null);
      if (effectiveKind && it.type !== effectiveKind) return false;
      if (activeOnly || activeFilter === true) { if (!it.active) return false; }
      if (activeFilter === false && it.active) return false;
      if (heavyOnly && it.tokens <= 1000) return false;
      if (tokGt !== undefined && it.tokens <= tokGt) return false;
      if (inAnyProfile && inAnyProfile.has(it.file)) return false;
      return true;
    });

    if (fuzzy) {
      items = this.search.fuzzyFilter(items, (i) => `${i.name} ${i.description} ${i.file}`, fuzzy);
    }

    return items;
  });

  protected onRowContextMenu(e: MouseEvent, item: RowItem): void {
    e.preventDefault();
    this.contextMenu.open({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: item.active ? '✕ Disable' : '✓ Enable',
          action: () => this.toggle(item),
        },
        {
          label: '⎘ Copy name',
          action: () => navigator.clipboard.writeText(item.name),
        },
      ],
    });
  }

  protected nameRanges(name: string): [number, number][] {
    const { fuzzy } = this.parsedQuery();
    if (!fuzzy) return [];
    return this.search.getMatchRanges(name, fuzzy);
  }

  protected setKind(v: ItemKind): void {
    this.filters.patch('workspace', { kind: v });
  }

  protected toggleActive(): void {
    this.filters.patch('workspace', { activeOnly: !this.filters.workspace().activeOnly });
  }

  protected toggleHeavy(): void {
    this.filters.patch('workspace', { heavyOnly: !this.filters.workspace().heavyOnly });
  }

  protected toggleNotInProfile(): void {
    this.orphanOnly.update((v) => !v);
  }

  protected key(item: RowItem): string {
    return `${item.type}:${item.file}`;
  }

  protected onCardClick(item: RowItem, e: MouseEvent): void {
    if (e.shiftKey) {
      e.preventDefault();
      this.toggleSelect(item, e);
    }
  }

  protected toggleSelect(item: RowItem, e?: MouseEvent): void {
    const k = this.key(item);
    const next = new Set(this.selected());

    // Range select with shift if there's a previous click
    if (e?.shiftKey && this.lastClickedKey && this.lastClickedKey !== k) {
      const list = this.visibleItems();
      const startIdx = list.findIndex((i) => this.key(i) === this.lastClickedKey);
      const endIdx = list.findIndex((i) => this.key(i) === k);
      if (startIdx >= 0 && endIdx >= 0) {
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        for (let i = from; i <= to; i++) next.add(this.key(list[i]));
        this.selected.set(next);
        this.lastClickedKey = k;
        return;
      }
    }

    if (next.has(k)) next.delete(k);
    else next.add(k);
    this.selected.set(next);
    this.lastClickedKey = k;
  }

  protected isSelected(item: RowItem): boolean {
    return this.selected().has(this.key(item));
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
    this.lastClickedKey = '';
  }

  protected toggle(item: RowItem): void {
    this.bloc.toggle(item.type, item.file, item.active);
  }

  protected enableAllVisible(): void {
    const items = this.visibleItems()
      .filter((i) => !i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: false as const }));
    if (items.length) this.bloc.bulkToggle(items);
  }

  protected disableAllVisible(): void {
    const items = this.visibleItems()
      .filter((i) => i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: true as const }));
    if (items.length) this.bloc.bulkToggle(items);
  }

  protected bulkEnable(): void {
    const items = this.allItems()
      .filter((i) => this.selected().has(this.key(i)) && !i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: false as const }));
    if (items.length) this.bloc.bulkToggle(items);
    this.clearSelection();
  }

  protected bulkDisable(): void {
    const items = this.allItems()
      .filter((i) => this.selected().has(this.key(i)) && i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: true as const }));
    if (items.length) this.bloc.bulkToggle(items);
    this.clearSelection();
  }
}
