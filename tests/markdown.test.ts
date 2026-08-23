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
});
