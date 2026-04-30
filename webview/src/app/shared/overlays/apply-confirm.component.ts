import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
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
    <div class="cm-sheet-scrim" (click)="cancel.emit()" role="presentation"></div>
    <div
      #sheet
      class="cm-sheet"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      [attr.aria-label]="'Apply profile ' + profileName()"
      (keydown.escape)="cancel.emit()"
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
  `,
})
export class ApplyConfirmComponent implements AfterViewInit {
  readonly profileName = input.required<string>();
  readonly diff = input.required<ApplyDiff>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  private readonly sheetRef = viewChild<ElementRef<HTMLDivElement>>('sheet');

  ngAfterViewInit(): void {
    this.sheetRef()?.nativeElement.focus();
  }

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
