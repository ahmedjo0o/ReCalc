import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext(null);

// Same localStorage key the legacy app used, so an existing visitor's
// language preference carries over after cutover.
const STORAGE_KEY = 'preferredLanguage';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.title = translations[language]?.pageTitle || translations.en.pageTitle;
  }, [language]);

  function setLanguage(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }

  function toggleLanguage() {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }

  const value = useMemo(
    () => ({
      language,
      dir: language === 'ar' ? 'rtl' : 'ltr',
      t: translations[language] || translations.en,
      setLanguage,
      toggleLanguage,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
