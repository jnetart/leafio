export type EditorWidthMode = 'centered' | 'wide';
export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguageMode = 'system' | 'zh-CN' | 'en';
export type LaunchBehavior = 'welcome' | 'last';
export type ResolvedLocale = 'zh-CN' | 'en';

export interface AppPreferences {
  editorWidthMode: EditorWidthMode;
  theme: ThemeMode;
  language: LanguageMode;
  launchBehavior: LaunchBehavior;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  editorWidthMode: 'centered',
  theme: 'system',
  language: 'system',
  launchBehavior: 'welcome',
};
