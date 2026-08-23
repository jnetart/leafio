import { useCallback } from 'react';

export function useWindowDrag() {
  return useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [data-no-drag]')) {
      return;
    }

    void import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => getCurrentWindow().startDragging())
      .catch(() => {
        // Not running inside Tauri — CSS drag region only.
      });
  }, []);
}
