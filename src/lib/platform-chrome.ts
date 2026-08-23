import { platform } from './platform';

/** Apply platform-specific titlebar / sidebar chrome CSS variables on :root. */
export function installPlatformChrome(): void {
  document.documentElement.dataset.platform = platform;
}
