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

function isScrollableY(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element);
  if (!/(auto|scroll|overlay)/.test(overflowY)) {
    return false;
  }
  return element.scrollHeight > element.clientHeight + 1;
}

function findScrollableAncestor(start: EventTarget | null): HTMLElement | null {
  let node = start instanceof Node ? start : null;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && isScrollableY(node)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Block macOS rubber-band scroll from exposing the window background. */
function installOverscrollGuard(): void {
  document.addEventListener(
    'wheel',
    (event) => {
      const scrollable = findScrollableAncestor(event.target);
      if (!scrollable) {
        event.preventDefault();
        return;
      }

      const { deltaY } = event;
      if (deltaY === 0) {
        return;
      }

      const atTop = scrollable.scrollTop <= 0;
      const atBottom =
        scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;

      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
        event.preventDefault();
      }
    },
    { passive: false, capture: true },
  );
}

export function installDesktopGuard(): void {
  if (!isTauri()) {
    return;
  }

  installOverscrollGuard();

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
