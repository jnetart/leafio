import type { JSONContent } from '@tiptap/react';

export const PANEL_BLOCK_TYPES = new Set(['table', 'codeBlock', 'horizontalRule', 'image', 'footnotes']);

const TEXTBLOCK_TYPES = new Set(['paragraph', 'heading']);

export function isPanelBlockType(type: string): boolean {
  return PANEL_BLOCK_TYPES.has(type);
}

export function isTextblockType(type: string): boolean {
  return TEXTBLOCK_TYPES.has(type);
}

export function isEmptyParagraphContent(node: JSONContent): boolean {
  if (node.type !== 'paragraph') {
    return false;
  }
  const content = node.content ?? [];
  return content.length === 0 || content.every((child) => child.type === 'hardBreak');
}

export function stripEditorSpacingParagraphs(doc: JSONContent): JSONContent {
  const content = [...(doc.content ?? [])];

  while (content.length > 0 && isEmptyParagraphContent(content[content.length - 1]!)) {
    content.pop();
  }

  while (
    content.length >= 2 &&
    content[content.length - 1]?.type === 'footnotes' &&
    isEmptyParagraphContent(content[content.length - 2]!)
  ) {
    content.splice(content.length - 2, 1);
  }

  const filtered = content.filter((node, index) => {
    if (!isEmptyParagraphContent(node)) {
      return true;
    }

    const prev = content[index - 1];
    const next = content[index + 1];
    if (!prev?.type || !next?.type) {
      return false;
    }

    if (next.type === 'footnotes') {
      return false;
    }

    if (isPanelBlockType(prev.type) && isPanelBlockType(next.type)) {
      return false;
    }

    return isTextblockType(prev.type) || isTextblockType(next.type);
  });

  return { ...doc, content: filtered };
}
