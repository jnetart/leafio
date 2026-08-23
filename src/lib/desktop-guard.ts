import { isTauri } from '@tauri-apps/api/core';

function isReloadShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  if (key === 'f5') {
    return true;
  }
  if (key !== 'r') {
    return false;
  }
  return event.metaKey || event.ctrlKey;
}

export function installDesktopGuard(): void {
  if (!isTauri()) {
    return;
  }

  document.addEventListener(
    'contextmenu',
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );

  window.addEventListener(
    'keydown',
    (event) => {
      if (isReloadShortcut(event)) {
        event.preventDefault();
      }
    },
    { capture: true },
  );
}
