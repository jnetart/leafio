import type { JSONContent } from '@tiptap/react';

export function tableHasCellBackground(table: JSONContent): boolean {
  for (const row of table.content ?? []) {
    for (const cell of row.content ?? []) {
      if (cell.attrs?.backgroundColor) {
        return true;
      }
    }
  }
  return false;
}

export function serializeTableAsHtml(table: JSONContent): string {
  const rows = (table.content ?? [])
    .map((row) => {
      const cells = (row.content ?? [])
        .map((cell) => {
          const tag = cell.type === 'tableHeader' ? 'th' : 'td';
          const backgroundColor = cell.attrs?.backgroundColor as string | undefined;
          const style = backgroundColor ? ` style="background-color: ${backgroundColor}"` : '';
          const inner = tiptapCellContentToHtml(cell);
          return `<${tag}${style}>${inner}</${tag}>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  return `<table>\n${rows}\n</table>`;
}

function tiptapCellContentToHtml(cell: JSONContent): string {
  const parts: string[] = [];
  for (const block of cell.content ?? []) {
    if (block.type === 'paragraph') {
      parts.push(tiptapInlineToHtml(block.content ?? []));
    }
  }
  return parts.join('<br />') || '';
}

function tiptapInlineToHtml(nodes: JSONContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') {
        return '<br />';
      }
      if (node.type !== 'text' || !node.text) {
        return '';
      }

      let html = escapeHtml(node.text);
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') {
          html = `<strong>${html}</strong>`;
        } else if (mark.type === 'italic') {
          html = `<em>${html}</em>`;
        } else if (mark.type === 'strike') {
          html = `<del>${html}</del>`;
        } else if (mark.type === 'code') {
          html = `<code>${html}</code>`;
        } else if (mark.type === 'link') {
          const href = escapeHtml(String(mark.attrs?.href ?? ''));
          html = `<a href="${href}">${html}</a>`;
        } else if (mark.type === 'highlight') {
          html = `<mark>${html}</mark>`;
        }
      }
      return html;
    })
    .join('');
}

export function parseHtmlTable(html: string): JSONContent | null {
  const trimmed = html.trim();
  if (!/^<table[\s>]/i.test(trimmed)) {
    return null;
  }

  const rowMatches = [...trimmed.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rowMatches.length === 0) {
    return null;
  }

  const content = rowMatches.map((rowMatch) => {
    const rowHtml = rowMatch[1];
    const cellMatches = [
      ...rowHtml.matchAll(/<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi),
    ];

    return {
      type: 'tableRow',
      content: cellMatches.map((cellMatch) => {
        const tag = cellMatch[1].toLowerCase();
        const attrs = cellMatch[2];
        const innerHtml = cellMatch[3];
        const backgroundColor = parseBackgroundColor(attrs);

        return {
          type: tag === 'th' ? 'tableHeader' : 'tableCell',
          ...(backgroundColor ? { attrs: { backgroundColor } } : {}),
          content: [
            {
              type: 'paragraph',
              content: htmlInlineToTiptap(innerHtml),
            },
          ],
        } satisfies JSONContent;
      }),
    } satisfies JSONContent;
  });

  if (content.every((row) => (row.content?.length ?? 0) === 0)) {
    return null;
  }

  return { type: 'table', content };
}

function parseBackgroundColor(attrs: string): string | null {
  const styleMatch = attrs.match(/style="([^"]*)"/i);
  if (!styleMatch) {
    return null;
  }
  const backgroundMatch = styleMatch[1].match(/background-color:\s*([^;"]+)/i);
  return backgroundMatch?.[1]?.trim() ?? null;
}

function htmlInlineToTiptap(html: string): JSONContent[] {
  const normalized = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div)[^>]*>/gi, '')
    .trim();

  if (!normalized) {
    return [];
  }

  if (!/[<>]/.test(normalized)) {
    return [{ type: 'text', text: decodeHtmlEntities(normalized) }];
  }

  return parseInlineHtmlFragment(normalized);
}

function parseInlineHtmlFragment(html: string): JSONContent[] {
  const result: JSONContent[] = [];
  const tagPattern =
    /<(strong|b|em|i|del|s|code|mark|a)(\s[^>]*)?>([\s\S]*?)<\/\1>|<(br\s*\/?)>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      result.push(...textNodes(decodeHtmlEntities(html.slice(lastIndex, match.index))));
    }

    if (match[4]) {
      result.push({ type: 'hardBreak' });
    } else {
      const tag = match[1].toLowerCase();
      const attrs = match[2] ?? '';
      const inner = match[3];
      const children = parseInlineHtmlFragment(inner);
      const mark = markForTag(tag, attrs);
      if (mark) {
        result.push(...applyMarkToNodes(children, mark));
      } else {
        result.push(...children);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    result.push(...textNodes(decodeHtmlEntities(html.slice(lastIndex))));
  }

  return result.length > 0 ? result : textNodes(decodeHtmlEntities(stripTags(html)));
}

function textNodes(text: string): JSONContent[] {
  if (!text) {
    return [];
  }
  return text.split('\n').flatMap((part, index, parts) => {
    const nodes: JSONContent[] = [];
    if (part) {
      nodes.push({ type: 'text', text: part });
    }
    if (index < parts.length - 1) {
      nodes.push({ type: 'hardBreak' });
    }
    return nodes;
  });
}

function markForTag(tag: string, attrs: string): { type: string; attrs?: Record<string, unknown> } | null {
  switch (tag) {
    case 'strong':
    case 'b':
      return { type: 'bold' };
    case 'em':
    case 'i':
      return { type: 'italic' };
    case 'del':
    case 's':
      return { type: 'strike' };
    case 'code':
      return { type: 'code' };
    case 'mark':
      return { type: 'highlight' };
    case 'a': {
      const hrefMatch = attrs.match(/href="([^"]*)"/i);
      return { type: 'link', attrs: { href: hrefMatch?.[1] ?? '' } };
    }
    default:
      return null;
  }
}

function applyMarkToNodes(
  nodes: JSONContent[],
  mark: { type: string; attrs?: Record<string, unknown> },
): JSONContent[] {
  return nodes.map((node) => {
    if (node.type !== 'text') {
      return node;
    }
    return {
      ...node,
      marks: [
        ...(node.marks ?? []),
        mark.attrs ? { type: mark.type, attrs: mark.attrs } : { type: mark.type },
      ],
    };
  });
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
