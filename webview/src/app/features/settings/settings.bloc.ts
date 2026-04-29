import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import { SettingsState } from '@state/settings.state';
import { ToastService } from '@core/toast.service';
import type { Settings } from '@core/messages';

const SETTING_LABELS: Partial<Record<keyof Settings, Record<string, string>>> = {
  density:    { compact: 'Compact', comfortable: 'Comfortable' },
  theme:      { dark: 'Dark theme', light: 'Light theme', auto: 'Auto theme' },
  defaultTab: { workspace: 'Default: Workspace', profiles: 'Default: Profiles', catalog: 'Default: Catalog', last: 'Default: Last opened' },
};

@Injectable({ providedIn: 'root' })
export class SettingsBloc {
  private readonly bridge = inject(VsCodeBridgeService);
  private readonly settingsState = inject(SettingsState);
  private readonly toast = inject(ToastService);

  private readonly _registryTestResult = signal<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  private readonly _registryTestMessage = signal('');

  readonly registryTestResult = this._registryTestResult.asReadonly();
  readonly registryTestMessage = this._registryTestMessage.asReadonly();

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((m) => {
      if (m.command === 'testRegistryResult') {
        this._registryTestResult.set(m.ok ? 'ok' : 'fail');
        this._registryTestMessage.set(m.ok ? `HTTP ${m.status}` : (m.error ?? 'Failed'));
      }
    });
  }

  updateSettings<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const partial: Partial<Settings> = { [key]: value };
    this.settingsState.setAll(partial);
    this.bridge.send({ command: 'updateSettings', settings: partial });
    const label =
      key === 'registryUrl'
        ? 'Registry URL saved'
        : (SETTING_LABELS[key]?.[value as string] ?? 'Saved');
    this.toast.show(label);
  }

  updateClaudeSetting(key: string, value: string | boolean | null): void {
    this.bridge.send({ command: 'updateClaudeSetting', key, value });
    this.toast.show('Saved');
  }

  openMemoryFile(path: string): void {
    this.bridge.send({ command: 'openMemoryFile', path });
  }

  addEnvVar(key: string, value: string): void {
    this.bridge.send({ command: 'addEnvVar', key, value });
  }

  removeEnvVar(key: string): void {
    this.bridge.send({ command: 'removeEnvVar', key });
  }

  revealCatalog(): void {
    this.bridge.send({ command: 'revealCatalog' });
  }

  openExternal(url: string): void {
    this.bridge.send({ command: 'openExternal', url });
  }

  testRegistry(url: string): void {
    this._registryTestResult.set('testing');
    this._registryTestMessage.set('');
    this.bridge.send({ command: 'testRegistry', url });
  }
}
