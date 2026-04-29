import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SettingsState } from './state/settings.state';
import { VsCodeBridgeService } from './vscode-bridge.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly bridge = inject(VsCodeBridgeService);
  private readonly settings = inject(SettingsState);

  private readonly vscodeKind = signal<'dark' | 'light'>('dark');
  private themeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly resolved = computed<'dark' | 'light'>(() => {
    const setting = this.settings.settings().theme;
    return setting === 'auto' ? this.vscodeKind() : setting;
  });

  constructor() {
    this.bridge.messages$.subscribe((msg) => {
      if (msg.command === 'vscodeThemeChanged') {
        this.vscodeKind.set(msg.kind);
      }
      if (msg.command === 'initialData' || msg.command === 'dataUpdate') {
        this.vscodeKind.set(msg.data.vscodeThemeKind);
      }
    });

    effect(() => {
      const theme = this.resolved();
      const root = document.documentElement;
      root.classList.add('cm-theme-transitioning');
      root.dataset['theme'] = theme;
      if (this.themeTimer) clearTimeout(this.themeTimer);
      this.themeTimer = window.setTimeout(() => {
        root.classList.remove('cm-theme-transitioning');
        this.themeTimer = null;
      }, 320);
    });
  }

  setVscodeKind(kind: 'dark' | 'light'): void {
    this.vscodeKind.set(kind);
  }
}
