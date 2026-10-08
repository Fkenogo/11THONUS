/**
 * Staff-only bottom navigation (Founder Preview Pass 1 correction; permanent at every viewport size since
 * Pass 2 — the bar is centred at the same bounded width as the Staff app).
 *
 * The earlier "no bottom bar" decision belongs to the broader Business / Owner-Manager shell; the
 * Founder explicitly approved this bar for the Staff mobile shell only. It has four bounded actions —
 * Counter, New customer, Activity (in-page sections of the one Counter, no routes) and More (language
 * and Switch Business / Personal). It carries no Owner/Manager destination and grants nothing: every
 * protected operation is still decided by the server.
 */

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { History, MoreHorizontal, ReceiptText, Repeat2, UserPlus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { StaffSection } from "./staffSections";

/** Height of the bar's content row; the safe-area inset is added below it. */
export const STAFF_BOTTOM_NAV_HEIGHT = "3.5rem";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ITEMS: { section: StaffSection; icon: LucideIcon; labelKey: string }[] = [
  { section: "counter", icon: ReceiptText, labelKey: "counter.shell.counter" },
  { section: "newCustomer", icon: UserPlus, labelKey: "counter.shell.newCustomer" },
  { section: "activity", icon: History, labelKey: "counter.shell.activity" },
];

const FOCUS_RING = "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

export function StaffBottomNav({
  active,
  onSelect,
}: {
  active: StaffSection;
  onSelect: (section: StaffSection) => void;
}) {
  const { t } = useTranslation("business");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (moreOpen) closeRef.current?.focus();
    else if (wasOpen.current) moreButtonRef.current?.focus();
    wasOpen.current = moreOpen;
  }, [moreOpen]);

  function onSheetKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setMoreOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const itemClass = (isActive: boolean) =>
    cn(
      "relative flex h-full w-full flex-col items-center justify-start gap-1 pt-2 rounded-xl px-0.5 text-center text-[11px] leading-tight transition active:scale-95",
      FOCUS_RING,
      isActive ? "font-bold text-amber-800" : "font-medium text-slate-600",
    );

  return (
    <>
      <nav
        aria-label={t("counter.shell.navLabel")}
        data-testid="staff-bottom-nav"
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-x border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
        style={{ height: `calc(${STAFF_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom))` }}
      >
        <ul className="mx-auto grid h-full grid-cols-4 items-stretch gap-1 py-0.5">
          {ITEMS.map(({ section, icon: Icon, labelKey }) => {
            const isActive = !moreOpen && active === section;
            return (
              <li key={section} className="min-w-0">
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelect(section)}
                  className={itemClass(isActive)}
                >
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
                </button>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              ref={moreButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={itemClass(moreOpen)}
            >
              {moreOpen ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 h-1 w-7 rounded-full bg-amber-700"
                />
              ) : null}
              <MoreHorizontal
                aria-hidden="true"
                className={cn("h-5 w-5", moreOpen ? "stroke-[2.25]" : "stroke-[1.75]")}
              />
              <span className="max-w-full">{t("counter.shell.more")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60"
          onClick={() => setMoreOpen(false)}
          data-testid="staff-more-backdrop"
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-more-title"
            onKeyDown={onSheetKeyDown}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] space-y-4 overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="staff-more-title" className="text-base font-bold text-slate-900">
                {t("counter.shell.moreTitle")}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={t("counter.shell.moreClose")}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700",
                  FOCUS_RING,
                )}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex [&_button]:min-h-11 [&_button]:flex-1 [&_button]:rounded-lg [&_button]:border [&_button]:border-slate-300 [&_button]:px-3 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-slate-800 [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-amber-500 [&_button]:focus-visible:outline-none [&_button[aria-pressed=true]]:border-amber-700 [&_button[aria-pressed=true]]:bg-amber-100 [&_button[aria-pressed=true]]:text-amber-950 [&>div]:flex [&>div]:w-full [&>div]:gap-2">
              <LanguageSwitcher />
            </div>

            <Link
              to="/business"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800",
                FOCUS_RING,
              )}
            >
              <Repeat2 className="h-4 w-4" aria-hidden="true" />
              {t("counter.shell.switchContext")}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
