/**
 * Staff-only bottom navigation (Founder Preview Passes 1–3), permanent at every viewport size.
 *
 * It separates PLACES from ACTIONS. The three permanent destinations — Counter, Activity, Profile —
 * are real routes (`NavLink`, `aria-current="page"`). The visually distinct round button is the quick
 * ACTION control: it opens a small sheet offering exactly two bounded frontline actions — scan a
 * customer's QR (back into the Counter's existing scanner) and help a new customer join (the existing
 * tokenless sign-up code). It offers no Owner/Manager destination, customer search or admin action, and
 * grants nothing: every protected operation is still decided by the server.
 */

import { useId, useState } from "react";
import { NavLink } from "react-router-dom";
import { Camera, History, Plus, ReceiptText, UserPlus, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import { NewCustomerSheet } from "./NewCustomerSheet";
import { StaffSheet } from "./StaffSheet";

/** Height of the bar's content row; the safe-area inset is added below it. */
export const STAFF_BOTTOM_NAV_HEIGHT = "3.5rem";

const FOCUS_RING = "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

const DESTINATIONS: { slug: string; icon: LucideIcon; labelKey: string }[] = [
  { slug: "counter", icon: ReceiptText, labelKey: "counter.shell.counter" },
  { slug: "activity", icon: History, labelKey: "counter.shell.activity" },
];
const PROFILE = { slug: "profile", icon: UserRound, labelKey: "counter.shell.profile" };

type Sheet = "quick" | "newCustomer" | null;

export function StaffBottomNav({
  basePath,
  onScan,
}: {
  /** The Staff places' base path (`/business/:id/dashboard` in production). */
  basePath: string;
  /** Start the Counter's existing scanner (the shell routes to the Counter first when needed). */
  onScan: () => void;
}) {
  const { t } = useTranslation("business");
  const [sheet, setSheet] = useState<Sheet>(null);
  const quickTitleId = useId();
  const base = basePath;

  const itemClass = (isActive: boolean) =>
    cn(
      "relative flex h-full w-full flex-col items-center justify-start gap-1 rounded-xl px-0.5 pt-2 text-center text-[11px] leading-tight transition active:scale-95",
      FOCUS_RING,
      isActive ? "font-bold text-amber-800" : "font-medium text-slate-600",
    );

  function renderDestination({ slug, icon: Icon, labelKey }: (typeof DESTINATIONS)[number]) {
    return (
      <li key={slug} className="min-w-0">
        <NavLink to={`${base}/${slug}`} end className={({ isActive }) => itemClass(isActive)}>
          {({ isActive }) => (
            <>
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 h-1 w-7 rounded-full bg-amber-700"
                />
              ) : null}
              <Icon
                aria-hidden="true"
                className={cn("h-5 w-5", isActive ? "stroke-[2.25]" : "stroke-[1.75]")}
              />
              <span className="max-w-full">{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      </li>
    );
  }

  return (
    <>
      <nav
        aria-label={t("counter.shell.navLabel")}
        data-testid="staff-bottom-nav"
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-x border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
        style={{ height: `calc(${STAFF_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom))` }}
      >
        <ul className="grid h-full grid-cols-4 items-stretch gap-1 py-0.5">
          {DESTINATIONS.map(renderDestination)}
          <li className="flex min-w-0 items-center justify-center">
            <button
              type="button"
              aria-label={t("counter.shell.quickActions")}
              aria-haspopup="dialog"
              aria-expanded={sheet === "quick"}
              onClick={() => setSheet("quick")}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-amber-700 text-white shadow-md ring-4 ring-amber-100 transition hover:bg-amber-800 active:scale-95",
                FOCUS_RING,
              )}
            >
              <Plus aria-hidden="true" className="h-6 w-6 stroke-[2.5]" />
            </button>
          </li>
          {renderDestination(PROFILE)}
        </ul>
      </nav>

      {sheet === "quick" ? (
        <StaffSheet
          title={t("counter.quick.title")}
          titleId={quickTitleId}
          closeLabel={t("counter.quick.close")}
          onClose={() => setSheet(null)}
          testId="staff-quick-actions"
        >
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => {
                  setSheet(null);
                  onScan();
                }}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-xl bg-amber-700 px-4 text-left text-white hover:bg-amber-800",
                  FOCUS_RING,
                )}
              >
                <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-base font-bold">{t("counter.quick.scan")}</span>
                  <span className="block text-xs text-amber-50">{t("counter.quick.scanHint")}</span>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setSheet("newCustomer")}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-left text-slate-900 hover:bg-slate-50",
                  FOCUS_RING,
                )}
              >
                <UserPlus className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-base font-bold">
                    {t("counter.quick.newCustomer")}
                  </span>
                  <span className="block text-xs text-slate-600">
                    {t("counter.quick.newCustomerHint")}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </StaffSheet>
      ) : null}

      {sheet === "newCustomer" ? <NewCustomerSheet onClose={() => setSheet(null)} /> : null}
    </>
  );
}
