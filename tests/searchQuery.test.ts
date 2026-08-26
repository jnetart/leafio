import { describe, expect, it } from 'vitest';
import {
  cycleSearchIndex,
  highlightParts,
  isSearchQueryEmpty,
  parseSearchQuery,
  searchNeedles,
} from '../src/lib/searchQuery';

describe('parseSearchQuery', () => {
  it('treats plain words as AND terms', () => {
    expect(parseSearchQuery('meeting notes')).toEqual({
      terms: ['meeting', 'notes'],
      tags: [],
      paths: [],
    });
  });

  it('parses tag: and path: filters', () => {
    expect(parseSearchQuery('tag:会议 path:notes 议程')).toEqual({
      terms: ['议程'],
      tags: ['会议'],
      paths: ['notes'],
    });
  });

  it('accepts quoted filter values and operators in any case', () => {
    expect(parseSearchQuery(`TAG:"foo bar" PATH:'my notes'`)).toEqual({
      terms: [],
      tags: ['foo bar'],
      paths: ['my notes'],
    });
  });

  it('treats #tag tokens as tag filters', () => {
    expect(parseSearchQuery('#work draft')).toEqual({
      terms: ['draft'],
      tags: ['work'],
      paths: [],
    });
  });

  it('collects repeated filters', () => {
    expect(parseSearchQuery('tag:a tag:b path:notes path:2024')).toEqual({
      terms: [],
      tags: ['a', 'b'],
      paths: ['notes', '2024'],
    });
  });

  it('ignores empty filter values', () => {
    expect(parseSearchQuery('tag: path: hello')).toEqual({
      terms: ['hello'],
      tags: [],
      paths: [],
    });
  });

  it('keeps quoted phrases as a single term', () => {
    expect(parseSearchQuery('"exact phrase" leftover')).toEqual({
      terms: ['exact phrase', 'leftover'],
      tags: [],
      paths: [],
    });
  });
});

describe('isSearchQueryEmpty', () => {
  it('is empty for blank input', () => {
    expect(isSearchQueryEmpty(parseSearchQuery('   '))).toBe(true);
  });

  it('is not empty when only a filter is present', () => {
    expect(isSearchQueryEmpty(parseSearchQuery('tag:work'))).toBe(false);
  });
});

describe('searchNeedles', () => {
  it('highlights terms, tags, and path fragments', () => {
    expect(searchNeedles(parseSearchQuery('tag:work path:notes agenda'))).toEqual([
      'agenda',
      'work',
      'notes',
    ]);
  });
});

describe('highlightParts', () => {
  it('wraps case-insensitive matches and keeps original casing', () => {
    expect(highlightParts('Welcome to Leafio', ['leaf'])).toEqual([
      { text: 'Welcome to ', hit: false },
      { text: 'Leaf', hit: true },
      { text: 'io', hit: false },
    ]);
  });

  it('highlights every needle without overlapping', () => {
    expect(highlightParts('tag work path', ['tag', 'path'])).toEqual([
      { text: 'tag', hit: true },
      { text: ' work ', hit: false },
      { text: 'path', hit: true },
    ]);
  });

  it('returns the original text when nothing matches', () => {
    expect(highlightParts('plain snippet', ['zzz'])).toEqual([
      { text: 'plain snippet', hit: false },
    ]);
  });
});

describe('cycleSearchIndex', () => {
  it('wraps from last to first and first to last', () => {
    expect(cycleSearchIndex(2, 3, 1)).toBe(0);
    expect(cycleSearchIndex(0, 3, -1)).toBe(2);
  });

  it('moves one step within range', () => {
    expect(cycleSearchIndex(0, 3, 1)).toBe(1);
    expect(cycleSearchIndex(1, 3, -1)).toBe(0);
  });

  it('stays at 0 when there are no items', () => {
    expect(cycleSearchIndex(0, 0, 1)).toBe(0);
  });
});
