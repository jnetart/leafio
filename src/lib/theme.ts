import type { ThemeMode } from './preferences';

export function resolveIsDark(theme: ThemeMode, systemPrefersDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark);
}

/** Native WKWebView widgets (scrollbars, form controls) follow this, not `.dark`. */
export function documentColorScheme(isDark: boolean): 'dark' | 'light' {
  return isDark ? 'dark' : 'light';
}

export function applyDocumentTheme(root: HTMLElement, isDark: boolean): void {
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = documentColorScheme(isDark);
}
