import { describe, expect, it } from 'vitest';
import { alignMarkdownDiff, countChangedRows } from '../src/lib/line-diff';

describe('alignMarkdownDiff', () => {
  it('marks identical documents as unchanged', () => {
    const rows = alignMarkdownDiff('a\nb', 'a\nb');
    expect(rows).toEqual([
      { kind: 'same', local: 'a', disk: 'a', localNo: 1, diskNo: 1 },
      { kind: 'same', local: 'b', disk: 'b', localNo: 2, diskNo: 2 },
    ]);
    expect(countChangedRows(rows)).toBe(0);
  });

  it('pairs a replaced line as changed', () => {
    const rows = alignMarkdownDiff('hello\nworld', 'hello\nthere');
    expect(rows).toEqual([
      { kind: 'same', local: 'hello', disk: 'hello', localNo: 1, diskNo: 1 },
      { kind: 'changed', local: 'world', disk: 'there', localNo: 2, diskNo: 2 },
    ]);
    expect(countChangedRows(rows)).toBe(1);
  });

  it('keeps an inserted disk line on the right', () => {
    const rows = alignMarkdownDiff('a\nc', 'a\nb\nc');
    expect(rows).toEqual([
      { kind: 'same', local: 'a', disk: 'a', localNo: 1, diskNo: 1 },
      { kind: 'disk', local: null, disk: 'b', localNo: null, diskNo: 2 },
      { kind: 'same', local: 'c', disk: 'c', localNo: 2, diskNo: 3 },
    ]);
  });

  it('keeps a deleted local line on the left', () => {
    const rows = alignMarkdownDiff('a\nb\nc', 'a\nc');
    expect(rows).toEqual([
      { kind: 'same', local: 'a', disk: 'a', localNo: 1, diskNo: 1 },
      { kind: 'local', local: 'b', disk: null, localNo: 2, diskNo: null },
      { kind: 'same', local: 'c', disk: 'c', localNo: 3, diskNo: 2 },
    ]);
  });

  it('preserves a trailing empty line', () => {
    const rows = alignMarkdownDiff('note\n', 'note\n');
    expect(rows.at(-1)).toEqual({
      kind: 'same',
      local: '',
      disk: '',
      localNo: 2,
      diskNo: 2,
    });
  });
});
