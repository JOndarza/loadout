import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import type { ItemType, RegistryItem } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class CatalogBloc {
  private readonly bridge = inject(VsCodeBridgeService);

  private readonly _registryItems = signal<RegistryItem[]>([]);
  private readonly _registryLoading = signal(false);
  private readonly _registryError = signal<string | null>(null);
  private readonly _updateRunning = signal(false);
  private readonly _updateResult = signal<{ updated: string[]; skipped: string[]; failed: string[] } | null>(null);

  readonly registryItems = this._registryItems.asReadonly();
  readonly registryLoading = this._registryLoading.asReadonly();
  readonly registryError = this._registryError.asReadonly();
  readonly updateRunning = this._updateRunning.asReadonly();
  readonly updateResult = this._updateResult.asReadonly();

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((m) => {
      if (m.command === 'registryStatus') {
        this._registryLoading.set(false);
        this._registryError.set(m.error ?? null);
        this._registryItems.set(m.items ?? []);
      } else if (m.command === 'updateStarted') {
        this._updateRunning.set(true);
      } else if (m.command === 'updateDone') {
        this._updateRunning.set(false);
        this._updateResult.set(m.result);
      }
    });
  }

  addFromGlobal(itemType: ItemType, file: string): void {
    this.bridge.send({ command: 'addFromGlobal', itemType, file });
  }

  bulkAddFromGlobal(items: Array<{ itemType: ItemType; file: string }>): void {
    this.bridge.send({ command: 'bulkAddFromGlobal', items });
  }

  pushToGlobal(itemType: ItemType, file: string): void {
    this.bridge.send({ command: 'pushToGlobal', itemType, file });
  }

  checkRegistry(): void {
    this._registryLoading.set(true);
    this._registryError.set(null);
    this._registryItems.set([]);
    this.bridge.send({ command: 'checkRegistry' });
  }

  runUpdate(): void {
    this._updateResult.set(null);
    this.bridge.send({ command: 'runUpdate' });
  }

  revealCatalog(): void {
    this.bridge.send({ command: 'revealCatalog' });
  }
}
