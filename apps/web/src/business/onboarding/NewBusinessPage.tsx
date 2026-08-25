/**
 * `/business/new` — Business Establishment entry point (`ENG-P3-002-UI-IMP-A`, per
 * `ENG-P3-002-UI-RECON-001` Package A / `ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`'s
 * `REVIEW-AFTER-CREATE` journey). Orchestrates EST-01 (identity/category/type/phone) → EST-02
 * (location/operating details, where the real `createBusiness` call fires) with bounded,
 * in-memory-only local state — no persisted onboarding-step model, no `localStorage`, no
 * Firestore draft document (per the Founder's explicit "do not invent a persisted onboarding-step
 * model" instruction). A refresh before creation loses this in-memory state and restarts at
 * EST-01 — the same behavior this route already had before this task (a browser refresh on
 * `/business/new` has always lost in-progress form state). On `createBusiness` success, navigates
 * to `/business/:businessId`, where `getBusinessContext` — not this component's own state —
 * becomes the sole source of truth from then on.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../../i18n";
import {
  EstablishmentIdentityStep,
  type EstablishmentIdentityValues,
} from "./establishment/EstablishmentIdentityStep";
import {
  EstablishmentLocationStep,
  type EstablishmentLocationValues,
} from "./establishment/EstablishmentLocationStep";

const emptyIdentity: EstablishmentIdentityValues = {
  displayName: "",
  primaryCategoryId: "",
  businessTypeId: "",
  contactPhone: "",
};

const emptyLocation: EstablishmentLocationValues = {
  countryCode: "",
  city: "",
  displayName: "",
  address: "",
  currencyCode: "",
  timezone: "",
};

export function NewBusinessPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"identity" | "location">("identity");
  const [identityValues, setIdentityValues] = useState(emptyIdentity);
  const [locationValues, setLocationValues] = useState(emptyLocation);

  return (
    <main className="mx-auto max-w-lg p-6">
      <LanguageSwitcher />
      {step === "identity" && (
        <EstablishmentIdentityStep
          initialValues={identityValues}
          onContinue={(values) => {
            setIdentityValues(values);
            setStep("location");
          }}
        />
      )}
      {step === "location" && (
        <EstablishmentLocationStep
          identityValues={identityValues}
          initialValues={locationValues}
          onBack={(values) => {
            setLocationValues(values);
            setStep("identity");
          }}
          onCreated={(businessId) => navigate(`/business/${businessId}`, { replace: true })}
        />
      )}
    </main>
  );
}
