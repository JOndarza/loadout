import { Injectable, signal } from '@angular/core';

const EXIT_MS = 280;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly message = signal<string | null>(null);
  readonly leaving  = signal(false);
  readonly actionLabel = signal<string | null>(null);
  readonly onAction = signal<(() => void) | null>(null);

  show(text: string, duration = 2200): void {
    this.actionLabel.set(null);
    this.onAction.set(null);
    this.display(text, duration);
  }

  showWithAction(text: string, label: string, cb: () => void, duration = 5000): void {
    this.actionLabel.set(label);
    this.onAction.set(cb);
    this.display(text, duration);
  }

  private display(text: string, duration: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.leaving.set(false);
    this.message.set(text);
    this.timer = setTimeout(() => {
      this.leaving.set(true);
      setTimeout(() => {
        this.message.set(null);
        this.leaving.set(false);
        this.actionLabel.set(null);
        this.onAction.set(null);
      }, EXIT_MS);
    }, duration);
  }
}
