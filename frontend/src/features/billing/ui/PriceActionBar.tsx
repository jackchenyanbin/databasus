import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import { SubscriptionStatus } from '../../../entity/billing';

interface Props {
  monthlyPrice: number;
  currentPrice: number;
  isPurchaseFlow: boolean;
  isChangeFlow: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSameStorage: boolean;
  isSubmitting: boolean;
  subscriptionStatus: SubscriptionStatus;
  onPurchase: () => void;
  onChangeStorage: () => void;
}

export function PriceActionBar({
  monthlyPrice,
  currentPrice,
  isPurchaseFlow,
  isChangeFlow,
  isUpgrade,
  isDowngrade,
  isSameStorage,
  isSubmitting,
  subscriptionStatus,
  onPurchase,
  onChangeStorage,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="flex-1">
        <p className="text-2xl font-bold">
          ${(monthlyPrice / 100).toFixed(2)}
          <span className="text-base font-medium text-gray-500 dark:text-gray-400">{t('billing.perMonth')}</span>
        </p>

        {isChangeFlow && !isSameStorage && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('billing.currentlyPrice', { price: (currentPrice / 100).toFixed(2) })}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {isPurchaseFlow && (
          <Button type="primary" size="large" loading={isSubmitting} onClick={onPurchase}>
            {subscriptionStatus === SubscriptionStatus.Canceled ? t('billing.reSubscribe') : t('billing.purchase')}
          </Button>
        )}

        {isChangeFlow && (
          <>
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              disabled={!!isSameStorage}
              onClick={onChangeStorage}
            >
              {isUpgrade ? t('billing.upgrade') : isDowngrade ? t('billing.downgrade') : t('billing.changeStorageBtn')}
            </Button>

            {isDowngrade && (
              <p className="text-xs text-gray-500">
                {t('billing.downgradeHint')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
