import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '../src/editor/markdown';

describe('markdown serialization', () => {
  it('round-trips a heading and paragraph', () => {
    const md = '# Hello\n\nThis is a paragraph.\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0].type).toBe('heading');
    expect(doc.content?.[0].attrs?.level).toBe(1);
    expect(doc.content?.[1].type).toBe('paragraph');
    expect(serializeMarkdown(doc).trim()).toContain('# Hello');
    expect(serializeMarkdown(doc)).toContain('This is a paragraph.');
  });

  it('parses bullet lists', () => {
    const md = '- one\n- two\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0].type).toBe('bulletList');
    expect(doc.content?.[0].content?.length).toBe(2);
  });

  it('parses fenced code blocks', () => {
    const md = '```js\nconsole.log("hi")\n```\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0].type).toBe('codeBlock');
    expect(doc.content?.[0].attrs?.language).toBe('js');
  });

  it('parses task lists', () => {
    const md = '- [x] done\n- [ ] todo\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0].type).toBe('taskList');
    expect(doc.content?.[0].content?.[0].attrs?.checked).toBe(true);
    expect(doc.content?.[0].content?.[1].attrs?.checked).toBe(false);
  });

  it('parses inline marks', () => {
    const md = '**bold** and *italic*\n';
    const doc = parseMarkdown(md);
    const inline = doc.content?.[0].content ?? [];
    expect(inline.some((n) => n.marks?.some((m) => m.type === 'bold'))).toBe(true);
    expect(inline.some((n) => n.marks?.some((m) => m.type === 'italic'))).toBe(true);
  });

  it('parses links and highlights', () => {
    const md = '[Leafio](https://leafio.app) and ==highlight==\n';
    const doc = parseMarkdown(md);
    const inline = doc.content?.[0].content ?? [];
    expect(
      inline.some(
        (n) => n.marks?.some((m) => m.type === 'link' && m.attrs?.href === 'https://leafio.app'),
      ),
    ).toBe(true);
    expect(inline.some((n) => n.marks?.some((m) => m.type === 'highlight'))).toBe(true);

    const roundTrip = serializeMarkdown(doc);
    expect(roundTrip).toContain('[Leafio](https://leafio.app)');
    expect(roundTrip).toContain('==highlight==');
  });

  it('parses and serializes tables', () => {
    const md = '| Name | Value |\n| --- | --- |\n| foo | bar |\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0].type).toBe('table');
    expect(doc.content?.[0].content?.[0].content?.[0].type).toBe('tableHeader');

    const roundTrip = serializeMarkdown(doc);
    expect(roundTrip).toContain('| Name | Value |');
    expect(roundTrip).toContain('foo');
    expect(roundTrip).toContain('bar');
  });

  it('strips trailing empty paragraphs added for editing', () => {
    const doc = parseMarkdown('```js\nconsole.log("hi")\n```\n');
    const withTrailing = {
      ...doc,
      content: [
        ...(doc.content ?? []),
        { type: 'paragraph', content: [] },
      ],
    };
    expect(serializeMarkdown(withTrailing).trim()).toBe('```js\nconsole.log("hi")\n```');
  });

  it('strips empty paragraphs between adjacent block nodes', () => {
    const table = parseMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |\n').content?.[0];
    const codeBlock = parseMarkdown('```js\nconsole.log("hi")\n```\n').content?.[0];
    const withGap = {
      type: 'doc',
      content: [table, { type: 'paragraph', content: [] }, codeBlock],
    } as const;

    const serialized = serializeMarkdown(withGap);
    expect(serialized).toContain('| A | B |');
    expect(serialized).toContain('```js');
    expect(serialized).not.toMatch(/\n\n\n/);
  });

  it('keeps intentional blank lines between paragraphs', () => {
    const doc = parseMarkdown('First line.\n\nSecond line.\n');
    expect(serializeMarkdown(doc)).toContain('First line.');
    expect(serializeMarkdown(doc)).toContain('Second line.');
  });

  it('round-trips table cell background colors via HTML', () => {
    const doc = parseMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |\n');
    const table = doc.content?.[0];
    expect(table?.type).toBe('table');

    const cell = table?.content?.[1]?.content?.[0];
    if (cell) {
      cell.type = 'tableCell';
      cell.attrs = { backgroundColor: 'rgba(91, 140, 111, 0.18)' };
    }

    const serialized = serializeMarkdown(doc);
    expect(serialized).toContain('<table>');
    expect(serialized).toContain('background-color: rgba(91, 140, 111, 0.18)');

    const roundTrip = parseMarkdown(serialized);
    const roundTripCell = roundTrip.content?.[0]?.content?.[1]?.content?.[0];
    expect(roundTripCell?.attrs?.backgroundColor).toBe('rgba(91, 140, 111, 0.18)');
  });

  it('parses a standalone markdown image as a block', () => {
    const doc = parseMarkdown('![架构](./api-guide.assets/architecture.png)\n');
    expect(doc.content?.[0]).toEqual({
      type: 'image',
      attrs: {
        src: './api-guide.assets/architecture.png',
        alt: '架构',
        width: null,
      },
    });
  });

  it('serializes unsized images as markdown and sized images as html', () => {
    const unsized = serializeMarkdown({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: './n.assets/a.png', alt: 'a', width: null },
        },
      ],
    });
    expect(unsized).toContain('![a](./n.assets/a.png)');
    expect(unsized).not.toContain('<img');

    const sized = serializeMarkdown({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: './n.assets/a.png', alt: 'a', width: 480 },
        },
      ],
    });
    expect(sized).toContain('<img');
    expect(sized).toContain('src="./n.assets/a.png"');
    expect(sized).toContain('width="480"');
    expect(sized).not.toContain('height=');
  });

  it('round-trips html img width', () => {
    const md = '<img src="./n.assets/a.png" alt="shot" width="480">\n';
    const doc = parseMarkdown(md);
    expect(doc.content?.[0]?.type).toBe('image');
    expect(doc.content?.[0]?.attrs?.width).toBe(480);
    expect(serializeMarkdown(doc)).toContain('width="480"');
  });

  it('splits inline images out of paragraphs', () => {
    const doc = parseMarkdown('see ![x](./a.png) here\n');
    const types = (doc.content ?? []).map((node) => node.type);
    expect(types).toEqual(['paragraph', 'image', 'paragraph']);
  });
});
