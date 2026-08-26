import { describe, expect, it } from 'vitest';
import { filterBlockActions } from '../src/editor/blockActions';

describe('filterBlockActions', () => {
  it('returns all actions for an empty query', () => {
    expect(filterBlockActions('')).toHaveLength(14);
  });

  it('matches titles and keywords', () => {
    expect(filterBlockActions('表格').map((item) => item.id)).toEqual(['table']);
    expect(filterBlockActions('todo').map((item) => item.id)).toEqual(['task-list']);
    expect(filterBlockActions('h2').map((item) => item.id)).toEqual(['heading-2']);
    expect(filterBlockActions('图片').map((item) => item.id)).toEqual(['image']);
    expect(filterBlockActions('image').map((item) => item.id)).toEqual(['image']);
  });

  it('returns no matches for unknown queries', () => {
    expect(filterBlockActions('zzzz-not-found')).toEqual([]);
  });
});
