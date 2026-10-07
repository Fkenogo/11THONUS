/**
 * `/business/:businessId/dashboard/*` — route wrapper for the Business Dashboard
 * (`ENG-P3-002-UI-IMP-B`, superseding Package A's `DashboardPlaceholder`). Reads real
 * `getBusinessContext` data — the same governed pattern `BusinessWizardPage.tsx` already uses —
 * never trusting the route param alone as identity/display truth, then hands it to
 * `BusinessDashboardRoutes` for the shell + nested Dashboard destinations.
 */

import { useParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAccessibleBusinessesQuery, useBusinessContextQuery } from "../hooks/businessQueries";
import { StaffRoutes } from "../counter/StaffShell";
import { BusinessDashboardRoutes } from "./BusinessDashboardRoutes";

export function BusinessDashboardBoundaryPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation("business");
  const query = useBusinessContextQuery(businessId);
  const accessible = useAccessibleBusinessesQuery();

  if (query.status === "pending" || accessible.status === "pending") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>{t("resolve.loading")}</p>
      </main>
    );
  }

  if (query.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold">{t("integrityError.title")}</h1>
        <p>{t("integrityError.body")}</p>
      </main>
    );
  }

  // `EA-BL-001-CORR-002-B` (D8): Staff land on the Counter inside a bounded Staff shell; every other
  // role — and any case where the role could not be read — keeps the existing Business Dashboard,
  // unchanged. This is UX routing only: the server remains the authority for every operation.
  const role = accessible.data?.find(
    (business) => business.businessId === query.data.businessId,
  )?.role;
  if (role === "staff") {
    return <StaffRoutes context={query.data} />;
  }

  return <BusinessDashboardRoutes context={query.data} />;
}
