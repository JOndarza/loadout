import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VsCodeBridgeService } from '@core/vscode-bridge.service';
import type { ItemType, PendingItems, Profile } from '@core/messages';
import type { ApplyDiff } from '@shared/overlays/apply-confirm.component';
import type { ImportPreview } from '@shared/overlays/import-profile.component';

@Injectable({ providedIn: 'root' })
export class ProfilesBloc {
  private readonly bridge = inject(VsCodeBridgeService);

  private readonly _pendingApply = signal<{ name: string; diff: ApplyDiff } | null>(null);
  private readonly _importPreview = signal<ImportPreview | null>(null);

  readonly pendingApply = this._pendingApply.asReadonly();
  readonly importPreview = this._importPreview.asReadonly();

  constructor() {
    this.bridge.messages$.pipe(takeUntilDestroyed()).subscribe((msg) => {
      if (msg.command === 'applyProfilePreview') {
        this._pendingApply.set({
          name: msg.name,
          diff: { willActivate: msg.willActivate, willDeactivate: msg.willDeactivate },
        });
      } else if (msg.command === 'profileImportPreview') {
        this._importPreview.set({
          originalName: msg.originalName,
          profile: msg.profile,
          found: msg.found,
          missing: msg.missing,
        });
      }
    });
  }

  saveProfile(name: string): void {
    this.bridge.send({ command: 'saveProfile', name });
  }

  previewApply(name: string): void {
    this.bridge.send({ command: 'previewApplyProfile', name });
  }

  applyProfile(name: string, silent = false, skipRestorePoint = false): void {
    this.bridge.send({ command: 'applyProfile', name, silent, skipRestorePoint });
  }

  confirmApply(): void {
    const p = this._pendingApply();
    if (!p) return;
    this.applyProfile(p.name);
    this._pendingApply.set(null);
  }

  cancelApply(): void {
    this._pendingApply.set(null);
  }

  restore(): void {
    this.applyProfile('__restore_point__', true, true);
  }

  clearRestorePoint(): void {
    this.bridge.send({ command: 'clearRestorePoint' });
  }

  deleteProfile(name: string): void {
    this.bridge.send({ command: 'deleteProfile', name });
  }

  duplicateProfile(from: string, to: string): void {
    this.bridge.send({ command: 'duplicateProfile', from, to });
  }

  updateDescription(name: string, description: string): void {
    this.bridge.send({ command: 'updateProfileDescription', name, description });
  }

  exportProfile(name: string): void {
    this.bridge.send({ command: 'exportProfile', name });
  }

  importProfileRequest(): void {
    this.bridge.send({ command: 'importProfileRequest' });
  }

  importProfileConfirm(name: string, missing: PendingItems): void {
    const p = this._importPreview();
    if (!p) return;
    this.bridge.send({ command: 'importProfileConfirm', name, profile: p.profile, missing });
    this._importPreview.set(null);
  }

  cancelImport(): void {
    this._importPreview.set(null);
  }

  renameProfile(from: string, to: string): void {
    this.bridge.send({ command: 'renameProfile', from, to });
  }

  updateProfileItems(name: string, agents: string[], skills: string[], commands: string[]): void {
    this.bridge.send({ command: 'updateProfileItems', name, agents, skills, commands });
  }

  reorderProfiles(order: string[]): void {
    this.bridge.send({ command: 'reorderProfiles', order });
  }

  adoptPending(pending: PendingItems): void {
    const items: Array<{ itemType: ItemType; file: string }> = [
      ...pending.agents.map((f) => ({ itemType: 'agents' as ItemType, file: f })),
      ...pending.skills.map((f) => ({ itemType: 'skills' as ItemType, file: f })),
      ...pending.commands.map((f) => ({ itemType: 'commands' as ItemType, file: f })),
    ];
    if (items.length) this.bridge.send({ command: 'bulkAddFromGlobal', items });
  }
}
