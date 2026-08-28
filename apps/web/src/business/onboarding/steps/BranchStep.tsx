/**
 * Main-location (default Branch) profile editing (design §L). Reused as-is by
 * `EstablishmentReviewPage`'s (EST-03) "Edit" action (`ENG-P3-002-UI-IMP-A`) — same
 * `updateBusinessBranchProfile` mutation, no duplicated backend semantics.
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, TextField } from "../../../components/ui/formPrimitives";
import { useUpdateBusinessBranchProfileMutation } from "../../hooks/businessMutations";
import { optionalField } from "../../api/optionalField";
import type { BusinessContext } from "../../api/businessContext";
import { MutationError } from "../MutationError";

export function BranchStep({
  context,
  onContinue,
}: {
  context: BusinessContext;
  onContinue: () => void;
}) {
  const { t } = useTranslation("business");
  const branch = context.branch!;
  const [displayName, setDisplayName] = useState(branch.displayName);
  const [city, setCity] = useState(branch.city);
  const [address, setAddress] = useState(branch.address ?? "");
  const mutation = useUpdateBusinessBranchProfileMutation(context.businessId, branch.branchId);

  function handleSave() {
    mutation.mutate(
      { displayName, city, ...optionalField("address", address) },
      { onSuccess: onContinue },
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("branch.title")}</h2>
      <div className="flex flex-col gap-4">
        <TextField
          id="branchName"
          label={t("branch.displayNameLabel")}
          value={displayName}
          onChange={setDisplayName}
        />
        <TextField id="branchCity" label={t("branch.cityLabel")} value={city} onChange={setCity} />
        <TextField
          id="branchAddress"
          label={t("branch.addressLabel")}
          value={address}
          onChange={setAddress}
        />
        <Button
          type="button"
          disabled={!displayName || !city || mutation.isPending}
          onClick={handleSave}
        >
          {t("actions.continue")}
        </Button>
        <MutationError error={mutation.error} />
      </div>
    </section>
  );
}
