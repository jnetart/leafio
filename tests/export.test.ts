import { describe, expect, it } from 'vitest';
import { exportBody, stripYamlFrontmatter } from '../src/lib/export';

describe('stripYamlFrontmatter', () => {
  it('removes a YAML block at the top of the file', () => {
    expect(stripYamlFrontmatter('---\ntags: [a]\n---\n\nHello')).toBe('Hello');
  });

  it('leaves files without a frontmatter fence unchanged', () => {
    expect(stripYamlFrontmatter('# Title\n\nBody')).toBe('# Title\n\nBody');
  });

  it('does not strip a thematic break later in the file', () => {
    expect(stripYamlFrontmatter('Intro\n\n---\n\nMore')).toBe('Intro\n\n---\n\nMore');
  });
});

describe('exportBody', () => {
  it('keeps markdown frontmatter when asked', () => {
    const source = '---\ntags: [a]\n---\n\nHello';
    expect(exportBody(source, 'markdown', true)).toBe(source);
  });

  it('strips markdown frontmatter when asked', () => {
    expect(exportBody('---\ntags: [a]\n---\n\nHello', 'markdown', false)).toBe('Hello');
  });
});
