import { DestroyRef, Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import type { ExtensionMessage, WebviewMessage } from './messages';

interface VsCodeApi {
  postMessage(msg: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

@Injectable({ providedIn: 'root' })
export class VsCodeBridgeService {
  private readonly vscode: VsCodeApi | null = window.acquireVsCodeApi
    ? window.acquireVsCodeApi()
    : null;
  private readonly inbound = new Subject<ExtensionMessage>();

  readonly messages$ = this.inbound.asObservable();

  constructor() {
    const destroyRef = inject(DestroyRef);
    const handler = (e: MessageEvent) => {
      if (this.isValidMessage(e.data)) this.inbound.next(e.data);
    };
    window.addEventListener('message', handler);
    destroyRef.onDestroy(() => {
      window.removeEventListener('message', handler);
      this.inbound.complete();
    });
  }

  private isValidMessage(d: unknown): d is ExtensionMessage {
    return !!d && typeof d === 'object' && typeof (d as Record<string, unknown>)['command'] === 'string';
  }

  send(msg: WebviewMessage): void {
    if (!this.vscode) {
      console.warn('[Loadout] vscode API unavailable — running outside webview?', msg);
      return;
    }
    this.vscode.postMessage(msg);
  }

  ready(): void {
    this.send({ command: 'ready' });
  }
}
