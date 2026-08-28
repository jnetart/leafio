import { platform } from './platform';

/** Titlebar overlay fill when the sidebar is collapsed. */
export type ChromeSurface = 'window' | 'paper' | 'settings' | 'tabs';

/** Apply platform-specific titlebar / sidebar chrome CSS variables on :root. */
export function installPlatformChrome(): void {
  document.documentElement.dataset.platform = platform;
}

/**
 * Collapsed sidebar chrome sits on top of the title row.
 * Multi-tab uses the tab strip, so the overlay must stay transparent
 * (paper/settings/window fills would flash as a white block).
 * Single-tab has no strip — match the content surface underneath.
 */
export function resolveChromeSurface(input: {
  showTabBar: boolean;
  settingsOpen: boolean;
  showWelcomeScreen: boolean;
}): ChromeSurface {
  if (input.showTabBar) {
    return 'tabs';
  }
  if (input.settingsOpen) {
    return 'settings';
  }
  if (input.showWelcomeScreen) {
    return 'window';
  }
  return 'paper';
}
