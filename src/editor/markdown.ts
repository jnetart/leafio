import type { JSONContent } from '@tiptap/react';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { stripEditorSpacingParagraphs } from './blockSpacing';
import {
  attachFootnotes,
  FOOTNOTE_DEF,
  FOOTNOTE_REF,
  FOOTNOTES,
  orderDefinitionsForSerialize,
} from './footnoteModel';
import { parseHtmlImage, serializeHtmlImage } from './imageHtml';
import { parseHtmlTable, serializeTableAsHtml, tableHasCellBackground } from './tableHtml';

type MdastNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  checked?: boolean | null;
  lang?: string | null;
  url?: string;
  alt?: string | null;
  identifier?: string;
  label?: string | null;
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

export function serializeMarkdown(doc: JSONContent): string {
  const tree = tiptapToRemark(stripEditorSpacingParagraphs(doc));
  return unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      handlers: {
        text(node, _parent, state, info) {
          const value = typeof node.value === 'string' ? node.value : '';
          if (!state.stack.includes('listItem')) {
            return state.safe(value, info);
          }

          const original = state.unsafe;
          state.unsafe = original.filter((pattern) => !isListItemSyntaxEscape(pattern));
          try {
            return state.safe(value, info);
          } finally {
            state.unsafe = original;
          }
        },
      },
    })
    .stringify(tree as never);
}

function isListItemSyntaxEscape(pattern: {
  atBreak?: boolean | null;
  before?: string | null;
  character: string;
}): boolean {
  if (!pattern.atBreak) {
    return false;
  }
  if (pattern.character === '#') {
    return true;
  }
  return (pattern.character === '.' || pattern.character === ')') && pattern.before === '\\d+';
}

function footnoteId(node: MdastNode): string {
  const label = typeof node.label === 'string' ? node.label : '';
  const identifier = typeof node.identifier === 'string' ? node.identifier : '';
  return label || identifier;
}

function convertFootnoteDefinition(node: MdastNode): JSONContent {
  const content = (node.children ?? []).flatMap((child) => convertBlock(child));
  return {
    type: FOOTNOTE_DEF,
    attrs: { identifier: footnoteId(node) },
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

function remarkToTiptap(tree: MdastRoot): JSONContent {
  const definitions: JSONContent[] = [];
  const seen = new Set<string>();
  const bodyNodes: MdastNode[] = [];

  for (const child of tree.children) {
    if (child.type === 'footnoteDefinition') {
      const id = footnoteId(child);
      const key = (child.identifier ?? id).toLowerCase();
      if (!id || seen.has(key)) {
        continue;
      }
      seen.add(key);
      definitions.push(convertFootnoteDefinition(child));
      continue;
    }
    bodyNodes.push(child);
  }

  const body = bodyNodes.flatMap((node) => convertBlock(node));
  return { type: 'doc', content: attachFootnotes(body, definitions) };
}

function convertBlock(node: MdastNode): JSONContent[] {
  switch (node.type) {
    case 'heading':
      return [
        {
          type: 'heading',
          attrs: { level: node.depth ?? 1 },
          content: inlineToTiptap(node.children ?? []),
        },
      ];
    case 'paragraph':
      return convertParagraph(node);
    case 'blockquote':
      return [
        {
          type: 'blockquote',
          content: (node.children ?? []).flatMap((child) => convertBlock(child)),
        },
      ];
    case 'code':
      return [
        {
          type: 'codeBlock',
          attrs: { language: node.lang ?? null },
          content: node.value ? [{ type: 'text', text: node.value }] : [],
        },
      ];
    case 'list':
      return [convertList(node)];
    case 'table':
      return [convertTable(node)];
    case 'thematicBreak':
      return [{ type: 'horizontalRule' }];
    case 'html': {
      const img = parseHtmlImage(node.value ?? '');
      if (img) {
        return [img];
      }
      const table = parseHtmlTable(node.value ?? '');
      return table ? [table] : [];
    }
    default:
      return [];
  }
}

function convertParagraph(node: MdastNode): JSONContent[] {
  const blocks: JSONContent[] = [];
  let inline: MdastNode[] = [];

  const flush = () => {
    if (inline.length === 0) {
      return;
    }
    blocks.push({ type: 'paragraph', content: inlineToTiptap(inline) });
    inline = [];
  };

  for (const child of node.children ?? []) {
    if (child.type === 'image') {
      flush();
      blocks.push(imageFromMdast(child));
      continue;
    }
    if (child.type === 'html') {
      const img = parseHtmlImage(child.value ?? '');
      if (img) {
        flush();
        blocks.push(img);
        continue;
      }
    }
    inline.push(child);
  }
  flush();
  return blocks;
}

function imageFromMdast(node: MdastNode): JSONContent {
  return {
    type: 'image',
    attrs: {
      src: node.url ?? '',
      alt: typeof node.alt === 'string' ? node.alt : '',
      width: null,
    },
  };
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
  const content = (node.children ?? []).flatMap((child) => {
    if (child.type === 'paragraph') {
      return convertParagraph(child);
    }
    return convertBlock(child);
  });

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

    if (node.type === 'footnoteReference') {
      const identifier = footnoteId(node);
      if (identifier) {
        result.push({ type: FOOTNOTE_REF, attrs: { identifier } });
      }
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

function convertFootnoteDefToMdast(node: JSONContent): MdastNode {
  const identifier = String(node.attrs?.identifier ?? '');
  const children = (node.content ?? [])
    .map((child) => convertTiptapBlock(child))
    .filter((child): child is MdastNode => child !== null);
  return {
    type: 'footnoteDefinition',
    identifier,
    label: identifier,
    children: children.length > 0 ? children : [{ type: 'paragraph', children: [] }],
  };
}

function tiptapToRemark(doc: JSONContent): MdastRoot {
  const body = (doc.content ?? [])
    .filter((node) => node.type !== FOOTNOTES)
    .map((node) => convertTiptapBlock(node))
    .filter((node): node is MdastNode => node !== null);

  const definitions = orderDefinitionsForSerialize(doc).map(convertFootnoteDefToMdast);
  return { type: 'root', children: [...body, ...definitions] };
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
    case 'image': {
      const src = String(node.attrs?.src ?? '');
      const alt = String(node.attrs?.alt ?? '');
      const width = node.attrs?.width;
      if (typeof width === 'number' && width > 0) {
        return {
          type: 'html',
          value: serializeHtmlImage({ src, alt, width }),
        };
      }
      return {
        type: 'paragraph',
        children: [{ type: 'image', url: src, alt, children: [] }],
      };
    }
    case FOOTNOTES:
      return null;
    case FOOTNOTE_DEF:
      return null;
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

    if (node.type === FOOTNOTE_REF) {
      const identifier = String(node.attrs?.identifier ?? '');
      if (identifier) {
        result.push({ type: 'footnoteReference', identifier, label: identifier });
      }
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

  trimTrailingTextWhitespace(result);
  return result;
}

function trimTrailingTextWhitespace(nodes: MdastNode[]): void {
  while (nodes.length > 0) {
    const node = nodes[nodes.length - 1];
    if (node.type === 'text') {
      const trimmed = (node.value ?? '').replace(/[ \t]+$/, '');
      if (trimmed.length > 0) {
        node.value = trimmed;
        return;
      }
      nodes.pop();
      continue;
    }

    if (node.children && node.children.length > 0) {
      trimTrailingTextWhitespace(node.children);
      if (node.children.length === 0) {
        nodes.pop();
        continue;
      }
    }

    return;
  }
}

function normalizeHighlightSyntax(md: string): string {
  return md.replace(/==([^=\n][^=\n]*?)==/g, '<mark>$1</mark>');
}
