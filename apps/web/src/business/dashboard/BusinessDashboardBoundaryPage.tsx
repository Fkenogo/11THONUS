/**
 * `/business/:businessId/dashboard` — route wrapper for the Package A Dashboard boundary
 * placeholder (`ENG-P3-002-UI-IMP-A`). Reads real `getBusinessContext` data — the same governed
 * pattern `BusinessWizardPage.tsx` already uses — never trusting the route param alone as
 * identity/display truth.
 */

import { useParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useBusinessContextQuery } from "../hooks/businessQueries";
import { DashboardPlaceholder } from "./DashboardPlaceholder";

export function BusinessDashboardBoundaryPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation("business");
  const query = useBusinessContextQuery(businessId);

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
        <h1 className="mb-2 text-lg font-semibold">{t("integrityError.title")}</h1>
        <p>{t("integrityError.body")}</p>
      </main>
    );
  }

  return <DashboardPlaceholder context={query.data} />;
}
