import { Injectable, signal } from '@angular/core';

const EXIT_MS = 280;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly message = signal<string | null>(null);
  readonly leaving  = signal(false);

  show(text: string, duration = 2200): void {
    if (this.timer) clearTimeout(this.timer);
    this.leaving.set(false);
    this.message.set(text);
    this.timer = setTimeout(() => {
      this.leaving.set(true);
      setTimeout(() => {
        this.message.set(null);
        this.leaving.set(false);
      }, EXIT_MS);
    }, duration);
  }
}
