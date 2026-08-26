import { describe, expect, it } from 'vitest';
import {
  collapsedRailWindow,
  extractHeadings,
  headingHasChildren,
  headingIndexAtReadingLine,
  headingSubtreeEnd,
  isOutlineHeadingHidden,
  parentHeadingIndex,
  visibleOutlineHeadingIndex,
  type HeadingItem,
} from '../src/lib/headings';
import { parseMarkdown } from '../src/editor/markdown';

function outline(...levels: number[]): HeadingItem[] {
  return levels.map((level, index) => ({
    id: `heading-${index}`,
    level,
    text: `H${level}-${index}`,
  }));
}

describe('extractHeadings', () => {
  it('extracts heading text from document', () => {
    const doc = parseMarkdown('# Alpha\n\n## Beta\n');
    expect(extractHeadings(doc)).toEqual([
      { id: 'heading-0', level: 1, text: 'Alpha' },
      { id: 'heading-1', level: 2, text: 'Beta' },
    ]);
  });
});

describe('outline tree', () => {
  const headings = outline(1, 2, 3, 2, 1, 3);

  it('treats later deeper headings as children until the next peer or parent', () => {
    expect(headingSubtreeEnd(headings, 0)).toBe(4);
    expect(headingSubtreeEnd(headings, 1)).toBe(3);
    expect(headingSubtreeEnd(headings, 4)).toBe(6);
    expect(headingHasChildren(headings, 0)).toBe(true);
    expect(headingHasChildren(headings, 2)).toBe(false);
    expect(headingHasChildren(headings, 5)).toBe(false);
  });

  it('finds the nearest shallower parent, including skipped levels', () => {
    expect(parentHeadingIndex(headings, 0)).toBe(-1);
    expect(parentHeadingIndex(headings, 1)).toBe(0);
    expect(parentHeadingIndex(headings, 2)).toBe(1);
    expect(parentHeadingIndex(headings, 3)).toBe(0);
    expect(parentHeadingIndex(headings, 5)).toBe(4);
  });

  it('hides descendants of a collapsed heading', () => {
    const collapsed = new Set(['heading-1']);
    expect(isOutlineHeadingHidden(headings, 1, collapsed)).toBe(false);
    expect(isOutlineHeadingHidden(headings, 2, collapsed)).toBe(true);
    expect(isOutlineHeadingHidden(headings, 3, collapsed)).toBe(false);
  });

  it('surfaces the nearest visible ancestor as the reading location', () => {
    const collapsed = new Set(['heading-0']);
    expect(visibleOutlineHeadingIndex(headings, 2, collapsed)).toBe(0);
    expect(visibleOutlineHeadingIndex(headings, 4, collapsed)).toBe(4);
    expect(visibleOutlineHeadingIndex(headings, -1, collapsed)).toBe(-1);
  });
});

describe('headingIndexAtReadingLine', () => {
  it('returns the last heading that has crossed the reading line', () => {
    expect(headingIndexAtReadingLine([40, 120, 300], 150)).toBe(1);
    expect(headingIndexAtReadingLine([40, 120, 300], 20)).toBe(0);
    expect(headingIndexAtReadingLine([40, 120, 300], 400)).toBe(2);
  });

  it('returns -1 when there are no headings', () => {
    expect(headingIndexAtReadingLine([], 80)).toBe(-1);
  });
});

describe('collapsedRailWindow', () => {
  it('keeps a short outline intact', () => {
    expect(collapsedRailWindow(4, 2)).toEqual({ start: 0, end: 4 });
  });

  it('centers a long outline on the current heading', () => {
    expect(collapsedRailWindow(20, 10, 12)).toEqual({ start: 4, end: 16 });
    expect(collapsedRailWindow(20, 0, 12)).toEqual({ start: 0, end: 12 });
    expect(collapsedRailWindow(20, 19, 12)).toEqual({ start: 8, end: 20 });
  });
});
