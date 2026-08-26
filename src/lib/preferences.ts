export type EditorWidthMode = 'centered' | 'wide';
export type EditorFontFamily = 'sans' | 'serif' | 'mono';
export type EditorFontSize = 'compact' | 'medium' | 'large' | 'xlarge';
export type EditorTabWidth = 2 | 4;
export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguageMode = 'system' | 'zh-CN' | 'en';
export type LaunchBehavior = 'welcome' | 'last';
export type ResolvedLocale = 'zh-CN' | 'en';

export interface AppPreferences {
  editorWidthMode: EditorWidthMode;
  editorFontFamily: EditorFontFamily;
  editorFontSize: EditorFontSize;
  editorTabWidth: EditorTabWidth;
  theme: ThemeMode;
  language: LanguageMode;
  launchBehavior: LaunchBehavior;
  autoUpdateEnabled: boolean;
  /** ISO timestamp of the last successful update check. */
  lastUpdateCheckAt: string | null;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  editorWidthMode: 'centered',
  editorFontFamily: 'sans',
  editorFontSize: 'medium',
  editorTabWidth: 2,
  theme: 'system',
  language: 'system',
  launchBehavior: 'welcome',
  autoUpdateEnabled: true,
  lastUpdateCheckAt: null,
};

/** Maps stored prefs, including the old interval field, onto a boolean. */
export function resolveAutoUpdateEnabled(stored: {
  autoUpdateEnabled?: unknown;
  updateCheckInterval?: unknown;
}): boolean {
  if (typeof stored.autoUpdateEnabled === 'boolean') {
    return stored.autoUpdateEnabled;
  }
  if (stored.updateCheckInterval === 'off') {
    return false;
  }
  return true;
}
