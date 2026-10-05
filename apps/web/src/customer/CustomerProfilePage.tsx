import { Link, useOutletContext } from "react-router-dom";
import { Shield } from "lucide-react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import type { CustomerShellContext } from "./CustomerShell";
import { useCustomerExperienceOverviewQuery } from "./hooks/experienceQueries";

export function CustomerProfilePage({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const { identity, openIdentity } = useOutletContext<CustomerShellContext>();
  const overview = useCustomerExperienceOverviewQuery({ auth, functions });
  const displayName = identity?.displayName || t("experience.memberFallback");

  return (
    <div className="space-y-4">
      <h1 className="px-1 font-display text-lg font-bold text-slate-900">
        {t("experience.profileTitle")}
      </h1>
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-white shadow-sm">
            {displayName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toLocaleUpperCase() ?? "")
              .join("") || "11"}
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900">{displayName}</h2>
          <p className="font-mono text-xs text-slate-500">
            {identity?.loyaltyNumber ?? t("experience.noIdentity")}
          </p>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="flex justify-between gap-3 py-2">
            <span className="text-slate-500">{t("home.loyaltyNumberLabel")}</span>
            <span className="font-semibold text-slate-900">
              {identity?.loyaltyNumber ?? t("experience.noIdentity")}
            </span>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <span className="text-slate-500">{t("experience.identityVerified")}</span>
            <span className="font-semibold text-emerald-700">
              {identity?.status === "ready" ? "✓" : t("experience.noIdentity")}
            </span>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <span className="text-slate-500">{t("experience.activeBusinesses")}</span>
            <span className="font-semibold text-slate-900">
              {overview.data?.circles.length ?? 0}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
          <Shield aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>{t("experience.privacyNote")}</span>
        </div>
        <button
          type="button"
          onClick={openIdentity}
          disabled={!identity?.qrReference}
          className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {t("experience.codeCta")}
        </button>
      </section>
      <Link
        to="/customer/activity"
        className="block min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700"
      >
        {t("nav.activity")}
      </Link>
    </div>
  );
}
