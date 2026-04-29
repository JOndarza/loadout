import { Directive, HostListener, inject, input, output, signal } from '@angular/core';
import { ToastService } from '@core/toast.service';

@Directive({
  selector: '[cmCopy]',
  host: {
    'class': 'cm-copy',
    '[class.is-copied]': 'copied()',
    '[attr.data-copied]': 'copied()',
  },
})
export class CopyToClipboardDirective {
  private readonly toast = inject(ToastService);

  readonly cmCopy = input.required<string>();
  readonly cmCopyDuration = input<number>(2000);
  readonly cmCopyLabel = input<string>('Copied!');

  readonly copied = signal(false);
  readonly cmCopied = output<string>();

  @HostListener('click', ['$event'])
  async onClick(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const text = this.cmCopy();
    if (!text || this.copied()) return;

    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      this.cmCopied.emit(text);
      this.toast.show(this.cmCopyLabel());
      setTimeout(() => this.copied.set(false), this.cmCopyDuration());
    } catch {
      this.toast.show('Copy failed');
    }
  }
}
