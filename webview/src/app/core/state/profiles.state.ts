import { Injectable, computed, signal } from '@angular/core';
import type { PendingItems, Profile } from '@core/messages';

export interface ProfileEntry {
  name: string;
  agents: string[];
  skills: string[];
  commands: string[];
  createdAt: string;
  order: number;
  description: string;
  pendingItems: PendingItems;
}

const RESTORE_POINT_KEY = '__restore_point__';
const EMPTY_PENDING: PendingItems = { agents: [], skills: [], commands: [] };

@Injectable({ providedIn: 'root' })
export class ProfilesState {
  private readonly _profiles = signal<Record<string, Profile>>({});
  private readonly _activeName = signal<string | null>(null);

  readonly profiles = this._profiles.asReadonly();
  readonly activeName = this._activeName.asReadonly();

  readonly entries = computed<ProfileEntry[]>(() => {
    return Object.entries(this._profiles())
      .filter(([name]) => name !== RESTORE_POINT_KEY)
      .map(([name, p], idx) => ({
        name,
        agents:      p.agents      ?? [],
        skills:      p.skills      ?? [],
        commands:    p.commands    ?? [],
        createdAt:   p.createdAt   ?? '',
        order:       p.order       ?? idx,
        description: p.description ?? '',
        pendingItems: p.pendingItems ?? EMPTY_PENDING,
      }))
      .sort((a, b) => a.order - b.order);
  });

  readonly hasRestorePoint = computed(() =>
    Object.prototype.hasOwnProperty.call(this._profiles(), RESTORE_POINT_KEY),
  );

  readonly allProfileItemFiles = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const [name, p] of Object.entries(this._profiles())) {
      if (name === RESTORE_POINT_KEY) continue;
      for (const f of [...(p.agents ?? []), ...(p.skills ?? []), ...(p.commands ?? [])]) {
        set.add(f);
      }
    }
    return set;
  });

  setAll(profiles: Record<string, Profile>): void {
    this._profiles.set(profiles);
  }

  setActiveName(name: string | null): void {
    this._activeName.set(name);
  }
}
