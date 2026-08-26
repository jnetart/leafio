import { describe, expect, it } from 'vitest';
import {
  assetsDirForNote,
  isAssetsFolderName,
  isSupportedImageFilename,
  noteStem,
  pastedImageFilename,
  relativeAssetSrc,
  resolveImageSrc,
  rewriteAssetPrefix,
  sanitizeImageFilename,
  uniqueImageFilename,
} from '../src/lib/image-assets';

describe('image asset paths', () => {
  it('derives stem and sibling assets dir', () => {
    expect(noteStem('/notes/api-guide.md')).toBe('api-guide');
    expect(assetsDirForNote('/notes/api-guide.md')).toBe('/notes/api-guide.assets');
    expect(relativeAssetSrc('/notes/api-guide.md', 'architecture.png')).toBe(
      './api-guide.assets/architecture.png',
    );
  });

  it('hides assets folders case-insensitively', () => {
    expect(isAssetsFolderName('api-guide.assets')).toBe(true);
    expect(isAssetsFolderName('API-GUIDE.ASSETS')).toBe(true);
    expect(isAssetsFolderName('assets')).toBe(false);
  });

  it('accepts only the spec image extensions', () => {
    expect(isSupportedImageFilename('shot.PNG')).toBe(true);
    expect(isSupportedImageFilename('a.jpeg')).toBe(true);
    expect(isSupportedImageFilename('x.heic')).toBe(false);
    expect(isSupportedImageFilename('spec.pdf')).toBe(false);
  });

  it('sanitizes names and suffixes collisions', () => {
    expect(sanitizeImageFilename('a/b\\c.png')).toBe('abc.png');
    expect(uniqueImageFilename('file.png', ['file.png'])).toBe('file-1.png');
    expect(uniqueImageFilename('file.png', ['file.png', 'file-1.png'])).toBe('file-2.png');
  });

  it('names clipboard pastes with a timestamp', () => {
    expect(pastedImageFilename(new Date('2026-08-26T13:04:05'), 'png')).toBe(
      'pasted-20260826-130405.png',
    );
  });

  it('rewrites asset prefixes when a note is renamed', () => {
    const md = '![x](./old.assets/a.png)\n';
    expect(rewriteAssetPrefix(md, 'old', 'new')).toBe('![x](./new.assets/a.png)\n');
  });

  it('resolves remote, relative, and empty src', () => {
    expect(resolveImageSrc('https://example.com/a.png', '/notes/n.md')).toEqual({
      kind: 'remote',
      href: 'https://example.com/a.png',
    });
    expect(resolveImageSrc('./n.assets/a.png', '/notes/n.md')).toEqual({
      kind: 'local',
      absPath: '/notes/n.assets/a.png',
    });
    expect(resolveImageSrc('', '/notes/n.md')).toEqual({ kind: 'empty' });
  });
});
