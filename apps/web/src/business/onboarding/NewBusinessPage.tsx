/**
 * `/business/new` — Business + default-Branch bootstrap (design §16/§Phase H).
 * Collects the fields `createBusiness` genuinely requires, including
 * `primaryCategoryId` (backend-required at bootstrap, unlike Business Type
 * which stays optional and is refined later in the wizard). On success,
 * navigates straight to `/business/:businessId` — `getBusinessContext`
 * hydration (not this form) is the source of truth from then on.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { Button, Select, TextField } from "../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery } from "../hooks/businessQueries";
import { useCreateBusinessMutation } from "../hooks/businessMutations";
import { MutationError } from "./MutationError";

export function NewBusinessPage() {
  const { t, i18n } = useTranslation("business");
  const navigate = useNavigate();
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const mutation = useCreateBusinessMutation();

  const [displayName, setDisplayName] = useState("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [timezone, setTimezone] = useState("");

  const isComplete =
    displayName &&
    primaryCategoryId &&
    countryCode &&
    city &&
    contactPhone &&
    currencyCode &&
    timezone;

  function handleSubmit() {
    mutation.mutate(
      {
        displayName,
        primaryCategoryId,
        countryCode,
        city,
        contactPhone,
        currencyCode,
        timezone,
        // [] is a valid value for this required field (ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001)
        // — no repository source mandates this default explicitly, but no onboarding step
        // collects it either; refined later via profile update if ever needed.
        supportedLanguages: [],
      },
      {
        onSuccess: (result) => {
          if (result) navigate(`/business/${result.businessId}`, { replace: true });
        },
      },
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <LanguageSwitcher />
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
          onChange={setPrimaryCategoryId}
          placeholder={t("classification.categoryPlaceholder")}
          options={(categoriesQuery.data ?? []).map((option) => ({
            value: option.id,
            label: option.displayLabel,
          }))}
        />
        <TextField
          id="countryCode"
          label={t("details.countryLabel")}
          value={countryCode}
          onChange={setCountryCode}
        />
        <TextField id="city" label={t("details.cityLabel")} value={city} onChange={setCity} />
        <TextField
          id="contactPhone"
          label={t("details.contactPhoneLabel")}
          value={contactPhone}
          onChange={setContactPhone}
        />
        <TextField
          id="currencyCode"
          label={t("details.currencyLabel")}
          value={currencyCode}
          onChange={setCurrencyCode}
        />
        <TextField
          id="timezone"
          label={t("details.timezoneLabel")}
          value={timezone}
          onChange={setTimezone}
        />
        <Button type="button" disabled={!isComplete || mutation.isPending} onClick={handleSubmit}>
          {t("actions.continue")}
        </Button>
        <MutationError error={mutation.error} />
      </div>
    </main>
  );
}
