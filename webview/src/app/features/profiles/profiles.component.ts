import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ProfilesState, type ProfileEntry } from '@state/profiles.state';
import { WorkspaceState } from '@state/workspace.state';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import type { PendingItems } from '@core/messages';
import { CmButtonComponent, CmCardComponent, CmEmptyComponent } from '@shared/primitives';
import { ApplyConfirmComponent, type ApplyDiff } from '@shared/overlays/apply-confirm.component';
import { ImportProfileComponent, type ImportPreview } from '@shared/overlays/import-profile.component';

@Component({
  selector: 'cm-profiles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent, CmCardComponent, CmEmptyComponent, ApplyConfirmComponent, ImportProfileComponent],
  templateUrl: './profiles.component.html',
})
export class ProfilesComponent {
  protected readonly state = inject(ProfilesState);
  protected readonly workspace = inject(WorkspaceState);
  private readonly bridge = inject(VsCodeBridgeService);

  protected readonly newName = signal('');
  protected readonly editingName = signal<string | null>(null);
  protected readonly editingItems = signal<{ agents: Set<string>; skills: Set<string>; commands: Set<string> } | null>(null);
  protected readonly renameTo = signal<string>('');
  protected readonly renamingFrom = signal<string | null>(null);

  // description editing
  protected readonly editingDescriptionFor = signal<string | null>(null);
  protected readonly descriptionDraft = signal('');

  // diff modal (Task 4)
  protected readonly pendingApply = signal<{ name: string; diff: ApplyDiff } | null>(null);

  // import modal (Task 6)
  protected readonly importPreview = signal<ImportPreview | null>(null);

  protected readonly entries = computed(() => this.state.entries());

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((msg) => {
      if (msg.command === 'applyProfilePreview') {
        this.pendingApply.set({
          name: msg.name,
          diff: { willActivate: msg.willActivate, willDeactivate: msg.willDeactivate },
        });
      }
      if (msg.command === 'profileImportPreview') {
        this.importPreview.set({
          originalName: msg.originalName,
          profile: msg.profile,
          found: msg.found,
          missing: msg.missing,
        });
      }
    });
  }

  protected isActive(name: string): boolean {
    return this.state.activeName() === name;
  }

  protected pendingCount(p: ProfileEntry): number {
    return (
      p.pendingItems.agents.length +
      p.pendingItems.skills.length +
      p.pendingItems.commands.length
    );
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

  protected requestApply(name: string): void {
    this.bridge.send({ command: 'previewApplyProfile', name });
  }

  protected confirmApply(): void {
    const p = this.pendingApply();
    if (!p) return;
    this.bridge.send({ command: 'applyProfile', name: p.name });
    this.pendingApply.set(null);
  }

  protected restore(): void {
    this.bridge.send({ command: 'applyProfile', name: '__restore_point__', silent: true });
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

  // ─── Description ────────────────────────────────────────────────────────────

  protected startEditDescription(name: string, current: string): void {
    this.editingDescriptionFor.set(name);
    this.descriptionDraft.set(current);
  }

  protected saveDescription(name: string): void {
    this.bridge.send({ command: 'updateProfileDescription', name, description: this.descriptionDraft() });
    this.editingDescriptionFor.set(null);
  }

  // ─── Export / Import ────────────────────────────────────────────────────────

  protected exportProfile(name: string): void {
    this.bridge.send({ command: 'exportProfile', name });
  }

  protected startImport(): void {
    this.bridge.send({ command: 'importProfileRequest' });
  }

  protected confirmImport(event: { name: string; missing: PendingItems }): void {
    const p = this.importPreview();
    if (!p) return;
    this.bridge.send({ command: 'importProfileConfirm', name: event.name, profile: p.profile, missing: event.missing });
    this.importPreview.set(null);
  }

  // ─── Rename ─────────────────────────────────────────────────────────────────

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

  // ─── Item editing ────────────────────────────────────────────────────────────

  protected startEdit(p: ProfileEntry): void {
    this.editingName.set(p.name);
    this.editingItems.set({
      agents:   new Set(p.agents),
      skills:   new Set(p.skills),
      commands: new Set(p.commands),
    });
  }

  protected toggleEditAgent(file: string): void {
    const items = this.editingItems();
    if (!items) return;
    const next = new Set(items.agents);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.editingItems.set({ agents: next, skills: items.skills, commands: items.commands });
  }

  protected toggleEditSkill(file: string): void {
    const items = this.editingItems();
    if (!items) return;
    const next = new Set(items.skills);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.editingItems.set({ agents: items.agents, skills: next, commands: items.commands });
  }

  protected toggleEditCommand(file: string): void {
    const items = this.editingItems();
    if (!items) return;
    const next = new Set(items.commands);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.editingItems.set({ agents: items.agents, skills: items.skills, commands: next });
  }

  protected isEditAgentOn(file: string): boolean {
    return this.editingItems()?.agents.has(file) ?? false;
  }

  protected isEditSkillOn(file: string): boolean {
    return this.editingItems()?.skills.has(file) ?? false;
  }

  protected isEditCommandOn(file: string): boolean {
    return this.editingItems()?.commands.has(file) ?? false;
  }

  protected commitEdit(): void {
    const name = this.editingName();
    const items = this.editingItems();
    if (!name || !items) return;
    this.bridge.send({
      command: 'updateProfileItems',
      name,
      agents:   Array.from(items.agents),
      skills:   Array.from(items.skills),
      commands: Array.from(items.commands),
    });
    this.cancelEdit();
  }

  protected cancelEdit(): void {
    this.editingName.set(null);
    this.editingItems.set(null);
  }

  // ─── Drag reorder ────────────────────────────────────────────────────────────
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
