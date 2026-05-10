import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';
import { LanguageToggleComponent } from '../../../shared/ui/LanguageToggleComponent';
import { StarButtonComponent } from '../../../shared/ui/StarButtonComponent';
import { ThemeToggleComponent } from '../../../shared/ui/ThemeToggleComponent';

export function AuthNavbarComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex h-[65px] items-center justify-center px-5 pt-5 sm:justify-start">
      <div className="flex items-center gap-3 hover:opacity-80">
        <a href="https://databasus.com" target="_blank" rel="noreferrer">
          <img className="h-[45px] w-[45px] p-1" src="/logo.svg" />
        </a>

        <div className="text-xl font-bold">
          <a
            href="https://databasus.com"
            className="!text-blue-600"
            target="_blank"
            rel="noreferrer"
          >
            Databasus
          </a>
        </div>
      </div>

      <div className="mr-3 ml-auto hidden items-center gap-5 sm:flex">
        <a
          className="!text-black hover:opacity-80 dark:!text-gray-200"
          href="https://t.me/databasus_community"
          target="_blank"
          rel="noreferrer"
        >
          {t('nav.community')}
        </a>

        {!IS_CLOUD && (
          <Tooltip title={t('nav.cloudTooltip')}>
            <a
              className="flex items-center gap-2 !text-black hover:opacity-80 dark:!text-gray-200"
              href="https://databasus.com/cloud"
              target="_blank"
              rel="noreferrer"
            >
              {t('nav.cloud')}
              <span className="relative flex h-2 w-2" aria-label={t('nav.cloudTooltip')}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            </a>
          </Tooltip>
        )}

        <div className="flex items-center gap-2">
          <StarButtonComponent />

          <LanguageToggleComponent />

          <ThemeToggleComponent />
        </div>
      </div>
    </div>
  );
}
