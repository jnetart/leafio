import type { Editor } from '@tiptap/core';
import type { SlashRange } from './blockActions';
import { ingestImage, type IngestImageSource } from './ingestImage';
import { pickImageFiles } from '../lib/dialog';
import { DEFAULT_COMPRESS_MAX_EDGE } from '../lib/image-assets';

export type ImageNoticeKey = 'unsupported' | 'too-large' | 'write-failed' | 'saved-original';

type ImageBlockStorage = {
  notePath: string;
  compress: boolean;
  maxEdge: number;
  onNotice?: (key: ImageNoticeKey) => void;
};

function imageStorage(editor: Editor): ImageBlockStorage {
  return editor.storage.imageBlock as ImageBlockStorage;
}

export function insertImageBlocks(
  editor: Editor,
  images: Array<{ src: string; alt?: string }>,
  range?: SlashRange,
): void {
  if (images.length === 0) {
    return;
  }
  const nodes = images.map((image) => ({
    type: 'image',
    attrs: { src: image.src, alt: image.alt ?? '', width: null },
  }));

  if (range) {
    editor.chain().focus().deleteRange(range).run();
  }

  const { $from } = editor.state.selection;
  let tableDepth: number | null = null;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') {
      tableDepth = depth;
      break;
    }
  }

  if (tableDepth !== null) {
    const pos = $from.after(tableDepth);
    editor.chain().focus().insertContentAt(pos, nodes).run();
    return;
  }

  editor.chain().focus().insertContent(nodes).run();
}

export async function ingestAndInsertImages(
  editor: Editor,
  sources: IngestImageSource[],
  range?: SlashRange,
): Promise<void> {
  const storage = imageStorage(editor);
  const notePath = storage.notePath;
  if (!notePath || sources.length === 0) {
    return;
  }

  const inserted: Array<{ src: string }> = [];
  for (const source of sources) {
    const result = await ingestImage(notePath, source, {
      compress: storage.compress,
      maxEdge: storage.maxEdge ?? DEFAULT_COMPRESS_MAX_EDGE,
    });
    if (!result.ok) {
      storage.onNotice?.(result.reason);
      continue;
    }
    if (result.warning) {
      storage.onNotice?.(result.warning);
    }
    inserted.push({ src: result.src });
  }

  if (inserted.length > 0) {
    insertImageBlocks(editor, inserted, range);
  }
}

export async function insertImagesFromPicker(editor: Editor, range?: SlashRange): Promise<void> {
  const paths = await pickImageFiles();
  if (paths.length === 0) {
    return;
  }
  await ingestAndInsertImages(
    editor,
    paths.map((path) => ({ type: 'path', path })),
    range,
  );
}
