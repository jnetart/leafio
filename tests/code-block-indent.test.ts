import { describe, expect, it } from 'vitest';
import {
  getCodeBlockLineRange,
  indentCodeBlockText,
  outdentCodeBlockText,
  tabStringForSize,
} from '../src/editor/codeBlockIndent';

describe('codeBlockIndent', () => {
  it('builds a tab string from the configured width', () => {
    expect(tabStringForSize(2)).toBe('  ');
    expect(tabStringForSize(4)).toBe('    ');
  });

  it('indents each line with the configured tab string', () => {
    expect(indentCodeBlockText('a\nb', tabStringForSize(4))).toBe('    a\n    b');
  });

  it('outdents leading spaces up to tab width', () => {
    expect(outdentCodeBlockText('  hello\n    world', 2)).toBe('hello\n  world');
    expect(outdentCodeBlockText('    world', 4)).toBe('world');
  });

  it('outdents a leading tab character', () => {
    expect(outdentCodeBlockText('\tline', 2)).toBe('line');
  });

  it('resolves the affected line range inside a code block', () => {
    const text = 'line one\nline two\nline three';
    expect(getCodeBlockLineRange(text, 10, 10)).toEqual({
      lineStart: 9,
      lineEnd: 17,
      selectedText: 'line two',
    });
  });
});
