import { Injectable, signal } from '@angular/core';
import type { Settings } from '../messages';

const DEFAULT: Settings = {
  density: 'comfortable',
  theme: 'auto',
  defaultTab: 'workspace',
  registryUrl: 'https://www.aitmpl.com/components.json',
};

@Injectable({ providedIn: 'root' })
export class SettingsState {
  private readonly _settings = signal<Settings>(DEFAULT);

  readonly settings = this._settings.asReadonly();

  setAll(partial: Partial<Settings>): void {
    this._settings.update((current) => ({ ...current, ...partial }));
  }
}
