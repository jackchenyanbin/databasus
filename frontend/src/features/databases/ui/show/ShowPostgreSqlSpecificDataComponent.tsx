import { useTranslation } from 'react-i18next';

import { type Database, PostgresBackupType, PostgresqlVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const postgresqlVersionLabels = {
  [PostgresqlVersion.PostgresqlVersion12]: '12',
  [PostgresqlVersion.PostgresqlVersion13]: '13',
  [PostgresqlVersion.PostgresqlVersion14]: '14',
  [PostgresqlVersion.PostgresqlVersion15]: '15',
  [PostgresqlVersion.PostgresqlVersion16]: '16',
  [PostgresqlVersion.PostgresqlVersion17]: '17',
  [PostgresqlVersion.PostgresqlVersion18]: '18',
};

export const ShowPostgreSqlSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation();
  const backupType = database.postgresql?.backupType;
  const backupTypeLabels: Record<string, string> = {
    [PostgresBackupType.PG_DUMP]: t('database.backupTypePgDump'),
    [PostgresBackupType.WAL_V1]: t('database.backupTypeWal'),
  };
  const backupTypeLabel = backupType
    ? (backupTypeLabels[backupType] ?? backupType)
    : t('database.backupTypeDefault');

  const renderPgDumpDetails = () => (
    <>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.pgVersion')}</div>
        <div>
          {database.postgresql?.version ? postgresqlVersionLabels[database.postgresql.version] : ''}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('database.host')}</div>
        <div>{database.postgresql?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.port')}</div>
        <div>{database.postgresql?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.username')}</div>
        <div>{database.postgresql?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.dbNameShort')}</div>
        <div>{database.postgresql?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.useHttps')}</div>
        <div>{database.postgresql?.isHttps ? t('common.yes') : t('common.no')}</div>
      </div>

      {!!database.postgresql?.includeSchemas?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.includeSchemas')}</div>
          <div>{database.postgresql.includeSchemas.join(', ')}</div>
        </div>
      )}
    </>
  );

  const renderWalDetails = () => (
    <>
      {database.postgresql?.version && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('database.pgVersion')}</div>
          <div>{postgresqlVersionLabels[database.postgresql.version]}</div>
        </div>
      )}
    </>
  );

  const renderDetails = () => {
    switch (backupType) {
      case PostgresBackupType.WAL_V1:
        return renderWalDetails();
      default:
        return renderPgDumpDetails();
    }
  };

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('database.backupType')}</div>
        <div>{backupTypeLabel}</div>
      </div>

      {renderDetails()}
    </div>
  );
};
