import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'cm-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.message()) {
      <div class="cm-toast" [class.is-leaving]="toast.leaving()" role="status" aria-live="polite">
        <span class="cm-toast-check">✓</span>
        {{ toast.message() }}
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
