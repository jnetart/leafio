import { describe, expect, it } from 'vitest';
import { assetPair } from '../src/lib/note-assets';

describe('assetPair', () => {
  it('pairs a note with its sibling assets folder', () => {
    expect(assetPair('/notes/guide.md')).toEqual({
      stem: 'guide',
      assetsDir: '/notes/guide.assets',
    });
  });

  it('keeps the stem when a note is moved to another folder', () => {
    expect(assetPair('/other/guide.md').stem).toBe('guide');
    expect(assetPair('/other/guide.md').assetsDir).toBe('/other/guide.assets');
  });
});
