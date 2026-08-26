import { describe, expect, it } from 'vitest';
import { resolveAutoUpdateEnabled } from './preferences';

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
