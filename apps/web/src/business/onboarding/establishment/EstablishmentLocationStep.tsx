/**
 * EST-02 — Main Location & Operating Details (`ENG-P3-002-UI-IMP-A`, per
 * `ENG-P3-002-UI-RECON-001` §VI/Brief 2). **The real `createBusiness` call fires here, exactly
 * once, on Continue** — combining EST-01's already-collected identity/category/type/phone with
 * this screen's country/city/location-name/currency/timezone, per the Founder's
 * `REVIEW-AFTER-CREATE` disposition (`ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`). The
 * `createBusiness` required-field set and idempotency semantics are entirely unchanged
 * (`useCreateBusinessMutation`, unmodified). Any address entered here is `BusinessBranch.address`
 * — the default Branch's own field — never written to `Business.address`; that separate,
 * unresolved question (`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION` §4) stays
 * untouched by this component, which simply never sends an `address` key to `createBusiness` at
 * all (the default Branch's address is applied afterward, if ever, via
 * `updateBusinessBranchProfile` — exactly as `BranchStep.tsx` already does today).
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, TextField } from "../../../components/ui/formPrimitives";
import { useCreateBusinessMutation } from "../../hooks/businessMutations";
import { optionalField } from "../../api/optionalField";
import { MutationError } from "../MutationError";
import type { EstablishmentIdentityValues } from "./EstablishmentIdentityStep";

export type EstablishmentLocationValues = {
  countryCode: string;
  city: string;
  displayName: string;
  address: string;
  currencyCode: string;
  timezone: string;
};

export function EstablishmentLocationStep({
  identityValues,
  initialValues,
  onBack,
  onCreated,
}: {
  identityValues: EstablishmentIdentityValues;
  initialValues: EstablishmentLocationValues;
  onBack: (values: EstablishmentLocationValues) => void;
  onCreated: (businessId: string) => void;
}) {
  const { t } = useTranslation("business");
  const mutation = useCreateBusinessMutation();
  const [countryCode, setCountryCode] = useState(initialValues.countryCode);
  const [city, setCity] = useState(initialValues.city);
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [address, setAddress] = useState(initialValues.address);
  const [currencyCode, setCurrencyCode] = useState(initialValues.currencyCode);
  const [timezone, setTimezone] = useState(initialValues.timezone);

  const isComplete = countryCode && city && displayName && currencyCode && timezone;

  function currentValues(): EstablishmentLocationValues {
    return { countryCode, city, displayName, address, currencyCode, timezone };
  }

  function handleContinue() {
    mutation.mutate(
      {
        displayName: identityValues.displayName,
        primaryCategoryId: identityValues.primaryCategoryId,
        ...optionalField("businessTypeId", identityValues.businessTypeId),
        contactPhone: identityValues.contactPhone,
        countryCode,
        city,
        currencyCode,
        timezone,
        supportedLanguages: [],
      },
      {
        onSuccess: (result) => {
          if (result) onCreated(result.businessId);
        },
      },
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">{t("branch.title")}</h1>
      <div className="flex flex-col gap-4">
        <TextField
          id="countryCode"
          label={t("branch.countryLabel")}
          value={countryCode}
          onChange={setCountryCode}
        />
        <TextField id="city" label={t("branch.cityLabel")} value={city} onChange={setCity} />
        <TextField
          id="branchDisplayName"
          label={t("branch.displayNameLabel")}
          value={displayName}
          onChange={setDisplayName}
        />
        <TextField
          id="address"
          label={t("branch.addressLabel")}
          value={address}
          onChange={setAddress}
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
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => onBack(currentValues())}>
            {t("actions.back")}
          </Button>
          <Button
            type="button"
            disabled={!isComplete || mutation.isPending}
            onClick={handleContinue}
          >
            {t("actions.continue")}
          </Button>
        </div>
        <MutationError error={mutation.error} />
      </div>
    </section>
  );
}
