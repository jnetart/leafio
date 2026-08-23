import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { setWorkspaceWatchers } from '../lib/fs';

export function useWorkspaceWatcher(workspacePaths: string[], onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pathsKey = workspacePaths.join('\0');

  useEffect(() => {
    void setWorkspaceWatchers(workspacePaths);
  }, [pathsKey, workspacePaths]);

  useEffect(() => {
    let debounceTimer: number | undefined;
    let unlisten: (() => void) | undefined;

    void listen('workspace-fs-changed', () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        onChangeRef.current();
      }, 300);
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      window.clearTimeout(debounceTimer);
      unlisten?.();
      void setWorkspaceWatchers([]);
    };
  }, []);
}
