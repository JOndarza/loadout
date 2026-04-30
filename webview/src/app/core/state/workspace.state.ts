import { Injectable, computed, signal } from '@angular/core';
import type { ItemType, WorkspaceItem } from '@core/messages';

@Injectable({ providedIn: 'root' })
export class WorkspaceState {
  private readonly _agents   = signal<WorkspaceItem[]>([]);
  private readonly _skills   = signal<WorkspaceItem[]>([]);
  private readonly _commands = signal<WorkspaceItem[]>([]);

  readonly agents   = this._agents.asReadonly();
  readonly skills   = this._skills.asReadonly();
  readonly commands = this._commands.asReadonly();

  readonly activeAgents   = computed(() => this._agents().filter((a) => a.active));
  readonly activeSkills   = computed(() => this._skills().filter((s) => s.active));
  readonly activeCommands = computed(() => this._commands().filter((c) => c.active));

  readonly totalActiveTokens = computed(
    () =>
      this.activeAgents().reduce((sum, i) => sum + i.tokens, 0) +
      this.activeSkills().reduce((sum, i) => sum + i.tokens, 0) +
      this.activeCommands().reduce((sum, i) => sum + i.tokens, 0),
  );

  readonly totalCount = computed(
    () => this._agents().length + this._skills().length + this._commands().length,
  );
  readonly activeCount = computed(
    () => this.activeAgents().length + this.activeSkills().length + this.activeCommands().length,
  );

  setAll(agents: WorkspaceItem[], skills: WorkspaceItem[], commands: WorkspaceItem[]): void {
    this._agents.set(agents);
    this._skills.set(skills);
    this._commands.set(commands);
  }

  optimisticToggle(type: ItemType, file: string): void {
    const flip = (items: WorkspaceItem[]) =>
      items.map((i) => (i.file === file ? { ...i, active: !i.active } : i));
    if (type === 'agents') this._agents.update(flip);
    else if (type === 'skills') this._skills.update(flip);
    else this._commands.update(flip);
  }
}
