/**
 * `/business` — the resume-detection entry point (design §9/§10). Zero
 * businesses → the create flow; exactly one → auto-select it; more than one
 * → a bounded selection list (no arbitrary auto-choice, no full switcher UI).
 */

import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useOwnedBusinessesQuery } from "../hooks/businessQueries";

export function BusinessResolverPage() {
  const { t } = useTranslation("business");
  const query = useOwnedBusinessesQuery();

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

  if (businesses.length === 1) {
    return <Navigate to={`/business/${businesses[0].businessId}`} replace />;
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-xl font-semibold">{t("resolve.chooseBusiness")}</h1>
      <ul className="flex flex-col gap-2">
        {businesses.map((business) => (
          <li key={business.businessId}>
            <Link
              to={`/business/${business.businessId}`}
              className="block rounded-md border border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-muted)]"
            >
              {business.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
