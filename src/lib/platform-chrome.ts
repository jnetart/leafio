import { invoke, isTauri } from '@tauri-apps/api/core';
import { isMac, platform } from './platform';

/** Titlebar overlay fill when the sidebar is collapsed. */
export type ChromeSurface = 'window' | 'paper' | 'settings' | 'tabs';

/**
 * Native Overlay traffic lights in tauri.conf.json, plus the CSS drag-zone
 * that keeps the sidebar toggle clear of the cluster (12px buttons, 8px gaps).
 */
export const MACOS_TRAFFIC_LIGHTS = {
  x: 16,
  y: 22,
  button: 12,
  gap: 8,
  trailingGap: 10,
} as const;

export function trafficLightDragZoneWidth(
  lights: Pick<typeof MACOS_TRAFFIC_LIGHTS, 'x' | 'button' | 'gap' | 'trailingGap'> = MACOS_TRAFFIC_LIGHTS,
): number {
  return lights.x + lights.button * 3 + lights.gap * 2 + lights.trailingGap;
}

function scheduleTrafficLightReposition(): void {
  if (!isTauri() || !isMac) {
    return;
  }
  const run = () => {
    void invoke('reposition_traffic_lights').catch(() => {
      /* web preview / older builds */
    });
  };
  run();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(run);
  }
}

/** Apply platform-specific titlebar / sidebar chrome CSS variables on :root. */
export function installPlatformChrome(): void {
  document.documentElement.dataset.platform = platform;
  if (platform === 'mac') {
    document.documentElement.style.setProperty(
      '--traffic-light-offset',
      `${trafficLightDragZoneWidth()}px`,
    );
  }
  scheduleTrafficLightReposition();
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
