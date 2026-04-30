import { Injectable, inject } from '@angular/core';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import { WorkspaceState } from '@state/workspace.state';
import type { ItemType } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class WorkspaceBloc {
  private readonly bridge = inject(VsCodeBridgeService);
  private readonly workspaceState = inject(WorkspaceState);

  toggle(type: ItemType, file: string, wasActive: boolean): void {
    this.workspaceState.optimisticToggle(type, file);
    this.bridge.send({ command: 'toggle', type, file, wasActive });
  }

  bulkToggle(items: Array<{ type: ItemType; file: string; wasActive: boolean }>): void {
    for (const item of items) this.workspaceState.optimisticToggle(item.type, item.file);
    this.bridge.send({ command: 'bulkToggle', items });
  }
}
