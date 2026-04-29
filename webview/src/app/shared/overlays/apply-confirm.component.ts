import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CmButtonComponent } from '@shared/primitives';
import type { PendingItems } from '@core/messages';

export interface ApplyDiff {
  willActivate: PendingItems;
  willDeactivate: PendingItems;
}

@Component({
  selector: 'cm-apply-confirm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CmButtonComponent],
  template: `
    <div class="cm-overlay-backdrop" (click)="cancel.emit()" role="presentation">
      <div
        class="cm-overlay-dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Apply profile ' + profileName()"
        (click)="$event.stopPropagation()"
      >
        <h2 class="cm-overlay-title">Apply "{{ profileName() }}"?</h2>

        @if (hasChanges()) {
          @if (activating().length) {
            <section class="cm-diff-section">
              <p class="cm-diff-label cm-diff-label--on">Activating ({{ activating().length }})</p>
              <div class="cm-diff-chips">
                @for (f of activating(); track f) {
                  <span class="cm-diff-chip cm-diff-chip--on">{{ f }}</span>
                }
              </div>
            </section>
          }
          @if (deactivating().length) {
            <section class="cm-diff-section">
              <p class="cm-diff-label cm-diff-label--off">Deactivating ({{ deactivating().length }})</p>
              <div class="cm-diff-chips">
                @for (f of deactivating(); track f) {
                  <span class="cm-diff-chip cm-diff-chip--off">{{ f }}</span>
                }
              </div>
            </section>
          }
        } @else {
          <p class="cm-overlay-hint">No changes — workspace already matches this profile.</p>
        }

        <div class="cm-overlay-actions">
          <cm-button variant="ghost" size="md" (click)="cancel.emit()">Cancel</cm-button>
          <cm-button variant="primary" size="md" (click)="confirm.emit()">Apply</cm-button>
        </div>
      </div>
    </div>
  `,
})
export class ApplyConfirmComponent {
  readonly profileName = input.required<string>();
  readonly diff = input.required<ApplyDiff>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly activating = computed(() => {
    const d = this.diff();
    return [...d.willActivate.agents, ...d.willActivate.skills, ...d.willActivate.commands];
  });

  protected readonly deactivating = computed(() => {
    const d = this.diff();
    return [...d.willDeactivate.agents, ...d.willDeactivate.skills, ...d.willDeactivate.commands];
  });

  protected readonly hasChanges = computed(
    () => this.activating().length + this.deactivating().length > 0,
  );
}
