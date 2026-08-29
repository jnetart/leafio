import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
  type AutoSaveInterval,
  type EditorFontFamily,
  type EditorFontSize,
  type EditorTabWidth,
  type EditorWidthMode,
  type ExportFormat,
  type LanguageMode,
  type LaunchBehavior,
  type ThemeMode,
} from '../lib/preferences';
import { loadPreferences, savePreferences } from '../lib/preferences-store';

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPreferences()
      .then((loaded) => {
        setPreferences(loaded);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  const updatePreferences = useCallback((updater: (current: AppPreferences) => AppPreferences) => {
    setPreferences((current) => {
      const next = updater(current);
      void savePreferences(next);
      return next;
    });
  }, []);

  const setEditorWidthMode = useCallback(
    (editorWidthMode: EditorWidthMode) => {
      updatePreferences((current) => ({ ...current, editorWidthMode }));
    },
    [updatePreferences],
  );

  const setEditorFontFamily = useCallback(
    (editorFontFamily: EditorFontFamily) => {
      updatePreferences((current) => ({ ...current, editorFontFamily }));
    },
    [updatePreferences],
  );

  const setEditorFontSize = useCallback(
    (editorFontSize: EditorFontSize) => {
      updatePreferences((current) => ({ ...current, editorFontSize }));
    },
    [updatePreferences],
  );

  const setEditorTabWidth = useCallback(
    (editorTabWidth: EditorTabWidth) => {
      updatePreferences((current) => ({ ...current, editorTabWidth }));
    },
    [updatePreferences],
  );

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      updatePreferences((current) => ({ ...current, theme }));
    },
    [updatePreferences],
  );

  const setLanguage = useCallback(
    (language: LanguageMode) => {
      updatePreferences((current) => ({ ...current, language }));
    },
    [updatePreferences],
  );

  const setLaunchBehavior = useCallback(
    (launchBehavior: LaunchBehavior) => {
      updatePreferences((current) => ({ ...current, launchBehavior }));
    },
    [updatePreferences],
  );

  const setAutoUpdateEnabled = useCallback(
    (autoUpdateEnabled: boolean) => {
      updatePreferences((current) => ({ ...current, autoUpdateEnabled }));
    },
    [updatePreferences],
  );

  const setLastUpdateCheckAt = useCallback(
    (lastUpdateCheckAt: string) => {
      updatePreferences((current) => ({ ...current, lastUpdateCheckAt }));
    },
    [updatePreferences],
  );

  const setCompressImages = useCallback(
    (compressImages: boolean) => {
      updatePreferences((current) => ({ ...current, compressImages }));
    },
    [updatePreferences],
  );

  const setCompressMaxEdge = useCallback(
    (compressMaxEdge: number) => {
      updatePreferences((current) => ({ ...current, compressMaxEdge }));
    },
    [updatePreferences],
  );

  const setAutoSaveInterval = useCallback(
    (autoSaveInterval: AutoSaveInterval) => {
      updatePreferences((current) => ({ ...current, autoSaveInterval }));
    },
    [updatePreferences],
  );

  const setSpellCheck = useCallback(
    (spellCheck: boolean) => {
      updatePreferences((current) => ({ ...current, spellCheck }));
    },
    [updatePreferences],
  );

  const setDefaultExportFormat = useCallback(
    (defaultExportFormat: ExportFormat) => {
      updatePreferences((current) => ({ ...current, defaultExportFormat }));
    },
    [updatePreferences],
  );

  const setIncludeFrontmatter = useCallback(
    (includeFrontmatter: boolean) => {
      updatePreferences((current) => ({ ...current, includeFrontmatter }));
    },
    [updatePreferences],
  );

  return {
    ...preferences,
    ready,
    setEditorWidthMode,
    setEditorFontFamily,
    setEditorFontSize,
    setEditorTabWidth,
    setTheme,
    setLanguage,
    setLaunchBehavior,
    setAutoUpdateEnabled,
    setLastUpdateCheckAt,
    setCompressImages,
    setCompressMaxEdge,
    setAutoSaveInterval,
    setSpellCheck,
    setDefaultExportFormat,
    setIncludeFrontmatter,
    setPreferences: updatePreferences,
  };
}
