import { describe, expect, it } from 'vitest';
import { WELCOME_RECENT_LIMIT, welcomeRecentFiles } from './welcome';

describe('welcomeRecentFiles', () => {
  it('keeps the most recent entries in order', () => {
    const paths = ['a.md', 'b.md', 'c.md'];
    expect(welcomeRecentFiles(paths)).toEqual(paths);
  });

  it('caps the list so the welcome stack can stay centered', () => {
    const paths = Array.from({ length: 12 }, (_, i) => `${i}.md`);
    const visible = welcomeRecentFiles(paths);
    expect(visible).toHaveLength(WELCOME_RECENT_LIMIT);
    expect(visible).toEqual(paths.slice(0, WELCOME_RECENT_LIMIT));
  });
});
