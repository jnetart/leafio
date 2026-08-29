import { describe, expect, it } from 'vitest';
import {
  MACOS_TRAFFIC_LIGHTS,
  resolveChromeSurface,
  trafficLightDragZoneWidth,
} from './platform-chrome';

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

  it('uses settings chrome when settings is open, even if multiple tabs exist', () => {
    expect(
      resolveChromeSurface({
        showTabBar: true,
        settingsOpen: true,
        showWelcomeScreen: false,
      }),
    ).toBe('settings');
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

describe('trafficLightDragZoneWidth', () => {
  it('matches the Overlay CSS offset used to clear the native cluster', () => {
    expect(MACOS_TRAFFIC_LIGHTS).toEqual({
      x: 16,
      y: 22,
      button: 12,
      gap: 8,
      trailingGap: 10,
    });
    expect(trafficLightDragZoneWidth()).toBe(78);
  });
});
