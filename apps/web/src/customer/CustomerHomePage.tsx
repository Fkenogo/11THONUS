import { Link, useOutletContext } from "react-router-dom";
import { CheckCircle2, ChevronRight, Gift, Shield, Sparkles } from "lucide-react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { useCustomerExperienceOverviewQuery } from "./hooks/experienceQueries";
import { CustomerLoyaltyCircle } from "./components/CustomerLoyaltyCircle";
import type { CustomerExperienceActivityWire } from "./api/customerExperienceClient";
import type { CustomerShellContext } from "./CustomerShell";

function activityTitle(
  activity: CustomerExperienceActivityWire,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (activity.eventKind === "reward_available") return t("experience.activityRewardAvailable");
  if (activity.eventKind === "reward_redeemed") return t("experience.activityRewardRedeemed");
  switch (activity.status) {
    case "waiting_for_customer":
      return t("experience.activityRecorded");
    case "pending_admission":
      return t("experience.activityAdmission");
    case "awaiting_business_confirmation":
      return t("experience.activityBusinessReview");
    case "verified":
      return t("experience.activityVerified");
    case "rejected":
      return t("experience.activityRejected");
    case "under_review":
      return t("experience.activityUnderReview");
    default:
      return t("experience.activityOtherStatus");
  }
}

export function CustomerHomePage({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const platform = { auth, functions };
  const { identity, openIdentity } = useOutletContext<CustomerShellContext>();
  const overviewQuery = useCustomerExperienceOverviewQuery(platform);

  const overview = overviewQuery.data;
  const circles = overview?.circles ?? [];
  const rewards = overview?.availableRewards ?? [];
  const activity = overview?.activity ?? [];
  const rewardCircle = circles.find((circle) => circle.rewardAvailable);
  const availableReward = rewardCircle
    ? rewards.find(
        (reward) =>
          reward.businessId === rewardCircle.businessId &&
          reward.rewardProgramId === rewardCircle.rewardProgramId,
      )
    : rewards[0];
  const closestCircle = [...circles]
    .filter((circle) => !circle.rewardAvailable)
    .sort((a, b) => b.verifiedUnits - a.verifiedUnits)[0];
  const latestRedemption = activity.find((item) => item.eventKind === "reward_redeemed");
  const redeemedCount = activity.filter((item) => item.eventKind === "reward_redeemed").length;

  if (overviewQuery.isPending) {
    return (
      <p
        className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
        aria-busy="true"
      >
        {t("experience.loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-5">
      {overviewQuery.isError ? (
        <section
          className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-800"
          role="alert"
        >
          <p>{t("experience.overviewError")}</p>
          <button
            type="button"
            onClick={() => void overviewQuery.refetch()}
            className="mt-2 min-h-11 font-semibold underline"
          >
            {t("experience.retry")}
          </button>
        </section>
      ) : null}

      {!overviewQuery.isError ? (
        <>
          {availableReward && rewardCircle ? (
            <section className="relative space-y-3 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-5 text-white shadow-lg shadow-amber-500/20">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-50">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-amber-100" />
                  {t("experience.rewardReady")}
                </span>
                <span className="text-right text-[11px] font-semibold text-amber-100">
                  {rewardCircle.businessName ?? t("experience.businessFallback")}
                </span>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight">
                  {t("experience.rewardTitle", {
                    item: rewardCircle.qualifyingItemName ?? t("experience.qualifyingItem"),
                    business: rewardCircle.businessName ?? t("experience.businessFallback"),
                  })}
                </h2>
                <p className="mt-1 text-xs text-amber-50">
                  {availableReward.rewardDescription || t("experience.rewardHelp")}
                </p>
                <p className="mt-1 text-xs text-amber-50">{t("experience.rewardHelp")}</p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={openIdentity}
                  disabled={!identity?.qrReference || !identity?.loyaltyNumber}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
                >
                  <Gift aria-hidden="true" className="h-4 w-4 text-amber-600" />
                  {t("experience.redeemCode")}
                </button>
                <span className="text-right text-[11px] font-semibold text-amber-100">
                  {t("experience.cycleComplete", { count: rewardCircle.cycleNumber ?? 1 })}
                </span>
              </div>
            </section>
          ) : latestRedemption ? (
            <section className="space-y-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-50">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                {t("experience.redeemedHeading")}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight">
                  {t("experience.redeemedTitle")}
                </h2>
                <p className="mt-1 text-xs text-emerald-50">
                  {t("experience.redeemedBody", {
                    reward: latestRedemption.rewardDescription ?? t("experience.qualifyingItem"),
                    business: latestRedemption.businessName ?? t("experience.businessFallback"),
                  })}
                </p>
              </div>
              {redeemedCount > 1 ? (
                <p className="text-[11px] text-emerald-50">
                  {t("experience.rewardHistoryCount", { count: redeemedCount })}
                </p>
              ) : null}
            </section>
          ) : null}

          {closestCircle ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("experience.closestReward")}
                </h2>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {t("experience.visitsRemaining", {
                    count: Math.max(0, 10 - closestCircle.verifiedUnits),
                  })}
                </span>
              </div>
              <CustomerLoyaltyCircle circle={closestCircle} />
              <Link
                to="/customer/circles"
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-900">
                    {closestCircle.businessName ?? t("experience.businessFallback")}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {closestCircle.programmeName}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            </section>
          ) : rewardCircle ? (
            <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {t("experience.cycleComplete", { count: rewardCircle.cycleNumber ?? 1 })}
                </h2>
                <span className="text-xs font-semibold text-slate-600">
                  {rewardCircle.businessName ?? t("experience.businessFallback")}
                </span>
              </div>
              <CustomerLoyaltyCircle circle={rewardCircle} />
            </section>
          ) : circles.length === 0 ? (
            <section className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Gift aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t("experience.emptyTitle")}</h2>
                <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                  {t("experience.emptyBody")}
                </p>
              </div>
              {identity?.status === "ready" ? (
                <button
                  type="button"
                  onClick={openIdentity}
                  className="min-h-11 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  {t("experience.codeCta")}
                </button>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("experience.myLoyalty", { count: circles.length })}
              </h2>
              <Link
                to="/customer/circles"
                className="flex min-h-11 items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
              >
                {t("nav.circles")}
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            {circles.length === 0 ? (
              <p className="text-xs text-slate-500">{t("experience.emptyRelationship")}</p>
            ) : (
              <ul className="space-y-2.5">
                {circles.map((circle) => (
                  <li key={circle.id}>
                    <Link
                      to="/customer/circles"
                      className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800">
                          {(circle.businessName ?? t("experience.businessFallback"))
                            .slice(0, 2)
                            .toLocaleUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-900">
                            {circle.businessName ?? t("experience.businessFallback")}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {circle.programmeName}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {circle.rewardAvailable ? (
                          <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">
                            {t("experience.rewardUnlocked")}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">
                            {circle.verifiedUnits}/10
                          </span>
                        )}
                        <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("experience.recentActivity")}
              </h2>
              <Link
                to="/customer/activity"
                className="flex min-h-11 items-center text-xs font-semibold text-amber-700 hover:underline"
              >
                {t("experience.seeAllActivity")}
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="py-2 text-xs text-slate-500">{t("experience.activityEmpty")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {activity.slice(0, 4).map((item) => (
                  <li
                    key={`${item.eventKind}-${item.id}-${item.occurredAt}`}
                    className="flex items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">
                        {activityTitle(item, t)}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {item.businessName ?? t("experience.businessFallback")} ·{" "}
                        {new Date(item.occurredAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded border px-2 py-1 text-[10px] font-semibold ${item.status === "verified" || item.eventKind === "reward_redeemed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                    >
                      {item.eventKind === "reward_redeemed"
                        ? t("experience.activityRewardRedeemed")
                        : item.status === "verified"
                          ? t("experience.activityVerified")
                          : item.status === "pending_admission"
                            ? t("experience.activityAdmission")
                            : item.status === "awaiting_business_confirmation"
                              ? t("experience.activityBusinessReview")
                              : t("experience.activityWaiting")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {latestRedemption ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("experience.rewardHistoryCount", { count: redeemedCount })}
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <Gift aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">
                    {latestRedemption.rewardDescription}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {latestRedemption.businessName ?? t("experience.businessFallback")} ·{" "}
                    {new Date(latestRedemption.occurredAt).toLocaleDateString()}
                  </span>
                </span>
                <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  {t("experience.activityRewardRedeemed")}
                </span>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-500">
        <Shield aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        {t("experience.privacyNote")}
      </p>
    </div>
  );
}
