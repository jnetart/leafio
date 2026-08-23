import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../src/editor/markdown';
import {
  computeDocumentStats,
  countCharacters,
  countNonEmptyLines,
  countWords,
  extractPlainText,
} from '../src/lib/textStats';

describe('textStats', () => {
  it('extracts plain text without markdown syntax', () => {
    const doc = parseMarkdown('# 中文\n\n## 你是谁\n\n副本文件 sssssss\n');
    expect(extractPlainText(doc)).toBe('中文\n你是谁\n副本文件 sssssss');
  });

  it('counts characters for Chinese content', () => {
    const text = '中文\n你是谁\n副本文件 sssssss';
    expect(countCharacters(text)).toBe(16);
  });

  it('counts words with CJK per character and Latin per token', () => {
    const text = '中文\n你是谁\n副本文件ssss';
    expect(countWords(text)).toBe(10);
  });

  it('counts non-empty content lines', () => {
    const text = '中文\n你是谁\n副本文件ssss';
    expect(countNonEmptyLines(text)).toBe(3);
  });

  it('uses character count for zh-CN locale', () => {
    const doc = parseMarkdown('# 中文\n\n## 你是谁\n\n副本文件ssss\n');
    expect(computeDocumentStats(doc, 'zh-CN')).toEqual({ words: 13, lines: 3 });
  });

  it('uses word count for en locale', () => {
    const doc = parseMarkdown('# 中文\n\n## 你是谁\n\n副本文件ssss\n');
    expect(computeDocumentStats(doc, 'en')).toEqual({ words: 10, lines: 3 });
  });
});
