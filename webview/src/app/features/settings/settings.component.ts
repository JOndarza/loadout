import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsState } from '@state/settings.state';
import { CatalogState } from '@state/catalog.state';
import { ClaudeSettingsState } from '@state/claude-settings.state';
import { SettingsBloc } from './settings.bloc';
import { DataSyncService } from '@core/data-sync.service';
import { ShortcutsService } from '@core/shortcuts.service';
import { CmButtonComponent, CmToggleComponent } from '@shared/primitives';
import type { Settings } from '@core/messages';

@Component({
  selector: 'cm-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent, CmToggleComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly settings       = inject(SettingsState);
  protected readonly catalog        = inject(CatalogState);
  protected readonly claudeSettings = inject(ClaudeSettingsState);
  protected readonly sync           = inject(DataSyncService);
  private readonly bloc             = inject(SettingsBloc);
  private readonly sc               = inject(ShortcutsService);

  protected readonly registryUrlDraft = signal('');
  protected readonly newEnvKey   = signal('');
  protected readonly newEnvValue = signal('');
  protected readonly registryTestResult = this.bloc.registryTestResult;
  protected readonly registryTestMessage = this.bloc.registryTestMessage;

  protected readonly registryUrl = computed(() => this.settings.settings().registryUrl);

  protected update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.bloc.updateSettings(key, value);
  }

  protected revealCatalog(): void {
    this.bloc.revealCatalog();
  }

  protected onRegistryUrlInput(v: string): void {
    this.registryUrlDraft.set(v);
  }

  protected commitRegistryUrl(): void {
    const url = this.registryUrlDraft().trim();
    if (url && url !== this.registryUrl()) {
      this.bloc.updateSettings('registryUrl', url);
    }
  }

  protected updateClaudeSetting(key: string, value: string | boolean | null): void {
    this.bloc.updateClaudeSetting(key, value);
  }

  protected openMemoryFile(path: string): void {
    this.bloc.openMemoryFile(path);
  }

  protected addEnvVar(): void {
    const key = this.newEnvKey().trim();
    const val = this.newEnvValue().trim();
    if (!key) return;
    this.bloc.addEnvVar(key, val);
    this.newEnvKey.set('');
    this.newEnvValue.set('');
  }

  protected removeEnvVar(key: string): void {
    this.bloc.removeEnvVar(key);
  }

  protected openLink(url: string): void {
    this.bloc.openExternal(url);
  }

  protected testRegistry(): void {
    const url = (this.registryUrlDraft() || this.registryUrl()).trim();
    if (!url) return;
    this.bloc.testRegistry(url);
  }

  protected readonly openFolderLabel = this.sc.isMac
    ? 'Open in Finder'
    : /win/i.test(navigator.userAgent)
      ? 'Open in Explorer'
      : 'Open folder';

  protected readonly shortcuts = [
    { keys: ['1', '2', '3'], action: 'Switch tabs (Workspace · Profiles · Catalog)' },
    { keys: ['/'], action: 'Focus search' },
    { keys: [this.sc.modKey, 'K'], action: 'Open command palette' },
    { keys: ['a'], action: 'Toggle "Active only" filter in Workspace' },
    { keys: ['p'], action: 'Toggle "Not in profile" filter in Workspace' },
    { keys: ['s'], action: 'Save current state as new loadout' },
    { keys: ['Esc'], action: 'Close palette / cancel inline edits' },
  ];
}
