import type { JSONContent } from '@tiptap/react';

export function serializeHtmlImage(attrs: { src: string; alt: string; width: number }): string {
  const src = escapeAttr(attrs.src);
  const alt = escapeAttr(attrs.alt);
  return `<img src="${src}" alt="${alt}" width="${Math.round(attrs.width)}">`;
}

export function parseHtmlImage(html: string): JSONContent | null {
  const trimmed = html.trim();
  const match = trimmed.match(/^<img\b([^>]*)\/?>$/i);
  if (!match) {
    return null;
  }
  const attrs = match[1] ?? '';
  const src = readAttr(attrs, 'src');
  if (!src) {
    return null;
  }
  const widthRaw = readAttr(attrs, 'width');
  const widthNum = widthRaw ? Number.parseInt(widthRaw, 10) : NaN;
  return {
    type: 'image',
    attrs: {
      src,
      alt: readAttr(attrs, 'alt') ?? '',
      width: Number.isFinite(widthNum) && widthNum > 0 ? widthNum : null,
    },
  };
}

function readAttr(source: string, name: string): string | null {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) {
    return null;
  }
  return match[2] ?? match[3] ?? match[4] ?? null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
