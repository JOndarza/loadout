import { ChangeDetectionStrategy, Component, computed, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmButtonComponent } from '@shared/primitives';
import type { PendingItems } from '@core/messages';

export interface ImportPreview {
  originalName: string;
  profile: { agents: string[]; skills: string[]; commands: string[]; description: string };
  found: PendingItems;
  missing: PendingItems;
}

@Component({
  selector: 'cm-import-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CmButtonComponent],
  template: `
    <div class="cm-overlay-backdrop" (click)="cancel.emit()" role="presentation">
      <div
        class="cm-overlay-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Import profile"
        (click)="$event.stopPropagation()"
      >
        <h2 class="cm-overlay-title">Import profile</h2>

        <label class="cm-overlay-label" for="import-name">Profile name</label>
        <input
          id="import-name"
          type="text"
          class="cm-profiles-input"
          [ngModel]="importName()"
          (ngModelChange)="importName.set($event)"
          [ngModelOptions]="{ standalone: true }"
          aria-label="Profile name"
        />

        <section class="cm-diff-section">
          <p class="cm-diff-label cm-diff-label--on">Ready ({{ totalFound() }})</p>
          <div class="cm-diff-chips">
            @for (f of preview().found.agents; track f) {
              <span class="cm-diff-chip cm-diff-chip--on">{{ f }}</span>
            }
            @for (f of preview().found.skills; track f) {
              <span class="cm-diff-chip cm-diff-chip--on">{{ f }}</span>
            }
            @for (f of preview().found.commands; track f) {
              <span class="cm-diff-chip cm-diff-chip--on">{{ f }}</span>
            }
            @if (totalFound() === 0) {
              <span class="cm-overlay-hint">None found in this workspace</span>
            }
          </div>
        </section>

        @if (totalMissing() > 0) {
          <section class="cm-diff-section">
            <p class="cm-diff-label cm-diff-label--pending">
              Pending adoption ({{ totalMissing() }} not in workspace)
            </p>
            <div class="cm-diff-chips">
              @for (f of preview().missing.agents; track f) {
                <span class="cm-diff-chip cm-diff-chip--pending">{{ f }}</span>
              }
              @for (f of preview().missing.skills; track f) {
                <span class="cm-diff-chip cm-diff-chip--pending">{{ f }}</span>
              }
              @for (f of preview().missing.commands; track f) {
                <span class="cm-diff-chip cm-diff-chip--pending">{{ f }}</span>
              }
            </div>
          </section>
        }

        <div class="cm-overlay-actions">
          <cm-button variant="ghost" size="md" (click)="cancel.emit()">Cancel</cm-button>
          <cm-button
            variant="primary"
            size="md"
            [disabled]="!importName().trim()"
            (click)="doImport()"
          >
            Import@if (totalMissing() > 0) { with {{ totalMissing() }} pending}
          </cm-button>
        </div>
      </div>
    </div>
  `,
})
export class ImportProfileComponent implements OnInit {
  readonly preview = input.required<ImportPreview>();
  readonly confirm = output<{ name: string; missing: PendingItems }>();
  readonly cancel = output<void>();

  protected readonly importName = signal('');

  protected readonly totalFound = computed(() => {
    const f = this.preview().found;
    return f.agents.length + f.skills.length + f.commands.length;
  });

  protected readonly totalMissing = computed(() => {
    const m = this.preview().missing;
    return m.agents.length + m.skills.length + m.commands.length;
  });

  ngOnInit(): void {
    this.importName.set(this.preview().originalName);
  }

  protected doImport(): void {
    const name = this.importName().trim();
    if (!name) return;
    this.confirm.emit({ name, missing: this.preview().missing });
  }
}
