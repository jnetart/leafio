import { useEffect } from 'react';
import type { ThemeMode } from '../lib/preferences';
import { applyDocumentTheme, resolveIsDark } from '../lib/theme';

export function useTheme(theme: ThemeMode) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      applyDocumentTheme(document.documentElement, resolveIsDark(theme, media.matches));
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
