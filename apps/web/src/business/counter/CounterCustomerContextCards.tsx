import { CheckCircle2, Gift, Hourglass } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CounterCustomerContextWire } from "../api/purchaseMutations";
import type { CounterProgramme } from "./counterProgrammes";

export function CounterCustomerContextCards({
  context,
  programmes,
  onAddPurchase,
}: {
  context: CounterCustomerContextWire;
  programmes: readonly CounterProgramme[];
  onAddPurchase: (rewardProgramId: string) => void;
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
          const programme = activeProgrammes.get(circle.rewardProgramId);
          const remaining = Math.max(0, circle.requiredVerifiedUnits - circle.verifiedUnits);
          const progress = `${circle.verifiedUnits} ${t("counter.customerContext.of")} ${circle.requiredVerifiedUnits} ${t("counter.customerContext.verified")}`;
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
                <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-950">
                  {t("counter.customerContext.rewardAvailable")}
                  <span className="mt-1 block text-xs font-medium">
                    {t("counter.customerContext.rewardHandoff")}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-slate-700">
                  {t("counter.customerContext.remaining", { count: remaining })}
                  <span className="block text-xs">{t("counter.customerContext.noReward")}</span>
                </p>
              )}
              {circle.awaitingCustomerConfirmationUnits > 0 ? (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Hourglass aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("counter.loyalty.awaiting", {
                    count: circle.awaitingCustomerConfirmationUnits,
                  })}
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
            </article>
          );
        })
      )}
    </section>
  );
}
