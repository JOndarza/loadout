import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SettingsState } from '../../core/state/settings.state';
import { CatalogState } from '../../core/state/catalog.state';
import { VsCodeBridgeService } from '../../core/vscode-bridge.service';
import { DataSyncService } from '../../core/data-sync.service';
import { ToastService } from '../../core/toast.service';
import { ShortcutsService } from '../../core/shortcuts.service';
import { CmButtonComponent } from '../../shared/primitives';
import type { Settings } from '../../core/messages';

@Component({
  selector: 'cm-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly settings = inject(SettingsState);
  protected readonly catalog = inject(CatalogState);
  protected readonly sync = inject(DataSyncService);
  private readonly bridge = inject(VsCodeBridgeService);
  private readonly toast = inject(ToastService);
  private readonly sc = inject(ShortcutsService);

  protected readonly registryUrlDraft = signal('');
  protected readonly registryTestResult = signal<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  protected readonly registryTestMessage = signal('');

  protected readonly registryUrl = computed(() => this.settings.settings().registryUrl);

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((m) => {
      if (m.command === 'testRegistryResult') {
        this.registryTestResult.set(m.ok ? 'ok' : 'fail');
        this.registryTestMessage.set(m.ok ? `HTTP ${m.status}` : (m.error ?? 'Failed'));
      }
    });
  }

  private readonly settingLabels: Partial<Record<keyof Settings, Record<string, string>>> = {
    density: { compact: 'Compact', comfortable: 'Comfortable' },
    theme:   { dark: 'Dark theme', light: 'Light theme', auto: 'Auto theme' },
    defaultTab: { workspace: 'Default: Workspace', profiles: 'Default: Profiles', catalog: 'Default: Catalog', last: 'Default: Last opened' },
  };

  protected update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const partial: Partial<Settings> = { [key]: value };
    this.settings.setAll(partial);
    this.bridge.send({ command: 'updateSettings', settings: partial });
    const label = key === 'registryUrl'
      ? 'Registry URL saved'
      : (this.settingLabels[key]?.[value as string] ?? 'Saved');
    this.toast.show(label);
  }

  protected revealCatalog(): void {
    this.bridge.send({ command: 'revealCatalog' });
  }

  protected onRegistryUrlInput(v: string): void {
    this.registryUrlDraft.set(v);
    this.registryTestResult.set('idle');
  }

  protected commitRegistryUrl(): void {
    const url = this.registryUrlDraft().trim();
    if (url && url !== this.registryUrl()) {
      this.update('registryUrl', url);
    }
  }

  protected openLink(url: string): void {
    this.bridge.send({ command: 'openExternal', url });
  }

  protected testRegistry(): void {
    const url = (this.registryUrlDraft() || this.registryUrl()).trim();
    if (!url) return;
    this.registryTestResult.set('testing');
    this.registryTestMessage.set('');
    this.bridge.send({ command: 'testRegistry', url });
  }

  protected readonly shortcuts = [
    { keys: ['1', '2', '3'], action: 'Switch tabs (Workspace · Profiles · Catalog)' },
    { keys: ['/'], action: 'Focus search' },
    { keys: [this.sc.modKey, 'K'], action: 'Open command palette' },
    { keys: ['a'], action: 'Toggle "Active only" filter in Workspace' },
    { keys: ['s'], action: 'Save current state as new loadout' },
    { keys: ['Esc'], action: 'Close palette / cancel inline edits' },
  ];
}
