import { describe, expect, it } from 'vitest';
import { workspaceRootSubtitle } from '../src/lib/workspace';

describe('workspaceRootSubtitle', () => {
  it('returns undefined when label matches basename', () => {
    expect(workspaceRootSubtitle('/Users/me/notes', 'notes')).toBeUndefined();
  });

  it('returns undefined when label is empty', () => {
    expect(workspaceRootSubtitle('/Users/me/notes', '')).toBeUndefined();
  });

  it('returns basename when label differs', () => {
    expect(workspaceRootSubtitle('/Users/me/Documents/notes', '日记')).toBe('notes');
  });
});
