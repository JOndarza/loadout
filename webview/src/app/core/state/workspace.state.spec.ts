import { describe, it, expect } from 'vitest';
import { WorkspaceState } from './workspace.state';

const item = (name: string, active: boolean, tokens = 100) => ({
  name, file: `${name}.md`, active, tokens, description: '',
});

describe('WorkspaceState', () => {
  it('initializes empty', () => {
    const state = new WorkspaceState();
    expect(state.agents()).toEqual([]);
    expect(state.skills()).toEqual([]);
    expect(state.commands()).toEqual([]);
    expect(state.totalCount()).toBe(0);
    expect(state.totalActiveTokens()).toBe(0);
  });

  it('exposes items after setAll', () => {
    const state = new WorkspaceState();
    state.setAll([item('a', true), item('b', false)], [item('s', true)], []);
    expect(state.agents()).toHaveLength(2);
    expect(state.skills()).toHaveLength(1);
    expect(state.totalCount()).toBe(3);
  });

  it('filters active items', () => {
    const state = new WorkspaceState();
    state.setAll([item('a', true), item('b', false)], [], []);
    expect(state.activeAgents()).toHaveLength(1);
    expect(state.activeAgents()[0].name).toBe('a');
    expect(state.activeSkills()).toHaveLength(0);
  });

  it('sums active tokens across types', () => {
    const state = new WorkspaceState();
    state.setAll(
      [item('a', true, 300), item('b', false, 200)],
      [item('s', true, 500)],
      [item('c', true, 100)],
    );
    expect(state.totalActiveTokens()).toBe(900); // 300 + 500 + 100
  });

  it('reacts to setAll updates', () => {
    const state = new WorkspaceState();
    state.setAll([item('a', true)], [], []);
    expect(state.totalCount()).toBe(1);
    state.setAll([], [], []);
    expect(state.totalCount()).toBe(0);
  });
});
