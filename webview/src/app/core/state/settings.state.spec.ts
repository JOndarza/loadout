import { describe, it, expect } from 'vitest';
import { SettingsState } from './settings.state';

describe('SettingsState', () => {
  it('defaults to comfortable density and auto theme', () => {
    const state = new SettingsState();
    expect(state.settings().density).toBe('comfortable');
    expect(state.settings().theme).toBe('auto');
    expect(state.settings().defaultTab).toBe('workspace');
  });

  it('merges partial updates via setAll', () => {
    const state = new SettingsState();
    state.setAll({ density: 'compact' });
    expect(state.settings().density).toBe('compact');
    expect(state.settings().theme).toBe('auto'); // unchanged
  });

  it('updates registryUrl', () => {
    const state = new SettingsState();
    state.setAll({ registryUrl: 'https://example.com/components.json' });
    expect(state.settings().registryUrl).toBe('https://example.com/components.json');
  });

  it('applies multiple updates incrementally', () => {
    const state = new SettingsState();
    state.setAll({ density: 'compact' });
    state.setAll({ theme: 'dark' });
    expect(state.settings().density).toBe('compact');
    expect(state.settings().theme).toBe('dark');
  });
});
