/**
 * `/business/:businessId` — lifecycle-routed shell (design §18, Founder
 * correction #5, updated `ENG-P3-002-UI-IMP-A`): `draft` opens EST-03 (the
 * Establishment Review & Finish Setup page — every persisted `draft` Business is always
 * establishment-complete by construction, since `createBusiness` enforces every establishment
 * field atomically; there is no partial-establishment persisted state to resume into);
 * `pending_verification` shows the submitted/pending state; every other status renders a bounded
 * generic safe state — never re-opens establishment, never the Dashboard shell (Package B, not
 * built here).
 */

import { useParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useBusinessContextQuery } from "../hooks/businessQueries";
import { EstablishmentReviewPage } from "./establishment/EstablishmentReviewPage";
import { SubmittedStatusPage } from "./SubmittedStatusPage";

export function BusinessWizardPage() {
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

  const context = query.data;

  switch (context.status) {
    case "draft":
      return <EstablishmentReviewPage context={context} />;
    case "pending_verification":
      return <SubmittedStatusPage context={context} />;
    default:
      return (
        <main className="flex min-h-screen items-center justify-center p-8 text-center">
          <p>{t("lifecycle.notAvailable")}</p>
        </main>
      );
  }
}
