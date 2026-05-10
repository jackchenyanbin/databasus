import { Button, Modal, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../../constants';
import { type Database, DatabaseType, databaseApi } from '../../../../entity/databases';

interface Props {
  database: Database;
  onReadOnlyUserUpdated: (database: Database) => void;

  onGoBack: () => void;
  onSkipped: () => void;
  onAlreadyExists: () => void;
}

const PRIVILEGES_TRUNCATE_LENGTH = 50;

export const CreateReadOnlyComponent = ({
  database,
  onReadOnlyUserUpdated,
  onGoBack,
  onSkipped,
  onAlreadyExists,
}: Props) => {
  const { t } = useTranslation();
  const [isCheckingReadOnlyUser, setIsCheckingReadOnlyUser] = useState(false);
  const [isCreatingReadOnlyUser, setIsCreatingReadOnlyUser] = useState(false);
  const [isShowSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [isPrivilegesExpanded, setIsPrivilegesExpanded] = useState(false);

  const isPostgres = database.type === DatabaseType.POSTGRES;
  const isMysql = database.type === DatabaseType.MYSQL;
  const isMariadb = database.type === DatabaseType.MARIADB;
  const isMongodb = database.type === DatabaseType.MONGODB;
  const databaseTypeName = isPostgres
    ? 'PostgreSQL'
    : isMysql
      ? 'MySQL'
      : isMariadb
        ? 'MariaDB'
        : isMongodb
          ? 'MongoDB'
          : 'database';

  const privilegesLabelI18n = isMongodb ? t('database.rolesLabel') : t('database.privilegesLabel');

  const checkReadOnlyUser = async (): Promise<boolean> => {
    try {
      const response = await databaseApi.isUserReadOnly(database);
      setPrivileges(response.privileges || []);
      return response.isReadOnly;
    } catch (e) {
      alert((e as Error).message);
      return false;
    }
  };

  const getPrivilegesDisplay = () => {
    const fullText = privileges.join(', ');
    if (isPrivilegesExpanded || fullText.length <= PRIVILEGES_TRUNCATE_LENGTH) {
      return fullText;
    }

    return fullText.substring(0, PRIVILEGES_TRUNCATE_LENGTH) + '...';
  };

  const shouldShowExpandToggle = () => {
    const fullText = privileges.join(', ');
    return fullText.length > PRIVILEGES_TRUNCATE_LENGTH;
  };

  const createReadOnlyUser = async () => {
    setIsCreatingReadOnlyUser(true);

    try {
      const response = await databaseApi.createReadOnlyUser(database);

      if (isPostgres && database.postgresql) {
        database.postgresql.username = response.username;
        database.postgresql.password = response.password;
      } else if (isMysql && database.mysql) {
        database.mysql.username = response.username;
        database.mysql.password = response.password;
      } else if (isMariadb && database.mariadb) {
        database.mariadb.username = response.username;
        database.mariadb.password = response.password;
      } else if (isMongodb && database.mongodb) {
        database.mongodb.username = response.username;
        database.mongodb.password = response.password;
      }

      onReadOnlyUserUpdated(database);
    } catch (e) {
      alert((e as Error).message);
    }

    setIsCreatingReadOnlyUser(false);
  };

  const handleSkip = () => {
    setShowSkipConfirmation(true);
  };

  const handleSkipConfirmed = () => {
    setShowSkipConfirmation(false);
    onSkipped();
  };

  useEffect(() => {
    const run = async () => {
      setIsCheckingReadOnlyUser(true);

      const isReadOnly = await checkReadOnlyUser();
      if (isReadOnly) {
        onAlreadyExists();
      }

      setIsCheckingReadOnlyUser(false);
    };
    run();
  }, []);

  if (isCheckingReadOnlyUser) {
    return (
      <div className="flex items-center">
        <Spin />
        <span className="ml-3">{t('database.checkingReadOnly')}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <p className="mb-3 text-lg font-bold">{t('database.roQuestion')}</p>

        <p className="mb-2">
          {t('database.roExplainPrefix')}{databaseTypeName}{t('database.roExplainSuffix')}
        </p>

        <ul className="mb-2 ml-5 list-disc">
          <li>{t('database.roBulletPrevent')}</li>
          <li>{t('database.roBulletLeast')}</li>
          <li>{t('database.roBulletBestPractice')}</li>
        </ul>

        <p className="mb-2">
          {t('database.roSecurityLine')}
          <a
            href="https://databasus.com/security"
            target="_blank"
            rel="noreferrer"
            className="!text-blue-600 dark:!text-blue-400"
          >
            {t('database.roReadDetails')}
          </a>
          {t('database.roSecuritySuffix')}
        </p>

        <p className="mt-3">
          <b>{t('database.roCoreMessage')}</b>{t('database.roCoreSuffix')}
        </p>

        <p className="mt-3">
          {privileges.length === 0 ? (
            <>{t('database.roNoWrite', { label: privilegesLabelI18n })}</>
          ) : (
            <>
              {t('database.roHasWrite', { label: privilegesLabelI18n })}{' '}
              <span
                className={shouldShowExpandToggle() ? 'cursor-pointer hover:opacity-80' : ''}
                onClick={() =>
                  shouldShowExpandToggle() && setIsPrivilegesExpanded(!isPrivilegesExpanded)
                }
              >
                {getPrivilegesDisplay()}
                {shouldShowExpandToggle() && (
                  <span className="ml-1 text-xs text-blue-600 hover:opacity-80">
                    ({isPrivilegesExpanded ? t('database.collapse') : t('database.expand')})
                  </span>
                )}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="mt-5 flex">
        <Button className="mr-auto" type="primary" ghost onClick={() => onGoBack()}>
          {t('common.back')}
        </Button>

        {!IS_CLOUD && (
          <Button className="mr-2 ml-auto" danger ghost onClick={handleSkip}>
            {t('database.skip')}
          </Button>
        )}

        <Button
          type="primary"
          onClick={createReadOnlyUser}
          loading={isCreatingReadOnlyUser}
          disabled={isCreatingReadOnlyUser}
        >
          {t('database.roCreateBtn')}
        </Button>
      </div>

      <Modal
        title={t('database.roSkipTitle')}
        open={isShowSkipConfirmation}
        onCancel={() => setShowSkipConfirmation(false)}
        footer={null}
        width={450}
      >
        <div className="mb-5">
          <p className="mb-2">{t('database.roSkipConfirm')}</p>

          <p className="mb-2">{t('database.roSkipExplain')}</p>

          <p>{t('database.roSkipAdvice')}</p>
        </div>

        <div className="flex justify-end">
          <Button className="mr-2" danger ghost onClick={handleSkipConfirmed}>
            {t('database.roAcceptRisks')}
          </Button>

          <Button type="primary" onClick={() => setShowSkipConfirmation(false)}>
            {t('database.roContinueSecure')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
