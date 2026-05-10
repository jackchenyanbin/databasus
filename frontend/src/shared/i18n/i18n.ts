import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

export type Language = 'en' | 'zh';

export const LANGUAGE_STORAGE_KEY = 'databasus-language';
export const DEFAULT_LANGUAGE: Language = 'en';

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') {
    return stored;
  }

  const browserLang = (navigator.language || '').toLowerCase();
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }

  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: detectInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
