import { describe, expect, it } from 'vitest';
import { expandUserPath, formatDisplayPath } from '../src/lib/paths';

const HOME = '/Users/shenjie';

describe('formatDisplayPath', () => {
  it('replaces home prefix with ~/', () => {
    expect(formatDisplayPath('/Users/shenjie/Documents/leafio/未命名.md', HOME)).toBe(
      '~/Documents/leafio/未命名.md',
    );
  });

  it('returns ~ for home directory itself', () => {
    expect(formatDisplayPath('/Users/shenjie', HOME)).toBe('~');
  });

  it('leaves paths outside home unchanged', () => {
    expect(formatDisplayPath('/var/log/system.log', HOME)).toBe('/var/log/system.log');
  });

  it('is case-insensitive on Windows-style paths', () => {
    expect(
      formatDisplayPath('C:\\Users\\Me\\Documents\\notes.md', 'C:\\Users\\Me'),
    ).toBe('~/Documents/notes.md');
  });

  it('returns original path when home is unknown', () => {
    expect(formatDisplayPath('/Users/shenjie/foo.md', null)).toBe('/Users/shenjie/foo.md');
  });
});

describe('expandUserPath', () => {
  it('expands ~/ paths', () => {
    expect(expandUserPath('~/Documents/leafio', HOME)).toBe('/Users/shenjie/Documents/leafio');
  });

  it('expands ~ to home', () => {
    expect(expandUserPath('~', HOME)).toBe('/Users/shenjie');
  });

  it('leaves absolute paths unchanged', () => {
    expect(expandUserPath('/tmp/export.html', HOME)).toBe('/tmp/export.html');
  });
});
