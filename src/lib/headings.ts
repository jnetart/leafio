import type { JSONContent } from '@tiptap/react';

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

export const OUTLINE_HEADING_SELECTOR =
  '.leafio-editor h1, .leafio-editor h2, .leafio-editor h3, .leafio-editor h4';

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

/** Exclusive end of the heading's nested subtree. */
export function headingSubtreeEnd(headings: HeadingItem[], index: number): number {
  const level = headings[index]?.level ?? 1;
  let end = index + 1;
  while (end < headings.length && headings[end].level > level) {
    end += 1;
  }
  return end;
}

export function headingHasChildren(headings: HeadingItem[], index: number): boolean {
  return headingSubtreeEnd(headings, index) > index + 1;
}

export function parentHeadingIndex(headings: HeadingItem[], index: number): number {
  const level = headings[index]?.level ?? 1;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (headings[cursor].level < level) {
      return cursor;
    }
  }
  return -1;
}

export function isOutlineHeadingHidden(
  headings: HeadingItem[],
  index: number,
  collapsedIds: ReadonlySet<string>,
): boolean {
  let parent = parentHeadingIndex(headings, index);
  while (parent >= 0) {
    if (collapsedIds.has(headings[parent].id)) {
      return true;
    }
    parent = parentHeadingIndex(headings, parent);
  }
  return false;
}

/** Nearest visible ancestor when the active heading sits inside a collapsed subtree. */
export function visibleOutlineHeadingIndex(
  headings: HeadingItem[],
  activeIndex: number,
  collapsedIds: ReadonlySet<string>,
): number {
  if (activeIndex < 0 || activeIndex >= headings.length) {
    return -1;
  }
  let index = activeIndex;
  while (index >= 0 && isOutlineHeadingHidden(headings, index, collapsedIds)) {
    index = parentHeadingIndex(headings, index);
  }
  return index;
}

/** Last heading whose top edge has crossed the reading line. */
export function headingIndexAtReadingLine(headingTops: number[], readingY: number): number {
  if (headingTops.length === 0) {
    return -1;
  }
  let active = 0;
  for (let index = 0; index < headingTops.length; index += 1) {
    if (headingTops[index] <= readingY) {
      active = index;
    } else {
      break;
    }
  }
  return active;
}

export function collapsedRailWindow(
  count: number,
  activeIndex: number,
  maxDots = 12,
): { start: number; end: number } {
  if (count <= maxDots) {
    return { start: 0, end: count };
  }
  const active = Math.min(Math.max(activeIndex, 0), count - 1);
  let start = Math.max(0, active - Math.floor(maxDots / 2));
  let end = start + maxDots;
  if (end > count) {
    end = count;
    start = count - maxDots;
  }
  return { start, end };
}
