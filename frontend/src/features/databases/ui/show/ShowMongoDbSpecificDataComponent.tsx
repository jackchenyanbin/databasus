import { useTranslation } from 'react-i18next';

import { type Database } from '../../../../entity/databases';

interface Props {
  database: Database;
}

export const ShowMongoDbSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('database.host')}</div>
        <div>{database.mongodb?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.port')}</div>
        <div>{database.mongodb?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.username')}</div>
        <div>{database.mongodb?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.dbNameShort')}</div>
        <div>{database.mongodb?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.useHttps')}</div>
        <div>{database.mongodb?.isHttps ? t('common.yes') : t('common.no')}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.cpuCount')}</div>
        <div>{database.mongodb?.cpuCount}</div>
      </div>

      {database.mongodb?.isDirectConnection && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.directConnection')}</div>
          <div>{t('common.yes')}</div>
        </div>
      )}

      {database.mongodb?.authDatabase && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.authDatabase')}</div>
          <div>{database.mongodb.authDatabase}</div>
        </div>
      )}

      {!!database.mongodb?.excludeCollections?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">Exclude collections</div>
          <div>{database.mongodb.excludeCollections.join(', ')}</div>
        </div>
      )}
    </div>
  );
};
