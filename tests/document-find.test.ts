import { describe, expect, it } from 'vitest';
import {
  findMatches,
  findMatchesInTextNodes,
  formatFindCount,
} from '../src/lib/document-find';
import { searchRevealNeedle } from '../src/lib/searchQuery';

describe('findMatches', () => {
  it('returns no ranges for an empty query', () => {
    expect(findMatches('Hello Leafio', '')).toEqual([]);
    expect(findMatches('Hello Leafio', '   ')).toEqual([]);
  });

  it('finds case-insensitive, non-overlapping ranges', () => {
    expect(findMatches('Hello Leafio leaf', 'LEAF')).toEqual([
      { from: 6, to: 10 },
      { from: 13, to: 17 },
    ]);
  });

  it('keeps original offsets for CJK text', () => {
    expect(findMatches('今天开会，明天也开会', '开会')).toEqual([
      { from: 2, to: 4 },
      { from: 8, to: 10 },
    ]);
  });
});

describe('findMatchesInTextNodes', () => {
  it('maps matches onto document positions from text nodes', () => {
    const matches = findMatchesInTextNodes(
      [
        { text: 'Hello ', pos: 1 },
        { text: 'Leafio', pos: 10 },
      ],
      'leaf',
    );
    expect(matches).toEqual([{ from: 10, to: 14 }]);
  });
});

describe('formatFindCount', () => {
  it('is zeroed when nothing matches', () => {
    expect(formatFindCount(0, 0)).toEqual({ current: 0, total: 0 });
  });

  it('is 1-based for the active match', () => {
    expect(formatFindCount(0, 3)).toEqual({ current: 1, total: 3 });
    expect(formatFindCount(2, 3)).toEqual({ current: 3, total: 3 });
  });
});

describe('searchRevealNeedle', () => {
  it('prefers the first content term', () => {
    expect(
      searchRevealNeedle({ terms: ['agenda', 'notes'], tags: ['会议'], paths: [] }),
    ).toBe('agenda');
  });

  it('falls back to a hashtag when only tags are present', () => {
    expect(searchRevealNeedle({ terms: [], tags: ['会议'], paths: ['notes'] })).toBe('#会议');
  });

  it('is empty for path-only queries', () => {
    expect(searchRevealNeedle({ terms: [], tags: [], paths: ['notes'] })).toBe('');
  });
});
