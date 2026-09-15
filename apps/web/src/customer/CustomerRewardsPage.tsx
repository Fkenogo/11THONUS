/**
 * `/customer/rewards` — the customer's available-reward read surface
 * (`PLATFORM-BASELINE-006A`).
 *
 * Minimum ownership-scoped reward read (governing terms snapshot, no
 * redemption surface — redemption is deferred to a later package).
 */

import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { useAvailableRewardsQuery, type CustomerPlatform } from "./hooks/purchaseQueries";

export function CustomerRewardsPage({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const platform: CustomerPlatform = { auth, functions };
  const rewardsQuery = useAvailableRewardsQuery(platform);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("purchase.rewardsTitle")}</h1>
      {rewardsQuery.isPending ? <p>{t("entry.loading")}</p> : null}
      {rewardsQuery.data?.rewards.length === 0 ? <p>{t("purchase.rewardsEmpty")}</p> : null}
      <ul className="flex flex-col gap-2">
        {(rewardsQuery.data?.rewards ?? []).map((reward) => (
          <li key={reward.id} className="rounded-md border border-[var(--color-border)] p-3">
            <p className="font-medium">{t("purchase.rewardAvailable")}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {reward.rewardDescription}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
