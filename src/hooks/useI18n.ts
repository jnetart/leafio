import { useEffect, useMemo } from 'react';
import { createTranslator, resolveLocale } from '../lib/i18n';
import type { LanguageMode } from '../lib/preferences';

export function useI18n(language: LanguageMode) {
  const locale = resolveLocale(language);
  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
  }, [locale]);

  useEffect(() => {
    if (language !== 'system') {
      return;
    }
    const onChange = () => {
      document.documentElement.lang = resolveLocale('system') === 'zh-CN' ? 'zh-CN' : 'en';
    };
    window.addEventListener('languagechange', onChange);
    return () => window.removeEventListener('languagechange', onChange);
  }, [language]);

  return { locale, t };
}
