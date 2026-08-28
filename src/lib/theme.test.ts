import { describe, expect, it } from 'vitest';
import { documentColorScheme, resolveIsDark } from './theme';

describe('resolveIsDark', () => {
  it('follows the explicit theme, and the system preference when set to system', () => {
    expect(resolveIsDark('dark', false)).toBe(true);
    expect(resolveIsDark('light', true)).toBe(false);
    expect(resolveIsDark('system', true)).toBe(true);
    expect(resolveIsDark('system', false)).toBe(false);
  });
});

describe('documentColorScheme', () => {
  it('tells WebKit to use dark native widgets when the app is dark', () => {
    expect(documentColorScheme(true)).toBe('dark');
    expect(documentColorScheme(false)).toBe('light');
  });
});
