/**
 * "Your recent submissions" (`EA-BL-001-CORR-002-B`, D6 — prototype "Today's Counter Activity").
 *
 * Shows only what the server returns from the Staff-own read: the caller's own Counter submissions,
 * scoped server-side. Per row: time, item × quantity, an identifier the Staff member themselves
 * presented (the last characters of a typed Loyalty Number, or "scanned QR"), and a neutral status.
 * No customer profile, no colleague, no reviewer, no review reason, no threshold, no internal id is
 * ever rendered (none is in the data).
 */

import { Clock, History, QrCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useCounterRecentQuery } from "./counterHooks";

export function CounterRecentActivity({ businessId }: { businessId: string }) {
  const { t, i18n } = useTranslation("business");
  const query = useCounterRecentQuery(businessId);
  const formatter = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section
      aria-labelledby="counter-recent-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-1 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h2
          id="counter-recent-heading"
          className="text-xs font-bold tracking-wider text-slate-700 uppercase"
        >
          {t("counter.recent.heading")}
        </h2>
      </div>
      <p className="mb-3 text-[11px] text-slate-500">{t("counter.recent.subtitle")}</p>

      {query.isPending ? (
        <p role="status" className="py-3 text-sm text-slate-500">
          {t("counter.loading")}
        </p>
      ) : null}

      {query.isError ? (
        <div role="alert" className="space-y-2 py-2 text-sm text-slate-700">
          <p>{t("counter.recent.loadError")}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            {t("counter.recent.retry")}
          </button>
        </div>
      ) : null}

      {query.data && query.data.purchases.length === 0 ? (
        <p className="py-3 text-sm text-slate-500">{t("counter.recent.empty")}</p>
      ) : null}

      {query.data && query.data.purchases.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {query.data.purchases.map((purchase) => (
            <li key={purchase.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {t("counter.recent.quantityItem", {
                    quantity: purchase.quantity,
                    item: purchase.itemLabel,
                  })}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  {purchase.presentedVia === "qr_identity" ? (
                    <>
                      <QrCode className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t("counter.recent.scannedQr")}</span>
                    </>
                  ) : (
                    <span>
                      {t("counter.recent.loyaltyNumberHint", {
                        hint: purchase.customerCodeHint ?? "",
                      })}
                    </span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {t(`purchase.status.${purchase.status}`)}
                </span>
                <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-600">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={purchase.recordedAt}>
                    {formatter.format(new Date(purchase.recordedAt))}
                  </time>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
