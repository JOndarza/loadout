import { Injectable, inject } from '@angular/core';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import type { ItemType } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class WorkspaceBloc {
  private readonly bridge = inject(VsCodeBridgeService);

  toggle(type: ItemType, file: string, wasActive: boolean): void {
    this.bridge.send({ command: 'toggle', type, file, wasActive });
  }

  bulkToggle(items: Array<{ type: ItemType; file: string; wasActive: boolean }>): void {
    this.bridge.send({ command: 'bulkToggle', items });
  }

  enableAll(type: ItemType): void {
    this.bridge.send({ command: 'enableAll', type });
  }

  disableAll(type: ItemType): void {
    this.bridge.send({ command: 'disableAll', type });
  }
}
