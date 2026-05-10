import { useTranslation } from 'react-i18next';

import { type Database, getDatabaseLogoFromType } from '../../../../entity/databases';

interface Props {
  database: Database;
  isShowName?: boolean;
  isShowType?: boolean;
}

export const ShowDatabaseBaseInfoComponent = ({ database, isShowName, isShowType }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      {isShowName && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('common.name')}</div>
          <div>{database.name || ''}</div>
        </div>
      )}

      {isShowType && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.dbType')}</div>
          <div className="flex items-center">
            <span>{database.type === 'POSTGRES' ? 'PostgreSQL' : 'MySQL'}</span>
            <img
              src={getDatabaseLogoFromType(database.type)}
              alt="databaseIcon"
              className="ml-2 h-4 w-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};
