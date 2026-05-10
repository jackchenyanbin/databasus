import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FilterFilled,
  FilterOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';
import {
  type Backup,
  type BackupConfig,
  BackupEncryption,
  BackupStatus,
  PgWalBackupType,
  backupConfigApi,
  backupsApi,
} from '../../../entity/backups';
import type { BackupsFilters } from '../../../entity/backups/api/backupsApi';
import { type Database, DatabaseType, PostgresBackupType } from '../../../entity/databases';
import { getUserTimeFormat } from '../../../shared/time';
import { ConfirmationComponent } from '../../../shared/ui';
import { RestoresComponent } from '../../restores';
import { AgentRestoreComponent } from './AgentRestoreComponent';
import { BackupsBillingBannerComponent } from './BackupsBillingBannerComponent';
import { BackupsFiltersPanelComponent } from './BackupsFiltersPanelComponent';

const BACKUPS_PAGE_SIZE = 50;

interface Props {
  database: Database;
  isCanManageDBs: boolean;
  isDirectlyUnderTab?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onNavigateToBilling?: () => void;
}

export const BackupsComponent = ({
  database,
  isCanManageDBs,
  isDirectlyUnderTab,
  scrollContainerRef,
  onNavigateToBilling,
}: Props) => {
  const [isBackupsLoading, setIsBackupsLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);

  const [totalBackups, setTotalBackups] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(BACKUPS_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [backupConfig, setBackupConfig] = useState<BackupConfig | undefined>();
  const [isBackupConfigLoading, setIsBackupConfigLoading] = useState(false);

  const [isMakeBackupRequestLoading, setIsMakeBackupRequestLoading] = useState(false);

  const [showingBackupError, setShowingBackupError] = useState<Backup | undefined>();

  const [deleteConfimationId, setDeleteConfimationId] = useState<string | undefined>();
  const [deletingBackupId, setDeletingBackupId] = useState<string | undefined>();

  const [showingRestoresBackupId, setShowingRestoresBackupId] = useState<string | undefined>();

  const lastRequestTimeRef = useRef<number>(0);
  const isBackupsRequestInFlightRef = useRef(false);

  const [downloadingBackupId, setDownloadingBackupId] = useState<string | undefined>();
  const [cancellingBackupId, setCancellingBackupId] = useState<string | undefined>();

  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [filters, setFilters] = useState<BackupsFilters>({});

  const { t } = useTranslation();

  const downloadBackup = async (backupId: string) => {
    try {
      await backupsApi.downloadBackup(backupId);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDownloadingBackupId(undefined);
    }
  };

  const loadBackups = async (limit?: number, filtersOverride?: BackupsFilters) => {
    if (isBackupsRequestInFlightRef.current) return;
    isBackupsRequestInFlightRef.current = true;

    const requestTime = Date.now();
    lastRequestTimeRef.current = requestTime;

    const loadLimit = limit ?? currentLimit;
    const activeFilters = filtersOverride ?? filters;

    try {
      const response = await backupsApi.getBackups(database.id, loadLimit, 0, activeFilters);

      if (lastRequestTimeRef.current !== requestTime) return;

      setBackups(response.backups);
      setTotalBackups(response.total);
      setHasMore(response.backups.length < response.total);
    } catch (e) {
      if (lastRequestTimeRef.current === requestTime) {
        alert((e as Error).message);
      }
    } finally {
      isBackupsRequestInFlightRef.current = false;
    }
  };

  const loadMoreBackups = async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    const newLimit = currentLimit + BACKUPS_PAGE_SIZE;
    setCurrentLimit(newLimit);

    const requestTime = Date.now();
    lastRequestTimeRef.current = requestTime;

    try {
      const response = await backupsApi.getBackups(database.id, newLimit, 0, filters);

      if (lastRequestTimeRef.current !== requestTime) return;

      setBackups(response.backups);
      setTotalBackups(response.total);
      setHasMore(response.backups.length < response.total);
    } catch (e) {
      if (lastRequestTimeRef.current === requestTime) {
        alert((e as Error).message);
      }
    }

    setIsLoadingMore(false);
  };

  const makeBackup = async () => {
    setIsMakeBackupRequestLoading(true);

    try {
      await backupsApi.makeBackup(database.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentLimit(BACKUPS_PAGE_SIZE);
      setHasMore(true);
      await loadBackups(BACKUPS_PAGE_SIZE);
    } catch (e) {
      alert((e as Error).message);
    }

    setIsMakeBackupRequestLoading(false);
  };

  const deleteBackup = async () => {
    if (!deleteConfimationId) {
      return;
    }

    setDeleteConfimationId(undefined);
    setDeletingBackupId(deleteConfimationId);

    try {
      await backupsApi.deleteBackup(deleteConfimationId);
      setCurrentLimit(BACKUPS_PAGE_SIZE);
      setHasMore(true);
      await loadBackups(BACKUPS_PAGE_SIZE);
    } catch (e) {
      alert((e as Error).message);
    }

    setDeletingBackupId(undefined);
    setDeleteConfimationId(undefined);
  };

  const cancelBackup = async (backupId: string) => {
    setCancellingBackupId(backupId);

    try {
      await backupsApi.cancelBackup(backupId);
      await loadBackups();
    } catch (e) {
      alert((e as Error).message);
    }

    setCancellingBackupId(undefined);
  };

  useEffect(() => {
    setIsBackupConfigLoading(true);
    setCurrentLimit(BACKUPS_PAGE_SIZE);
    setHasMore(true);

    backupConfigApi.getBackupConfigByDbID(database.id).then((config) => {
      setBackupConfig(config);
      setIsBackupConfigLoading(false);

      setIsBackupsLoading(true);
      loadBackups(BACKUPS_PAGE_SIZE).then(() => setIsBackupsLoading(false));
    });

    return () => {};
  }, [database]);

  useEffect(() => {
    setCurrentLimit(BACKUPS_PAGE_SIZE);
    setHasMore(true);
    setIsBackupsLoading(true);
    loadBackups(BACKUPS_PAGE_SIZE, filters).then(() => setIsBackupsLoading(false));
  }, [filters]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadBackups();
    }, 1_000);

    return () => clearInterval(intervalId);
  }, [currentLimit, filters]);

  useEffect(() => {
    if (downloadingBackupId) {
      downloadBackup(downloadingBackupId);
    }
  }, [downloadingBackupId]);

  useEffect(() => {
    if (!scrollContainerRef?.current) {
      return;
    }

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

      if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !isLoadingMore) {
        loadMoreBackups();
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, currentLimit, scrollContainerRef]);

  const renderStatus = (status: BackupStatus, record: Backup) => {
    if (status === BackupStatus.FAILED) {
      return (
        <Tooltip title={t('backup.clickToSeeError')}>
          <div
            className="flex cursor-pointer items-center text-red-600 underline"
            onClick={() => setShowingBackupError(record)}
          >
            <ExclamationCircleOutlined className="mr-2" style={{ fontSize: 16 }} />
            <div>{t('backup.statusFailed')}</div>
          </div>
        </Tooltip>
      );
    }

    if (status === BackupStatus.COMPLETED) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircleOutlined className="mr-2" style={{ fontSize: 16 }} />
          <div>{t('backup.statusSuccessful')}</div>
          {record.encryption === BackupEncryption.ENCRYPTED && (
            <Tooltip title={t('backup.statusEncrypted')}>
              <LockOutlined className="ml-1" style={{ fontSize: 14 }} />
            </Tooltip>
          )}
        </div>
      );
    }

    if (status === BackupStatus.DELETED) {
      return (
        <div className="flex items-center text-gray-600">
          <DeleteOutlined className="mr-2" style={{ fontSize: 16 }} />
          <div>{t('backup.statusDeleted')}</div>
        </div>
      );
    }

    if (status === BackupStatus.IN_PROGRESS) {
      return (
        <div className="flex items-center font-bold text-blue-600">
          <SyncOutlined spin />
          <span className="ml-2">{t('backup.statusInProgress')}</span>
        </div>
      );
    }

    if (status === BackupStatus.CANCELED) {
      return (
        <div className="flex items-center text-gray-600">
          <CloseCircleOutlined className="mr-2" style={{ fontSize: 16 }} />
          <div>{t('backup.statusCanceled')}</div>
        </div>
      );
    }

    return <span className="font-bold">{status}</span>;
  };

  const renderActions = (record: Backup) => {
    return (
      <div className="flex gap-2 text-lg">
        {record.status === BackupStatus.IN_PROGRESS &&
          isCanManageDBs &&
          database.postgresql?.backupType !== PostgresBackupType.WAL_V1 && (
            <div className="flex gap-2">
              {cancellingBackupId === record.id ? (
                <SyncOutlined spin />
              ) : (
                <Tooltip title={t('backup.cancelBackupTooltip')}>
                  <CloseCircleOutlined
                    className="cursor-pointer"
                    onClick={() => {
                      if (cancellingBackupId) return;
                      cancelBackup(record.id);
                    }}
                    style={{ color: '#ff0000', opacity: cancellingBackupId ? 0.2 : 1 }}
                  />
                </Tooltip>
              )}
            </div>
          )}

        {record.status === BackupStatus.COMPLETED && (
          <div className="flex gap-2">
            {deletingBackupId === record.id ? (
              <SyncOutlined spin />
            ) : (
              <>
                {isCanManageDBs && (
                  <Tooltip title={t('backup.deleteBackupTooltip')}>
                    <DeleteOutlined
                      className="cursor-pointer"
                      onClick={() => {
                        if (deletingBackupId) return;
                        setDeleteConfimationId(record.id);
                      }}
                      style={{ color: '#ff0000', opacity: deletingBackupId ? 0.2 : 1 }}
                    />
                  </Tooltip>
                )}

                <Tooltip title={t('backup.restoreBackupTooltip')}>
                  <CloudUploadOutlined
                    className="cursor-pointer"
                    onClick={() => {
                      setShowingRestoresBackupId(record.id);
                    }}
                    style={{
                      color: '#155dfc',
                    }}
                  />
                </Tooltip>

                <Tooltip
                  title={
                    database.type === DatabaseType.POSTGRES
                      ? t('backup.downloadTooltipPostgres')
                      : database.type === DatabaseType.MYSQL
                        ? t('backup.downloadTooltipMysql')
                        : database.type === DatabaseType.MARIADB
                          ? t('backup.downloadTooltipMariadb')
                          : database.type === DatabaseType.MONGODB
                            ? t('backup.downloadTooltipMongo')
                            : t('backup.downloadTooltipDefault')
                  }
                >
                  {downloadingBackupId === record.id ? (
                    <SyncOutlined spin style={{ color: '#155dfc' }} />
                  ) : (
                    <DownloadOutlined
                      className="cursor-pointer"
                      onClick={() => {
                        if (downloadingBackupId) return;
                        setDownloadingBackupId(record.id);
                      }}
                      style={{
                        opacity: downloadingBackupId ? 0.2 : 1,
                        color: '#155dfc',
                      }}
                    />
                  )}
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const formatSize = (sizeMb: number) => {
    if (sizeMb >= 1024) {
      const sizeGb = sizeMb / 1024;
      return `${Number(sizeGb.toFixed(2)).toLocaleString()} GB`;
    }
    return `${Number(sizeMb?.toFixed(2)).toLocaleString()} MB`;
  };

  const formatDuration = (durationMs: number) => {
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const columns: ColumnsType<Backup> = [
    {
      title: t('backup.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => (
        <div>
          {dayjs.utc(createdAt).local().format(getUserTimeFormat().format)} <br />
          <span className="text-gray-500 dark:text-gray-400">
            ({dayjs.utc(createdAt).local().fromNow()})
          </span>
        </div>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('backup.backupStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: BackupStatus, record: Backup) => renderStatus(status, record),
    },
    {
      title: (
        <div className="flex items-center">
          {t('backup.size')}
          <Tooltip
            className="ml-1"
            title={t('backup.sizeTooltip')}
          >
            <InfoCircleOutlined />
          </Tooltip>
        </div>
      ),
      dataIndex: 'backupSizeMb',
      key: 'backupSizeMb',
      width: 150,
      render: (sizeMb: number, record: Backup) => (
        <div className="flex items-center gap-2">
          {formatSize(sizeMb)}
          {record.pgWalBackupType === PgWalBackupType.PG_FULL_BACKUP && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              FULL
            </span>
          )}
          {record.pgWalBackupType === PgWalBackupType.PG_WAL_SEGMENT && (
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              WAL
            </span>
          )}
        </div>
      ),
    },
    {
      title: t('backup.duration'),
      dataIndex: 'backupDurationMs',
      key: 'backupDurationMs',
      width: 150,
      render: (durationMs: number) => formatDuration(durationMs),
    },
    {
      title: t('backup.actions'),
      dataIndex: '',
      key: '',
      render: (_, record: Backup) => renderActions(record),
    },
  ];

  const isAnyFilterApplied =
    (filters.statuses && filters.statuses.length > 0) ||
    filters.beforeDate !== undefined ||
    filters.pgWalBackupType !== undefined;

  if (isBackupConfigLoading) {
    return (
      <div className="mb-5 flex items-center">
        <Spin />
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-white p-3 shadow md:p-5 dark:bg-gray-800 ${isDirectlyUnderTab ? 'rounded-tr-md rounded-br-md rounded-bl-md' : 'rounded-md'}`}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold md:text-xl dark:text-white">{t('backup.title')}</h2>
        <div className="relative">
          {isFilterPanelVisible ? (
            <FilterFilled
              className="cursor-pointer text-blue-600"
              onClick={() => setIsFilterPanelVisible(false)}
            />
          ) : (
            <FilterOutlined
              className="cursor-pointer"
              onClick={() => setIsFilterPanelVisible(true)}
            />
          )}
          {!isFilterPanelVisible && isAnyFilterApplied && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600" />
          )}
        </div>
      </div>

      {isFilterPanelVisible && (
        <div className="mt-3">
          <BackupsFiltersPanelComponent
            filters={filters}
            onFiltersChange={setFilters}
            isWalDatabase={database.postgresql?.backupType === PostgresBackupType.WAL_V1}
          />
        </div>
      )}

      {IS_CLOUD && (
        <BackupsBillingBannerComponent
          databaseId={database.id}
          isCanManageDBs={isCanManageDBs}
          onNavigateToBilling={onNavigateToBilling}
        />
      )}

      {!isBackupConfigLoading && !backupConfig?.isBackupsEnabled && (
        <div className="text-sm text-red-600">
          {t('backup.scheduledDisabled')}
        </div>
      )}

      <div className="mt-5" />

      {database.postgresql?.backupType !== PostgresBackupType.WAL_V1 && (
        <div className="flex items-center">
          <Button
            onClick={makeBackup}
            className="mr-1"
            type="primary"
            disabled={isMakeBackupRequestLoading}
            loading={isMakeBackupRequestLoading}
          >
            <span className="md:hidden">{t('backup.backupNow')}</span>
            <span className="hidden md:inline">{t('backup.makeBackupRightNow')}</span>
          </Button>
        </div>
      )}

      <div className="mt-5 w-full md:max-w-[850px]">
        {/* Mobile card view */}
        <div className="md:hidden">
          {isBackupsLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : (
            <div>
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="mb-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('backup.createdAt')}</div>
                        <div className="text-sm font-medium">
                          {dayjs.utc(backup.createdAt).local().format(getUserTimeFormat().format)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ({dayjs.utc(backup.createdAt).local().fromNow()})
                        </div>
                      </div>
                      <div>{renderStatus(backup.status, backup)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('backup.size')}</div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {formatSize(backup.backupSizeMb)}
                          {backup.pgWalBackupType === PgWalBackupType.PG_FULL_BACKUP && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              FULL
                            </span>
                          )}
                          {backup.pgWalBackupType === PgWalBackupType.PG_WAL_SEGMENT && (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              WAL
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('backup.duration')}</div>
                        <div className="text-sm font-medium">
                          {formatDuration(backup.backupDurationMs)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t border-gray-200 pt-3">
                      {renderActions(backup)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="mt-3 flex justify-center">
              <Spin />
            </div>
          )}
          {!hasMore && backups.length > 0 && (
            <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('backup.allBackupsLoaded', { total: totalBackups })}
            </div>
          )}
          {!isBackupsLoading && backups.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">{t('backup.noBackupsYetText')}</div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
          <Table
            bordered
            columns={columns}
            dataSource={backups}
            rowKey="id"
            loading={isBackupsLoading}
            size="small"
            pagination={false}
          />
          {isLoadingMore && (
            <div className="mt-2 flex justify-center">
              <Spin />
            </div>
          )}
          {!hasMore && backups.length > 0 && (
            <div className="mt-2 text-center text-gray-500 dark:text-gray-400">
              {t('backup.allBackupsLoaded', { total: totalBackups })}
            </div>
          )}
        </div>
      </div>

      {deleteConfimationId && (
        <ConfirmationComponent
          onConfirm={deleteBackup}
          onDecline={() => setDeleteConfimationId(undefined)}
          description={t('backup.deleteConfirm')}
          actionButtonColor="red"
          actionText={t('common.delete')}
        />
      )}

      {showingRestoresBackupId &&
        (database.postgresql?.backupType === PostgresBackupType.WAL_V1 ? (
          <Modal
            width={600}
            open={!!showingRestoresBackupId}
            onCancel={() => setShowingRestoresBackupId(undefined)}
            title={t('backup.restoreFromBackup')}
            footer={null}
            maskClosable={false}
          >
            <AgentRestoreComponent
              database={database}
              backup={backups.find((b) => b.id === showingRestoresBackupId) as Backup}
            />
          </Modal>
        ) : (
          <Modal
            width={400}
            open={!!showingRestoresBackupId}
            onCancel={() => setShowingRestoresBackupId(undefined)}
            title={t('backup.restoreFromBackup')}
            footer={null}
            maskClosable={false}
          >
            <RestoresComponent
              database={database}
              backup={backups.find((b) => b.id === showingRestoresBackupId) as Backup}
            />
          </Modal>
        ))}

      {showingBackupError && (
        <Modal
          title={t('backup.errorDetails')}
          open={!!showingBackupError}
          onCancel={() => setShowingBackupError(undefined)}
          maskClosable={false}
          footer={null}
        >
          <div className="text-sm">{showingBackupError.failMessage}</div>
        </Modal>
      )}
    </div>
  );
};
