import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { Gift } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import { CustomerLoyaltyCircle } from "./components/CustomerLoyaltyCircle";
import { useCustomerExperienceOverviewQuery } from "./hooks/experienceQueries";

export function CustomerCirclesPage({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const { rewardProgramId } = useParams<{ rewardProgramId: string }>();
  const query = useCustomerExperienceOverviewQuery({ auth, functions });

  if (query.isPending)
    return (
      <p
        aria-busy="true"
        className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
      >
        {t("experience.loading")}
      </p>
    );
  if (query.isError) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-800"
      >
        <p>{t("experience.overviewError")}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-2 min-h-11 font-semibold underline"
        >
          {t("experience.retry")}
        </button>
      </section>
    );
  }

  const circles = query.data.circles;
  const selectedCircle = rewardProgramId
    ? circles.find((circle) => circle.rewardProgramId === rewardProgramId)
    : undefined;
  if (rewardProgramId) {
    return selectedCircle ? (
      <div className="space-y-4">
        <Link
          to="/customer/circles"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-amber-800 underline"
        >
          {t("experience.backToCircles")}
        </Link>
        <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="space-y-1">
            <p className="break-words text-xs font-semibold uppercase tracking-wide text-slate-500">
              {selectedCircle.businessName ?? t("experience.businessFallback")}
            </p>
            <h1 className="break-words font-display text-lg font-bold text-slate-900">
              {selectedCircle.programmeName}
            </h1>
            {selectedCircle.cycleNumber ? (
              <p className="text-xs text-slate-500">
                {t("experience.cycleNumber", { count: selectedCircle.cycleNumber })}
              </p>
            ) : null}
          </header>
          <div className="flex justify-center rounded-xl bg-slate-50 py-2">
            <CustomerLoyaltyCircle circle={selectedCircle} />
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">
              {t("experience.verifiedOfTen", { count: selectedCircle.verifiedUnits })}
            </p>
            {selectedCircle.pendingUnits > 0 ? (
              <p className="rounded-lg bg-amber-50 p-3 text-amber-950">
                {t("experience.awaitingDetail", { count: selectedCircle.pendingUnits })}
              </p>
            ) : null}
            {selectedCircle.rewardAvailable ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-bold text-amber-950">
                {t("experience.rewardAvailableDetail", {
                  reward: selectedCircle.rewardDescription ?? t("experience.qualifyingItem"),
                })}
              </p>
            ) : null}
            {selectedCircle.rewardDescription && !selectedCircle.rewardAvailable ? (
              <p className="text-slate-600">{selectedCircle.rewardDescription}</p>
            ) : null}
          </div>
        </article>
      </div>
    ) : (
      <section
        role="status"
        className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
      >
        {t("experience.circleUnavailable")}
        <Link to="/customer/circles" className="ml-2 font-semibold text-amber-800 underline">
          {t("experience.backToCircles")}
        </Link>
      </section>
    );
  }
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900">
            {t("experience.circlesTitle")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("experience.cyclesCount", { count: circles.length })}
          </p>
        </div>
        <Gift aria-hidden="true" className="mb-1 h-5 w-5 text-amber-600" />
      </header>
      {circles.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Gift aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">{t("experience.emptyTitle")}</h2>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
            {t("experience.emptyBody")}
          </p>
        </section>
      ) : (
        circles.map((circle) => (
          <Link
            to={`/customer/circles/${circle.rewardProgramId}`}
            key={circle.id}
            className="block min-h-12 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm focus-visible:outline-2 focus-visible:outline-amber-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {circle.businessName ?? t("experience.businessFallback")}
                </span>
                <h2 className="truncate text-sm font-bold text-slate-900">
                  {circle.programmeName}
                </h2>
                {circle.cycleNumber ? (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {t("experience.cycleNumber", { count: circle.cycleNumber })}
                  </p>
                ) : null}
              </div>
              {circle.rewardAvailable ? (
                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                  {t("experience.rewardUnlocked")}
                </span>
              ) : null}
            </div>
            <div className="flex justify-center rounded-xl bg-slate-50 py-2">
              <CustomerLoyaltyCircle circle={circle} />
            </div>
            <p className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-950">
              {t("experience.rewardDescription")}
            </p>
          </Link>
        ))
      )}
    </div>
  );
}
