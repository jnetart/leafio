import { describe, expect, it } from 'vitest';
import { shouldAutoCheck, updateCheckIntervalMs } from './app-update';

describe('updateCheckIntervalMs', () => {
  it('treats off and daily as one day', () => {
    expect(updateCheckIntervalMs('off')).toBe(24 * 60 * 60 * 1000);
    expect(updateCheckIntervalMs('daily')).toBe(24 * 60 * 60 * 1000);
  });

  it('uses multi-day intervals', () => {
    expect(updateCheckIntervalMs('3days')).toBe(3 * 24 * 60 * 60 * 1000);
    expect(updateCheckIntervalMs('weekly')).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('shouldAutoCheck', () => {
  const now = Date.parse('2026-08-25T12:00:00.000Z');

  it('checks when never checked before', () => {
    expect(shouldAutoCheck('daily', null, now)).toBe(true);
  });

  it('skips when last check is recent', () => {
    const recent = new Date(now - 60 * 60 * 1000).toISOString();
    expect(shouldAutoCheck('daily', recent, now)).toBe(false);
  });

  it('checks when interval elapsed', () => {
    const old = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    expect(shouldAutoCheck('off', old, now)).toBe(true);
  });
});
