import { describe, expect, it } from 'vitest';
import { resolveChromeSurface } from './platform-chrome';

describe('resolveChromeSurface', () => {
  it('uses the tab strip when multiple tabs are open', () => {
    expect(
      resolveChromeSurface({
        showTabBar: true,
        settingsOpen: false,
        showWelcomeScreen: false,
      }),
    ).toBe('tabs');
  });

  it('keeps tab-strip chrome even if settings is open underneath', () => {
    expect(
      resolveChromeSurface({
        showTabBar: true,
        settingsOpen: true,
        showWelcomeScreen: false,
      }),
    ).toBe('tabs');
  });

  it('matches paper when a single tab has no tab bar', () => {
    expect(
      resolveChromeSurface({
        showTabBar: false,
        settingsOpen: false,
        showWelcomeScreen: false,
      }),
    ).toBe('paper');
  });

  it('matches the welcome and settings surfaces without a tab bar', () => {
    expect(
      resolveChromeSurface({
        showTabBar: false,
        settingsOpen: false,
        showWelcomeScreen: true,
      }),
    ).toBe('window');
    expect(
      resolveChromeSurface({
        showTabBar: false,
        settingsOpen: true,
        showWelcomeScreen: false,
      }),
    ).toBe('settings');
  });
});
