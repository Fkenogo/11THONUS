/** Main-location (default Branch) profile editing (design §L). A missing branch is handled upstream by `OnboardingWizard`'s integrity check, not here. */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, TextField } from "../../../components/ui/formPrimitives";
import { useUpdateBusinessBranchProfileMutation } from "../../hooks/businessMutations";
import type { BusinessContext } from "../../api/businessContext";

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
      { displayName, city, address: address || undefined },
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
      </div>
    </section>
  );
}
