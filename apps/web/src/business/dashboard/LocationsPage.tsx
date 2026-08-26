/**
 * Package C — Locations screen (MGMT-03, `ENG-P3-002-UI-IMP-C`, per
 * `ENG-P3-002-UI-RECON-001` Part XV Package C). Displays and edits only the
 * single Main Location (`BusinessContextBranch`) through the existing,
 * unchanged `updateBusinessBranchProfile` callable — the same fields
 * `BranchStep` already edits during establishment (`displayName`, `city`,
 * `address`). `countryCode` renders read-only here too, matching that same
 * existing precedent (`BranchStep` never edits it either — no new mutability
 * is invented for this package).
 *
 * No "Add new location" action, no per-location status/photo/ID badge, and
 * no multi-branch UI — all explicitly excluded by Package C's acceptance
 * criteria (`ENG-P3-002-UI-RECON-001` Part XV), even though the v3 Stitch
 * mockup depicts an "Add new location" control and an "Active"/ID badge.
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, TextField } from "../../components/ui/formPrimitives";
import { useUpdateBusinessBranchProfileMutation } from "../hooks/businessMutations";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext, BusinessContextBranch } from "../api/businessContext";

function countryDisplayName(countryCode: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function LocationsPage({ context }: { context: BusinessContext }) {
  const { t, i18n } = useTranslation("business");
  const [editing, setEditing] = useState(false);
  // `getBusinessContext` never returns `branch: null` for a Business that exists at all
  // (`businessReadService.ts`'s own Phase K/L correction) — the type stays nullable only for a
  // theoretical future relaxation, mirroring the same non-null read `BranchStep` already uses.
  const branch = context.branch!;

  if (editing) {
    return (
      <LocationEditForm
        businessId={context.businessId}
        branch={branch}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <section>
      <h1 className="mb-1 text-xl font-semibold">{t("locations.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">{t("locations.subtitle")}</p>

      <div className="rounded-md border border-[var(--color-border)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{branch.displayName}</h2>
          <button
            type="button"
            className="-m-3 p-3 text-sm underline"
            onClick={() => setEditing(true)}
          >
            {t("actions.edit")}
          </button>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-medium">{t("branch.cityLabel")}</dt>
            <dd>{branch.city}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("branch.countryLabel")}</dt>
            <dd>{countryDisplayName(branch.countryCode, i18n.language)}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("branch.addressLabel")}</dt>
            <dd>{branch.address ? branch.address : t("review.addressNotProvided")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function LocationEditForm({
  businessId,
  branch,
  onDone,
}: {
  businessId: string;
  branch: BusinessContextBranch;
  onDone: () => void;
}) {
  const { t } = useTranslation("business");
  const [displayName, setDisplayName] = useState(branch.displayName);
  const [city, setCity] = useState(branch.city);
  const [address, setAddress] = useState(branch.address ?? "");
  const mutation = useUpdateBusinessBranchProfileMutation(businessId, branch.branchId);

  function handleSave() {
    mutation.mutate({ displayName, city, address: address || undefined }, { onSuccess: onDone });
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">{t("locations.editTitle")}</h1>
      <div className="flex flex-col gap-4">
        <TextField
          id="locationName"
          label={t("branch.displayNameLabel")}
          value={displayName}
          onChange={setDisplayName}
        />
        <TextField
          id="locationCity"
          label={t("branch.cityLabel")}
          value={city}
          onChange={setCity}
        />
        <TextField
          id="locationAddress"
          label={t("branch.addressLabel")}
          value={address}
          onChange={setAddress}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            disabled={!displayName || !city || mutation.isPending}
            onClick={handleSave}
          >
            {t("actions.save")}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone} disabled={mutation.isPending}>
            {t("actions.cancel")}
          </Button>
        </div>
        <MutationError error={mutation.error} />
      </div>
    </section>
  );
}
