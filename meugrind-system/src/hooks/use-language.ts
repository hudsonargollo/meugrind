/**
 * React hook for language management
 */

import { useState, useEffect, useCallback } from 'react';
import { Language, getCurrentLanguage, setStoredLanguage } from '../lib/i18n';
import { getTranslations, Translations } from '../lib/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Safe default for SSR
    if (typeof window === 'undefined') return 'pt';
    return getCurrentLanguage();
  });
  
  const [translations, setTranslations] = useState<Translations>(() => {
    return getTranslations(language);
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const currentLang = getCurrentLanguage();
    if (currentLang !== language) {
      setLanguage(currentLang);
      setTranslations(getTranslations(currentLang));
    }
  }, [language]);

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    setTranslations(getTranslations(newLanguage));
    setStoredLanguage(newLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'pt' ? 'en' : 'pt';
    changeLanguage(newLanguage);
  }, [language, changeLanguage]);

  return {
    language,
    translations,
    changeLanguage,
    toggleLanguage,
  };
}