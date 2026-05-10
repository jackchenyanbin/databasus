import type { Locale } from 'antd/es/locale';
import { createContext } from 'react';

import type { Language } from './i18n';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  antdLocale: Locale;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
