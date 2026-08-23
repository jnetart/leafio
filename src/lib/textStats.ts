import type { JSONContent } from '@tiptap/react';
import type { ResolvedLocale } from './preferences';

const CJK_CHAR = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

function extractBlockText(node: JSONContent): string {
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  if (!node.content) {
    return '';
  }
  return node.content.map(extractBlockText).join('');
}

/** Plain text per block, joined with newlines (excludes Markdown syntax). */
export function extractPlainText(doc: JSONContent): string {
  if (!doc.content?.length) {
    return '';
  }
  return doc.content.map(extractBlockText).join('\n');
}

/** Character count excluding whitespace — matches Chinese 「字数」 convention. */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length;
}

/** Word count for Latin tokens plus one per CJK character. */
export function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  let count = 0;
  let inLatinWord = false;

  for (const char of normalized) {
    if (/\s/.test(char)) {
      inLatinWord = false;
      continue;
    }
    if (CJK_CHAR.test(char)) {
      count += 1;
      inLatinWord = false;
    } else if (/[0-9A-Za-z]/.test(char)) {
      if (!inLatinWord) {
        count += 1;
        inLatinWord = true;
      }
    } else {
      inLatinWord = false;
    }
  }

  return count;
}

export function countNonEmptyLines(text: string): number {
  if (!text) {
    return 0;
  }
  return text.split('\n').filter((line) => line.trim()).length;
}

export function computeDocumentStats(doc: JSONContent, locale: ResolvedLocale) {
  const plainText = extractPlainText(doc);
  const lines = countNonEmptyLines(plainText);
  const words =
    locale === 'zh-CN' ? countCharacters(plainText) : countWords(plainText);
  return { words, lines };
}
