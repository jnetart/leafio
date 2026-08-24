import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
  type EditorFontFamily,
  type EditorFontSize,
  type EditorWidthMode,
  type LanguageMode,
  type LaunchBehavior,
  type ThemeMode,
} from '../lib/preferences';
import { loadPreferences, savePreferences } from '../lib/preferences-store';

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPreferences().then((loaded) => {
      setPreferences(loaded);
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

  return {
    ...preferences,
    ready,
    setEditorWidthMode,
    setEditorFontFamily,
    setEditorFontSize,
    setTheme,
    setLanguage,
    setLaunchBehavior,
    setPreferences: updatePreferences,
  };
}
