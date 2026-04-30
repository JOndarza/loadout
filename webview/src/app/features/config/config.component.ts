import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClaudeSettingsState } from '@state/claude-settings.state';
import { ConfigBloc } from './config.bloc';
import { CmButtonComponent, CmToggleComponent } from '@shared/primitives';
import type { HookEntry, McpServer } from '@core/messages';

@Component({
  selector: 'cm-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent, CmToggleComponent],
  templateUrl: './config.component.html',
})
export class ConfigComponent {
  protected readonly state = inject(ClaudeSettingsState);
  private readonly bloc   = inject(ConfigBloc);

  protected readonly newAllowRule = signal('');
  protected readonly newDenyRule  = signal('');
  protected readonly newAskRule   = signal('');

  protected addAllow(): void { this._addRule('allow', this.newAllowRule); }
  protected addDeny():  void { this._addRule('deny',  this.newDenyRule);  }
  protected addAsk():   void { this._addRule('ask',   this.newAskRule);   }

  private _addRule(type: 'allow' | 'deny' | 'ask', draft: ReturnType<typeof signal<string>>): void {
    const v = draft().trim();
    if (!v) return;
    this.bloc.addPermissionRule(type, v);
    draft.set('');
  }

  protected removeAllow(v: string): void { this.bloc.removePermissionRule('allow', v); }
  protected removeDeny(v: string):  void { this.bloc.removePermissionRule('deny',  v); }
  protected removeAsk(v: string):   void { this.bloc.removePermissionRule('ask',   v); }

  protected pickDir(): void {
    this.bloc.pickAndAddDirectory();
  }

  protected removeDir(path: string): void {
    this.bloc.removeDirectory(path);
  }

  protected toggleHook(hook: HookEntry): void {
    this.bloc.toggleHook(hook);
  }

  protected hookKey(hook: HookEntry): string {
    return `${hook.event}:${hook.groupIndex}:${hook.hookIndex}`;
  }

  protected hookLabel(hook: HookEntry): string {
    return hook.command ?? hook.url ?? hook.type;
  }

  protected toggleSandbox(): void {
    this.bloc.setSandboxEnabled(!this.state.sandboxEnabled());
  }

  protected toggleMcp(server: McpServer): void {
    this.bloc.toggleMcpServer(server.name);
  }

  protected mcpDetail(server: McpServer): string {
    if (server.url)     return server.url;
    if (server.command) return server.command;
    return server.type ?? '—';
  }
}
