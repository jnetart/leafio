import type { JSONContent } from '@tiptap/react';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { parseHtmlTable, serializeTableAsHtml, tableHasCellBackground } from './tableHtml';

type MdastNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  checked?: boolean | null;
  lang?: string | null;
  url?: string;
  align?: Array<'left' | 'right' | 'center' | null>;
  children?: MdastNode[];
};

type MdastRoot = MdastNode & { type: 'root'; children: MdastNode[] };

export function parseMarkdown(md: string): JSONContent {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(normalizeHighlightSyntax(md)) as MdastRoot;
  return remarkToTiptap(tree);
}

function isEmptyParagraph(node: JSONContent): boolean {
  if (node.type !== 'paragraph') {
    return false;
  }
  const content = node.content ?? [];
  return content.length === 0 || content.every((child) => child.type === 'hardBreak');
}

function stripTrailingEmptyParagraphs(doc: JSONContent): JSONContent {
  const content = [...(doc.content ?? [])];
  while (content.length > 0 && isEmptyParagraph(content[content.length - 1]!)) {
    content.pop();
  }
  return { ...doc, content };
}

export function serializeMarkdown(doc: JSONContent): string {
  const tree = tiptapToRemark(stripTrailingEmptyParagraphs(doc));
  return unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
    })
    .stringify(tree as never);
}

function remarkToTiptap(tree: MdastRoot): JSONContent {
  const content = tree.children
    .flatMap((node) => {
      const block = convertBlock(node);
      return block ? [block] : [];
    });

  return { type: 'doc', content };
}

function convertBlock(node: MdastNode): JSONContent | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: node.depth ?? 1 },
        content: inlineToTiptap(node.children ?? []),
      };
    case 'paragraph':
      return {
        type: 'paragraph',
        content: inlineToTiptap(node.children ?? []),
      };
    case 'blockquote':
      return {
        type: 'blockquote',
        content: (node.children ?? [])
          .map((child) => convertBlock(child))
          .filter((child): child is JSONContent => child !== null),
      };
    case 'code':
      return {
        type: 'codeBlock',
        attrs: { language: node.lang ?? null },
        content: node.value ? [{ type: 'text', text: node.value }] : [],
      };
    case 'list':
      return convertList(node);
    case 'table':
      return convertTable(node);
    case 'thematicBreak':
      return { type: 'horizontalRule' };
    case 'html': {
      const table = parseHtmlTable(node.value ?? '');
      return table ?? null;
    }
    default:
      return null;
  }
}

function convertTable(node: MdastNode): JSONContent {
  return {
    type: 'table',
    content: (node.children ?? []).map((row, rowIndex) => ({
      type: 'tableRow',
      content: (row.children ?? []).map((cell) => ({
        type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
        content: [
          {
            type: 'paragraph',
            content: inlineToTiptap(cell.children ?? []),
          },
        ],
      })),
    })),
  };
}

function convertList(node: MdastNode): JSONContent {
  const items = (node.children ?? []).map((item) => convertListItem(item));
  const isTaskList = (node.children ?? []).some(
    (item) => item.checked !== null && item.checked !== undefined,
  );

  if (isTaskList) {
    return { type: 'taskList', content: items };
  }

  return node.ordered
    ? { type: 'orderedList', content: items }
    : { type: 'bulletList', content: items };
}

function convertListItem(node: MdastNode): JSONContent {
  const content = (node.children ?? [])
    .map((child) => {
      if (child.type === 'paragraph') {
        return {
          type: 'paragraph',
          content: inlineToTiptap(child.children ?? []),
        };
      }
      return convertBlock(child);
    })
    .filter((child): child is JSONContent => child !== null);

  if (node.checked !== null && node.checked !== undefined) {
    return {
      type: 'taskItem',
      attrs: { checked: node.checked },
      content: content.length > 0 ? content : [{ type: 'paragraph' }],
    };
  }

  return {
    type: 'listItem',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

function inlineToTiptap(nodes: MdastNode[]): JSONContent[] {
  const result: JSONContent[] = [];
  let highlightOpen = false;

  for (const node of nodes) {
    if (node.type === 'html') {
      if (node.value === '<mark>') {
        highlightOpen = true;
        continue;
      }
      if (node.value === '</mark>') {
        highlightOpen = false;
        continue;
      }
    }

    if (node.type === 'text') {
      const textNode: JSONContent = { type: 'text', text: node.value ?? '' };
      if (highlightOpen) {
        textNode.marks = [{ type: 'highlight' }];
      }
      result.push(textNode);
      continue;
    }

    if (node.type === 'inlineCode') {
      result.push({
        type: 'text',
        text: node.value ?? '',
        marks: [{ type: 'code' }],
      });
      continue;
    }

    if (node.type === 'break') {
      result.push({ type: 'hardBreak' });
      continue;
    }

    const mark = markForNode(node);
    if (mark) {
      result.push(...applyMark(node.children ?? [], mark));
    }
  }

  return result;
}

type TiptapMark = { type: string; attrs?: Record<string, unknown> };

function markForNode(node: MdastNode): TiptapMark | null {
  switch (node.type) {
    case 'strong':
      return { type: 'bold' };
    case 'emphasis':
      return { type: 'italic' };
    case 'delete':
      return { type: 'strike' };
    case 'link':
      return { type: 'link', attrs: { href: node.url ?? '' } };
    case 'mark':
      return { type: 'highlight' };
    default:
      return null;
  }
}

function applyMark(nodes: MdastNode[], mark: TiptapMark): JSONContent[] {
  return inlineToTiptap(nodes).map((node) => {
    if (node.type !== 'text') {
      return node;
    }
    return {
      ...node,
      marks: [...(node.marks ?? []), mark.attrs ? { type: mark.type, attrs: mark.attrs } : { type: mark.type }],
    };
  });
}

function tiptapToRemark(doc: JSONContent): MdastRoot {
  return {
    type: 'root',
    children: (doc.content ?? [])
      .map((node) => convertTiptapBlock(node))
      .filter((node): node is MdastNode => node !== null),
  };
}

function convertTiptapBlock(node: JSONContent): MdastNode | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        depth: node.attrs?.level ?? 1,
        children: tiptapInlineToRemark(node.content ?? []),
      };
    case 'paragraph':
      return {
        type: 'paragraph',
        children: tiptapInlineToRemark(node.content ?? []),
      };
    case 'blockquote':
      return {
        type: 'blockquote',
        children: (node.content ?? [])
          .map((child) => convertTiptapBlock(child))
          .filter((child): child is MdastNode => child !== null),
      };
    case 'codeBlock': {
      const text = (node.content ?? [])
        .map((child) => child.text ?? '')
        .join('');
      return {
        type: 'code',
        lang: node.attrs?.language ?? null,
        value: text,
      };
    }
    case 'bulletList':
      return {
        type: 'list',
        ordered: false,
        children: (node.content ?? []).map((item) => tiptapListItemToRemark(item, false)),
      };
    case 'orderedList':
      return {
        type: 'list',
        ordered: true,
        children: (node.content ?? []).map((item) => tiptapListItemToRemark(item, false)),
      };
    case 'taskList':
      return {
        type: 'list',
        ordered: false,
        children: (node.content ?? []).map((item) => tiptapListItemToRemark(item, true)),
      };
    case 'table':
      return convertTiptapTable(node);
    case 'horizontalRule':
      return { type: 'thematicBreak' };
    default:
      return null;
  }
}

function convertTiptapTable(node: JSONContent): MdastNode {
  if (tableHasCellBackground(node)) {
    return {
      type: 'html',
      value: serializeTableAsHtml(node),
    };
  }

  return {
    type: 'table',
    align: [] as Array<'left' | 'right' | 'center' | null>,
    children: (node.content ?? []).map((row) => ({
      type: 'tableRow',
      children: (row.content ?? []).map((cell) => ({
        type: 'tableCell',
        children: tiptapCellToRemarkInline(cell),
      })),
    })),
  };
}

function tiptapCellToRemarkInline(cell: JSONContent): MdastNode[] {
  const inline: MdastNode[] = [];

  for (const block of cell.content ?? []) {
    if (block.type === 'paragraph') {
      inline.push(...tiptapInlineToRemark(block.content ?? []));
    }
  }

  return inline.length > 0 ? inline : [{ type: 'text', value: '' }];
}

function tiptapListItemToRemark(node: JSONContent, isTask: boolean): MdastNode {
  const children = (node.content ?? [])
    .map((child) => {
      if (child.type === 'paragraph') {
        return {
          type: 'paragraph',
          children: tiptapInlineToRemark(child.content ?? []),
        };
      }
      return convertTiptapBlock(child);
    })
    .filter((child): child is MdastNode => child !== null);

  if (isTask) {
    return {
      type: 'listItem',
      checked: Boolean(node.attrs?.checked),
      children,
    };
  }

  return { type: 'listItem', children };
}

function tiptapInlineToRemark(nodes: JSONContent[]): MdastNode[] {
  const result: MdastNode[] = [];

  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      result.push({ type: 'break' });
      continue;
    }

    if (node.type !== 'text' || !node.text) {
      continue;
    }

    const marks = node.marks ?? [];
    let current: MdastNode = { type: 'text', value: node.text };

    for (const mark of marks) {
      if (mark.type === 'bold') {
        current = { type: 'strong', children: [current] };
      } else if (mark.type === 'italic') {
        current = { type: 'emphasis', children: [current] };
      } else if (mark.type === 'strike') {
        current = { type: 'delete', children: [current] };
      } else if (mark.type === 'code') {
        current = { type: 'inlineCode', value: node.text };
      } else if (mark.type === 'link') {
        current = { type: 'link', url: String(mark.attrs?.href ?? ''), children: [current] };
      } else if (mark.type === 'highlight') {
        if (current.type === 'text') {
          current = { type: 'text', value: `==${current.value}==` };
        } else {
          current = { type: 'mark', children: [current] };
        }
      }
    }

    result.push(current);
  }

  return result;
}

function normalizeHighlightSyntax(md: string): string {
  return md.replace(/==([^=\n][^=\n]*?)==/g, '<mark>$1</mark>');
}
