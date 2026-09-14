/**
 * Purchase Records (`PLATFORM-BASELINE-006A`).
 *
 * Minimum usable Business-facing surface: record a purchase against a
 * Reward Program (one presented Customer artifact + commercial snapshot),
 * list Purchase Records with a status filter, and inspect a record's
 * lifecycle state and event timeline. Deliberately bounded — no
 * dispute-resolution, correction, cancellation, expiry, or archival
 * controls (not implemented server-side in this package). Server
 * authorization remains mandatory (`purchase.record`, Staff/Manager/Owner)
 * — control visibility here is convenience, never enforcement.
 *
 * The localhost preview exercises this page against the real callables —
 * no preview-only product logic exists here.
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, TextField } from "../../components/ui/formPrimitives";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";
import { usePurchasesQuery, useBusinessPurchaseQuery } from "../hooks/purchaseQueries";
import { useRecordPurchaseMutation } from "../hooks/purchaseMutations";
import { useRewardProgramsQuery } from "../hooks/rewardProgramQueries";

type RecordFormState = {
  rewardProgramId: string;
  artifactKind: "loyalty_number" | "qr_identity";
  artifactValue: string;
  quantity: string;
  itemLabel: string;
  purchaseDate: string;
  notes: string;
};

function emptyRecordForm(): RecordFormState {
  return {
    rewardProgramId: "",
    artifactKind: "loyalty_number",
    artifactValue: "",
    quantity: "1",
    itemLabel: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

const STATUS_FILTERS = [
  "",
  "waiting_for_customer",
  "verified",
  "rejected",
  "under_review",
] as const;

export function PurchaseRecordsPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const purchasesQuery = usePurchasesQuery(
    context.businessId,
    statusFilter === "" ? undefined : statusFilter,
  );
  const programsQuery = useRewardProgramsQuery(context.businessId);

  const [form, setForm] = useState<RecordFormState>(emptyRecordForm());
  const [recorded, setRecorded] = useState(false);
  const recordMutation = useRecordPurchaseMutation(context.businessId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQuery = useBusinessPurchaseQuery(context.businessId, selectedId ?? undefined);

  const activePrograms = (programsQuery.data ?? []).filter(
    (entry) => entry.program.status === "active" && entry.program.currentVersionId !== null,
  );

  async function submitRecord(event: React.FormEvent) {
    event.preventDefault();
    setRecorded(false);
    const quantity = Number.parseInt(form.quantity, 10);
    await recordMutation.mutateAsync({
      rewardProgramId: form.rewardProgramId,
      ...(form.artifactKind === "loyalty_number"
        ? { loyaltyNumberValue: form.artifactValue.trim() }
        : { qrReference: form.artifactValue.trim() }),
      quantity,
      itemLabel: form.itemLabel.trim(),
      purchaseDate: new Date(`${form.purchaseDate}T12:00:00.000Z`).toISOString(),
      ...(form.notes.trim().length > 0 ? { notes: form.notes.trim() } : {}),
    });
    setRecorded(true);
    setForm(emptyRecordForm());
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold">{t("purchase.title")}</h1>
        <p className="text-[var(--color-muted-foreground)]">{t("purchase.subtitle")}</p>
      </header>

      <section aria-labelledby="purchase-record-heading" className="flex flex-col gap-4">
        <h2 id="purchase-record-heading" className="text-lg font-medium">
          {t("purchase.recordTitle")}
        </h2>
        <form onSubmit={submitRecord} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("purchase.fieldProgram")}
            <select
              value={form.rewardProgramId}
              onChange={(event) => setForm({ ...form, rewardProgramId: event.target.value })}
              required
              className="rounded-md border border-[var(--color-border)] bg-transparent p-2"
            >
              <option value="">—</option>
              {activePrograms.map((entry) => (
                <option key={entry.program.id} value={entry.program.id}>
                  {entry.program.displayName}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex gap-4 text-sm">
            <legend className="mb-1">{t("purchase.fieldArtifactKind")}</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="artifactKind"
                checked={form.artifactKind === "loyalty_number"}
                onChange={() => setForm({ ...form, artifactKind: "loyalty_number" })}
              />
              {t("purchase.artifactLoyaltyNumber")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="artifactKind"
                checked={form.artifactKind === "qr_identity"}
                onChange={() => setForm({ ...form, artifactKind: "qr_identity" })}
              />
              {t("purchase.artifactQr")}
            </label>
          </fieldset>
          <TextField
            id="purchase-record-artifact"
            label={t("purchase.fieldArtifactValue")}
            value={form.artifactValue}
            onChange={(value) => setForm({ ...form, artifactValue: value })}
            required
          />
          <TextField
            id="purchase-record-quantity"
            label={t("purchase.fieldQuantity")}
            value={form.quantity}
            onChange={(value) => setForm({ ...form, quantity: value })}
            required
          />
          <TextField
            id="purchase-record-item"
            label={t("purchase.fieldItemLabel")}
            value={form.itemLabel}
            onChange={(value) => setForm({ ...form, itemLabel: value })}
            required
          />
          <TextField
            id="purchase-record-date"
            label={t("purchase.fieldPurchaseDate")}
            value={form.purchaseDate}
            onChange={(value) => setForm({ ...form, purchaseDate: value })}
            required
            type="date"
          />
          <TextField
            id="purchase-record-notes"
            label={t("purchase.fieldNotes")}
            value={form.notes}
            onChange={(value) => setForm({ ...form, notes: value })}
          />
          {recordMutation.isError ? <MutationError error={recordMutation.error} /> : null}
          {recorded ? <p role="status">{t("purchase.recordSuccess")}</p> : null}
          <Button type="submit" disabled={recordMutation.isPending}>
            {recordMutation.isPending ? t("purchase.recording") : t("purchase.recordSubmit")}
          </Button>
        </form>
      </section>

      <section aria-labelledby="purchase-list-heading" className="flex flex-col gap-4">
        <h2 id="purchase-list-heading" className="text-lg font-medium">
          {t("purchase.listTitle")}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          {t("purchase.filterLabel")}
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-transparent p-2"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === "" ? t("purchase.filterAll") : t(`purchase.status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        {purchasesQuery.isPending ? <p>{t("rewardProgram.loading")}</p> : null}
        {purchasesQuery.isError ? <MutationError error={purchasesQuery.error} /> : null}
        {purchasesQuery.data?.purchases.length === 0 ? <p>{t("purchase.listEmpty")}</p> : null}
        <ul className="flex flex-col gap-2">
          {(purchasesQuery.data?.purchases ?? []).map((purchase) => (
            <li key={purchase.id} className="rounded-md border border-[var(--color-border)] p-3">
              <button
                type="button"
                onClick={() => setSelectedId(purchase.id)}
                className="flex w-full flex-col gap-1 text-left"
              >
                <span className="font-medium">{purchase.itemLabel}</span>
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {t(`purchase.status.${purchase.status}`)} ·{" "}
                  {t("purchase.customerLoyaltyNumber", {
                    value: purchase.canonicalLoyaltyNumberValue,
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedId ? (
        <section aria-labelledby="purchase-detail-heading" className="flex flex-col gap-3">
          <h2 id="purchase-detail-heading" className="text-lg font-medium">
            {t("purchase.detailTitle")}
          </h2>
          {detailQuery.isPending ? <p>{t("rewardProgram.loading")}</p> : null}
          {detailQuery.data ? (
            <div className="flex flex-col gap-2 text-sm">
              <p>{detailQuery.data.purchase.itemLabel}</p>
              <p>{t(`purchase.status.${detailQuery.data.purchase.status}`)}</p>
              <p>{t("purchase.recordedBy", { role: detailQuery.data.purchase.recordedByRole })}</p>
              <ol className="flex flex-col gap-1">
                {detailQuery.data.events.map((event) => (
                  <li key={event.id}>
                    {event.fromStatus ?? "∅"} → {event.toStatus} ({event.actorType})
                  </li>
                ))}
              </ol>
              <Button type="button" onClick={() => setSelectedId(null)}>
                {t("purchase.detailClose")}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
