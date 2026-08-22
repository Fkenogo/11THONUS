/**
 * `/business/:businessId` — lifecycle-routed shell (design §18, Founder
 * correction #5): `draft` opens the onboarding wizard; `pending_verification`
 * shows the submitted/pending state; every other status renders a bounded
 * generic safe state — never re-opens the wizard, never a dashboard.
 */

import { useParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useBusinessContextQuery } from "../hooks/businessQueries";
import { OnboardingWizard } from "./OnboardingWizard";
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
      return <OnboardingWizard context={context} />;
    case "pending_verification":
      return <SubmittedStatusPage context={context} />;
    default:
      return (
        <main className="flex min-h-screen items-center justify-center p-8 text-center">
          <p>Not available from onboarding.</p>
        </main>
      );
  }
}
