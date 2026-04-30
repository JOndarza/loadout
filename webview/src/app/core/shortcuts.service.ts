import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type ShortcutEvent =
  | { type: 'tab'; index: 0 | 1 | 2 | 3 }
  | { type: 'palette' }
  | { type: 'search' }
  | { type: 'activeOnly' }
  | { type: 'orphanOnly' }
  | { type: 'saveProfile' }
  | { type: 'escape' };

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly events = new Subject<ShortcutEvent>();
  readonly events$ = this.events.asObservable();

  private readonly _paletteOpen = signal(false);
  readonly paletteOpen = this._paletteOpen.asReadonly();

  readonly isMac = /mac/i.test(navigator.userAgent) && !/iphone|ipad/i.test(navigator.userAgent);
  readonly modKey = this.isMac ? '⌘' : 'Ctrl';

  constructor(destroyRef: DestroyRef) {
    const handler = (e: KeyboardEvent) => this.handle(e);
    window.addEventListener('keydown', handler);
    destroyRef.onDestroy(() => window.removeEventListener('keydown', handler));
  }

  setPaletteOpen(open: boolean): void {
    this._paletteOpen.set(open);
  }

  private handle(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const isInput =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable;

    // Cmd+K / Ctrl+K — palette (works even in inputs)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.events.next({ type: 'palette' });
      return;
    }

    if (e.key === 'Escape') {
      this.events.next({ type: 'escape' });
      return;
    }

    if (isInput || this._paletteOpen()) return;

    if (e.key === '1') this.events.next({ type: 'tab', index: 0 });
    else if (e.key === '2') this.events.next({ type: 'tab', index: 1 });
    else if (e.key === '3') this.events.next({ type: 'tab', index: 2 });
    else if (e.key === '4') this.events.next({ type: 'tab', index: 3 });
    else if (e.key === '/') {
      e.preventDefault();
      this.events.next({ type: 'search' });
    } else if (e.key.toLowerCase() === 'a') {
      this.events.next({ type: 'activeOnly' });
    } else if (e.key.toLowerCase() === 'p') {
      this.events.next({ type: 'orphanOnly' });
    } else if (e.key.toLowerCase() === 's') {
      this.events.next({ type: 'saveProfile' });
    }
  }
}
