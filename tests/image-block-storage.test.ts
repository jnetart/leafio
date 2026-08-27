import { describe, expect, it } from 'vitest';
import { getImageBlockStorage } from '../src/editor/insertImage';

describe('getImageBlockStorage', () => {
  it('reads TipTap storage from the image extension name', () => {
    const storage = getImageBlockStorage({
      storage: { image: { notePath: '/notes/a.md', compress: true, maxEdge: 1920 } },
    });
    expect(storage?.notePath).toBe('/notes/a.md');
  });

  it('returns undefined instead of throwing when storage is missing', () => {
    expect(getImageBlockStorage({ storage: {} })).toBeUndefined();
  });
});
