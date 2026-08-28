import { describe, expect, it } from 'vitest';
import {
  attachFootnotes,
  countRefs,
  definitionPlainText,
  displayNumbers,
  nextIdentifier,
  orderDefinitionsForSerialize,
  usedIdentifiers,
} from '../src/editor/footnoteModel';
import { parseMarkdown, serializeMarkdown } from '../src/editor/markdown';
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

describe('countRefs', () => {
  it('countRefs counts matching references', () => {
    const doc = docWith([{ type: 'paragraph', content: [ref('1'), ref('1')] }], [def('1', 'x')]);
    expect(countRefs(doc, '1')).toBe(2);
    expect(countRefs(doc, 'missing')).toBe(0);
  });
});

describe('markdown footnotes', () => {
  it('round-trips a numeric footnote', () => {
    const md = 'This claim still holds.[^1]\n\n[^1]: From the 1912 marginalia.\n';
    const doc = parseMarkdown(md);
    const paragraph = doc.content?.[0];
    expect(paragraph?.type).toBe('paragraph');
    expect(paragraph?.content?.some((n) => n.type === 'footnoteReference' && n.attrs?.identifier === '1')).toBe(
      true,
    );
    expect(doc.content?.at(-1)?.type).toBe('footnotes');
    expect(doc.content?.at(-1)?.content?.[0]?.type).toBe('footnoteDefinition');
    expect(doc.content?.at(-1)?.content?.[0]?.attrs?.identifier).toBe('1');

    const out = serializeMarkdown(doc);
    expect(out).toContain('[^1]');
    expect(out).toContain('[^1]:');
    expect(out).toContain('From the 1912 marginalia.');
    expect(out).not.toContain('footnotes');
    expect(out).not.toMatch(/Footnotes|脚注/);
  });

  it('preserves a named identifier', () => {
    const md = 'See the later note.[^smith]\n\n[^smith]: Same as appendix B.\n';
    const doc = parseMarkdown(md);
    expect(
      doc.content?.[0]?.content?.some((n) => n.type === 'footnoteReference' && n.attrs?.identifier === 'smith'),
    ).toBe(true);
    const out = serializeMarkdown(doc);
    expect(out).toContain('[^smith]');
    expect(out).toContain('[^smith]:');
  });

  it('shares one definition across two refs', () => {
    const md = 'One.[^1] Two.[^1]\n\n[^1]: Shared.\n';
    const doc = parseMarkdown(md);
    const refs = (doc.content?.[0]?.content ?? []).filter((n) => n.type === 'footnoteReference');
    expect(refs).toHaveLength(2);
    expect(doc.content?.at(-1)?.content).toHaveLength(1);
    expect(serializeMarkdown(doc)).toContain('Shared.');
  });

  it('moves a mid-file definition to the end on serialize', () => {
    const md = '[^1]: Mid.\n\nBody.[^1]\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0]?.type).toBe('paragraph');
    expect(doc.content?.at(-1)?.type).toBe('footnotes');
    const out = serializeMarkdown(doc).trim();
    expect(out.startsWith('Body.')).toBe(true);
    expect(out.indexOf('[^1]:')).toBeGreaterThan(out.indexOf('[^1]'));
  });

  it('keeps an orphan definition', () => {
    const md = 'No refs.\n\n[^ghost]: Still here.\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.at(-1)?.content?.[0]?.attrs?.identifier).toBe('ghost');
    expect(serializeMarkdown(doc)).toContain('[^ghost]:');
  });

  it('keeps the first of duplicate definitions', () => {
    const md = 'Cite.[^1]\n\n[^1]: First.\n\n[^1]: Second.\n';
    const doc = parseMarkdown(md);
    const defs = doc.content?.at(-1)?.content ?? [];
    expect(defs).toHaveLength(1);
    expect(serializeMarkdown(doc)).toContain('First.');
    expect(serializeMarkdown(doc)).not.toContain('Second.');
  });

  it('strips an empty paragraph before the notes container', () => {
    const doc = parseMarkdown('Body.[^1]\n\n[^1]: Note.\n');
    const withGap = {
      ...doc,
      content: [
        ...(doc.content ?? []).slice(0, -1),
        { type: 'paragraph', content: [] },
        (doc.content ?? []).at(-1)!,
      ],
    };
    const out = serializeMarkdown(withGap);
    expect(out).toContain('Body.');
    expect(out).toContain('[^1]:');
    expect(out).not.toMatch(/\n\n\n/);
  });

  it('serializes an empty definition so the ref does not dangle', () => {
    const doc = {
      type: 'doc',
      content: attachFootnotes(
        [{ type: 'paragraph', content: [{ type: 'text', text: 'Cite.' }, ref('1')] }],
        [def('1')],
      ),
    };
    const out = serializeMarkdown(doc);
    expect(out).toContain('[^1]');
    expect(out).toContain('[^1]:');
  });
});

