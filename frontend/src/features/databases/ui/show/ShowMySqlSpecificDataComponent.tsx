import { useTranslation } from 'react-i18next';

import { type Database, MysqlVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const mysqlVersionLabels = {
  [MysqlVersion.MysqlVersion57]: '5.7',
  [MysqlVersion.MysqlVersion80]: '8.0',
  [MysqlVersion.MysqlVersion84]: '8.4',
};

export const ShowMySqlSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.mysqlVersion')}</div>
        <div>{database.mysql?.version ? mysqlVersionLabels[database.mysql.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('database.host')}</div>
        <div>{database.mysql?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.port')}</div>
        <div>{database.mysql?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.username')}</div>
        <div>{database.mysql?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.dbNameShort')}</div>
        <div>{database.mysql?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.useHttps')}</div>
        <div>{database.mysql?.isHttps ? t('common.yes') : t('common.no')}</div>
      </div>
    </div>
  );
};
