import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ProfilesState } from '@state/profiles.state';
import { WorkspaceState } from '@state/workspace.state';
import { CatalogState } from '@state/catalog.state';
import { ShortcutsService } from '@core/shortcuts.service';
import { DataSyncService } from '@core/data-sync.service';
import { WorkspaceBloc } from '@features/workspace/workspace.bloc';
import { ProfilesBloc } from '@features/profiles/profiles.bloc';
import { CatalogBloc } from '@features/catalog/catalog.bloc';

interface PaletteCommand {
  key: string;
  label: string;
  hint: string;
  category: 'toggle' | 'profile' | 'catalog' | 'system';
  run: () => void;
}

@Component({
  selector: 'cm-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent {
  protected readonly shortcuts = inject(ShortcutsService);
  private readonly workspace = inject(WorkspaceState);
  private readonly profiles = inject(ProfilesState);
  private readonly catalog = inject(CatalogState);
  private readonly workspaceBloc = inject(WorkspaceBloc);
  private readonly profilesBloc = inject(ProfilesBloc);
  private readonly catalogBloc = inject(CatalogBloc);
  private readonly sync = inject(DataSyncService);

  protected readonly open = this.shortcuts.paletteOpen;
  protected readonly query = signal('');
  protected readonly highlightedIdx = signal(0);
  protected readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly allCommands = computed<PaletteCommand[]>(() => {
    if (!this.open()) return [];
    const cmds: PaletteCommand[] = [];

    // Toggle agents/skills
    for (const a of this.workspace.agents()) {
      cmds.push({
        key: `toggle-agent-${a.file}`,
        label: `${a.active ? 'Disable' : 'Enable'} ${a.name}`,
        hint: `agent · ${a.tokens} tok`,
        category: 'toggle',
        run: () => this.workspaceBloc.toggle('agents', a.file, a.active),
      });
    }
    for (const s of this.workspace.skills()) {
      cmds.push({
        key: `toggle-skill-${s.file}`,
        label: `${s.active ? 'Disable' : 'Enable'} ${s.name}`,
        hint: `skill · ${s.tokens} tok`,
        category: 'toggle',
        run: () => this.workspaceBloc.toggle('skills', s.file, s.active),
      });
    }
    for (const c of this.workspace.commands()) {
      cmds.push({
        key: `toggle-command-${c.file}`,
        label: `${c.active ? 'Disable' : 'Enable'} ${c.name}`,
        hint: `command · ${c.tokens} tok`,
        category: 'toggle',
        run: () => this.workspaceBloc.toggle('commands', c.file, c.active),
      });
    }

    // Apply profiles
    for (const p of this.profiles.entries()) {
      cmds.push({
        key: `apply-${p.name}`,
        label: `Apply loadout: ${p.name}`,
        hint: `${p.agents.length}a · ${p.skills.length}s · ${p.commands.length}c`,
        category: 'profile',
        run: () => this.profilesBloc.applyProfile(p.name, true),
      });
    }

    // Adopt from catalog
    for (const c of this.catalog.all().filter((i) => !i.inProject)) {
      cmds.push({
        key: `adopt-${c.type}-${c.file}`,
        label: `Adopt ${c.name}`,
        hint: `${{ agents: 'agent', skills: 'skill', commands: 'command' }[c.type]} · catalog`,
        category: 'catalog',
        run: () => this.catalogBloc.addFromGlobal(c.type, c.file),
      });
    }

    // System
    cmds.push({
      key: 'sys-refresh',
      label: 'Refresh',
      hint: 'reload data from disk',
      category: 'system',
      run: () => this.sync.refresh(),
    });

    return cmds;
  });

  protected readonly filtered = computed<PaletteCommand[]>(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.allCommands();
    if (!q) return list.slice(0, 50);
    const tokens = q.split(/\s+/).filter(Boolean);
    return list
      .filter((c) => {
        const haystack = `${c.label} ${c.hint} ${c.category}`.toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      })
      .slice(0, 50);
  });

  constructor() {
    this.shortcuts.events$.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e.type === 'palette') {
        this.shortcuts.setPaletteOpen(!this.open());
      } else if (e.type === 'escape') {
        if (this.open()) this.close();
      }
    });

    effect(() => {
      if (this.open()) {
        this.query.set('');
        this.highlightedIdx.set(0);
        // Focus on next tick
        queueMicrotask(() => this.inputEl()?.nativeElement.focus());
      }
    });
  }

  protected close(): void {
    this.shortcuts.setPaletteOpen(false);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.highlightedIdx.set(0);
  }

  protected onKeyDown(e: KeyboardEvent): void {
    const filtered = this.filtered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIdx.update((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIdx.update((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[this.highlightedIdx()];
      if (cmd) {
        cmd.run();
        this.close();
      }
    }
  }

  protected select(idx: number): void {
    const cmd = this.filtered()[idx];
    if (cmd) {
      cmd.run();
      this.close();
    }
  }

  protected categoryIcon(cat: PaletteCommand['category']): string {
    switch (cat) {
      case 'toggle': return '◎';
      case 'profile': return '◇';
      case 'catalog': return '↓';
      case 'system': return '⌘';
    }
  }
}
