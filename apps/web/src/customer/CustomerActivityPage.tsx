/**
 * `/customer/activity` — the customer's "Waiting for you" purchase list
 * with detail, verify, reject, and dispute actions
 * (`PLATFORM-BASELINE-006A`).
 *
 * Minimum usable Customer-facing verification surface: waiting purchases,
 * purchase detail (recorder, quantity, notes), whole-record verify /
 * reject-with-reason / dispute-with-reason. Every action calls the real
 * callable; server ownership and state checks remain mandatory. No
 * partial verification, no Business-side resolution controls (deferred).
 */

import { useState } from "react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { Button } from "../components/ui/formPrimitives";
import {
  useCustomerPurchaseQuery,
  useWaitingPurchasesQuery,
  type CustomerPlatform,
} from "./hooks/purchaseQueries";
import {
  useDisputePurchaseMutation,
  useRejectPurchaseMutation,
  useVerifyPurchaseMutation,
} from "./hooks/purchaseMutations";
import type { CustomerPurchaseWire } from "./api/purchaseClient";

const REJECT_REASONS = [
  "did_not_happen",
  "duplicate",
  "wrong_customer",
  "wrong_program",
  "wholly_invalid",
] as const;

const DISPUTE_REASONS = ["wrong_quantity", "wrong_item", "partially_inaccurate"] as const;

function WaitingRow({
  purchase,
  selected,
  onSelect,
}: {
  purchase: CustomerPurchaseWire;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("customer");
  return (
    <li className="rounded-md border border-[var(--color-border)] p-3">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full flex-col gap-1 text-left"
      >
        <span className="font-medium">{purchase.itemLabel}</span>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {t("purchase.quantityLabel", { count: purchase.quantity })}
        </span>
      </button>
    </li>
  );
}

export function CustomerActivityPage({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const platform: CustomerPlatform = { auth, functions };
  const waitingQuery = useWaitingPurchasesQuery(platform);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQuery = useCustomerPurchaseQuery(platform, selectedId ?? undefined);

  const [rejectReason, setRejectReason] = useState<string>(REJECT_REASONS[0]);
  const [disputeReason, setDisputeReason] = useState<string>(DISPUTE_REASONS[0]);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"none" | "reject" | "dispute">("none");

  const verifyMutation = useVerifyPurchaseMutation(platform);
  const rejectMutation = useRejectPurchaseMutation(platform);
  const disputeMutation = useDisputePurchaseMutation(platform);
  const acting = verifyMutation.isPending || rejectMutation.isPending || disputeMutation.isPending;

  async function doVerify(purchaseRecordId: string) {
    setNotice(null);
    try {
      await verifyMutation.mutateAsync({ purchaseRecordId });
      setNotice(t("purchase.verifySuccess"));
      setDetailMode("none");
    } catch {
      setNotice(t("purchase.actionError"));
    }
  }

  async function doReject(purchaseRecordId: string) {
    setNotice(null);
    try {
      await rejectMutation.mutateAsync({ purchaseRecordId, reason: rejectReason });
      setNotice(t("purchase.rejectSuccess"));
      setDetailMode("none");
    } catch {
      setNotice(t("purchase.actionError"));
    }
  }

  async function doDispute(purchaseRecordId: string) {
    setNotice(null);
    try {
      await disputeMutation.mutateAsync({ purchaseRecordId, reason: disputeReason });
      setNotice(t("purchase.disputeSuccess"));
      setDetailMode("none");
    } catch {
      setNotice(t("purchase.actionError"));
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("purchase.waitingTitle")}</h1>
      {waitingQuery.isPending ? <p>{t("entry.loading")}</p> : null}
      {waitingQuery.data?.purchases.length === 0 ? <p>{t("purchase.waitingEmpty")}</p> : null}
      <ul className="flex flex-col gap-2">
        {(waitingQuery.data?.purchases ?? []).map((purchase) => (
          <WaitingRow
            key={purchase.id}
            purchase={purchase}
            selected={selectedId === purchase.id}
            onSelect={() => {
              setSelectedId(purchase.id);
              setDetailMode("none");
              setNotice(null);
            }}
          />
        ))}
      </ul>

      {selectedId ? (
        <section aria-labelledby="customer-purchase-detail-heading" className="flex flex-col gap-3">
          <h2 id="customer-purchase-detail-heading" className="text-lg font-medium">
            {t("purchase.detailTitle")}
          </h2>
          {detailQuery.isPending ? <p>{t("entry.loading")}</p> : null}
          {detailQuery.data ? (
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium">{detailQuery.data.purchase.itemLabel}</p>
              <p>{t("purchase.quantityLabel", { count: detailQuery.data.purchase.quantity })}</p>
              <p>{t("purchase.recordedByBusiness")}</p>
              {detailQuery.data.purchase.notes ? <p>{detailQuery.data.purchase.notes}</p> : null}
              <p>{t(`purchase.status.${detailQuery.data.purchase.status}`)}</p>
              {notice ? <p role="status">{notice}</p> : null}
              {detailQuery.data.purchase.status === "waiting_for_customer" ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={acting}
                    onClick={() => doVerify(detailQuery.data.purchase.id)}
                  >
                    {verifyMutation.isPending ? t("purchase.verifying") : t("purchase.verify")}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={acting}
                      onClick={() => setDetailMode(detailMode === "reject" ? "none" : "reject")}
                    >
                      {t("purchase.reject")}
                    </Button>
                    <Button
                      type="button"
                      disabled={acting}
                      onClick={() => setDetailMode(detailMode === "dispute" ? "none" : "dispute")}
                    >
                      {t("purchase.dispute")}
                    </Button>
                  </div>
                  {detailMode === "reject" ? (
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">{t("purchase.rejectTitle")}</p>
                      <p>{t("purchase.rejectHint")}</p>
                      <label className="flex flex-col gap-1">
                        {t("purchase.rejectTitle")}
                        <select
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          className="rounded-md border border-[var(--color-border)] bg-transparent p-2"
                        >
                          {REJECT_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {t(`purchase.rejectReason.${reason}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        disabled={acting}
                        onClick={() => doReject(detailQuery.data.purchase.id)}
                      >
                        {rejectMutation.isPending
                          ? t("purchase.rejecting")
                          : t("purchase.rejectConfirm")}
                      </Button>
                    </div>
                  ) : null}
                  {detailMode === "dispute" ? (
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">{t("purchase.disputeTitle")}</p>
                      <p>{t("purchase.disputeHint")}</p>
                      <label className="flex flex-col gap-1">
                        {t("purchase.disputeTitle")}
                        <select
                          value={disputeReason}
                          onChange={(event) => setDisputeReason(event.target.value)}
                          className="rounded-md border border-[var(--color-border)] bg-transparent p-2"
                        >
                          {DISPUTE_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {t(`purchase.disputeReason.${reason}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        disabled={acting}
                        onClick={() => doDispute(detailQuery.data.purchase.id)}
                      >
                        {disputeMutation.isPending
                          ? t("purchase.disputing")
                          : t("purchase.disputeConfirm")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
