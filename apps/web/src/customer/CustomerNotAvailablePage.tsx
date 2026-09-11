/**
 * Honest "not yet available" stub for Customer shell destinations that have
 * no real backend behind them yet (`PRODUCT-ALIGN-002`). Used by Scan,
 * Rewards, and Activity — never fabricates purchase/reward/progress/activity
 * data. Scan camera logic, Purchase and Verification are explicitly out of
 * scope for this task.
 */

import { useTranslation } from "../i18n";

export function CustomerNotAvailablePage({
  titleKey,
  bodyKey,
}: {
  titleKey: string;
  bodyKey: string;
}) {
  const { t } = useTranslation("customer");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <h1 className="text-xl font-semibold">{t(titleKey)}</h1>
      <p className="text-[var(--color-muted-foreground)]">{t(bodyKey)}</p>
    </div>
  );
}
