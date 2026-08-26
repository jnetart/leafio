import { useCallback, useEffect, useRef, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  getAppVersion,
  shouldAutoCheck,
} from '../lib/app-update';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'error';

interface UseAppUpdateOptions {
  ready: boolean;
  autoUpdateEnabled: boolean;
  lastUpdateCheckAt: string | null;
  onLastCheckAtChange: (iso: string) => void;
}

export function useAppUpdate({
  ready,
  autoUpdateEnabled,
  lastUpdateCheckAt,
  onLastCheckAtChange,
}: UseAppUpdateOptions) {
  const [appVersion, setAppVersion] = useState('…');
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadRatio, setDownloadRatio] = useState<number | null>(null);
  const checkingRef = useRef(false);
  const lastCheckAtRef = useRef(lastUpdateCheckAt);
  lastCheckAtRef.current = lastUpdateCheckAt;

  useEffect(() => {
    void getAppVersion().then(setAppVersion);
  }, []);

  const runCheck = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (checkingRef.current) {
        return;
      }
      checkingRef.current = true;
      if (!opts?.silent) {
        setStatus('checking');
      }
      setErrorMessage(null);
      try {
        const update = await checkForAppUpdate();
        const checkedAt = new Date().toISOString();
        onLastCheckAtChange(checkedAt);
        if (update) {
          setAvailableUpdate(update);
          setStatus('available');
        } else {
          setAvailableUpdate(null);
          setStatus(opts?.silent ? 'idle' : 'up-to-date');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
        if (!opts?.silent) {
          setStatus('error');
        }
      } finally {
        checkingRef.current = false;
      }
    },
    [onLastCheckAtChange],
  );

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!shouldAutoCheck(autoUpdateEnabled, lastCheckAtRef.current)) {
      return;
    }
    void runCheck({ silent: true });
  }, [ready, autoUpdateEnabled, runCheck]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = window.setInterval(() => {
      if (shouldAutoCheck(autoUpdateEnabled, lastCheckAtRef.current)) {
        void runCheck({ silent: true });
      }
    }, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [ready, autoUpdateEnabled, runCheck]);

  const installUpdate = useCallback(async () => {
    if (!availableUpdate) {
      return;
    }
    setStatus('downloading');
    setDownloadRatio(0);
    setErrorMessage(null);
    let downloaded = 0;
    let contentLength = 0;
    try {
      await downloadAndInstallUpdate(availableUpdate, (event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength ?? 0;
          downloaded = 0;
          setDownloadRatio(contentLength > 0 ? 0 : null);
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setDownloadRatio(Math.min(1, downloaded / contentLength));
          }
        } else if (event.event === 'Finished') {
          setDownloadRatio(1);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setStatus('error');
      setDownloadRatio(null);
    }
  }, [availableUpdate]);

  return {
    appVersion,
    status,
    availableUpdate,
    availableVersion: availableUpdate?.version ?? null,
    errorMessage,
    downloadRatio,
    checkForUpdates: () => runCheck({ silent: false }),
    installUpdate,
  };
}
