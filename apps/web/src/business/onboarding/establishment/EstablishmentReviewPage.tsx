/**
 * EST-03 — Review & Finish Setup (`ENG-P3-002-UI-IMP-A`, per `ENG-P3-002-UI-RECON-001` §VI/Brief
 * 3). Renders once `createBusiness` has already succeeded — this screen reads exclusively from
 * the server-authoritative `BusinessContext` passed down from `BusinessWizardPage`'s own
 * `getBusinessContext` query, never from any client-only copy of what EST-01/EST-02 collected.
 * Establishment-only: no Terms, no Team (both retired from this screen per FD-1/the Founder's
 * product boundary — Terms/Team remain fully functional elsewhere, unmodified, just not shown
 * here). "Finish setup" is a pure UX-level navigation into the Business Dashboard boundary — it
 * makes no backend call, submits nothing for verification, and does not touch `Business.status`.
 *
 * **Known, disclosed scope limit (not fixed here — a genuine backend gap, see the implementation
 * report):** `getBusinessContext` does not project `currencyCode`/`timezone` into
 * `BusinessContext` at all, even though `createBusiness` requires and persists both. This screen
 * therefore cannot display an "Operating details" section sourced from backend truth — omitting
 * it deliberately rather than fabricating a value or relying on stale client-only state.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher, useTranslation } from "../../../i18n";
import { Button } from "../../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery, useBusinessTypesQuery } from "../../hooks/businessQueries";
import { ClassificationStep } from "../steps/ClassificationStep";
import { BranchStep } from "../steps/BranchStep";
import type { BusinessContext } from "../../api/businessContext";

export function EstablishmentReviewPage({ context }: { context: BusinessContext }) {
  const { t, i18n } = useTranslation("business");
  const navigate = useNavigate();
  const [editing, setEditing] = useState<"identity" | "location" | null>(null);
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const typesQuery = useBusinessTypesQuery(context.primaryCategoryId, i18n.language);

  const categoryLabel =
    categoriesQuery.data?.find((option) => option.id === context.primaryCategoryId)?.displayLabel ??
    context.primaryCategoryId;
  const typeLabel = context.businessTypeId
    ? (typesQuery.data?.find((option) => option.id === context.businessTypeId)?.displayLabel ??
      context.businessTypeId)
    : undefined;

  if (editing === "identity") {
    return (
      <>
        <LanguageSwitcher />
        <ClassificationStep context={context} onContinue={() => setEditing(null)} />
      </>
    );
  }
  if (editing === "location") {
    return (
      <>
        <LanguageSwitcher />
        <BranchStep context={context} onContinue={() => setEditing(null)} />
      </>
    );
  }

  return (
    <section>
      <LanguageSwitcher />
      <h1 className="mb-4 text-xl font-semibold">{t("review.title")}</h1>

      <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">{t("review.businessSectionTitle")}</h2>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setEditing("identity")}
          >
            {t("actions.edit")}
          </button>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="font-medium">{t("review.businessNameLabel")}</dt>
            <dd>{context.displayName}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("review.categoryLabel")}</dt>
            <dd>{categoryLabel}</dd>
          </div>
          {typeLabel && (
            <div>
              <dt className="font-medium">{t("review.typeLabel")}</dt>
              <dd>{typeLabel}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium">{t("details.contactPhoneLabel")}</dt>
            <dd>{context.contactPhone}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">{t("review.locationSectionTitle")}</h2>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setEditing("location")}
          >
            {t("actions.edit")}
          </button>
        </div>
        <p className="text-sm">
          {context.branch?.displayName}, {context.branch?.city}
        </p>
      </div>

      <Button type="button" onClick={() => navigate(`/business/${context.businessId}/dashboard`)}>
        {t("actions.finishSetup")}
      </Button>
    </section>
  );
}
