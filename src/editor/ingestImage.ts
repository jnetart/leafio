import {
  assetsDirForNote,
  isSupportedImageFilename,
  MAX_IMAGE_BYTES,
  relativeAssetSrc,
  sanitizeImageFilename,
  uniqueImageFilename,
} from '../lib/image-assets';
import { listWorkspace, readBinaryFile, writeBinaryFile } from '../lib/fs';
import { basename } from '../lib/paths';

export type IngestImageSource =
  | { type: 'path'; path: string; filename?: string }
  | { type: 'bytes'; bytes: Uint8Array; filename: string };

export type IngestImageResult =
  | { ok: true; src: string; warning?: 'saved-original' }
  | { ok: false; reason: 'unsupported' | 'too-large' | 'write-failed' };

export type PlanIngestResult =
  | { ok: true; destPath: string; src: string; filename: string }
  | { ok: false; reason: 'unsupported' | 'too-large' };

export function shouldCompressImage(filename: string, compress: boolean): boolean {
  if (!compress) {
    return false;
  }
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  return ext !== 'gif' && ext !== 'svg';
}

export function planIngest(
  notePath: string,
  filename: string,
  existingNames: string[],
  byteLength: number,
): PlanIngestResult {
  const safe = sanitizeImageFilename(filename);
  if (!isSupportedImageFilename(safe)) {
    return { ok: false, reason: 'unsupported' };
  }
  if (byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, reason: 'too-large' };
  }
  const unique = uniqueImageFilename(safe, existingNames);
  return {
    ok: true,
    destPath: `${assetsDirForNote(notePath)}/${unique}`,
    src: relativeAssetSrc(notePath, unique),
    filename: unique,
  };
}

export async function ingestImage(
  notePath: string,
  source: IngestImageSource,
  options: { compress: boolean; maxEdge: number },
): Promise<IngestImageResult> {
  let filename: string;
  let bytes: Uint8Array;
  try {
    if (source.type === 'path') {
      filename = source.filename ?? basename(source.path);
      bytes = new Uint8Array(await readBinaryFile(source.path));
    } else {
      filename = source.filename;
      bytes = source.bytes;
    }
  } catch {
    return { ok: false, reason: 'write-failed' };
  }

  let existing: string[] = [];
  try {
    const entries = await listWorkspace(assetsDirForNote(notePath));
    existing = entries.filter((entry) => !entry.is_dir).map((entry) => entry.name);
  } catch {
    existing = [];
  }

  const planned = planIngest(notePath, filename, existing, bytes.byteLength);
  if (!planned.ok) {
    return planned;
  }

  let warning: 'saved-original' | undefined;
  let toWrite = bytes;
  if (shouldCompressImage(planned.filename, options.compress)) {
    try {
      const compressed = await compressImageBytes(bytes, planned.filename, options.maxEdge);
      if (compressed.byteLength > MAX_IMAGE_BYTES) {
        return { ok: false, reason: 'too-large' };
      }
      toWrite = compressed;
    } catch {
      warning = 'saved-original';
    }
  }

  try {
    await writeBinaryFile(planned.destPath, Array.from(toWrite));
  } catch {
    return { ok: false, reason: 'write-failed' };
  }

  return { ok: true, src: planned.src, warning };
}

async function compressImageBytes(
  bytes: Uint8Array,
  filename: string,
  maxEdge: number,
): Promise<Uint8Array> {
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'webp'
        ? 'image/webp'
        : 'image/png';
  const blob = new Blob([bytes], { type: mime });
  const bitmap = await createImageBitmap(blob);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= maxEdge) {
      return bytes;
    }
    const scale = maxEdge / longest;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('no-canvas');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const output = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('toBlob'));
          }
        },
        mime,
        0.86,
      );
    });
    return new Uint8Array(await output.arrayBuffer());
  } finally {
    bitmap.close();
  }
}
