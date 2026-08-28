import { describe, expect, it } from 'vitest';
import {
  attachFootnotes,
  definitionPlainText,
  displayNumbers,
  nextIdentifier,
  orderDefinitionsForSerialize,
  usedIdentifiers,
} from '../src/editor/footnoteModel';
import type { JSONContent } from '@tiptap/react';

function ref(identifier: string): JSONContent {
  return { type: 'footnoteReference', attrs: { identifier } };
}

function def(identifier: string, text = ''): JSONContent {
  return {
    type: 'footnoteDefinition',
    attrs: { identifier },
    content: text
      ? [{ type: 'paragraph', content: [{ type: 'text', text }] }]
      : [{ type: 'paragraph' }],
  };
}

function docWith(body: JSONContent[], definitions: JSONContent[] = []): JSONContent {
  return { type: 'doc', content: attachFootnotes(body, definitions) };
}

describe('nextIdentifier', () => {
  it('starts at 1 on an empty set', () => {
    expect(nextIdentifier([])).toBe('1');
  });

  it('skips used numeric ids and ignores named ids', () => {
    expect(nextIdentifier(['1', 'smith'])).toBe('2');
  });

  it('reuses the smallest missing positive integer', () => {
    expect(nextIdentifier(['1', '2', 'smith'])).toBe('3');
    expect(nextIdentifier(['1', '3'])).toBe('2');
  });
});

describe('displayNumbers', () => {
  it('numbers by first reference order, not identifier value', () => {
    const doc = docWith(
      [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'A' }, ref('smith'), { type: 'text', text: 'B' }, ref('1')],
        },
      ],
      [def('smith', 'named'), def('1', 'one')],
    );
    expect(displayNumbers(doc)).toEqual({ smith: 1, '1': 2 });
  });

  it('reuses the number for a second ref with the same identifier', () => {
    const doc = docWith(
      [
        {
          type: 'paragraph',
          content: [ref('1'), { type: 'text', text: ' ' }, ref('1')],
        },
      ],
      [def('1', 'once')],
    );
    expect(displayNumbers(doc)).toEqual({ '1': 1 });
  });
});

describe('usedIdentifiers', () => {
  it('includes both refs and definitions', () => {
    const doc = docWith(
      [{ type: 'paragraph', content: [ref('1')] }],
      [def('1', 'a'), def('orphan', 'left')],
    );
    expect([...usedIdentifiers(doc)].sort()).toEqual(['1', 'orphan']);
  });
});

describe('orderDefinitionsForSerialize', () => {
  it('emits first-reference order then leftover orphans', () => {
    const doc = docWith(
      [{ type: 'paragraph', content: [ref('b'), ref('a')] }],
      [def('orphan', 'o'), def('a', 'A'), def('b', 'B')],
    );
    expect(orderDefinitionsForSerialize(doc).map((node) => node.attrs?.identifier)).toEqual([
      'b',
      'a',
      'orphan',
    ]);
  });
});

describe('definitionPlainText', () => {
  it('joins text from nested paragraphs', () => {
    expect(definitionPlainText(def('1', 'From the 1912 marginalia.'))).toBe(
      'From the 1912 marginalia.',
    );
  });
});
