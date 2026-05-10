import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

import { type Language, useLanguage } from '../i18n';

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  zh: '中文',
};

const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  en: 'EN',
  zh: '中',
};

export function LanguageToggleComponent() {
  const { language, setLanguage } = useLanguage();

  const items: MenuProps['items'] = (Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => ({
    key: lang,
    label: (
      <div className="flex items-center gap-2">
        <span>{LANGUAGE_LABELS[lang]}</span>
      </div>
    ),
    onClick: () => setLanguage(lang),
  }));

  return (
    <Dropdown
      menu={{ items, selectedKeys: [language] }}
      trigger={['click']}
      placement="bottomRight"
    >
      <button
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        title={LANGUAGE_LABELS[language]}
      >
        <GlobeIcon />
        <span className="hidden sm:inline">{LANGUAGE_SHORT_LABELS[language]}</span>
      </button>
    </Dropdown>
  );
}
