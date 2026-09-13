/**
 * Reward Program management (`PLATFORM-BASELINE-005A`).
 *
 * Minimum usable Business-facing surface: list existing programs, create a
 * new one, configure/edit a draft, publish it, and create the next
 * version. Deliberately bounded — no pause/retire/archive controls (not
 * implemented server-side in this package), no plan-capacity display, no
 * participant-facing surface. Server authorization remains mandatory
 * (`rewardProgram.manage`, Owner-only) — the role-based control visibility
 * here is convenience, never enforcement, matching this codebase's
 * existing Team Management precedent.
 *
 * `requiredVerifiedUnits`/`rewardQuantity` are rendered as fixed,
 * read-only platform-rule text — never an editable field — per the
 * approved design (Section 26).
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, Checkbox, TextField } from "../../components/ui/formPrimitives";
import { useAccessibleBusinessesQuery } from "../hooks/businessQueries";
import { useRewardProgramsQuery } from "../hooks/rewardProgramQueries";
import {
  useCreateNextRewardProgramVersionMutation,
  useCreateRewardProgramMutation,
  usePublishRewardProgramVersionMutation,
  useUpdateRewardProgramDraftMutation,
} from "../hooks/rewardProgramMutations";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";
import type {
  QualifyingNodeWire,
  RewardProgramWithCurrentVersionWire,
} from "../api/rewardProgramMutations";

type DraftFormState = {
  displayName: string;
  rewardProgramCategoryId: string;
  rewardDescription: string;
  qualifyingNodeIds: string;
  multipleUnitsAllowed: boolean;
  sharedLoyaltyNumberAllowed: boolean;
  effectiveFrom: string;
};

function emptyDraftForm(): DraftFormState {
  return {
    displayName: "",
    rewardProgramCategoryId: "",
    rewardDescription: "",
    qualifyingNodeIds: "",
    multipleUnitsAllowed: true,
    sharedLoyaltyNumberAllowed: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  };
}

function parseQualifyingNodeIds(raw: string): QualifyingNodeWire[] {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => ({ knowledgeNodeId: id, businessDisplayName: null }));
}

export function RewardProgramManagementPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const accessibleQuery = useAccessibleBusinessesQuery();
  const rewardProgramsQuery = useRewardProgramsQuery(context.businessId);

  const myRole = accessibleQuery.data?.find(
    (business) => business.businessId === context.businessId,
  )?.role;
  const canManage = myRole === "owner";

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<DraftFormState>(emptyDraftForm());
  const createMutation = useCreateRewardProgramMutation(context.businessId);

  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DraftFormState>(emptyDraftForm());
  const updateDraftMutation = useUpdateRewardProgramDraftMutation(context.businessId);
  const publishMutation = usePublishRewardProgramVersionMutation(context.businessId);
  const createNextVersionMutation = useCreateNextRewardProgramVersionMutation(context.businessId);

  if (rewardProgramsQuery.isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p>{t("rewardProgram.loading")}</p>
      </main>
    );
  }

  if (rewardProgramsQuery.isError) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div role="alert" className="rounded-md border border-[var(--color-border)] p-4">
          {t("rewardProgram.loadError")}
        </div>
      </main>
    );
  }

  const programs = rewardProgramsQuery.data ?? [];

  function startEdit(entry: RewardProgramWithCurrentVersionWire) {
    setEditingProgramId(entry.program.id);
    setEditForm({
      displayName: entry.program.displayName,
      rewardProgramCategoryId: entry.program.rewardProgramCategoryId,
      rewardDescription: entry.currentVersion?.rewardDescription ?? "",
      qualifyingNodeIds:
        entry.currentVersion?.qualifyingNodes.map((n) => n.knowledgeNodeId).join(", ") ?? "",
      multipleUnitsAllowed: entry.currentVersion?.multipleUnitsAllowed ?? true,
      sharedLoyaltyNumberAllowed: entry.currentVersion?.sharedLoyaltyNumberAllowed ?? false,
      effectiveFrom:
        entry.currentVersion?.effectiveFrom.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    });
  }

  function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate(
      {
        displayName: createForm.displayName,
        rewardProgramCategoryId: createForm.rewardProgramCategoryId,
        rewardDescription: createForm.rewardDescription,
        multipleUnitsAllowed: createForm.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: createForm.sharedLoyaltyNumberAllowed,
        effectiveFrom: new Date(createForm.effectiveFrom).toISOString(),
        qualifyingNodes: parseQualifyingNodeIds(createForm.qualifyingNodeIds),
      },
      {
        onSuccess: () => {
          setCreating(false);
          setCreateForm(emptyDraftForm());
        },
      },
    );
  }

  function handleEditSubmit(entry: RewardProgramWithCurrentVersionWire) {
    if (!entry.currentVersion) return;
    updateDraftMutation.mutate(
      {
        rewardProgramId: entry.program.id,
        versionId: entry.currentVersion.id,
        expectedRowVersion: entry.currentVersion.rowVersion,
        rewardDescription: editForm.rewardDescription,
        multipleUnitsAllowed: editForm.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: editForm.sharedLoyaltyNumberAllowed,
        effectiveFrom: new Date(editForm.effectiveFrom).toISOString(),
        qualifyingNodes: parseQualifyingNodeIds(editForm.qualifyingNodeIds),
      },
      { onSuccess: () => setEditingProgramId(null) },
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("rewardProgram.title")}</h1>
        {canManage && !creating && (
          <Button type="button" onClick={() => setCreating(true)}>
            {t("rewardProgram.createAction")}
          </Button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={handleCreateSubmit}
          className="mb-6 space-y-3 rounded-md border border-[var(--color-border)] p-4"
        >
          <h2 className="font-semibold">{t("rewardProgram.createFormTitle")}</h2>
          <TextField
            id="rp-create-displayName"
            label={t("rewardProgram.fieldDisplayName")}
            value={createForm.displayName}
            onChange={(v) => setCreateForm((f) => ({ ...f, displayName: v }))}
            required
          />
          <TextField
            id="rp-create-category"
            label={t("rewardProgram.fieldCategory")}
            value={createForm.rewardProgramCategoryId}
            onChange={(v) => setCreateForm((f) => ({ ...f, rewardProgramCategoryId: v }))}
            required
          />
          <TextField
            id="rp-create-qualifyingNodes"
            label={t("rewardProgram.fieldQualifyingNodes")}
            value={createForm.qualifyingNodeIds}
            onChange={(v) => setCreateForm((f) => ({ ...f, qualifyingNodeIds: v }))}
          />
          <TextField
            id="rp-create-rewardDescription"
            label={t("rewardProgram.fieldRewardDescription")}
            value={createForm.rewardDescription}
            onChange={(v) => setCreateForm((f) => ({ ...f, rewardDescription: v }))}
            required
          />
          <TextField
            id="rp-create-effectiveFrom"
            label={t("rewardProgram.fieldEffectiveFrom")}
            type="date"
            value={createForm.effectiveFrom}
            onChange={(v) => setCreateForm((f) => ({ ...f, effectiveFrom: v }))}
            required
          />
          <Checkbox
            id="rp-create-multipleUnits"
            label={t("rewardProgram.fieldMultipleUnitsAllowed")}
            checked={createForm.multipleUnitsAllowed}
            onChange={(v) => setCreateForm((f) => ({ ...f, multipleUnitsAllowed: v }))}
          />
          <Checkbox
            id="rp-create-sharedNumber"
            label={t("rewardProgram.fieldSharedLoyaltyNumberAllowed")}
            checked={createForm.sharedLoyaltyNumberAllowed}
            onChange={(v) => setCreateForm((f) => ({ ...f, sharedLoyaltyNumberAllowed: v }))}
          />
          <FixedInvariantsNote t={t} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? t("rewardProgram.saving")
                : t("rewardProgram.createSubmit")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("rewardProgram.cancel")}
            </Button>
          </div>
          <MutationError error={createMutation.error} />
        </form>
      )}

      {programs.length === 0 && !creating && (
        <p className="text-[var(--color-muted-foreground)]">{t("rewardProgram.emptyState")}</p>
      )}

      <ul className="space-y-4">
        {programs.map((entry) => (
          <li key={entry.program.id} className="rounded-md border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{entry.program.displayName}</h2>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {t(`rewardProgram.status.${entry.program.status}`)}
              </span>
            </div>

            {entry.currentVersion && editingProgramId !== entry.program.id && (
              <div className="mt-2 text-sm">
                <p>{entry.currentVersion.rewardDescription}</p>
                <p className="text-[var(--color-muted-foreground)]">
                  {t("rewardProgram.versionLabel", { version: entry.currentVersion.version })} —{" "}
                  {t(`rewardProgram.versionStatus.${entry.currentVersion.status}`)}
                </p>
              </div>
            )}

            {canManage && editingProgramId !== entry.program.id && (
              <div className="mt-3 flex gap-2">
                {entry.currentVersion?.status === "draft" && (
                  <>
                    <Button type="button" variant="secondary" onClick={() => startEdit(entry)}>
                      {t("rewardProgram.editDraftAction")}
                    </Button>
                    <Button
                      type="button"
                      disabled={publishMutation.isPending}
                      onClick={() =>
                        entry.currentVersion &&
                        publishMutation.mutate({
                          rewardProgramId: entry.program.id,
                          versionId: entry.currentVersion.id,
                        })
                      }
                    >
                      {t("rewardProgram.publishAction")}
                    </Button>
                  </>
                )}
                {entry.currentVersion?.status === "active" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createNextVersionMutation.isPending}
                    onClick={() =>
                      entry.currentVersion &&
                      createNextVersionMutation.mutate({
                        rewardProgramId: entry.program.id,
                        rewardDescription: entry.currentVersion.rewardDescription,
                        multipleUnitsAllowed: entry.currentVersion.multipleUnitsAllowed,
                        sharedLoyaltyNumberAllowed: entry.currentVersion.sharedLoyaltyNumberAllowed,
                        effectiveFrom: new Date().toISOString(),
                        qualifyingNodes: entry.currentVersion.qualifyingNodes,
                      })
                    }
                  >
                    {t("rewardProgram.createNextVersionAction")}
                  </Button>
                )}
              </div>
            )}

            {editingProgramId === entry.program.id && (
              <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                <TextField
                  id={`rp-edit-rewardDescription-${entry.program.id}`}
                  label={t("rewardProgram.fieldRewardDescription")}
                  value={editForm.rewardDescription}
                  onChange={(v) => setEditForm((f) => ({ ...f, rewardDescription: v }))}
                  required
                />
                <TextField
                  id={`rp-edit-qualifyingNodes-${entry.program.id}`}
                  label={t("rewardProgram.fieldQualifyingNodes")}
                  value={editForm.qualifyingNodeIds}
                  onChange={(v) => setEditForm((f) => ({ ...f, qualifyingNodeIds: v }))}
                />
                <TextField
                  id={`rp-edit-effectiveFrom-${entry.program.id}`}
                  label={t("rewardProgram.fieldEffectiveFrom")}
                  type="date"
                  value={editForm.effectiveFrom}
                  onChange={(v) => setEditForm((f) => ({ ...f, effectiveFrom: v }))}
                  required
                />
                <Checkbox
                  id={`rp-edit-multipleUnits-${entry.program.id}`}
                  label={t("rewardProgram.fieldMultipleUnitsAllowed")}
                  checked={editForm.multipleUnitsAllowed}
                  onChange={(v) => setEditForm((f) => ({ ...f, multipleUnitsAllowed: v }))}
                />
                <Checkbox
                  id={`rp-edit-sharedNumber-${entry.program.id}`}
                  label={t("rewardProgram.fieldSharedLoyaltyNumberAllowed")}
                  checked={editForm.sharedLoyaltyNumberAllowed}
                  onChange={(v) => setEditForm((f) => ({ ...f, sharedLoyaltyNumberAllowed: v }))}
                />
                <FixedInvariantsNote t={t} />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={updateDraftMutation.isPending}
                    onClick={() => handleEditSubmit(entry)}
                  >
                    {updateDraftMutation.isPending
                      ? t("rewardProgram.saving")
                      : t("rewardProgram.saveDraftAction")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingProgramId(null)}
                  >
                    {t("rewardProgram.cancel")}
                  </Button>
                </div>
                <MutationError error={updateDraftMutation.error} />
              </div>
            )}
            <MutationError error={publishMutation.error} />
            <MutationError error={createNextVersionMutation.error} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function FixedInvariantsNote({
  t,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <p className="rounded-md bg-[var(--color-muted)] p-2 text-sm text-[var(--color-muted-foreground)]">
      {t("rewardProgram.fixedInvariantsNote", { threshold: 10, quantity: 1 })}
    </p>
  );
}
