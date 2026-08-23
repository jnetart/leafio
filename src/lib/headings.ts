import type { JSONContent } from '@tiptap/react';
import type { HeadingItem } from '../components/Inspector';

export function extractHeadings(doc: JSONContent): HeadingItem[] {
  const items: HeadingItem[] = [];
  let index = 0;

  for (const node of doc.content ?? []) {
    if (node.type !== 'heading') {
      continue;
    }
    const text = (node.content ?? [])
      .map((child) => child.text ?? '')
      .join('');
    items.push({
      id: `heading-${index++}`,
      level: Number(node.attrs?.level ?? 1),
      text: text || '未命名标题',
    });
  }

  return items;
}
