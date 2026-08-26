import { describe, expect, it } from 'vitest';
import { planIngest, shouldCompressImage } from '../src/editor/ingestImage';

describe('planIngest', () => {
  it('rejects unsupported types and oversized files before write', () => {
    expect(planIngest('/n/a.md', 'x.pdf', [], 10).ok).toBe(false);
    expect(planIngest('/n/a.md', 'x.png', [], 26 * 1024 * 1024).ok).toBe(false);
  });

  it('builds a unique destination under the note assets dir', () => {
    const planned = planIngest('/notes/guide.md', 'shot.png', ['shot.png'], 100);
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.destPath).toBe('/notes/guide.assets/shot-1.png');
      expect(planned.src).toBe('./guide.assets/shot-1.png');
    }
  });
});

describe('shouldCompressImage', () => {
  it('skips gif and svg even when compression is on', () => {
    expect(shouldCompressImage('a.gif', true)).toBe(false);
    expect(shouldCompressImage('a.svg', true)).toBe(false);
    expect(shouldCompressImage('a.png', true)).toBe(true);
    expect(shouldCompressImage('a.png', false)).toBe(false);
  });
});
