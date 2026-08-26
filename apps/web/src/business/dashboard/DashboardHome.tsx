/**
 * DASH-01 — Business Dashboard Home (`ENG-P3-002-UI-IMP-B`, per `ENG-P3-002-UI-RECON-001` Part
 * VI/Brief 4). Renders only the Founder-governed minimum: Business identity (name, category), a
 * readiness state sourced exclusively from real `termsAcceptance.accepted` (never a fabricated
 * "% complete"), and the four governed management entry points. Deliberately excludes Business
 * Code (not part of the governed minimum; its correct treatment belongs to Package C's Business
 * Profile screen, not Home) and every D-classified Stitch invention (Active badge, merchant
 * account/appointments copy, revenue/loyalty/tier/subscription content) per Part IX/X.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useBusinessCategoriesQuery } from "../hooks/businessQueries";
import type { BusinessContext } from "../api/businessContext";

export function DashboardHome({ context }: { context: BusinessContext }) {
  const { t, i18n } = useTranslation("business");
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const categoryLabel =
    categoriesQuery.data?.find((option) => option.id === context.primaryCategoryId)?.displayLabel ??
    context.primaryCategoryId;

  const base = `/business/${context.businessId}/dashboard`;
  const entryPoints = [
    { to: `${base}/profile`, labelKey: "dashboard.entryPoints.profile" },
    { to: `${base}/locations`, labelKey: "dashboard.entryPoints.locations" },
    { to: `${base}/team`, labelKey: "dashboard.entryPoints.team" },
    { to: `${base}/terms`, labelKey: "dashboard.entryPoints.terms" },
  ] as const;

  return (
    <section>
      <h1 className="mb-1 text-xl font-semibold">{t("dashboard.home.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">
        {context.displayName} · {categoryLabel}
      </p>

      {context.termsAcceptance.accepted ? (
        <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
          <p className="text-sm">{t("dashboard.home.readyBody")}</p>
        </div>
      ) : (
        <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
          <h2 className="mb-1 font-semibold">{t("dashboard.home.termsOutstandingTitle")}</h2>
          <p className="mb-3 text-sm">{t("dashboard.home.termsOutstandingBody")}</p>
          <Link to={`${base}/terms`} className="text-sm underline">
            {t("dashboard.home.reviewTermsAction")}
          </Link>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entryPoints.map((entry) => (
          <li key={entry.to}>
            <Link
              to={entry.to}
              className="block rounded-md border border-[var(--color-border)] p-4 text-sm font-medium"
            >
              {t(entry.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
