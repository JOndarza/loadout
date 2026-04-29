import { Injectable, computed, signal } from '@angular/core';
import type { ClaudePermissions, ClaudeSettings, McpServer, MemoryFile } from '@core/messages';

const EMPTY_PERMISSIONS: ClaudePermissions = { allow: [], deny: [], ask: [], additionalDirectories: [] };

@Injectable({ providedIn: 'root' })
export class ClaudeSettingsState {
  private readonly _settings    = signal<ClaudeSettings>({});
  private readonly _memoryFiles = signal<MemoryFile[]>([]);
  private readonly _mcpServers  = signal<McpServer[]>([]);

  readonly settings    = this._settings.asReadonly();
  readonly memoryFiles = this._memoryFiles.asReadonly();
  readonly mcpServers  = this._mcpServers.asReadonly();

  readonly envEntries          = computed(() => Object.entries(this._settings().env ?? {}).map(([key]) => key));
  readonly permissions         = computed(() => this._settings().permissions ?? EMPTY_PERMISSIONS);
  readonly hooks               = computed(() => this._settings().hooks ?? []);
  readonly sandboxEnabled      = computed(() => this._settings().sandboxEnabled ?? false);
  readonly additionalDirs      = computed(() => this._settings().permissions?.additionalDirectories ?? []);

  setAll(settings: ClaudeSettings, memoryFiles: MemoryFile[], mcpServers: McpServer[] = []): void {
    this._settings.set(settings);
    this._memoryFiles.set(memoryFiles);
    this._mcpServers.set(mcpServers);
  }
}
