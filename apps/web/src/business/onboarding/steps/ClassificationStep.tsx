/**
 * Business Category (required) / Business Type (optional) selection
 * (design §12/§13/Phase J-K). Categories/Types are never hardcoded — both
 * come from `listBusinessCategories`/`listBusinessTypesForCategory`. A
 * Category change explicitly clears any previously-selected Type rather
 * than leaving a Type from a different Category silently attached
 * (`DEC-CKS-003`).
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, Select } from "../../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery, useBusinessTypesQuery } from "../../hooks/businessQueries";
import { useUpdateBusinessProfileMutation } from "../../hooks/businessMutations";
import { optionalField } from "../../api/optionalField";
import type { BusinessContext } from "../../api/businessContext";
import { MutationError } from "../MutationError";

export function ClassificationStep({
  context,
  onContinue,
}: {
  context: BusinessContext;
  onContinue: () => void;
}) {
  const { t, i18n } = useTranslation("business");
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const [categoryId, setCategoryId] = useState(context.primaryCategoryId);
  const [businessTypeId, setBusinessTypeId] = useState(context.businessTypeId ?? "");
  const typesQuery = useBusinessTypesQuery(categoryId || undefined, i18n.language);
  const mutation = useUpdateBusinessProfileMutation(context.businessId);

  function handleCategoryChange(next: string) {
    setCategoryId(next);
    setBusinessTypeId(""); // explicit clear — a Type from the old Category is never silently kept
  }

  function handleSave() {
    mutation.mutate(
      { primaryCategoryId: categoryId, ...optionalField("businessTypeId", businessTypeId) },
      { onSuccess: onContinue },
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("classification.title")}</h2>
      <div className="flex flex-col gap-4">
        <Select
          id="category"
          label={t("classification.categoryLabel")}
          value={categoryId}
          onChange={handleCategoryChange}
          placeholder={t("classification.categoryPlaceholder")}
          options={(categoriesQuery.data ?? []).map((option) => ({
            value: option.id,
            label: option.displayLabel,
          }))}
        />

        {categoryId &&
          (typesQuery.data && typesQuery.data.length > 0 ? (
            <Select
              id="businessType"
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

        <Button type="button" disabled={!categoryId || mutation.isPending} onClick={handleSave}>
          {t("actions.continue")}
        </Button>
        <MutationError error={mutation.error} />
      </div>
    </section>
  );
}
