import { DEFAULT_COMPRESS_MAX_EDGE } from './image-assets';

export type EditorWidthMode = 'centered' | 'wide';
export type EditorFontFamily = 'sans' | 'serif' | 'mono';
export type EditorFontSize = 'compact' | 'medium' | 'large' | 'xlarge';
export type EditorTabWidth = 2 | 4;
export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguageMode = 'system' | 'zh-CN' | 'en';
export type LaunchBehavior = 'welcome' | 'last';
export type ResolvedLocale = 'zh-CN' | 'en';
export type AutoSaveInterval = 0 | 2 | 5;
export type ExportFormat = 'html' | 'markdown';

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
  compressImages: boolean;
  compressMaxEdge: number;
  autoSaveInterval: AutoSaveInterval;
  spellCheck: boolean;
  defaultExportFormat: ExportFormat;
  includeFrontmatter: boolean;
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
  compressImages: false,
  compressMaxEdge: DEFAULT_COMPRESS_MAX_EDGE,
  autoSaveInterval: 2,
  spellCheck: false,
  defaultExportFormat: 'html',
  includeFrontmatter: true,
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

export function resolveAutoSaveInterval(stored: unknown): AutoSaveInterval {
  if (stored === 2 || stored === 5 || stored === 0) {
    return stored;
  }
  if (stored === '2') {
    return 2;
  }
  if (stored === '5') {
    return 5;
  }
  if (stored === 'off' || stored === '0') {
    return 0;
  }
  return DEFAULT_PREFERENCES.autoSaveInterval;
}

export function resolveSpellCheck(stored: unknown): boolean {
  return stored === true;
}

export function resolveDefaultExportFormat(stored: unknown): ExportFormat {
  return stored === 'markdown' ? 'markdown' : 'html';
}

export function resolveIncludeFrontmatter(stored: unknown): boolean {
  return stored !== false;
}
