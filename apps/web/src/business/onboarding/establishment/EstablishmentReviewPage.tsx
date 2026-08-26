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
 * `ENG-P3-002-UI-IMP-A-CORR-001` correction (findings F2-1/F1-1 from the prior independent
 * review): `getBusinessContext` now projects `currencyCode`/`timezone` (backend correction,
 * `businessReadService.ts`), so this screen renders an "Operating details" section from that
 * backend truth. Country/address were already on `BusinessContextBranch` but weren't rendered —
 * they now are, read straight from `context.branch`, with a restrained "not provided" treatment
 * when `address` is absent (never an error state). Currency renders through `Intl.DisplayNames`
 * (a standard platform API, not an invented lookup table) for a customer-facing name instead of
 * the raw ISO code; timezone renders exactly as persisted — no detection, no conversion, the
 * backend value stays authoritative. `Business.address` (a separate, deliberately unresolved
 * field) is not touched by this screen.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher, useTranslation } from "../../../i18n";
import { Button } from "../../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery, useBusinessTypesQuery } from "../../hooks/businessQueries";
import { ClassificationStep } from "../steps/ClassificationStep";
import { BranchStep } from "../steps/BranchStep";
import { EstablishmentProgress } from "./EstablishmentProgress";
import type { BusinessContext } from "../../api/businessContext";

function currencyDisplayName(currencyCode: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
    return displayNames.of(currencyCode) ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

function countryDisplayName(countryCode: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

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
        <EstablishmentProgress current={3} total={3} />
        <ClassificationStep context={context} onContinue={() => setEditing(null)} />
      </>
    );
  }
  if (editing === "location") {
    return (
      <>
        <LanguageSwitcher />
        <EstablishmentProgress current={3} total={3} />
        <BranchStep context={context} onContinue={() => setEditing(null)} />
      </>
    );
  }

  return (
    <section>
      <LanguageSwitcher />
      <EstablishmentProgress current={3} total={3} />
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
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="font-medium">{t("review.locationLabel")}</dt>
            <dd>
              {context.branch?.displayName}, {context.branch?.city}
            </dd>
          </div>
          {context.branch?.countryCode && (
            <div>
              <dt className="font-medium">{t("review.countryLabel")}</dt>
              <dd>{countryDisplayName(context.branch.countryCode, i18n.language)}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium">{t("review.addressLabel")}</dt>
            <dd>
              {context.branch?.address ? context.branch.address : t("review.addressNotProvided")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
        <h2 className="mb-2 font-semibold">{t("review.operatingDetailsSectionTitle")}</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="font-medium">{t("review.currencyLabel")}</dt>
            <dd>{currencyDisplayName(context.currencyCode, i18n.language)}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("review.timezoneLabel")}</dt>
            <dd>{context.timezone}</dd>
          </div>
        </dl>
      </div>

      <Button type="button" onClick={() => navigate(`/business/${context.businessId}/dashboard`)}>
        {t("actions.finishSetup")}
      </Button>
    </section>
  );
}
