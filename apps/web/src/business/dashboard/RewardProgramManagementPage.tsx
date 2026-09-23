/**
 * Reward Program management (`PLATFORM-BASELINE-005A`, re-bound to
 * Business-owned Qualifying Items by `PLATFORM-BASELINE-013B` per
 * `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001`).
 *
 * Two surfaces, one page:
 *
 * 1. The Business's own Qualifying Item library -- add, rename, retire.
 *    Items are Business-authored names ("Black Coffee"); no Commerce
 *    Knowledge classification is required. Gated on
 *    `qualifyingItem.manage` server-side (Owner/Manager); the role-based
 *    visibility here is convenience, never enforcement.
 * 2. Reward Program configuration -- list existing programs, create a new
 *    one, configure/edit a draft through `QualifyingItemSelector` (stable
 *    `qualifyingItemId` bindings, human-readable Business names), publish
 *    it, and create the next version. Gated on `rewardProgram.manage`
 *    server-side (Owner-only).
 *
 * `requiredVerifiedUnits`/`rewardQuantity` are rendered as fixed,
 * read-only platform-rule text -- never an editable field -- per the
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
import { useQualifyingItemsQuery } from "../hooks/qualifyingItemQueries";
import {
  useCreateQualifyingItemMutation,
  useRetireQualifyingItemMutation,
  useUpdateQualifyingItemMutation,
} from "../hooks/qualifyingItemMutations";
import { MutationError } from "../onboarding/MutationError";
import { QualifyingItemSelector } from "./QualifyingItemSelector";
import { QualifyingItemClassificationEditor } from "./QualifyingItemClassificationEditor";
import { useKnowledgeNodeLabelsQuery } from "../hooks/businessQueries";
import type { BusinessContext } from "../api/businessContext";
import type { RewardProgramWithVersionsWire } from "../api/rewardProgramMutations";
import type { QualifyingItemWire } from "../api/qualifyingItems";

/**
 * The edit form round-trips the COMPLETE version snapshot
 * (`PLATFORM-BASELINE-005A-CORR-001` Finding 4): the server normalizes
 * omitted optional values to `null` and a draft update replaces the full
 * draft snapshot, so the form must carry `standardRewardNodeId`,
 * `bulkReviewThreshold`, and `effectiveUntil` through every edit even
 * though they are not (yet) exposed as editable controls -- the UI must
 * never silently clear configuration it does not own. The three fields
 * are loaded from the draft on `startEdit` and sent back unchanged until
 * product scope exposes them.
 *
 * `rewardProgramCategoryId` is deliberately NOT part of this form as of
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`) -- Phase 1 does not require a Reward
 * Program Category at all, so the create form no longer collects one and
 * the (already immutable) field is simply omitted from every request.
 */
type DraftFormState = {
  displayName: string;
  rewardDescription: string;
  /**
   * `PLATFORM-BASELINE-013B`: stable Business-owned Qualifying Item ids,
   * edited exclusively through `QualifyingItemSelector` -- the operator
   * never types an id and never sees one. Display names come from the
   * Business's own item library (live) or the version's frozen snapshot
   * (historical).
   */
  qualifyingItemIds: string[];
  multipleUnitsAllowed: boolean;
  sharedLoyaltyNumberAllowed: boolean;
  effectiveFrom: string;
  /** Preserved, not yet product-exposed: round-tripped unchanged (Finding 4). */
  standardRewardNodeId: string | null;
  /** Preserved, not yet product-exposed: round-tripped unchanged (Finding 4). */
  bulkReviewThreshold: number | null;
  /** Preserved, not yet product-exposed: round-tripped unchanged (Finding 4). */
  effectiveUntil: string | null;
};

function emptyDraftForm(): DraftFormState {
  return {
    displayName: "",
    rewardDescription: "",
    qualifyingItemIds: [],
    multipleUnitsAllowed: true,
    sharedLoyaltyNumberAllowed: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    standardRewardNodeId: null,
    bulkReviewThreshold: null,
    effectiveUntil: null,
  };
}

/** Frozen display evidence per bound id, for retired/historical references. */
function snapshotNamesOf(
  version: { qualifyingItems: { qualifyingItemId: string; itemNameAtVersion: string }[] } | null,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of version?.qualifyingItems ?? []) {
    map.set(item.qualifyingItemId, item.itemNameAtVersion);
  }
  return map;
}

export function RewardProgramManagementPage({ context }: { context: BusinessContext }) {
  const { t, i18n } = useTranslation("business");
  const accessibleQuery = useAccessibleBusinessesQuery();
  const rewardProgramsQuery = useRewardProgramsQuery(context.businessId);
  const qualifyingItemsQuery = useQualifyingItemsQuery(context.businessId);

  const myRole = accessibleQuery.data?.find(
    (business) => business.businessId === context.businessId,
  )?.role;
  const canManage = myRole === "owner";
  // `DEC-LOY-017`: Managers may manage Qualifying Items (but not Reward Programs).
  const canManageItems = myRole === "owner" || myRole === "manager";

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<DraftFormState>(emptyDraftForm());
  const createMutation = useCreateRewardProgramMutation(context.businessId);

  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DraftFormState>(emptyDraftForm());
  const updateDraftMutation = useUpdateRewardProgramDraftMutation(context.businessId);
  const publishMutation = usePublishRewardProgramVersionMutation(context.businessId);
  const createNextVersionMutation = useCreateNextRewardProgramVersionMutation(context.businessId);

  const activeItems = qualifyingItemsQuery.data ?? [];
  const frozenNodeIds = (rewardProgramsQuery.data ?? []).flatMap((entry) =>
    [entry.currentVersion, entry.draftVersion].flatMap((version) =>
      (version?.qualifyingItems ?? []).flatMap((item) =>
        item.knowledgeNodeIdAtVersion ? [item.knowledgeNodeIdAtVersion] : [],
      ),
    ),
  );
  const classificationLanguage = i18n.language.startsWith("fr") ? "fr" : "en";
  const frozenLabelsQuery = useKnowledgeNodeLabelsQuery(
    [...new Set(frozenNodeIds)],
    classificationLanguage,
  );
  const frozenLabels = new Map(
    (frozenLabelsQuery.data ?? []).map((item) => [item.id, item.displayLabel]),
  );
  const classificationMutation = useUpdateQualifyingItemMutation(context.businessId);

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

  function startEdit(entry: RewardProgramWithVersionsWire) {
    const draft = entry.draftVersion;
    if (!draft) return;
    setEditingProgramId(entry.program.id);
    setEditForm({
      displayName: entry.program.displayName,
      rewardDescription: draft.rewardDescription,
      qualifyingItemIds: draft.qualifyingItems.map((item) => item.qualifyingItemId),
      multipleUnitsAllowed: draft.multipleUnitsAllowed,
      sharedLoyaltyNumberAllowed: draft.sharedLoyaltyNumberAllowed,
      effectiveFrom: draft.effectiveFrom.slice(0, 10),
      // Finding 4: preserve the optional fields the form does not own.
      standardRewardNodeId: draft.standardRewardNodeId,
      bulkReviewThreshold: draft.bulkReviewThreshold,
      effectiveUntil: draft.effectiveUntil,
    });
  }

  function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate(
      {
        displayName: createForm.displayName,
        rewardDescription: createForm.rewardDescription,
        multipleUnitsAllowed: createForm.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: createForm.sharedLoyaltyNumberAllowed,
        effectiveFrom: new Date(createForm.effectiveFrom).toISOString(),
        qualifyingItemIds: createForm.qualifyingItemIds,
      },
      {
        onSuccess: () => {
          setCreating(false);
          setCreateForm(emptyDraftForm());
        },
      },
    );
  }

  function handleEditSubmit(entry: RewardProgramWithVersionsWire) {
    const draft = entry.draftVersion;
    if (!draft) return;
    updateDraftMutation.mutate(
      {
        rewardProgramId: entry.program.id,
        versionId: draft.id,
        expectedRowVersion: draft.rowVersion,
        rewardDescription: editForm.rewardDescription,
        standardRewardNodeId: editForm.standardRewardNodeId,
        multipleUnitsAllowed: editForm.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: editForm.sharedLoyaltyNumberAllowed,
        bulkReviewThreshold: editForm.bulkReviewThreshold,
        effectiveFrom: new Date(editForm.effectiveFrom).toISOString(),
        effectiveUntil: editForm.effectiveUntil,
        qualifyingItemIds: editForm.qualifyingItemIds,
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

      {canManageItems && (
        <QualifyingItemsSection
          businessId={context.businessId}
          businessTypeId={context.businessTypeId}
          items={activeItems}
          isLoading={qualifyingItemsQuery.isLoading}
          isError={qualifyingItemsQuery.isError}
          updateClassification={(item, knowledgeNodeId) =>
            classificationMutation.mutate({ qualifyingItemId: item.id, knowledgeNodeId })
          }
          classificationSaving={classificationMutation.isPending}
          classificationError={classificationMutation.error}
        />
      )}

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
          {/* PLATFORM-BASELINE-010B (Founder decision DEC-LOY-014 /
              FD-REWARD-QUALIFICATION-001): Phase 1 does not require a
              Reward Program Category -- the category selector is removed
              from this form entirely, never rendered as an optional field
              either. */}
          {/* PLATFORM-BASELINE-013B (DEC-LOY-016): qualification binds the
              Business's own Qualifying Items below -- the operative
              qualification definition. */}
          <QualifyingItemSelector
            idPrefix="rp-create-qi"
            items={activeItems}
            isLoading={qualifyingItemsQuery.isLoading}
            isError={qualifyingItemsQuery.isError}
            selectedIds={createForm.qualifyingItemIds}
            onChange={(next) => setCreateForm((f) => ({ ...f, qualifyingItemIds: next }))}
            snapshotNames={snapshotNamesOf(null)}
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

            {/* Published display always comes from currentVersion; the
                editable draft is a separate concept (Finding 1). */}
            {entry.currentVersion && editingProgramId !== entry.program.id && (
              <div className="mt-2 text-sm">
                <p>{entry.currentVersion.rewardDescription}</p>
                <BoundItemsList
                  items={entry.currentVersion.qualifyingItems}
                  label={t("rewardProgram.boundItemsLabel")}
                  classificationLabel={t("rewardProgram.classification.label")}
                  classificationNone={t("rewardProgram.classification.none")}
                  classificationUnavailable={t("rewardProgram.classification.unavailable")}
                  classificationLabels={frozenLabels}
                />
                <p className="text-[var(--color-muted-foreground)]">
                  {t("rewardProgram.versionLabel", { version: entry.currentVersion.version })} —{" "}
                  {t(`rewardProgram.versionStatus.${entry.currentVersion.status}`)}
                </p>
              </div>
            )}

            {!entry.currentVersion &&
              entry.draftVersion &&
              editingProgramId !== entry.program.id && (
                <div className="mt-2 text-sm">
                  <p>{entry.draftVersion.rewardDescription}</p>
                  <BoundItemsList
                    items={entry.draftVersion.qualifyingItems}
                    label={t("rewardProgram.boundItemsLabel")}
                    classificationLabel={t("rewardProgram.classification.label")}
                    classificationNone={t("rewardProgram.classification.none")}
                    classificationUnavailable={t("rewardProgram.classification.unavailable")}
                    classificationLabels={frozenLabels}
                  />
                  <p className="text-[var(--color-muted-foreground)]">
                    {t("rewardProgram.versionLabel", { version: entry.draftVersion.version })} —{" "}
                    {t(`rewardProgram.versionStatus.${entry.draftVersion.status}`)}
                  </p>
                </div>
              )}

            {canManage && editingProgramId !== entry.program.id && (
              <div className="mt-3 flex gap-2">
                {/* Edit/save/publish act on the editable DRAFT, never the
                    published version (Finding 1). */}
                {entry.draftVersion?.status === "draft" && (
                  <>
                    <Button type="button" variant="secondary" onClick={() => startEdit(entry)}>
                      {t("rewardProgram.editDraftAction")}
                    </Button>
                    <Button
                      type="button"
                      disabled={publishMutation.isPending}
                      onClick={() =>
                        entry.draftVersion &&
                        publishMutation.mutate({
                          rewardProgramId: entry.program.id,
                          versionId: entry.draftVersion.id,
                        })
                      }
                    >
                      {t("rewardProgram.publishAction")}
                    </Button>
                  </>
                )}
                {/* "Create next version" is eligible only for a published
                    current version AND only while no draft exists (Finding
                    1); the payload preserves the current version's optional
                    fields the form does not own (Finding 4). */}
                {entry.currentVersion?.status === "active" && !entry.draftVersion && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createNextVersionMutation.isPending}
                    onClick={() =>
                      entry.currentVersion &&
                      createNextVersionMutation.mutate({
                        rewardProgramId: entry.program.id,
                        rewardDescription: entry.currentVersion.rewardDescription,
                        standardRewardNodeId: entry.currentVersion.standardRewardNodeId,
                        multipleUnitsAllowed: entry.currentVersion.multipleUnitsAllowed,
                        sharedLoyaltyNumberAllowed: entry.currentVersion.sharedLoyaltyNumberAllowed,
                        bulkReviewThreshold: entry.currentVersion.bulkReviewThreshold,
                        effectiveFrom: new Date().toISOString(),
                        effectiveUntil: entry.currentVersion.effectiveUntil,
                        qualifyingItemIds: entry.currentVersion.qualifyingItems.map(
                          (item) => item.qualifyingItemId,
                        ),
                      })
                    }
                  >
                    {t("rewardProgram.createNextVersionAction")}
                  </Button>
                )}
              </div>
            )}

            {editingProgramId === entry.program.id && entry.draftVersion && (
              <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                <TextField
                  id={`rp-edit-rewardDescription-${entry.program.id}`}
                  label={t("rewardProgram.fieldRewardDescription")}
                  value={editForm.rewardDescription}
                  onChange={(v) => setEditForm((f) => ({ ...f, rewardDescription: v }))}
                  required
                />
                {/* PLATFORM-BASELINE-013B: the draft binds the Business's
                    own Qualifying Items. A previously-bound item that has
                    since been retired stays visible via its frozen
                    snapshot name until explicitly removed. */}
                <QualifyingItemSelector
                  idPrefix={`rp-edit-qi-${entry.program.id}`}
                  items={activeItems}
                  isLoading={qualifyingItemsQuery.isLoading}
                  isError={qualifyingItemsQuery.isError}
                  selectedIds={editForm.qualifyingItemIds}
                  onChange={(next) => setEditForm((f) => ({ ...f, qualifyingItemIds: next }))}
                  snapshotNames={snapshotNamesOf(entry.draftVersion)}
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

/** Renders a version's bound qualification as Business-authored names (never ids). */
function BoundItemsList({
  items,
  label,
  classificationLabel,
  classificationNone,
  classificationUnavailable,
  classificationLabels,
}: {
  items: readonly {
    qualifyingItemId: string;
    itemNameAtVersion: string;
    knowledgeNodeIdAtVersion: string | null;
  }[];
  label: string;
  classificationLabel: string;
  classificationNone: string;
  classificationUnavailable: string;
  classificationLabels: ReadonlyMap<string, string | null>;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-1 list-disc pl-5">
      <li className="list-none pl-0 text-[var(--color-muted-foreground)]">{label}</li>
      {items.map((item) => (
        <li key={item.qualifyingItemId}>
          {item.itemNameAtVersion}
          <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
            {classificationLabel}:{" "}
            {item.knowledgeNodeIdAtVersion
              ? (classificationLabels.get(item.knowledgeNodeIdAtVersion) ??
                classificationUnavailable)
              : classificationNone}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Business's own Qualifying Item library (`PLATFORM-BASELINE-013B`,
 * `DEC-LOY-017`): add, rename, retire. No taxonomy interaction on this
 * path -- names are Business-authored free text, optionally classifiable
 * later (deferred classification UI is a separate package).
 */
function QualifyingItemsSection({
  businessId,
  businessTypeId,
  items,
  isLoading,
  isError,
  updateClassification,
  classificationSaving,
  classificationError,
}: {
  businessId: string;
  businessTypeId: string | undefined;
  items: readonly QualifyingItemWire[];
  isLoading: boolean;
  isError: boolean;
  updateClassification: (item: QualifyingItemWire, knowledgeNodeId: string | null) => void;
  classificationSaving: boolean;
  classificationError: unknown;
}) {
  const { t } = useTranslation("business");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [retireId, setRetireId] = useState<string | null>(null);

  const createMutation = useCreateQualifyingItemMutation(businessId);
  const updateMutation = useUpdateQualifyingItemMutation(businessId);
  const retireMutation = useRetireQualifyingItemMutation(businessId);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (name.length === 0) return;
    createMutation.mutate(
      { name },
      {
        onSuccess: () => setNewName(""),
      },
    );
  }

  function startRename(item: QualifyingItemWire) {
    setEditingId(item.id);
    setEditName(item.name);
    setRetireId(null);
  }

  function handleRename(item: QualifyingItemWire) {
    const name = editName.trim();
    if (name.length === 0 || name === item.name) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate(
      { qualifyingItemId: item.id, name },
      { onSuccess: () => setEditingId(null) },
    );
  }

  return (
    <section
      aria-label={t("rewardProgram.qualifyingItems.sectionTitle")}
      className="mb-6 rounded-md border border-[var(--color-border)] p-4"
    >
      <h2 className="font-semibold">{t("rewardProgram.qualifyingItems.sectionTitle")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        {t("rewardProgram.qualifyingItems.sectionHint")}
      </p>

      {isLoading && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingItems.loading")}
        </p>
      )}
      {isError && (
        <div
          role="alert"
          className="mt-2 rounded-md border border-[var(--color-border)] p-2 text-sm text-red-600"
        >
          {t("rewardProgram.qualifyingItems.loadError")}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingItems.empty")}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] p-2"
            >
              {editingId === item.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRename(item);
                  }}
                >
                  <TextField
                    id={`qi-rename-${item.id}`}
                    label={t("rewardProgram.qualifyingItems.renameLabel")}
                    value={editName}
                    onChange={setEditName}
                    required
                  />
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {t("rewardProgram.qualifyingItems.saveAction")}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    {t("rewardProgram.cancel")}
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <QualifyingItemClassificationEditor
                      item={item}
                      businessTypeId={businessTypeId}
                      onAssign={(id) => updateClassification(item, id)}
                      onRemove={() => updateClassification(item, null)}
                      isSaving={classificationSaving}
                    />
                  </div>
                  <span className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => startRename(item)}>
                      {t("rewardProgram.qualifyingItems.renameAction")}
                    </Button>
                    {retireId === item.id ? (
                      <>
                        <Button
                          type="button"
                          disabled={retireMutation.isPending}
                          onClick={() =>
                            retireMutation.mutate(
                              { qualifyingItemId: item.id },
                              { onSuccess: () => setRetireId(null) },
                            )
                          }
                        >
                          {t("rewardProgram.qualifyingItems.retireConfirmAction")}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setRetireId(null)}>
                          {t("rewardProgram.cancel")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setRetireId(item.id);
                          setEditingId(null);
                        }}
                      >
                        {t("rewardProgram.qualifyingItems.retireAction")}
                      </Button>
                    )}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <MutationError error={updateMutation.error} />
      <MutationError error={classificationError} />
      <MutationError error={retireMutation.error} />

      <form onSubmit={handleAdd} className="mt-3 flex items-end gap-2">
        <TextField
          id="qi-add-name"
          label={t("rewardProgram.qualifyingItems.addLabel")}
          value={newName}
          onChange={setNewName}
          required
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending
            ? t("rewardProgram.saving")
            : t("rewardProgram.qualifyingItems.addAction")}
        </Button>
      </form>
      <MutationError error={createMutation.error} />
    </section>
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
