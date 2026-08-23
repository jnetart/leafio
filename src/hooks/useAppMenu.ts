import { useEffect, useRef } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import {
  buildAppMenu,
  updateAppMenu,
  type AppMenuAction,
  type AppMenuHandle,
} from '../lib/app-menu';
import type { AppMenuState } from '../lib/app-menu-state';
import type { createTranslator } from '../lib/i18n';

export function useAppMenu(
  ready: boolean,
  t: ReturnType<typeof createTranslator>,
  state: AppMenuState,
  onAction: (action: AppMenuAction) => void,
) {
  const handleRef = useRef<AppMenuHandle | null>(null);
  const onActionRef = useRef(onAction);
  const stateRef = useRef(state);
  onActionRef.current = onAction;
  stateRef.current = state;

  useEffect(() => {
    if (!ready || !isTauri()) {
      return;
    }

    void buildAppMenu(t, (action) => onActionRef.current(action))
      .then((handle) => {
        handleRef.current = handle;
        return updateAppMenu(handle, t, stateRef.current);
      })
      .catch(() => {
        // Menu setup is best-effort; the in-app UI remains fully usable.
      });
  }, [ready, t]);

  useEffect(() => {
    if (!ready || !isTauri() || !handleRef.current) {
      return;
    }

    void updateAppMenu(handleRef.current, t, state).catch(() => {
      // Ignore menu state sync failures.
    });
  }, [ready, t, state]);
}
