import { describe, expect, it } from 'vitest';
import { hasSiblingNameConflict } from '../src/lib/name-conflict';

describe('hasSiblingNameConflict', () => {
  it('detects duplicate names case-insensitively', () => {
    expect(hasSiblingNameConflict('Note.md', ['note.md', 'other.md'])).toBe(true);
  });

  it('allows unchanged name when excluded', () => {
    expect(hasSiblingNameConflict('note.md', ['note.md', 'other.md'], 'note.md')).toBe(false);
  });

  it('detects conflicts with files and folders in the same list', () => {
    expect(hasSiblingNameConflict('drafts', ['drafts', 'readme.md'])).toBe(true);
  });

  it('returns false for empty input', () => {
    expect(hasSiblingNameConflict('', ['note.md'])).toBe(false);
  });
});
