import { describe, expect, it } from 'vitest';
import { classifyExternalChange } from '../src/lib/external-change';

describe('classifyExternalChange', () => {
  it('ignores events that match the last known disk snapshot', () => {
    expect(
      classifyExternalChange({
        diskContent: 'hello',
        baseline: 'hello',
        editorContent: 'hello world',
        dirty: true,
      }),
    ).toBe('ignore');
  });

  it('syncs when disk caught up to the editor', () => {
    expect(
      classifyExternalChange({
        diskContent: 'hello world',
        baseline: 'hello',
        editorContent: 'hello world',
        dirty: true,
      }),
    ).toBe('sync');
  });

  it('reloads silently when the editor has no unsaved edits', () => {
    expect(
      classifyExternalChange({
        diskContent: 'from disk',
        baseline: 'saved',
        editorContent: 'saved',
        dirty: false,
      }),
    ).toBe('reload');
  });

  it('prompts when unsaved edits would be lost', () => {
    expect(
      classifyExternalChange({
        diskContent: 'from disk',
        baseline: 'saved',
        editorContent: 'local draft',
        dirty: true,
      }),
    ).toBe('prompt');
  });
});
