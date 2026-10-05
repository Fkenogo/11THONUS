/**
 * `/business` — the resume-detection entry point (design §9/§10). Zero
 * businesses → the create flow; exactly one → auto-select it; more than one
 * → a bounded selection list (no arbitrary auto-choice, no full switcher UI).
 */

import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAccessibleBusinessesQuery } from "../hooks/businessQueries";
import { ExperienceBrand } from "../../experience/ExperienceBrand";

function businessDestination(business: {
  businessId: string;
  role: "owner" | "manager" | "staff";
  status: string;
}): string {
  if (
    business.role === "owner" &&
    (business.status === "draft" || business.status === "pending_verification")
  ) {
    return `/business/${business.businessId}`;
  }
  return `/business/${business.businessId}/dashboard`;
}

export function BusinessResolverPage() {
  const { t } = useTranslation("business");
  const query = useAccessibleBusinessesQuery();

  if (query.status === "pending") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>{t("resolve.loading")}</p>
      </main>
    );
  }

  if (query.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>{t("integrityError.body")}</p>
      </main>
    );
  }

  const businesses = query.data;

  if (businesses.length === 0) {
    return <Navigate to="/business/new" replace />;
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-6 text-slate-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <ExperienceBrand />
        </header>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-950">
            {t("resolve.chooseContext")}
          </h1>
          <p className="mb-6 text-sm text-slate-600">{t("resolve.chooseContextDescription")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li>
              <Link
                to="/customer"
                className="block min-h-20 rounded-xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-900 hover:border-amber-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
              >
                {t("resolve.personal")}
              </Link>
            </li>
            {businesses.map((business) => (
              <li key={business.businessId}>
                <Link
                  to={businessDestination(business)}
                  className="block min-h-20 rounded-xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-900 hover:border-amber-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                >
                  {business.displayName} — {t(`resolve.roles.${business.role}`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
