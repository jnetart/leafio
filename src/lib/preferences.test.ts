import { describe, expect, it } from 'vitest';
import {
  resolveAutoSaveInterval,
  resolveAutoUpdateEnabled,
  resolveDefaultExportFormat,
  resolveIncludeFrontmatter,
  resolveSpellCheck,
} from './preferences';

describe('resolveAutoUpdateEnabled', () => {
  it('prefers the boolean preference when present', () => {
    expect(resolveAutoUpdateEnabled({ autoUpdateEnabled: true })).toBe(true);
    expect(resolveAutoUpdateEnabled({ autoUpdateEnabled: false })).toBe(false);
  });

  it('migrates legacy interval values', () => {
    expect(resolveAutoUpdateEnabled({ updateCheckInterval: 'off' })).toBe(false);
    expect(resolveAutoUpdateEnabled({ updateCheckInterval: 'daily' })).toBe(true);
    expect(resolveAutoUpdateEnabled({ updateCheckInterval: '3days' })).toBe(true);
    expect(resolveAutoUpdateEnabled({ updateCheckInterval: 'weekly' })).toBe(true);
  });

  it('defaults to enabled', () => {
    expect(resolveAutoUpdateEnabled({})).toBe(true);
  });
});

describe('resolveAutoSaveInterval', () => {
  it('accepts 2, 5, and off', () => {
    expect(resolveAutoSaveInterval(2)).toBe(2);
    expect(resolveAutoSaveInterval(5)).toBe(5);
    expect(resolveAutoSaveInterval(0)).toBe(0);
    expect(resolveAutoSaveInterval('off')).toBe(0);
  });

  it('defaults to 2 seconds', () => {
    expect(resolveAutoSaveInterval(undefined)).toBe(2);
    expect(resolveAutoSaveInterval('weekly')).toBe(2);
  });
});

describe('resolveSpellCheck', () => {
  it('defaults to off', () => {
    expect(resolveSpellCheck(undefined)).toBe(false);
  });

  it('reads a stored boolean', () => {
    expect(resolveSpellCheck(true)).toBe(true);
    expect(resolveSpellCheck(false)).toBe(false);
  });
});

describe('resolveDefaultExportFormat', () => {
  it('accepts html and markdown', () => {
    expect(resolveDefaultExportFormat('html')).toBe('html');
    expect(resolveDefaultExportFormat('markdown')).toBe('markdown');
  });

  it('defaults to html', () => {
    expect(resolveDefaultExportFormat(undefined)).toBe('html');
  });
});

describe('resolveIncludeFrontmatter', () => {
  it('defaults to including frontmatter', () => {
    expect(resolveIncludeFrontmatter(undefined)).toBe(true);
  });

  it('reads a stored boolean', () => {
    expect(resolveIncludeFrontmatter(false)).toBe(false);
  });
});
