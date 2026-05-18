import { useTranslation } from 'react-i18next';

import { type Database, MariadbVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const mariadbVersionLabels: Record<MariadbVersion, string> = {
  [MariadbVersion.MariadbVersion55]: '5.5',
  [MariadbVersion.MariadbVersion101]: '10.1',
  [MariadbVersion.MariadbVersion102]: '10.2',
  [MariadbVersion.MariadbVersion103]: '10.3',
  [MariadbVersion.MariadbVersion104]: '10.4',
  [MariadbVersion.MariadbVersion105]: '10.5',
  [MariadbVersion.MariadbVersion106]: '10.6',
  [MariadbVersion.MariadbVersion1011]: '10.11',
  [MariadbVersion.MariadbVersion114]: '11.4',
  [MariadbVersion.MariadbVersion118]: '11.8',
  [MariadbVersion.MariadbVersion120]: '12.0',
};

export const ShowMariaDbSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.mariadbVersion')}</div>
        <div>{database.mariadb?.version ? mariadbVersionLabels[database.mariadb.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('database.host')}</div>
        <div>{database.mariadb?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.port')}</div>
        <div>{database.mariadb?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.username')}</div>
        <div>{database.mariadb?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.dbNameShort')}</div>
        <div>{database.mariadb?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.useHttps')}</div>
        <div>{database.mariadb?.isHttps ? t('common.yes') : t('common.no')}</div>
      </div>

      {database.mariadb?.isExcludeEvents && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.excludeEvents')}</div>
          <div>{t('common.yes')}</div>
        </div>
      )}

      {!!database.mariadb?.excludeTables?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">Exclude tables</div>
          <div>{database.mariadb.excludeTables.join(', ')}</div>
        </div>
      )}
    </div>
  );
};
