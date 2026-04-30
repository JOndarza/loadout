import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly _state = signal<Record<string, unknown>>({});
  readonly state = this._state.asReadonly();

  setAll(state: Record<string, unknown>): void {
    this._state.set(state);
  }

  get<T>(key: string, fallback: T): T {
    return (this._state()[key] ?? fallback) as T;
  }
}
