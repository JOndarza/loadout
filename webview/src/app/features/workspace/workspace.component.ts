import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { VsCodeBridgeService } from '../../core/vscode-bridge.service';
import { WorkspaceState } from '../../core/state/workspace.state';
import {
  CmButtonComponent,
  CmCardComponent,
  CmEmptyComponent,
  CmSegmentedComponent,
  CmTokenBarComponent,
  CmToggleComponent,
  CopyToClipboardDirective,
  type SegmentedOption,
} from '../../shared/primitives';
import type { WorkspaceItem } from '../../core/messages';

type ItemKind = 'all' | 'agents' | 'skills';
interface RowItem extends WorkspaceItem {
  type: 'agents' | 'skills';
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
  ],
  templateUrl: './workspace.component.html',
})
export class WorkspaceComponent {
  private readonly bridge = inject(VsCodeBridgeService);
  protected readonly state = inject(WorkspaceState);

  readonly searchQuery = input<string>('');

  protected readonly kind = signal<ItemKind>('all');
  protected readonly activeOnly = signal(false);
  protected readonly heavyOnly = signal(false);
  protected readonly selected = signal<Set<string>>(new Set());
  private lastClickedKey = '';

  protected readonly kindOptions = computed<SegmentedOption<ItemKind>[]>(() => [
    { value: 'all', label: 'All', count: this.state.totalCount() },
    { value: 'agents', label: 'Agents', count: this.state.agents().length },
    { value: 'skills', label: 'Skills', count: this.state.skills().length },
  ]);

  protected readonly allItems = computed<RowItem[]>(() => {
    const a = this.state.agents().map((i) => ({ ...i, type: 'agents' as const }));
    const s = this.state.skills().map((i) => ({ ...i, type: 'skills' as const }));
    return [...a, ...s].sort((x, y) => x.name.localeCompare(y.name));
  });

  protected readonly visibleItems = computed<RowItem[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const k = this.kind();
    const activeOnly = this.activeOnly();
    const heavyOnly = this.heavyOnly();

    return this.allItems().filter((it) => {
      if (k !== 'all' && it.type !== k) return false;
      if (activeOnly && !it.active) return false;
      if (heavyOnly && it.tokens <= 1000) return false;
      if (q) {
        const haystack = `${it.name} ${it.description} ${it.file}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  });

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
    this.bridge.send({
      command: 'toggle',
      type: item.type,
      file: item.file,
      wasActive: item.active,
    });
  }

  protected enableAllVisible(): void {
    const items = this.visibleItems()
      .filter((i) => !i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: false as const }));
    if (items.length) this.bridge.send({ command: 'bulkToggle', items });
  }

  protected disableAllVisible(): void {
    const items = this.visibleItems()
      .filter((i) => i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: true as const }));
    if (items.length) this.bridge.send({ command: 'bulkToggle', items });
  }

  protected bulkEnable(): void {
    const items = this.allItems()
      .filter((i) => this.selected().has(this.key(i)) && !i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: false as const }));
    if (items.length) this.bridge.send({ command: 'bulkToggle', items });
    this.clearSelection();
  }

  protected bulkDisable(): void {
    const items = this.allItems()
      .filter((i) => this.selected().has(this.key(i)) && i.active)
      .map((i) => ({ type: i.type, file: i.file, wasActive: true as const }));
    if (items.length) this.bridge.send({ command: 'bulkToggle', items });
    this.clearSelection();
  }
}
