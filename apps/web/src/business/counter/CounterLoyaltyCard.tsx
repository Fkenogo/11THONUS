/**
 * Limited loyalty status for the customer being served (`EA-BL-001-CORR-002-B`, Founder Preview
 * Pass 3; PRD01 §8.2 "view limited customer progress needed to complete the transaction").
 *
 * Shown ONCE the customer and the Programme are known — before the purchase is recorded — so Staff can
 * tell the customer when their reward is ready. It shows only: verified progress, a separate
 * "awaiting customer confirmation" count, and a prominent reward-available state. It never names the
 * customer, never lists history, never reveals review information, and NEVER treats a recorded-but-
 * unconfirmed purchase as progress. A failed read is a quiet, neutral note: it never blocks recording.
 */

import { CheckCircle2, Gift, Hourglass } from "lucide-react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { CounterLoyaltyContextWire } from "../api/purchaseMutations";
import { formatOrdinal, toLoyaltyView } from "./counterLoyalty";

const CARD = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const STEP_LABEL = "text-xs font-bold tracking-wider text-slate-500 uppercase";

export type CounterLoyaltyCardState =
  | { readonly status: "pending" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly context: CounterLoyaltyContextWire };

export function CounterLoyaltyCard({ state }: { state: CounterLoyaltyCardState }) {
  const { t, i18n } = useTranslation("business");

  if (state.status === "pending") {
    return (
      <p role="status" className={cn(CARD, "text-sm text-slate-600")}>
        {t("counter.loyalty.checking")}
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p role="status" className={cn(CARD, "text-sm text-slate-600")}>
        {t("counter.loyalty.unavailable")}
      </p>
    );
  }

  const view = toLoyaltyView(state.context);

  if (view.kind === "reward") {
    const ordinal = formatOrdinal(view.rewardOrdinalNumber, i18n.language);
    return (
      <section
        role="status"
        aria-labelledby="counter-loyalty-heading"
        data-testid="counter-loyalty-reward"
        className="space-y-1 rounded-2xl border-2 border-amber-600 bg-amber-50 p-4 text-amber-950 shadow-sm"
      >
        <h2
          id="counter-loyalty-heading"
          className="flex items-center gap-2 text-base font-extrabold tracking-wide uppercase"
        >
          <Gift className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          {t("counter.loyalty.rewardHeading", { rewardOrdinal: ordinal })}
        </h2>
        <p className="text-sm font-semibold">{t("counter.loyalty.rewardBody")}</p>
        <p className="text-xs text-amber-900">{t("counter.loyalty.rewardNote")}</p>
        {state.context.awaitingCustomerConfirmationUnits > 0 ? (
          <p className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-amber-900">
            <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("counter.loyalty.awaiting", {
              count: state.context.awaitingCustomerConfirmationUnits,
            })}
          </p>
        ) : null}
      </section>
    );
  }

  const ordinal = formatOrdinal(view.requiredVerifiedUnits + 1, i18n.language);
  const percent = Math.round((view.verifiedUnits / Math.max(view.requiredVerifiedUnits, 1)) * 100);
  return (
    <section
      role="status"
      aria-labelledby="counter-loyalty-heading"
      data-testid="counter-loyalty-progress"
      className={cn(CARD, "space-y-2")}
    >
      <h2 id="counter-loyalty-heading" className={STEP_LABEL}>
        {t("counter.loyalty.heading")}
      </h2>
      <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        {t("counter.loyalty.verified", {
          verified: view.verifiedUnits,
          required: view.requiredVerifiedUnits,
        })}
      </p>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${percent}%` }} />
      </div>
      <p
        className={cn(
          "text-sm",
          view.nearReward ? "font-semibold text-amber-900" : "text-slate-700",
        )}
      >
        {t("counter.loyalty.remaining", { count: view.remainingUnits, rewardOrdinal: ordinal })}
      </p>
      {view.awaitingUnits > 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-slate-700">
          <Hourglass className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          {t("counter.loyalty.awaiting", { count: view.awaitingUnits })}
        </p>
      ) : null}
      <p className="text-xs text-slate-600">{t("counter.loyalty.note")}</p>
    </section>
  );
}
