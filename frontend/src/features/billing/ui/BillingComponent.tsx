import { App, Button, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CLOUD_PRICE_PER_GB_CENTS } from '../../../constants';
import {
  type Invoice,
  InvoiceStatus,
  type Subscription,
  type SubscriptionEvent,
  SubscriptionEventType,
  SubscriptionStatus,
  billingApi,
} from '../../../entity/billing';
import type { Database } from '../../../entity/databases';
import { getUserShortTimeFormat, getUserTimeFormat } from '../../../shared/time';
import { PurchaseComponent } from './PurchaseComponent';

const MAX_ROWS = 25;

const STATUS_TAG_COLOR: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.Trial]: 'blue',
  [SubscriptionStatus.Active]: 'green',
  [SubscriptionStatus.PastDue]: 'orange',
  [SubscriptionStatus.Canceled]: 'red',
  [SubscriptionStatus.Expired]: 'default',
};

const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Paid]: 'green',
  [InvoiceStatus.Pending]: 'blue',
  [InvoiceStatus.Failed]: 'red',
  [InvoiceStatus.Refunded]: 'orange',
  [InvoiceStatus.Disputed]: 'red',
};

interface Props {
  database: Database;
  isCanManageDBs: boolean;
}

export const BillingComponent = ({ database, isCanManageDBs }: Props) => {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const STATUS_LABEL: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.Trial]: t('billing.statusTrial'),
    [SubscriptionStatus.Active]: t('billing.statusActive'),
    [SubscriptionStatus.PastDue]: t('billing.statusPastDue'),
    [SubscriptionStatus.Canceled]: t('billing.statusCanceled'),
    [SubscriptionStatus.Expired]: t('billing.statusExpired'),
  };

  const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
    [InvoiceStatus.Paid]: t('billing.invoicePaid'),
    [InvoiceStatus.Pending]: t('billing.invoicePending'),
    [InvoiceStatus.Failed]: t('billing.invoiceFailed'),
    [InvoiceStatus.Refunded]: t('billing.invoiceRefunded'),
    [InvoiceStatus.Disputed]: t('billing.invoiceDisputed'),
  };

  const EVENT_TYPE_LABEL: Record<SubscriptionEventType, string> = {
    [SubscriptionEventType.Created]: t('billing.eventCreated'),
    [SubscriptionEventType.Upgraded]: t('billing.eventUpgraded'),
    [SubscriptionEventType.Downgraded]: t('billing.eventDowngraded'),
    [SubscriptionEventType.NewBillingCycleStarted]: t('billing.eventNewCycle'),
    [SubscriptionEventType.Canceled]: t('billing.eventCanceled'),
    [SubscriptionEventType.Reactivated]: t('billing.eventReactivated'),
    [SubscriptionEventType.Expired]: t('billing.eventExpired'),
    [SubscriptionEventType.PastDue]: t('billing.eventPastDue'),
    [SubscriptionEventType.RecoveredFromPastDue]: t('billing.eventRecovered'),
    [SubscriptionEventType.Refund]: t('billing.eventRefund'),
    [SubscriptionEventType.Dispute]: t('billing.eventDispute'),
  };

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const loadSubscription = async (): Promise<Subscription | null> => {
    setIsLoadingSubscription(true);

    try {
      const sub = await billingApi.getSubscription(database.id);
      setSubscription(sub);

      return sub;
    } catch {
      setSubscription(null);

      return null;
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const loadInvoices = async (subscriptionId: string) => {
    setIsLoadingInvoices(true);

    try {
      const response = await billingApi.getInvoices(subscriptionId, MAX_ROWS, 0);
      setInvoices(response.invoices);
      setTotalInvoices(response.total);
    } catch {
      setInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadEvents = async (subscriptionId: string) => {
    setIsLoadingEvents(true);

    try {
      const response = await billingApi.getSubscriptionEvents(subscriptionId, MAX_ROWS, 0);
      setEvents(response.events);
      setTotalEvents(response.total);
    } catch {
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handlePortalClick = async () => {
    if (!subscription) return;

    setIsPortalLoading(true);

    try {
      const result = await billingApi.getPortalSession(subscription.id);
      window.open(result.url, '_blank');
    } catch {
      message.error(t('billing.portalFailed'));
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleSubscriptionChanged = async () => {
    const sub = await loadSubscription();

    if (sub) {
      loadInvoices(sub.id);
      loadEvents(sub.id);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [database.id]);

  useEffect(() => {
    if (!subscription) return;

    loadInvoices(subscription.id);
    loadEvents(subscription.id);
  }, [subscription?.id]);

  const timeFormat = getUserTimeFormat();
  const shortFormat = getUserShortTimeFormat();

  const canPurchase =
    subscription &&
    (subscription.status === SubscriptionStatus.Trial ||
      subscription.status === SubscriptionStatus.Expired);

  const canAccessPortal =
    subscription &&
    (subscription.status === SubscriptionStatus.Active ||
      subscription.status === SubscriptionStatus.PastDue ||
      subscription.status === SubscriptionStatus.Canceled);

  const isTrial = subscription?.status === SubscriptionStatus.Trial;
  const monthlyPrice = subscription ? subscription.storageGb * CLOUD_PRICE_PER_GB_CENTS : 0;

  const invoiceColumns: ColumnsType<Invoice> = [
    {
      title: t('billing.colPeriod'),
      dataIndex: 'periodStart',
      render: (_: unknown, record: Invoice) =>
        `${dayjs.utc(record.periodStart).local().format(shortFormat.format)} - ${dayjs.utc(record.periodEnd).local().format(shortFormat.format)}`,
    },
    {
      title: t('billing.colAmount'),
      dataIndex: 'amountCents',
      render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    },
    {
      title: t('billing.colStorage'),
      dataIndex: 'storageGb',
      render: (gb: number) => `${gb} GB`,
    },
    {
      title: t('billing.colStatus'),
      dataIndex: 'status',
      render: (status: InvoiceStatus) => (
        <Tag color={INVOICE_STATUS_COLOR[status]}>{INVOICE_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: t('billing.colPaidAt'),
      dataIndex: 'paidAt',
      render: (paidAt: string | undefined) =>
        paidAt ? dayjs.utc(paidAt).local().format(timeFormat.format) : '-',
    },
  ];

  const eventColumns: ColumnsType<SubscriptionEvent> = [
    {
      title: t('billing.colDate'),
      dataIndex: 'createdAt',
      render: (createdAt: string) => (
        <div>
          <div>{dayjs.utc(createdAt).local().format(timeFormat.format)}</div>
          <div className="text-xs text-gray-500">{dayjs.utc(createdAt).local().fromNow()}</div>
        </div>
      ),
    },
    {
      title: t('billing.colEvent'),
      dataIndex: 'type',
      render: (type: SubscriptionEventType) => EVENT_TYPE_LABEL[type] ?? type,
    },
    {
      title: t('billing.colDetails'),
      render: (_: unknown, record: SubscriptionEvent) => {
        const parts: string[] = [];

        if (record.oldStorageGb != null && record.newStorageGb != null) {
          parts.push(`${record.oldStorageGb} GB \u2192 ${record.newStorageGb} GB`);
        }

        if (record.oldStatus != null && record.newStatus != null) {
          parts.push(
            `${STATUS_LABEL[record.oldStatus] ?? record.oldStatus} \u2192 ${STATUS_LABEL[record.newStatus] ?? record.newStatus}`,
          );
        }

        return parts.length > 0 ? parts.join(', ') : '-';
      },
    },
  ];

  if (isLoadingSubscription) {
    return (
      <div className="flex w-full justify-center rounded-tr-md rounded-br-md rounded-bl-md bg-white p-10 shadow dark:bg-gray-800">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-tr-md rounded-br-md rounded-bl-md bg-white p-3 shadow md:p-5 dark:bg-gray-800">
      <div className="max-w-[720px]">
        <h2 className="text-lg font-bold md:text-xl dark:text-white">{t('billing.title')}</h2>

        {/* Subscription Summary */}
        {!subscription && (
          <div className="mt-4">
            <p className="text-gray-500 dark:text-gray-400">
              {t('billing.noSubscription')}
            </p>

            {isCanManageDBs && (
              <Button type="primary" className="mt-3" onClick={() => setIsPurchaseModalOpen(true)}>
                {t('billing.purchase')}
              </Button>
            )}
          </div>
        )}

        {subscription && (
          <>
            <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Tag
                  color={STATUS_TAG_COLOR[subscription.status]}
                  style={{ fontSize: 14, padding: '2px 12px' }}
                >
                  {STATUS_LABEL[subscription.status]}
                </Tag>

                {!isTrial && (
                  <span className="text-2xl font-bold dark:text-white">
                    ${(monthlyPrice / 100).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">{t('billing.perMonth')}</span>
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('billing.storage')}</div>
                  <div className="font-medium dark:text-gray-200">
                    {subscription.storageGb} GB
                    {subscription.pendingStorageGb != null && (
                      <span className="ml-1 text-xs text-yellow-500">
                        {t('billing.pendingSuffix', { count: subscription.pendingStorageGb })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('billing.currentPeriod')}</div>
                  <div className="font-medium dark:text-gray-200">
                    {dayjs.utc(subscription.currentPeriodStart).local().format(shortFormat.format)}{' '}
                    - {dayjs.utc(subscription.currentPeriodEnd).local().format(shortFormat.format)}
                  </div>
                </div>

                {subscription.canceledAt && (
                  <div className="rounded-md bg-red-50 px-3 py-2 dark:bg-red-900/20">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('billing.canceledAt')}</div>
                    <div className="font-medium text-red-500">
                      {dayjs.utc(subscription.canceledAt).local().format(timeFormat.format)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dayjs.utc(subscription.canceledAt).local().fromNow()}
                    </div>
                  </div>
                )}

                {subscription.dataRetentionGracePeriodUntil && (
                  <div className="rounded-md bg-yellow-50 px-3 py-2 dark:bg-yellow-900/20">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('billing.dataRetainedUntil')}
                    </div>
                    <div className="font-medium text-yellow-500">
                      {dayjs
                        .utc(subscription.dataRetentionGracePeriodUntil)
                        .local()
                        .format(timeFormat.format)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dayjs.utc(subscription.dataRetentionGracePeriodUntil).local().fromNow()}
                    </div>
                  </div>
                )}
              </div>

              {isCanManageDBs && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                  {canPurchase && (
                    <Button type="primary" onClick={() => setIsPurchaseModalOpen(true)}>
                      {t('billing.purchase')}
                    </Button>
                  )}

                  {canAccessPortal && (
                    <>
                      {subscription.status !== SubscriptionStatus.Canceled && (
                        <Button onClick={() => setIsPurchaseModalOpen(true)}>{t('billing.changeStorage')}</Button>
                      )}
                      {subscription.status === SubscriptionStatus.Canceled ? (
                        <Button
                          type="primary"
                          loading={isPortalLoading}
                          onClick={handlePortalClick}
                        >
                          {t('billing.resumeSubscription')}
                        </Button>
                      ) : (
                        <Button loading={isPortalLoading} onClick={handlePortalClick}>
                          {t('billing.manageSubscription')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Invoices */}
            <h3 className="mt-6 mb-3 text-base font-bold dark:text-white">{t('billing.invoices')}</h3>

            <Table
              bordered
              size="small"
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              loading={isLoadingInvoices}
              pagination={false}
            />

            {totalInvoices > MAX_ROWS && (
              <p className="mt-1 text-xs text-gray-500">
                {t('billing.showingOfInvoices', { shown: MAX_ROWS, total: totalInvoices })}
              </p>
            )}

            {/* Activity */}
            <h3 className="mt-6 mb-3 text-base font-bold dark:text-white">{t('billing.activity')}</h3>

            <Table
              bordered
              size="small"
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              loading={isLoadingEvents}
              pagination={false}
            />

            {totalEvents > MAX_ROWS && (
              <p className="mt-1 text-xs text-gray-500">
                {t('billing.showingOfEvents', { shown: MAX_ROWS, total: totalEvents })}
              </p>
            )}
          </>
        )}

        {isPurchaseModalOpen && (
          <PurchaseComponent
            databaseId={database.id}
            onSubscriptionChanged={handleSubscriptionChanged}
            onClose={() => setIsPurchaseModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
