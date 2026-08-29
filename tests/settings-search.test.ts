import { describe, expect, it } from 'vitest';
import { searchSettings } from '../src/lib/settings-search';

describe('searchSettings', () => {
  it('returns no hits for an empty query', () => {
    expect(searchSettings('')).toEqual([]);
    expect(searchSettings('   ')).toEqual([]);
  });

  it('matches a setting by its Chinese title', () => {
    const hits = searchSettings('语言');
    expect(hits.map((hit) => hit.id)).toContain('language');
    expect(hits.find((hit) => hit.id === 'language')?.section).toBe('general');
    expect(hits.find((hit) => hit.id === 'language')?.kind).toBe('setting');
  });

  it('matches a setting by its English title', () => {
    expect(searchSettings('spell').map((hit) => hit.id)).toContain('spell');
  });

  it('matches a section by name', () => {
    const hits = searchSettings('外观');
    expect(hits.some((hit) => hit.id === 'section-appearance' && hit.kind === 'section')).toBe(
      true,
    );
  });

  it('matches descriptions and option labels', () => {
    expect(searchSettings('YAML').map((hit) => hit.id)).toContain('frontmatter');
    expect(searchSettings('宽屏').map((hit) => hit.id)).toContain('width');
  });

  it('returns nothing when nothing matches', () => {
    expect(searchSettings('zzzz-no-such-setting')).toEqual([]);
  });
});
