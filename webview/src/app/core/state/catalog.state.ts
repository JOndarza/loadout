import { Injectable, computed, signal } from '@angular/core';
import type { CatalogItem } from '../messages';

@Injectable({ providedIn: 'root' })
export class CatalogState {
  private readonly _agents = signal<CatalogItem[]>([]);
  private readonly _skills = signal<CatalogItem[]>([]);
  private readonly _globalRoot = signal<string>('');

  readonly agents = this._agents.asReadonly();
  readonly skills = this._skills.asReadonly();
  readonly globalRoot = this._globalRoot.asReadonly();

  readonly all = computed(() => [
    ...this._agents().map((a) => ({ ...a, type: 'agents' as const })),
    ...this._skills().map((s) => ({ ...s, type: 'skills' as const })),
  ]);

  readonly totalCount = computed(() => this._agents().length + this._skills().length);

  setAll(agents: CatalogItem[], skills: CatalogItem[], globalRoot: string): void {
    this._agents.set(agents);
    this._skills.set(skills);
    this._globalRoot.set(globalRoot);
  }
}
