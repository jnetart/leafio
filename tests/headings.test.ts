import { describe, expect, it } from 'vitest';
import { extractHeadings } from '../src/lib/headings';
import { parseMarkdown } from '../src/editor/markdown';

describe('extractHeadings', () => {
  it('extracts heading text from document', () => {
    const doc = parseMarkdown('# Alpha\n\n## Beta\n');
    expect(extractHeadings(doc)).toEqual([
      { id: 'heading-0', level: 1, text: 'Alpha' },
      { id: 'heading-1', level: 2, text: 'Beta' },
    ]);
  });
});
