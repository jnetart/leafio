import type { Editor } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { getImageBlockStorage, ingestAndInsertImages, insertImageBlocks } from '../insertImage';
import { pathExists } from '../../lib/fs';
import { isSupportedImageFilename, pastedImageFilename, resolveImageSrc } from '../../lib/image-assets';

type PathFile = File & { path?: string };

const IMAGE_URL = /^https?:\/\/\S+$/i;

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isSupportedImageFilename(file.name);
}

function uniqueFiles(files: File[]): File[] {
  return files.filter(
    (file, index, all) =>
      all.findIndex(
        (other) => other === file || (other.name === file.name && other.size === file.size),
      ) === index,
  );
}

async function ingestFiles(editor: Editor, files: File[]): Promise<void> {
  const sources = await Promise.all(
    files.map(async (file) => {
      const path = (file as PathFile).path;
      if (path) {
        return { type: 'path' as const, path, filename: file.name };
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const filename = file.name || pastedImageFilename(new Date(), 'png');
      return { type: 'bytes' as const, bytes, filename };
    }),
  );
  await ingestAndInsertImages(editor, sources);
}

export const ImageIngest = Extension.create({
  name: 'imageIngest',

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('imageIngest'),
        props: {
          handlePaste(_view, event) {
            return handleImageClipboard(editor, event);
          },
          handleDrop(view, event) {
            const dt = event.dataTransfer;
            if (!dt?.files?.length) {
              return false;
            }
            const files = uniqueFiles(Array.from(dt.files));
            const images = files.filter(isImageFile);
            if (images.length === 0) {
              if (files.length > 0) {
                getImageBlockStorage(editor)?.onNotice?.('unsupported');
                event.preventDefault();
                return true;
              }
              return false;
            }
            event.preventDefault();
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coords) {
              editor.chain().focus().setTextSelection(coords.pos).run();
            }
            void ingestFiles(editor, images);
            return true;
          },
        },
      }),
    ];
  },
});

function handleImageClipboard(editor: Editor, event: ClipboardEvent): boolean {
  const dt = event.clipboardData;
  if (!dt) {
    return false;
  }

  const files = uniqueFiles([
    ...Array.from(dt.files),
    ...Array.from(dt.items ?? [])
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null),
  ]);
  const images = files.filter(isImageFile);
  if (images.length > 0) {
    event.preventDefault();
    void ingestFiles(editor, images);
    return true;
  }
  if (files.length > 0) {
    getImageBlockStorage(editor)?.onNotice?.('unsupported');
    event.preventDefault();
    return true;
  }

  const text = dt.getData('text/plain').trim();
  if (IMAGE_URL.test(text)) {
    event.preventDefault();
    insertImageBlocks(editor, [{ src: text }]);
    return true;
  }

  const html = dt.getData('text/html');
  const htmlSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  if (htmlSrc) {
    event.preventDefault();
    void pasteHtmlImage(editor, htmlSrc);
    return true;
  }

  return false;
}

async function pasteHtmlImage(editor: Editor, src: string) {
  if (src.startsWith('data:')) {
    const file = dataUrlToBytes(src);
    if (file) {
      await ingestAndInsertImages(editor, [{ type: 'bytes', bytes: file.bytes, filename: file.filename }]);
    }
    return;
  }
  if (/^https?:\/\//i.test(src)) {
    insertImageBlocks(editor, [{ src }]);
    return;
  }
  const notePath = String(getImageBlockStorage(editor)?.notePath ?? '');
  const resolved = resolveImageSrc(src, notePath);
  if (resolved.kind === 'local' && (await pathExists(resolved.absPath))) {
    await ingestAndInsertImages(editor, [{ type: 'path', path: resolved.absPath }]);
    return;
  }
  insertImageBlocks(editor, [{ src }]);
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; filename: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  const mime = match[1] ?? 'image/png';
  const binary = atob(match[2] ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = mime.includes('jpeg') ? 'jpg' : (mime.split('/')[1]?.split('+')[0] ?? 'png');
  return { bytes, filename: pastedImageFilename(new Date(), ext) };
}
