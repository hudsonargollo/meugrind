/**
 * Internationalization (i18n) system for MEUGRIND
 * Supports Portuguese (default) and English
 */

export type Language = 'pt' | 'en';

export interface I18nConfig {
  defaultLanguage: Language;
  supportedLanguages: Language[];
}

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'pt',
  supportedLanguages: ['pt', 'en'],
};

// Language detection from browser
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return i18nConfig.defaultLanguage;
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check for Portuguese variants
  if (browserLang.startsWith('pt')) {
    return 'pt';
  }
  
  // Check for English variants
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // Default to Portuguese for other languages
  return i18nConfig.defaultLanguage;
}

// Get stored language preference
export function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('meugrind-language');
  if (stored && i18nConfig.supportedLanguages.includes(stored as Language)) {
    return stored as Language;
  }
  
  return null;
}

// Store language preference
export function setStoredLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meugrind-language', language);
}

// Get current language with fallback logic
export function getCurrentLanguage(): Language {
  // 1. Check stored preference
  const stored = getStoredLanguage();
  if (stored) return stored;
  
  // 2. Check browser language
  const detected = detectBrowserLanguage();
  
  // 3. Store the detected language for future use
  setStoredLanguage(detected);
  
  return detected;
}