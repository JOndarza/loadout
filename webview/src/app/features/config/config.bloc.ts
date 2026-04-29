import { Injectable, inject } from '@angular/core';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import type { HookEntry } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class ConfigBloc {
  private readonly bridge = inject(VsCodeBridgeService);

  addPermissionRule(ruleType: 'allow' | 'deny' | 'ask', value: string): void {
    this.bridge.send({ command: 'addPermissionRule', ruleType, value });
  }

  removePermissionRule(ruleType: 'allow' | 'deny' | 'ask', value: string): void {
    this.bridge.send({ command: 'removePermissionRule', ruleType, value });
  }

  pickAndAddDirectory(): void {
    this.bridge.send({ command: 'pickAndAddDirectory' });
  }

  removeDirectory(path: string): void {
    this.bridge.send({ command: 'removeDirectory', path });
  }

  toggleHook(hook: HookEntry): void {
    this.bridge.send({ command: 'toggleHook', event: hook.event, groupIndex: hook.groupIndex, hookIndex: hook.hookIndex });
  }

  setSandboxEnabled(enabled: boolean): void {
    this.bridge.send({ command: 'setSandboxEnabled', enabled });
  }

  toggleMcpServer(name: string): void {
    this.bridge.send({ command: 'toggleMcpServer', name });
  }
}
