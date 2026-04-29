import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataSyncService } from '@core/data-sync.service';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import { ProfilesState } from '@state/profiles.state';
import { CatalogState } from '@state/catalog.state';
import { WorkspaceState } from '@state/workspace.state';
import { SettingsState } from '@state/settings.state';
import { ShortcutsService } from '@core/shortcuts.service';
import { WorkspaceComponent } from '@features/workspace/workspace.component';
import { ProfilesComponent } from '@features/profiles/profiles.component';
import { CatalogComponent } from '@features/catalog/catalog.component';
import { SettingsComponent } from '@features/settings/settings.component';
import { CommandPaletteComponent } from '@shared/overlays/command-palette.component';

type TabId = 'workspace' | 'profiles' | 'catalog' | 'settings';

@Component({
  selector: 'cm-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkspaceComponent,
    ProfilesComponent,
    CatalogComponent,
    SettingsComponent,
    CommandPaletteComponent,
  ],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected readonly sync = inject(DataSyncService);
  private readonly bridge = inject(VsCodeBridgeService);
  protected readonly workspace = inject(WorkspaceState);
  protected readonly profiles = inject(ProfilesState);
  protected readonly catalog = inject(CatalogState);
  protected readonly settings = inject(SettingsState);
  protected readonly shortcuts = inject(ShortcutsService);

  protected readonly activeTab = signal<TabId>('workspace');
  protected readonly searchQuery = signal('');
  protected readonly searchFocused = signal(false);
  protected readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private static readonly COST_PER_TOKEN_USD = 3e-6; // Claude Sonnet input price

  protected readonly costEstimate = computed(() => {
    const cost = this.workspace.totalActiveTokens() * ShellComponent.COST_PER_TOKEN_USD;
    return cost.toFixed(4);
  });

  protected readonly density = computed(() => this.settings.settings().density);

  private appliedDefaultTab = false;

  constructor() {
    // Wire keyboard shortcuts to UI actions
    this.shortcuts.events$.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e.type === 'tab') {
        const tabs: TabId[] = ['workspace', 'profiles', 'catalog'];
        this.activeTab.set(tabs[e.index]);
      } else if (e.type === 'search') {
        this.searchInput()?.nativeElement.focus();
      } else if (e.type === 'saveProfile') {
        // TODO: replace with inline prompt UI
        const name = window.prompt('Save as profile:')?.trim();
        if (name) this.bridge.send({ command: 'saveProfile', name });
      }
    });

    // Sync default tab from settings on first ready (runs exactly once)
    effect(() => {
      if (this.sync.ready() && !this.appliedDefaultTab) {
        this.appliedDefaultTab = true;
        const defaultTab = untracked(() => this.settings.settings().defaultTab);
        if (defaultTab !== 'last') {
          this.activeTab.set(defaultTab as TabId);
        }
      }
    });
  }

  protected setTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  protected openPalette(): void {
    this.shortcuts.setPaletteOpen(true);
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected formatTokens(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  }
}
