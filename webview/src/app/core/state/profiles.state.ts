import { Injectable, computed, signal } from '@angular/core';
import type { Profile } from '../messages';

export interface ProfileEntry {
  name: string;
  agents: string[];
  skills: string[];
  commands: string[];
  createdAt: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class ProfilesState {
  private readonly _profiles = signal<Record<string, Profile>>({});
  private readonly _activeName = signal<string | null>(null);

  readonly profiles = this._profiles.asReadonly();
  readonly activeName = this._activeName.asReadonly();

  readonly entries = computed<ProfileEntry[]>(() => {
    return Object.entries(this._profiles())
      .map(([name, p], idx) => ({
        name,
        agents:   p.agents   ?? [],
        skills:   p.skills   ?? [],
        commands: p.commands ?? [],
        createdAt: p.createdAt ?? '',
        order: p.order ?? idx,
      }))
      .sort((a, b) => a.order - b.order);
  });

  setAll(profiles: Record<string, Profile>): void {
    this._profiles.set(profiles);
  }

  setActiveName(name: string | null): void {
    this._activeName.set(name);
  }
}
