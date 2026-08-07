'use client';

import * as React from 'react';

/**
 * Chrome-level i18n (docs/07 Sprint B2). Arabic is the product language;
 * the EN toggle translates app chrome for technical teammates. Documents
 * remain Arabic-primary by rule 8.
 */
const DICT = {
  'nav.pipeline': { ar: 'المسار', en: 'Pipeline' },
  'nav.clients': { ar: 'العملاء', en: 'Clients' },
  'nav.documents': { ar: 'المستندات', en: 'Documents' },
  'nav.website': { ar: 'الموقع', en: 'Website' },
  'nav.team': { ar: 'الفريق', en: 'Team' },
  'chrome.search': { ar: 'بحث…', en: 'Search…' },
  'chrome.signout': { ar: 'خروج', en: 'Sign out' },
  'chrome.skip': { ar: 'تخطي إلى المحتوى', en: 'Skip to content' },
  'chrome.activities': { ar: 'المهام والتذكيرات', en: 'Activities' },
  'search.title': { ar: 'بحث سريع', en: 'Quick search' },
  'search.placeholder': {
    ar: 'ابحث في العملاء والمحتملين والمستندات…',
    en: 'Search clients, leads, documents…',
  },
  'search.empty': { ar: 'لا نتائج', en: 'No results' },
} as const;

export type DictKey = keyof typeof DICT;
type Locale = 'ar' | 'en';

const LocaleContext = React.createContext<{
  locale: Locale;
  toggle: () => void;
  t: (k: DictKey) => string;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Locale>('ar');

  React.useEffect(() => {
    const saved = window.localStorage.getItem('agma-locale') as Locale | null;
    if (saved === 'en') setLocale('en');
  }, []);

  React.useEffect(() => {
    // Chrome direction follows locale; document content stays RTL Arabic.
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('agma-locale', locale);
  }, [locale]);

  const value = React.useMemo(
    () => ({
      locale,
      toggle: () => setLocale((l) => (l === 'ar' ? 'en' : 'ar')),
      t: (k: DictKey) => DICT[k][locale],
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale requires <LocaleProvider>');
  return ctx;
}
