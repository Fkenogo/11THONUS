/**
 * Business Command Centre — Owner / Manager home (EA-003).
 *
 * Experience guide: the frozen prototype's Business home (attention queue first, then the loyalty
 * picture, programmes, recent activity, shortcuts). Product Truth governs what is shown:
 *
 *  - Only real read models are used; nothing is demo state.
 *  - Progress exists only after the customer verifies a Purchase: a Purchase that is still
 *    waiting for the customer is shown as "not counted yet", never as progress.
 *  - There is no Manager-approval queue and no instant-progress behaviour (neither is Product
 *    Truth). The attention queue shows only states the platform really has.
 *  - Commercial consequence is surfaced ONLY through the canonical Purchase state
 *    `pending_admission` (a Purchase received while new Circles cannot start). No balance,
 *    ledger, settlement, capacity or processor detail is read or shown — no Business-facing
 *    Commercial read model exists yet (WP-COM-08), and role-specific detail is not invented.
 *
 * Authorisation is server-side: Owner/Manager access is enforced by each callable. The `role`
 * prop only selects wording (who to contact) — never what data is permitted.
 */

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/formPrimitives";
import type { BusinessContext } from "../../api/businessContext";
import { usePurchasesQuery } from "../../hooks/purchaseQueries";
import { useRewardProgramsQuery } from "../../hooks/rewardProgramQueries";
import {
  useBusinessAvailableRewardsQuery,
  useBusinessCycleProgressQuery,
} from "../../hooks/businessLoyaltyQueries";
import {
  circlesInProgress,
  closestToReward,
  deriveAttention,
  isLiveProgram,
  type AttentionItem,
} from "./deriveCommandCentre";

export type CommandCentreRole = "owner" | "manager";

const RECENT_LIMIT = 5;
/** Largest page the server returns; a count that reaches it is shown as "N+", never as a total. */
const PAGE_CAP = 100;

export function CommandCentre({
  context,
  role,
}: {
  context: BusinessContext;
  role: CommandCentreRole;
}) {
  const { t } = useTranslation("business");
  const id = context.businessId;
  const base = `/business/${id}/dashboard`;

  const programsQuery = useRewardProgramsQuery(id);
  const rewardsQuery = useBusinessAvailableRewardsQuery(id, true);
  const cyclesQuery = useBusinessCycleProgressQuery(id, true);
  const waitingQuery = usePurchasesQuery(id, "waiting_for_customer", PAGE_CAP);
  const underReviewQuery = usePurchasesQuery(id, "under_review", PAGE_CAP);
  const onHoldQuery = usePurchasesQuery(id, "pending_admission", PAGE_CAP);
  const recentQuery = usePurchasesQuery(id, undefined, RECENT_LIMIT);

  const formatCount = (n: number | null | undefined) =>
    n === null || n === undefined ? "–" : n >= PAGE_CAP ? `${PAGE_CAP}+` : String(n);

  const programs = programsQuery.data;
  const cycles = cyclesQuery.data?.cycles;
  const attention = deriveAttention({
    programs,
    rewardsReadyCount: rewardsQuery.data?.rewards.length,
    waitingForCustomerCount: waitingQuery.data?.purchases.length,
    underReviewCount: underReviewQuery.data?.purchases.length,
    pendingAdmissionCount: onHoldQuery.data?.purchases.length,
  });

  const allQueries = [
    programsQuery,
    rewardsQuery,
    cyclesQuery,
    waitingQuery,
    underReviewQuery,
    onHoldQuery,
    recentQuery,
  ];
  const anyPending = allQueries.some((q) => q.isPending);
  const anyError = allQueries.some((q) => q.isError);
  const settled = !anyPending;

  const attentionCopy: Record<
    AttentionItem["kind"],
    { title: string; body: string; action: string; to: string; tone: "warn" | "info" }
  > = {
    onHold: {
      title: t("dashboard.commandCentre.onHoldTitle"),
      body: `${t("dashboard.commandCentre.onHoldBody")} ${
        role === "owner"
          ? t("dashboard.commandCentre.onHoldOwnerNext")
          : t("dashboard.commandCentre.onHoldManagerNext")
      }`,
      action: t("dashboard.commandCentre.onHoldAction"),
      to: `${base}/purchases`,
      tone: "warn",
    },
    rewardsReady: {
      title: t("dashboard.commandCentre.rewardsReadyTitle"),
      body: t("dashboard.commandCentre.rewardsReadyBody"),
      action: t("dashboard.commandCentre.rewardsReadyAction"),
      to: `${base}/customer-rewards`,
      tone: "info",
    },
    underReview: {
      title: t("dashboard.commandCentre.underReviewTitle"),
      body: t("dashboard.commandCentre.underReviewBody"),
      action: t("dashboard.commandCentre.underReviewAction"),
      to: `${base}/purchases`,
      tone: "warn",
    },
    waitingForCustomer: {
      title: t("dashboard.commandCentre.waitingTitle"),
      body: t("dashboard.commandCentre.waitingBody"),
      action: t("dashboard.commandCentre.waitingAction"),
      to: `${base}/purchases`,
      tone: "info",
    },
    noLiveProgram: {
      title: t("dashboard.commandCentre.noProgramTitle"),
      body: t("dashboard.commandCentre.noProgramBody"),
      action: t("dashboard.commandCentre.noProgramAction"),
      to: `${base}/reward-programs`,
      tone: "warn",
    },
  };

  const closest = closestToReward(cycles);
  const recent = (recentQuery.data?.purchases ?? []).slice(0, RECENT_LIMIT);
  const livePrograms = programs?.filter(isLiveProgram).length;

  const tiles: { key: string; label: string; value: number | undefined }[] = [
    {
      key: "live",
      label: t("dashboard.commandCentre.glanceLivePrograms"),
      value: livePrograms,
    },
    {
      key: "circles",
      label: t("dashboard.commandCentre.glanceCirclesInProgress"),
      value: circlesInProgress(cycles),
    },
    {
      key: "ready",
      label: t("dashboard.commandCentre.glanceRewardsReady"),
      value: rewardsQuery.data?.rewards.length,
    },
    {
      key: "waiting",
      label: t("dashboard.commandCentre.glanceWaiting"),
      value: waitingQuery.data?.purchases.length,
    },
  ];

  const manage = [
    { to: `${base}/reward-programs`, label: t("dashboard.nav.rewardPrograms") },
    { to: `${base}/customer-rewards`, label: t("dashboard.nav.customerRewards") },
    { to: `${base}/purchases`, label: t("dashboard.nav.purchases") },
    { to: `${base}/team`, label: t("dashboard.nav.team") },
    { to: `${base}/locations`, label: t("dashboard.nav.locations") },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="command-centre">
      {anyPending ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {t("dashboard.commandCentre.loading")}
        </p>
      ) : null}
      {anyError ? (
        <div role="alert" className="rounded-md border border-[var(--color-border)] p-3 text-sm">
          <p className="mb-2">{t("dashboard.commandCentre.loadError")}</p>
          <Button
            type="button"
            onClick={() => allQueries.filter((q) => q.isError).forEach((q) => void q.refetch())}
          >
            {t("dashboard.commandCentre.retry")}
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="cc-attention" className="flex flex-col gap-3">
        <h2 id="cc-attention" className="text-lg font-semibold">
          {t("dashboard.commandCentre.attentionTitle")}
        </h2>
        {settled && !anyError && attention.length === 0 ? (
          <p className="rounded-md border border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
            {t("dashboard.commandCentre.attentionClear")}
          </p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {attention.map((item) => {
            const copy = attentionCopy[item.kind];
            return (
              <li
                key={item.kind}
                data-attention={item.kind}
                className={cn(
                  "rounded-lg border p-4",
                  copy.tone === "warn"
                    ? "border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-50"
                    : "border-[var(--color-border)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{copy.title}</h3>
                  {item.count !== null ? (
                    <span className="rounded-full border border-current px-2.5 py-0.5 text-sm font-semibold tabular-nums">
                      {formatCount(item.count)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm">{copy.body}</p>
                <Link
                  to={copy.to}
                  className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium underline"
                >
                  {copy.action}
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="cc-glance" className="flex flex-col gap-3">
        <h2 id="cc-glance" className="text-lg font-semibold">
          {t("dashboard.commandCentre.glanceTitle")}
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.key}
              className="rounded-lg border border-[var(--color-border)] p-4"
              data-tile={tile.key}
            >
              <dd className="text-2xl font-semibold tabular-nums">{formatCount(tile.value)}</dd>
              <dt className="text-sm text-[var(--color-muted-foreground)]">{tile.label}</dt>
            </div>
          ))}
        </dl>

        <h3 className="mt-2 font-medium">{t("dashboard.commandCentre.closestTitle")}</h3>
        {cyclesQuery.isSuccess && closest.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {t("dashboard.commandCentre.closestEmpty")}
          </p>
        ) : null}
        {cyclesQuery.data && cyclesQuery.data.cycles.length >= PAGE_CAP ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t("dashboard.commandCentre.closestPartial", { count: PAGE_CAP })}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {closest.map((cycle, index) => (
            <li
              key={`${cycle.rewardProgramId}-${cycle.customerLoyaltyNumber}-${cycle.cycleSequenceNumber}-${index}`}
              className="rounded-lg border border-[var(--color-border)] p-3"
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {cycle.customerLoyaltyNumber
                    ? t("loyaltyVisibility.customerLoyaltyNumber", {
                        value: cycle.customerLoyaltyNumber,
                      })
                    : t("loyaltyVisibility.customerUnknown")}
                </span>
                <span className="shrink-0 text-[var(--color-muted-foreground)]">
                  {cycle.rewardProgramName}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={cycle.threshold}
                aria-valuenow={cycle.allocatedUnits}
                aria-label={t("loyaltyVisibility.unitsOfThreshold", {
                  allocated: cycle.allocatedUnits,
                  threshold: cycle.threshold,
                })}
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-muted)]"
              >
                <div
                  className="h-full bg-[var(--color-primary)]"
                  style={{
                    width: `${Math.min(100, (cycle.allocatedUnits / Math.max(1, cycle.threshold)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {t("loyaltyVisibility.unitsOfThreshold", {
                  allocated: cycle.allocatedUnits,
                  threshold: cycle.threshold,
                })}{" "}
                · {t("loyaltyVisibility.unitsToReward", { count: cycle.unitsToReward })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cc-programs" className="flex flex-col gap-3">
        <h2 id="cc-programs" className="text-lg font-semibold">
          {t("dashboard.commandCentre.programsTitle")}
        </h2>
        {programs && programs.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {t("dashboard.commandCentre.programsEmpty")}
          </p>
        ) : null}
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(programs ?? []).map((entry) => {
            const version = entry.currentVersion ?? entry.draftVersion;
            return (
              <li
                key={entry.program.id}
                className="rounded-lg border border-[var(--color-border)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{entry.program.displayName}</h3>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium">
                    {t(`rewardProgram.status.${entry.program.status}`)}
                  </span>
                </div>
                {version ? (
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {t("dashboard.commandCentre.programRule", {
                      units: version.requiredVerifiedUnits,
                      reward: version.rewardDescription,
                    })}
                  </p>
                ) : null}
                {!entry.currentVersion ? (
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {t("dashboard.commandCentre.programDraftOnly")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <Link
          to={`${base}/reward-programs`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium underline"
        >
          {t("dashboard.commandCentre.programsManage")}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      <section aria-labelledby="cc-recent" className="flex flex-col gap-3">
        <h2 id="cc-recent" className="text-lg font-semibold">
          {t("dashboard.commandCentre.recentTitle")}
        </h2>
        {recentQuery.isSuccess && recent.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {t("dashboard.commandCentre.recentEmpty")}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {recent.map((purchase) => (
            <li
              key={purchase.id}
              className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">
                  {purchase.quantity} × {purchase.itemLabel}
                </span>
                <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs">
                  {t(`purchase.status.${purchase.status}`)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t("loyaltyVisibility.customerLoyaltyNumber", {
                  value: purchase.canonicalLoyaltyNumberValue,
                })}
              </p>
              {purchase.status === "waiting_for_customer" ? (
                <p className="mt-1 text-xs">{t("dashboard.commandCentre.recentNotCounted")}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <Link
          to={`${base}/purchases`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium underline"
        >
          {t("dashboard.commandCentre.recentAll")}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      <section aria-labelledby="cc-manage" className="flex flex-col gap-3">
        <h2 id="cc-manage" className="text-lg font-semibold">
          {t("dashboard.commandCentre.manageTitle")}
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {manage.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex min-h-12 items-center justify-between rounded-lg border border-[var(--color-border)] px-4 text-sm font-medium"
              >
                {link.label}
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
