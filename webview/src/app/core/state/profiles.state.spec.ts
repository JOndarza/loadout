import { describe, it, expect } from 'vitest';
import { ProfilesState } from './profiles.state';

const profile = (overrides = {}) => ({
  agents: ['agent.md'],
  skills: [],
  commands: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  order: 0,
  ...overrides,
});

describe('ProfilesState', () => {
  it('initializes empty', () => {
    const state = new ProfilesState();
    expect(state.entries()).toEqual([]);
    expect(state.activeName()).toBeNull();
    expect(state.hasRestorePoint()).toBe(false);
  });

  it('maps profiles to entries', () => {
    const state = new ProfilesState();
    state.setAll({ alpha: profile({ order: 0 }), beta: profile({ order: 1 }) });
    const entries = state.entries();
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('alpha');
    expect(entries[1].name).toBe('beta');
  });

  it('sorts entries by order', () => {
    const state = new ProfilesState();
    state.setAll({ b: profile({ order: 1 }), a: profile({ order: 0 }) });
    expect(state.entries()[0].name).toBe('a');
    expect(state.entries()[1].name).toBe('b');
  });

  it('excludes restore point from entries', () => {
    const state = new ProfilesState();
    state.setAll({ __restore_point__: profile(), real: profile({ order: 0 }) });
    expect(state.entries()).toHaveLength(1);
    expect(state.entries()[0].name).toBe('real');
    expect(state.hasRestorePoint()).toBe(true);
  });

  it('tracks activeName', () => {
    const state = new ProfilesState();
    state.setActiveName('alpha');
    expect(state.activeName()).toBe('alpha');
    state.setActiveName(null);
    expect(state.activeName()).toBeNull();
  });

  it('collects allProfileItemFiles across profiles', () => {
    const state = new ProfilesState();
    state.setAll({
      a: profile({ agents: ['x.md', 'y.md'], skills: [], commands: [] }),
      b: profile({ agents: ['y.md', 'z.md'], skills: [], commands: [] }),
    });
    const files = state.allProfileItemFiles();
    expect(files.has('x.md')).toBe(true);
    expect(files.has('y.md')).toBe(true);
    expect(files.has('z.md')).toBe(true);
    expect(files.size).toBe(3);
  });

  it('defaults missing profile fields', () => {
    const state = new ProfilesState();
    state.setAll({ p: { agents: [], skills: [], createdAt: '' } });
    const entry = state.entries()[0];
    expect(entry.commands).toEqual([]);
    expect(entry.description).toBe('');
    expect(entry.appliedCount).toBe(0);
    expect(entry.pendingItems).toEqual({ agents: [], skills: [], commands: [] });
  });
});
