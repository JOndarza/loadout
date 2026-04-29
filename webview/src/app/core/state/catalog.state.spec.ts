import { describe, it, expect } from 'vitest';
import { CatalogState } from './catalog.state';

const item = (name: string, inProject = false) => ({
  name, file: `${name}.md`, tokens: 100, description: '', inProject, syncStatus: null as null,
});

describe('CatalogState', () => {
  it('initializes empty', () => {
    const state = new CatalogState();
    expect(state.agents()).toEqual([]);
    expect(state.totalCount()).toBe(0);
    expect(state.globalRoot()).toBe('');
  });

  it('exposes items after setAll', () => {
    const state = new CatalogState();
    state.setAll([item('a'), item('b')], [item('s')], [], '/root');
    expect(state.agents()).toHaveLength(2);
    expect(state.skills()).toHaveLength(1);
    expect(state.totalCount()).toBe(3);
    expect(state.globalRoot()).toBe('/root');
  });

  it('flattens all items with type tag', () => {
    const state = new CatalogState();
    state.setAll([item('a')], [item('s')], [item('c')], '/root');
    const all = state.all();
    expect(all).toHaveLength(3);
    expect(all.find(i => i.name === 'a')?.type).toBe('agents');
    expect(all.find(i => i.name === 's')?.type).toBe('skills');
    expect(all.find(i => i.name === 'c')?.type).toBe('commands');
  });

  it('updates totalCount reactively', () => {
    const state = new CatalogState();
    state.setAll([item('a')], [], [], '');
    expect(state.totalCount()).toBe(1);
    state.setAll([], [], [], '');
    expect(state.totalCount()).toBe(0);
  });
});
