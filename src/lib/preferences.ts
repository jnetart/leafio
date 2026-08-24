export type EditorWidthMode = 'centered' | 'wide';
export type EditorFontFamily = 'sans' | 'serif' | 'mono';
export type EditorFontSize = 'compact' | 'medium' | 'large' | 'xlarge';
export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguageMode = 'system' | 'zh-CN' | 'en';
export type LaunchBehavior = 'welcome' | 'last';
export type ResolvedLocale = 'zh-CN' | 'en';

export interface AppPreferences {
  editorWidthMode: EditorWidthMode;
  editorFontFamily: EditorFontFamily;
  editorFontSize: EditorFontSize;
  theme: ThemeMode;
  language: LanguageMode;
  launchBehavior: LaunchBehavior;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  editorWidthMode: 'centered',
  editorFontFamily: 'sans',
  editorFontSize: 'medium',
  theme: 'system',
  language: 'system',
  launchBehavior: 'welcome',
};
