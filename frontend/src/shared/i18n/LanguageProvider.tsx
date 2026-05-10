import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { LANGUAGE_STORAGE_KEY } from './i18n';
import type { Language } from './i18n';
import { LanguageContext } from './languageContext';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n: i18nInstance } = useTranslation();
  const [language, setLanguageState] = useState<Language>(
    (i18nInstance.language as Language) || 'en',
  );

  // Sync dayjs locale with the current language
  useEffect(() => {
    dayjs.locale(language === 'zh' ? 'zh-cn' : 'en');
    document.documentElement.setAttribute('lang', language === 'zh' ? 'zh-CN' : 'en');
  }, [language]);

  const setLanguage = useCallback(
    (newLanguage: Language) => {
      setLanguageState(newLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      i18n.changeLanguage(newLanguage);
    },
    [],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      antdLocale: language === 'zh' ? zhCN : enUS,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
