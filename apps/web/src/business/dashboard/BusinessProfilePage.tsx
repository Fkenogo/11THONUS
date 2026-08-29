/**
 * Package C — Business Profile screen (MGMT-02, `ENG-P3-002-UI-IMP-C`, per
 * `ENG-P3-002-UI-RECON-001` Part XV Package C). Displays governed Business
 * profile fields from `BusinessContext` and edits them through the existing,
 * unchanged `updateBusinessProfile` callable — no new backend contract.
 *
 * `legalName`, `Business.address`, `logoUrl`, and `supportedLanguages` are
 * deliberately not shown here even though `updateBusinessProfile`'s patch
 * type accepts them: `getBusinessContext` does not project any of the four
 * back onto `BusinessContext`, so an edit control for them could never first
 * load a persisted value — extending that read projection is a backend
 * read-contract change outside this package's frontend-only authorization
 * (flagged as a finding, not resolved here). `Business.address` additionally
 * carries the separately deferred Founder disposition
 * (`ENG-P3-002-UI-RECON-001` Part XI) and stays untouched either way; Main
 * Location's own address lives on the Locations screen instead
 * (`BusinessBranch.address`, via `LocationsPage`).
 *
 * Business Code renders read-only with FD-3 §24's own governed framing —
 * "a permanent, system-generated, human-readable reference... suitable for
 * internal operational and support use," explicitly *not* a commerce,
 * integration, or public-sharing identifier — never the partner/integration
 * pitch some v3 Stitch mockups used.
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, Select, TextField } from "../../components/ui/formPrimitives";
import { useBusinessCategoriesQuery, useBusinessTypesQuery } from "../hooks/businessQueries";
import { useUpdateBusinessProfileMutation } from "../hooks/businessMutations";
import { optionalField } from "../api/optionalField";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";

export function BusinessProfilePage({ context }: { context: BusinessContext }) {
  const { t, i18n } = useTranslation("business");
  const [editing, setEditing] = useState(false);
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const typesQuery = useBusinessTypesQuery(context.primaryCategoryId, i18n.language);

  if (editing) {
    return <BusinessProfileEditForm context={context} onDone={() => setEditing(false)} />;
  }

  const categoryLabel =
    categoriesQuery.data?.find((option) => option.id === context.primaryCategoryId)?.displayLabel ??
    context.primaryCategoryId;
  const typeLabel = context.businessTypeId
    ? (typesQuery.data?.find((option) => option.id === context.businessTypeId)?.displayLabel ??
      context.businessTypeId)
    : t("profile.typeNone");

  return (
    <section>
      <h1 className="mb-1 text-xl font-semibold">{t("profile.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">{t("profile.subtitle")}</p>

      <div className="mb-6 rounded-md border border-[var(--color-border)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("profile.informationSectionTitle")}</h2>
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
            <dt className="font-medium">{t("profile.nameLabel")}</dt>
            <dd>{context.displayName}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("profile.categoryLabel")}</dt>
            <dd>{categoryLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("profile.typeLabel")}</dt>
            <dd>{typeLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("details.contactPhoneLabel")}</dt>
            <dd>{context.contactPhone}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("details.contactEmailLabel")}</dt>
            <dd>{context.contactEmail ? context.contactEmail : t("profile.emailNotProvided")}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-4">
        <h2 className="mb-3 font-semibold">{t("profile.identitySectionTitle")}</h2>
        <dl>
          <dt className="mb-1 text-sm font-medium">{t("profile.businessCodeLabel")}</dt>
          <dd className="mb-1 font-mono text-sm">{context.businessCode}</dd>
        </dl>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("profile.businessCodeHint")}
        </p>
      </div>
    </section>
  );
}

function BusinessProfileEditForm({
  context,
  onDone,
}: {
  context: BusinessContext;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation("business");
  const [displayName, setDisplayName] = useState(context.displayName);
  const [categoryId, setCategoryId] = useState(context.primaryCategoryId);
  const [businessTypeId, setBusinessTypeId] = useState(context.businessTypeId ?? "");
  const [contactPhone, setContactPhone] = useState(context.contactPhone);
  const [contactEmail, setContactEmail] = useState(context.contactEmail ?? "");
  const categoriesQuery = useBusinessCategoriesQuery(i18n.language);
  const typesQuery = useBusinessTypesQuery(categoryId || undefined, i18n.language);
  const mutation = useUpdateBusinessProfileMutation(context.businessId);

  function handleCategoryChange(next: string) {
    setCategoryId(next);
    setBusinessTypeId(""); // a Type from the old Category is never silently kept (DEC-CKS-003)
  }

  function handleSave() {
    mutation.mutate(
      {
        displayName,
        primaryCategoryId: categoryId,
        ...optionalField("businessTypeId", businessTypeId),
        contactPhone,
        ...optionalField("contactEmail", contactEmail),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">{t("profile.editTitle")}</h1>
      <div className="flex flex-col gap-4">
        <TextField
          id="profileName"
          label={t("profile.nameLabel")}
          value={displayName}
          onChange={setDisplayName}
        />
        <Select
          id="profileCategory"
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
              id="profileType"
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
          id="profilePhone"
          label={t("details.contactPhoneLabel")}
          value={contactPhone}
          onChange={setContactPhone}
        />
        <TextField
          id="profileEmail"
          label={t("details.contactEmailLabel")}
          value={contactEmail}
          onChange={setContactEmail}
          type="email"
        />
        <div className="flex gap-3">
          <Button
            type="button"
            disabled={!displayName || !categoryId || !contactPhone || mutation.isPending}
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
