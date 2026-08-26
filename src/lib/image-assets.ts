import { basename, dirname } from './paths';

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] as const;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const DEFAULT_COMPRESS_MAX_EDGE = 1920;

const IMAGE_EXT_SET = new Set<string>(IMAGE_EXTENSIONS);

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function isAssetsFolderName(name: string): boolean {
  return name.toLowerCase().endsWith('.assets');
}

export function isSupportedImageFilename(name: string): boolean {
  const ext = extensionOf(name);
  return ext !== null && IMAGE_EXT_SET.has(ext);
}

function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) {
    return null;
  }
  return name.slice(dot + 1).toLowerCase();
}

export function noteStem(notePath: string): string {
  return basename(notePath).replace(/\.md$/i, '');
}

export function assetsDirForNote(notePath: string): string {
  return `${dirname(notePath)}/${noteStem(notePath)}.assets`;
}

export function relativeAssetSrc(notePath: string, filename: string): string {
  return `./${noteStem(notePath)}.assets/${filename}`;
}

export function sanitizeImageFilename(name: string): string {
  const trimmed = name.replace(/[\\/]/g, '').trim();
  if (!trimmed || trimmed === '.' || trimmed === '..') {
    return 'image.png';
  }
  return trimmed;
}

export function uniqueImageFilename(desired: string, existingNames: string[]): string {
  const safe = sanitizeImageFilename(desired);
  const existing = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!existing.has(safe.toLowerCase())) {
    return safe;
  }
  const dot = safe.lastIndexOf('.');
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';
  for (let index = 1; index < 1000; index += 1) {
    const candidate = `${stem}-${index}${ext}`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return `${stem}-${Date.now()}${ext}`;
}

export function pastedImageFilename(now: Date, ext: string): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const normalizedExt = ext.replace(/^\./, '').toLowerCase() || 'png';
  return `pasted-${stamp}.${normalizedExt}`;
}

export function rewriteAssetPrefix(markdown: string, oldStem: string, newStem: string): string {
  if (!oldStem || oldStem === newStem) {
    return markdown;
  }
  const from = `./${oldStem}.assets/`;
  const to = `./${newStem}.assets/`;
  return markdown.split(from).join(to);
}

export function resolveImageSrc(
  src: string,
  notePath: string,
): { kind: 'remote'; href: string } | { kind: 'local'; absPath: string } | { kind: 'empty' } {
  const trimmed = src.trim();
  if (!trimmed) {
    return { kind: 'empty' };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return { kind: 'remote', href: trimmed };
  }
  const noteDirectory = dirname(notePath);
  const withoutDot = trimmed.replace(/^\.\//, '');
  const absPath = withoutDot.startsWith('/')
    ? normalizePath(withoutDot)
    : normalizePath(`${noteDirectory}/${withoutDot}`);
  return { kind: 'local', absPath };
}
