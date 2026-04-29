import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfilesState, type ProfileEntry } from '../../core/state/profiles.state';
import { WorkspaceState } from '../../core/state/workspace.state';
import { VsCodeBridgeService } from '../../core/vscode-bridge.service';
import {
  CmButtonComponent,
  CmCardComponent,
  CmEmptyComponent,
} from '../../shared/primitives';

@Component({
  selector: 'cm-profiles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent, CmCardComponent, CmEmptyComponent],
  templateUrl: './profiles.component.html',
})
export class ProfilesComponent {
  protected readonly state = inject(ProfilesState);
  protected readonly workspace = inject(WorkspaceState);
  private readonly bridge = inject(VsCodeBridgeService);

  protected readonly newName = signal('');
  protected readonly editingName = signal<string | null>(null);
  protected readonly editingItems = signal<{ agents: Set<string>; skills: Set<string> } | null>(null);
  protected readonly renameTo = signal<string>('');
  protected readonly renamingFrom = signal<string | null>(null);

  protected readonly entries = computed(() => this.state.entries());

  protected isActive(name: string): boolean {
    return this.state.activeName() === name;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const now = Date.now();
      const diffH = (now - d.getTime()) / 3600_000;
      if (diffH < 24) return 'today';
      if (diffH < 48) return 'yesterday';
      if (diffH < 24 * 7) return `${Math.floor(diffH / 24)}d ago`;
      return d.toLocaleDateString();
    } catch {
      return '—';
    }
  }

  protected save(): void {
    const name = this.newName().trim();
    if (!name) return;
    this.bridge.send({ command: 'saveProfile', name });
    this.newName.set('');
  }

  protected apply(name: string): void {
    this.bridge.send({ command: 'applyProfile', name, silent: true });
  }

  protected remove(name: string): void {
    this.bridge.send({ command: 'deleteProfile', name });
  }

  protected duplicate(from: string): void {
    const existing = new Set(this.entries().map((p) => p.name));
    let to = `${from} (copy)`;
    let n = 2;
    while (existing.has(to)) to = `${from} (copy ${n++})`;
    this.bridge.send({ command: 'duplicateProfile', from, to });
  }

  protected startRename(name: string): void {
    this.renamingFrom.set(name);
    this.renameTo.set(name);
  }

  protected commitRename(): void {
    const from = this.renamingFrom();
    const to = this.renameTo().trim();
    if (from && to && from !== to) {
      this.bridge.send({ command: 'renameProfile', from, to });
    }
    this.renamingFrom.set(null);
    this.renameTo.set('');
  }

  protected cancelRename(): void {
    this.renamingFrom.set(null);
    this.renameTo.set('');
  }

  protected startEdit(p: ProfileEntry): void {
    this.editingName.set(p.name);
    this.editingItems.set({
      agents: new Set(p.agents),
      skills: new Set(p.skills),
    });
  }

  protected toggleEditAgent(file: string): void {
    const items = this.editingItems();
    if (!items) return;
    const next = new Set(items.agents);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.editingItems.set({ agents: next, skills: items.skills });
  }

  protected toggleEditSkill(file: string): void {
    const items = this.editingItems();
    if (!items) return;
    const next = new Set(items.skills);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.editingItems.set({ agents: items.agents, skills: next });
  }

  protected isEditAgentOn(file: string): boolean {
    return this.editingItems()?.agents.has(file) ?? false;
  }

  protected isEditSkillOn(file: string): boolean {
    return this.editingItems()?.skills.has(file) ?? false;
  }

  protected commitEdit(): void {
    const name = this.editingName();
    const items = this.editingItems();
    if (!name || !items) return;
    this.bridge.send({
      command: 'updateProfileItems',
      name,
      agents: Array.from(items.agents),
      skills: Array.from(items.skills),
    });
    this.cancelEdit();
  }

  protected cancelEdit(): void {
    this.editingName.set(null);
    this.editingItems.set(null);
  }

  // ─── Drag reorder ──────────────────────────────────────────────────────────
  private dragFrom = -1;

  protected onDragStart(idx: number): void {
    this.dragFrom = idx;
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  protected onDrop(idx: number): void {
    if (this.dragFrom < 0 || this.dragFrom === idx) return;
    const list = this.entries().slice();
    const [moved] = list.splice(this.dragFrom, 1);
    list.splice(idx, 0, moved);
    this.bridge.send({ command: 'reorderProfiles', order: list.map((p) => p.name) });
    this.dragFrom = -1;
  }
}
