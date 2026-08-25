import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import type { UpdateCheckInterval } from './preferences';

const DAY_MS = 24 * 60 * 60 * 1000;

export function updateCheckIntervalMs(interval: UpdateCheckInterval): number {
  switch (interval) {
    case '3days':
      return 3 * DAY_MS;
    case 'weekly':
      return 7 * DAY_MS;
    case 'off':
    case 'daily':
    default:
      // `off` still silently checks once per day, then the user installs manually.
      return DAY_MS;
  }
}

export function shouldAutoCheck(
  interval: UpdateCheckInterval,
  lastCheckAt: string | null,
  now = Date.now(),
): boolean {
  const elapsed = lastCheckAt ? now - Date.parse(lastCheckAt) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(elapsed)) {
    return true;
  }
  return elapsed >= updateCheckIntervalMs(interval);
}

export async function getAppVersion(): Promise<string> {
  try {
    return await getVersion();
  } catch {
    return '0.8.43';
  }
}

export async function checkForAppUpdate(): Promise<Update | null> {
  try {
    return await check();
  } catch (error) {
    // Web / missing endpoint / network — treat as "no update" for auto checks.
    console.warn('Update check failed:', error);
    throw error;
  }
}

export async function downloadAndInstallUpdate(
  update: Update,
  onEvent?: (event: DownloadEvent) => void,
): Promise<void> {
  await update.downloadAndInstall(onEvent);
  await relaunch();
}
