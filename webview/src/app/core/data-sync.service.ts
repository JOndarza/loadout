import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogState } from './state/catalog.state';
import { ProfilesState } from './state/profiles.state';
import { SettingsState } from './state/settings.state';
import { WorkspaceState } from './state/workspace.state';
import type { InitialData } from './messages';
import { VsCodeBridgeService } from './vscode-bridge.service';

@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly bridge = inject(VsCodeBridgeService);
  private readonly workspace = inject(WorkspaceState);
  private readonly profiles = inject(ProfilesState);
  private readonly catalog = inject(CatalogState);
  private readonly settings = inject(SettingsState);

  private readonly _root = signal<string>('');
  private readonly _version = signal<string>('');
  private readonly _ready = signal(false);

  readonly root = this._root.asReadonly();
  readonly version = this._version.asReadonly();
  readonly ready = this._ready.asReadonly();

  private readonly destroyRef = inject(DestroyRef);

  refresh(): void {
    this.bridge.send({ command: 'refresh' });
  }

  init(): void {
    this.bridge.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
      if (msg.command === 'initialData' || msg.command === 'dataUpdate') {
        this.applyData(msg.data);
        this._ready.set(true);
      }
    });
    this.bridge.ready();
  }

  private applyData(data: InitialData): void {
    this._root.set(data.root);
    this._version.set(data.extensionVersion);
    this.workspace.setAll(data.agents, data.skills, data.commands ?? []);
    this.profiles.setAll(data.profiles);
    this.catalog.setAll(data.catalogAgents, data.catalogSkills, data.catalogCommands ?? [], data.globalRoot);
    this.settings.setAll(data.settings);

    // Resolve active profile using Set comparison (handles filenames with commas, stable order)
    const activeAgents   = new Set(data.agents.filter((a) => a.active).map((a) => a.file));
    const activeSkills   = new Set(data.skills.filter((s) => s.active).map((s) => s.file));
    const activeCommands = new Set((data.commands ?? []).filter((c) => c.active).map((c) => c.file));
    const sorted = Object.entries(data.profiles).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    const found = sorted.find(
      ([, p]) =>
        this.setsEqual(activeAgents,   new Set(p.agents   ?? [])) &&
        this.setsEqual(activeSkills,   new Set(p.skills   ?? [])) &&
        this.setsEqual(activeCommands, new Set(p.commands ?? [])),
    );
    const lastAppliedFallback = data.lastApplied && data.profiles[data.lastApplied]
      ? data.lastApplied
      : null;
    this.profiles.setActiveName(found?.[0] ?? lastAppliedFallback);
  }

  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  }
}
