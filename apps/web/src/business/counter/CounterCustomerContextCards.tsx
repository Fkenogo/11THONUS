import { useRef, useState } from "react";
import { CheckCircle2, Gift, Hourglass } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CounterCustomerContextWire } from "../api/purchaseMutations";
import type { CounterProgramme } from "./counterProgrammes";

export function CounterCustomerContextCards({
  context,
  programmes,
  onAddPurchase,
  canConfirmRedemption,
  onConfirmRedemption,
}: {
  context: CounterCustomerContextWire;
  programmes: readonly CounterProgramme[];
  onAddPurchase: (rewardProgramId: string) => void;
  canConfirmRedemption: boolean;
  onConfirmRedemption: (
    rewardId: string,
    rewardProgramId: string,
    idempotencyKey: string,
  ) => Promise<void>;
}) {
  const { t } = useTranslation("business");
  const activeProgrammes = new Map(programmes.map((programme) => [programme.id, programme]));

  return (
    <section aria-labelledby="counter-customer-context-heading" className="space-y-3">
      <h2 id="counter-customer-context-heading" className="sr-only">
        {t("counter.customerContext.heading")}
      </h2>
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-950">
        {context.customer.displayName || t("counter.customerContext.nameUnavailable")}
      </p>
      {context.programmes.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
        >
          {t("counter.customerContext.noProgrammes")}
        </p>
      ) : (
        context.programmes.map((circle) => {
          return (
            <CounterCustomerProgrammeCard
              key={circle.rewardProgramId}
              circle={circle}
              programme={activeProgrammes.get(circle.rewardProgramId)}
              displayName={
                context.customer.displayName || t("counter.customerContext.nameUnavailable")
              }
              canConfirmRedemption={canConfirmRedemption}
              onAddPurchase={onAddPurchase}
              onConfirmRedemption={onConfirmRedemption}
            />
          );
        })
      )}
    </section>
  );
}

function CounterCustomerProgrammeCard({
  circle,
  programme,
  displayName,
  canConfirmRedemption,
  onAddPurchase,
  onConfirmRedemption,
}: {
  circle: CounterCustomerContextWire["programmes"][number];
  programme: CounterProgramme | undefined;
  displayName: string;
  canConfirmRedemption: boolean;
  onAddPurchase: (rewardProgramId: string) => void;
  onConfirmRedemption: (
    rewardId: string,
    rewardProgramId: string,
    idempotencyKey: string,
  ) => Promise<void>;
}) {
  const { t } = useTranslation("business");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const remaining = Math.max(0, circle.requiredVerifiedUnits - circle.verifiedUnits);
  const progress = `${circle.verifiedUnits} ${t("counter.customerContext.of")} ${circle.requiredVerifiedUnits} ${t("counter.customerContext.verified")}`;

  async function confirmReward() {
    if (!circle.reward?.rewardId || !idempotencyKey || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setFailure(false);
    try {
      await onConfirmRedemption(circle.reward.rewardId, circle.rewardProgramId, idempotencyKey);
      setConfirming(false);
      setIdempotencyKey(null);
      setRedemptionSuccess(true);
    } catch {
      setFailure(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function openConfirmation() {
    setFailure(false);
    setIdempotencyKey(crypto.randomUUID());
    setConfirming(true);
  }

  return (
    <article
      key={circle.rewardProgramId}
      data-testid={
        circle.rewardStatus === "available"
          ? "counter-loyalty-reward"
          : "counter-customer-programme"
      }
      className={`space-y-3 rounded-2xl border bg-white p-4 shadow-sm ${circle.rewardStatus === "available" ? "border-2 border-amber-500" : "border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-base font-bold text-slate-900">
          {circle.programmeName}
        </h3>
        {circle.rewardStatus === "available" ? (
          <Gift aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-700" />
        ) : null}
      </div>
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700" />
        {progress}
      </p>
      {circle.rewardStatus === "available" ? (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-bold">{t("counter.customerContext.rewardAvailable")}</p>
          {circle.reward?.description ? <p className="mt-1">{circle.reward.description}</p> : null}
          {!canConfirmRedemption || !circle.reward?.rewardId ? (
            <p className="mt-1 text-xs font-medium">{t("counter.customerContext.rewardHandoff")}</p>
          ) : null}
          {canConfirmRedemption && circle.reward?.rewardId ? (
            <button
              type="button"
              onClick={openConfirmation}
              className="mt-3 min-h-12 w-full rounded-xl bg-amber-800 px-4 text-sm font-bold text-white hover:bg-amber-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t("counter.customerContext.useEleventh")}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-700">
          {t("counter.customerContext.remaining", { count: remaining })}
          <span className="block text-xs">{t("counter.customerContext.noReward")}</span>
        </p>
      )}
      {redemptionSuccess ? (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900"
        >
          {t("counter.customerContext.redemptionSuccess")}
        </p>
      ) : null}
      {circle.awaitingCustomerConfirmationUnits > 0 ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Hourglass aria-hidden="true" className="h-3.5 w-3.5" />
          {t("counter.loyalty.awaiting", { count: circle.awaitingCustomerConfirmationUnits })}
        </p>
      ) : null}
      {programme && programme.items.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("counter.customerContext.eligibleItems")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {programme.items.map((item) => (
              <li
                key={item.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {programme ? (
        <button
          type="button"
          onClick={() => onAddPurchase(circle.rewardProgramId)}
          className="min-h-12 w-full rounded-xl bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t("counter.customerContext.addPurchase")}
        </button>
      ) : null}
      {confirming && circle.reward ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-3 sm:place-items-center"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`redeem-title-${circle.rewardProgramId}`}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3
              id={`redeem-title-${circle.rewardProgramId}`}
              className="font-display text-lg font-bold text-slate-900"
            >
              {t("counter.customerContext.confirmTitle")}
            </h3>
            <p className="text-sm text-slate-800">
              {displayName} · {circle.programmeName}
            </p>
            <p className="text-sm text-slate-700">{circle.reward.description}</p>
            <p className="text-sm font-semibold text-slate-900">
              {t("counter.customerContext.confirmBody")}
            </p>
            {failure ? (
              <p role="alert" className="text-sm font-medium text-red-800">
                {t("counter.customerContext.confirmFailure")}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirming(false)}
                className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
              >
                {t("counter.customerContext.cancel")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmReward()}
                className="min-h-12 rounded-xl bg-amber-800 px-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting
                  ? t("counter.customerContext.confirming")
                  : t("counter.customerContext.confirmAction")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
