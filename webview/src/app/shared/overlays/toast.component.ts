import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@core/toast.service';

@Component({
  selector: 'cm-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.message()) {
      <div class="cm-toast" [class.is-leaving]="toast.leaving()" role="status" aria-live="polite">
        <span class="cm-toast-check">✓</span>
        <span class="cm-toast-text">{{ toast.message() }}</span>
        @if (toast.actionLabel()) {
          <button type="button" class="cm-toast-action" (click)="toast.onAction()!()">
            {{ toast.actionLabel() }}
          </button>
        }
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
