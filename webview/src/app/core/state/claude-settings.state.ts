import { Injectable, computed, signal } from '@angular/core';
import type { ClaudeSettings, MemoryFile } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class ClaudeSettingsState {
  private readonly _settings    = signal<ClaudeSettings>({});
  private readonly _memoryFiles = signal<MemoryFile[]>([]);

  readonly settings    = this._settings.asReadonly();
  readonly memoryFiles = this._memoryFiles.asReadonly();

  readonly envEntries = computed(() =>
    Object.entries(this._settings().env ?? {}).map(([key]) => key),
  );

  setAll(settings: ClaudeSettings, memoryFiles: MemoryFile[]): void {
    this._settings.set(settings);
    this._memoryFiles.set(memoryFiles);
  }
}
