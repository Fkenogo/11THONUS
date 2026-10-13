/**
 * Staff Activity view (`EA-BL-001-CORR-002-B`, D6 — prototype "Today's Counter Activity", now its own
 * view since Founder Preview Pass 3).
 *
 * Shows only what the server returns from the Staff-own read: the caller's own Counter submissions,
 * scoped server-side to the authenticated recorder and Business, newest first, "load more" by an opaque
 * keyset cursor. Per row: time, item × quantity, an identifier the Staff member themselves presented
 * (the last characters of a typed Loyalty Number, or "scanned QR"), and a neutral status. No customer
 * profile, no colleague, no reviewer, no review reason, no threshold, no internal id is ever rendered
 * (none is in the data).
 */

import { Clock, QrCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import { useCounterActivityQuery } from "./counterHooks";

const FOCUS_RING = "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

/** A malformed timestamp must never take the whole view down: it renders nothing instead. */
function RecordedAt({ value, formatter }: { value: unknown; formatter: Intl.DateTimeFormat }) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return <time dateTime={date.toISOString()}>{formatter.format(date)}</time>;
}

export function StaffActivityPage({ businessId }: { businessId: string }) {
  const { t, i18n } = useTranslation("business");
  const query = useCounterActivityQuery(businessId);
  const formatter = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const purchases = query.data?.pages.flatMap((page) => page.purchases) ?? [];

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 pb-4">
      <header className="min-w-0">
        <h1
          tabIndex={-1}
          data-staff-view-heading
          className="font-display text-xl leading-tight font-bold text-slate-900 focus:outline-none"
        >
          {t("counter.activity.title")}
        </h1>
        <p className="text-sm text-slate-500">{t("counter.recent.subtitle")}</p>
      </header>

      <section
        aria-labelledby="staff-activity-list-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 id="staff-activity-list-heading" className="sr-only">
          {t("counter.recent.heading")}
        </h2>

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
              className={cn(
                "min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800",
                FOCUS_RING,
              )}
            >
              {t("counter.recent.retry")}
            </button>
          </div>
        ) : null}

        {query.data && purchases.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">{t("counter.recent.empty")}</p>
        ) : null}

        {purchases.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {purchases.map((purchase) => (
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
                    <RecordedAt value={purchase.recordedAt} formatter={formatter} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {query.hasNextPage ? (
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            aria-busy={query.isFetchingNextPage}
            className={cn(
              "mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60",
              FOCUS_RING,
            )}
          >
            {query.isFetchingNextPage
              ? t("counter.activity.loading")
              : t("counter.activity.loadMore")}
          </button>
        ) : null}

        {query.data && purchases.length > 0 && !query.hasNextPage ? (
          <p className="pt-3 text-center text-xs text-slate-500">{t("counter.activity.end")}</p>
        ) : null}
      </section>
    </div>
  );
}
