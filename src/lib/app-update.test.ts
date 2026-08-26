import { describe, expect, it } from 'vitest';
import { shouldAutoCheck } from './app-update';

describe('shouldAutoCheck', () => {
  const now = Date.parse('2026-08-25T12:00:00.000Z');

  it('never checks when auto-update is off', () => {
    expect(shouldAutoCheck(false, null, now)).toBe(false);
    const old = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    expect(shouldAutoCheck(false, old, now)).toBe(false);
  });

  it('checks when enabled and never checked before', () => {
    expect(shouldAutoCheck(true, null, now)).toBe(true);
  });

  it('skips when last check is recent', () => {
    const recent = new Date(now - 60 * 60 * 1000).toISOString();
    expect(shouldAutoCheck(true, recent, now)).toBe(false);
  });

  it('checks when a day has elapsed', () => {
    const old = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    expect(shouldAutoCheck(true, old, now)).toBe(true);
  });
});
