/**
 * Customer Rewards & Progress — Business Owner/Manager visibility
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`).
 *
 * Read-only by construction: this page renders no redemption, fulfilment,
 * cancellation, or any other action control — only a retry for a failed
 * read. Every number shown (units, threshold, units to reward, pending
 * units) comes verbatim from the server's PostgreSQL-derived read model;
 * nothing is computed here, so no parallel loyalty model exists in the UI.
 *
 * Role handling mirrors `TeamManagementPage`: the viewer's own live role is
 * taken from the already-fetched accessible-businesses data. Owner and
 * Manager see the content; Staff (or an unresolved role) see a plain notice
 * and no read is ever issued. Server authorization remains mandatory
 * regardless of what this page decides.
 *
 * Layout is mobile-first: one column of cards on small screens, two
 * columns from `md` up, inside the existing Dashboard shell.
 */

import { useTranslation } from "../../i18n";
import { baseLanguage } from "../../i18n/config";
import { Button } from "../../components/ui/formPrimitives";
import { MutationError } from "../onboarding/MutationError";
import { useAccessibleBusinessesQuery } from "../hooks/businessQueries";
import {
  BUSINESS_LOYALTY_PAGE_LIMIT,
  useBusinessAvailableRewardsQuery,
  useBusinessCycleProgressQuery,
} from "../hooks/businessLoyaltyQueries";
import type { BusinessContext } from "../api/businessContext";
import type {
  BusinessAvailableRewardWire,
  BusinessLoyaltyCycleProgressWire,
} from "../api/businessLoyaltyVisibility";

export function CustomerRewardsProgressPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const accessibleQuery = useAccessibleBusinessesQuery();
  const myRole = accessibleQuery.data?.find(
    (business) => business.businessId === context.businessId,
  )?.role;
  const canView = myRole === "owner" || myRole === "manager";

  const rewardsQuery = useBusinessAvailableRewardsQuery(context.businessId, canView);
  const cyclesQuery = useBusinessCycleProgressQuery(context.businessId, canView);

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="mb-1 text-xl font-semibold">{t("loyaltyVisibility.title")}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("loyaltyVisibility.subtitle")}
        </p>
      </header>

      {accessibleQuery.isPending ? <p>{t("loyaltyVisibility.loading")}</p> : null}
      {accessibleQuery.isError ? <MutationError error={accessibleQuery.error} /> : null}

      {accessibleQuery.isSuccess && !canView ? (
        <p role="note" className="rounded-md border border-[var(--color-border)] p-4 text-sm">
          {t("loyaltyVisibility.notAvailableForRole")}
        </p>
      ) : null}

      {canView ? (
        <>
          <section aria-labelledby="rewards-ready-heading" className="flex flex-col gap-3">
            <h2 id="rewards-ready-heading" className="text-lg font-medium">
              {t("loyaltyVisibility.rewardsTitle")}
            </h2>
            <ReadState
              isPending={rewardsQuery.isPending}
              isError={rewardsQuery.isError}
              error={rewardsQuery.error}
              onRetry={() => rewardsQuery.refetch()}
              isEmpty={rewardsQuery.data?.rewards.length === 0}
              emptyText={t("loyaltyVisibility.rewardsEmpty")}
            />
            {rewardsQuery.data && rewardsQuery.data.rewards.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {rewardsQuery.data.rewards.map((reward, index) => (
                  <RewardCard
                    key={`${reward.rewardProgramId}-${reward.customerLoyaltyNumber}-${reward.cycleSequenceNumber}-${index}`}
                    reward={reward}
                  />
                ))}
              </ul>
            ) : null}
            {rewardsQuery.data?.rewards.length === BUSINESS_LOYALTY_PAGE_LIMIT ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {t("loyaltyVisibility.showingFirst", { count: BUSINESS_LOYALTY_PAGE_LIMIT })}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="cycle-progress-heading" className="flex flex-col gap-3">
            <h2 id="cycle-progress-heading" className="text-lg font-medium">
              {t("loyaltyVisibility.progressTitle")}
            </h2>
            <ReadState
              isPending={cyclesQuery.isPending}
              isError={cyclesQuery.isError}
              error={cyclesQuery.error}
              onRetry={() => cyclesQuery.refetch()}
              isEmpty={cyclesQuery.data?.cycles.length === 0}
              emptyText={t("loyaltyVisibility.progressEmpty")}
            />
            {cyclesQuery.data && cyclesQuery.data.cycles.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {cyclesQuery.data.cycles.map((cycle, index) => (
                  <CycleCard
                    key={`${cycle.rewardProgramId}-${cycle.customerLoyaltyNumber}-${cycle.cycleSequenceNumber}-${index}`}
                    cycle={cycle}
                  />
                ))}
              </ul>
            ) : null}
            {cyclesQuery.data?.cycles.length === BUSINESS_LOYALTY_PAGE_LIMIT ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {t("loyaltyVisibility.showingFirst", { count: BUSINESS_LOYALTY_PAGE_LIMIT })}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}

function ReadState(props: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
}) {
  const { t } = useTranslation("business");
  if (props.isPending) {
    return <p>{t("loyaltyVisibility.loading")}</p>;
  }
  if (props.isError) {
    return (
      <div role="alert" className="rounded-md border border-[var(--color-border)] p-4">
        <p className="mb-3 text-sm">{t("loyaltyVisibility.loadError")}</p>
        <MutationError error={props.error} />
        <Button type="button" onClick={props.onRetry}>
          {t("actions.retry")}
        </Button>
      </div>
    );
  }
  if (props.isEmpty) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{props.emptyText}</p>;
  }
  return null;
}

function CustomerLine({ loyaltyNumber }: { loyaltyNumber: string | null }) {
  const { t } = useTranslation("business");
  return (
    <span className="text-sm text-[var(--color-muted-foreground)]">
      {loyaltyNumber
        ? t("loyaltyVisibility.customerLoyaltyNumber", { value: loyaltyNumber })
        : t("loyaltyVisibility.customerUnknown")}
    </span>
  );
}

/**
 * Formats with the app's supported base language (`en`/`fr`) rather than the
 * raw detected tag: a browser/OS locale such as `en-US@posix` is not a valid
 * BCP 47 tag and would make `toLocaleDateString` throw, crashing the page.
 */
function formatDate(iso: string, language: string | undefined): string {
  return new Date(iso).toLocaleDateString(baseLanguage(language));
}

function RewardCard({ reward }: { reward: BusinessAvailableRewardWire }) {
  const { t, i18n } = useTranslation("business");
  return (
    <li className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] p-4">
      <span className="text-xs font-medium uppercase tracking-wide">
        {t(`loyaltyVisibility.rewardState.${reward.state}`)}
      </span>
      <span className="font-medium">{reward.rewardDescription}</span>
      <span className="text-sm">{reward.rewardProgramName}</span>
      <CustomerLine loyaltyNumber={reward.customerLoyaltyNumber} />
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {t("loyaltyVisibility.availableSince", {
          date: formatDate(reward.availableAt, i18n.resolvedLanguage ?? i18n.language),
        })}
      </span>
    </li>
  );
}

function CycleCard({ cycle }: { cycle: BusinessLoyaltyCycleProgressWire }) {
  const { t } = useTranslation("business");
  const progressLabel = t("loyaltyVisibility.unitsOfThreshold", {
    allocated: cycle.allocatedUnits,
    threshold: cycle.threshold,
  });
  return (
    <li className="flex flex-col gap-2 rounded-md border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{cycle.rewardProgramName}</span>
          <CustomerLine loyaltyNumber={cycle.customerLoyaltyNumber} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide">
          {t(`loyaltyVisibility.cycleState.${cycle.cycleState}`)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={cycle.threshold}
        aria-valuenow={cycle.allocatedUnits}
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
      >
        <div
          className="h-full bg-[var(--color-primary)]"
          style={{
            width: `${cycle.threshold > 0 ? (cycle.allocatedUnits / cycle.threshold) * 100 : 0}%`,
          }}
        />
      </div>
      <span className="text-sm">
        {progressLabel} ·{" "}
        {t("loyaltyVisibility.cycleNumber", { number: cycle.cycleSequenceNumber })}
      </span>
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {cycle.reward
          ? t("loyaltyVisibility.rewardReady", { description: cycle.reward.rewardDescription })
          : t("loyaltyVisibility.unitsToReward", { count: cycle.unitsToReward })}
      </span>
      {cycle.pendingUnits > 0 ? (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {t("loyaltyVisibility.pendingUnits", { count: cycle.pendingUnits })}
        </span>
      ) : null}
    </li>
  );
}
