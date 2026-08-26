/**
 * EST-01 — Business Identity & Category (`ENG-P3-002-UI-IMP-A`, per
 * `ENG-P3-002-UI-RECON-001` §VI/Brief 1). Purely presentational/local-state — no `createBusiness`
 * call happens here; the real Business is created atomically at EST-02, per the Founder's
 * `REVIEW-AFTER-CREATE` disposition. Category/Type reuse the existing, unmodified Commerce
 * Knowledge query contracts and the same "clear Type on Category change" rule already governed
 * for post-creation editing (`ClassificationStep.tsx`, `DEC-CKS-003`).
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, Select, TextField } from "../../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery, useBusinessTypesQuery } from "../../hooks/businessQueries";

export type EstablishmentIdentityValues = {
  displayName: string;
  primaryCategoryId: string;
  businessTypeId: string;
  contactPhone: string;
};

export function EstablishmentIdentityStep({
  initialValues,
  onContinue,
}: {
  initialValues: EstablishmentIdentityValues;
  onContinue: (values: EstablishmentIdentityValues) => void;
}) {
  const { t, i18n } = useTranslation("business");
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(initialValues.primaryCategoryId);
  const [businessTypeId, setBusinessTypeId] = useState(initialValues.businessTypeId);
  const [contactPhone, setContactPhone] = useState(initialValues.contactPhone);
  const typesQuery = useBusinessTypesQuery(primaryCategoryId || undefined, i18n.language);

  function handleCategoryChange(next: string) {
    setPrimaryCategoryId(next);
    setBusinessTypeId(""); // explicit clear — never keep a Type from the previous Category
  }

  const isComplete = displayName && primaryCategoryId && contactPhone;

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">{t("details.title")}</h1>
      <div className="flex flex-col gap-4">
        <TextField
          id="displayName"
          label={t("details.displayNameLabel")}
          value={displayName}
          onChange={setDisplayName}
        />
        <Select
          id="primaryCategoryId"
          label={t("classification.categoryLabel")}
          value={primaryCategoryId}
          onChange={handleCategoryChange}
          placeholder={t("classification.categoryPlaceholder")}
          options={(categoriesQuery.data ?? []).map((option) => ({
            value: option.id,
            label: option.displayLabel,
          }))}
        />
        {primaryCategoryId &&
          (typesQuery.data && typesQuery.data.length > 0 ? (
            <Select
              id="businessTypeId"
              label={t("classification.typeLabel")}
              value={businessTypeId}
              onChange={setBusinessTypeId}
              options={typesQuery.data.map((option) => ({
                value: option.id,
                label: option.displayLabel,
              }))}
              placeholder={t("classification.typeNone")}
            />
          ) : (
            typesQuery.status === "success" && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {t("classification.typeUnavailable")}
              </p>
            )
          ))}
        <TextField
          id="contactPhone"
          label={t("details.contactPhoneLabel")}
          value={contactPhone}
          onChange={setContactPhone}
        />
        <Button
          type="button"
          disabled={!isComplete}
          onClick={() =>
            onContinue({ displayName, primaryCategoryId, businessTypeId, contactPhone })
          }
        >
          {t("actions.continue")}
        </Button>
      </div>
    </section>
  );
}
