/**
 * Bounded Staff experience (`EA-BL-001-CORR-002-B`, D8): Staff land directly on the Counter and get a
 * minimal shell. Phone widths (the primary Staff device — Founder Preview Pass 1) get a simplified
 * header plus a Staff-only fixed bottom bar (Counter / New customer / Activity / More); tablet and
 * desktop keep the compact top bar. The Founder-rejected bottom-bar decision recorded for the broader
 * Business Dashboard shell does NOT apply here and that shell is untouched.
 *
 * This is UX routing ONLY. It hides the Owner/Manager destinations from Staff so they are not offered
 * controls they cannot use; it grants nothing and denies nothing. Every protected operation is still
 * decided by the server, per call, whatever route is on screen.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Repeat2 } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import { useMediaQuery } from "../../lib/useMediaQuery";
import type { BusinessContext } from "../api/businessContext";
import { CounterPage } from "./CounterPage";
import { STAFF_BOTTOM_NAV_HEIGHT, StaffBottomNav } from "./StaffBottomNav";
import {
  STAFF_SECTION_IDS,
  StaffSectionRequestContext,
  type StaffSection,
  type StaffSectionRequest,
} from "./staffSections";

/** Phone widths get the Staff bottom-bar shell; tablet and desktop keep the compact top bar. */
const PHONE_QUERY = "(max-width: 767px)";

/** A soft keyboard this much shorter than the layout viewport is "open". */
const KEYBOARD_MIN_DELTA = 150;

function isEditableField(element: Element | null) {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return true;
  return (
    element instanceof HTMLInputElement &&
    !["button", "submit", "checkbox", "radio", "reset", "image"].includes(element.type)
  );
}

/** True while an editable field has focus AND a soft keyboard has shrunk the visual viewport. */
function useSoftKeyboardOpen(enabled: boolean) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!enabled || !viewport) return;
    const update = () =>
      setOpen(
        isEditableField(document.activeElement) &&
          window.innerHeight - viewport.height > KEYBOARD_MIN_DELTA,
      );
    viewport.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [enabled]);
  return enabled && open;
}

/** The section whose heading is nearest the top of the view (the bottom one at the very end). */
function sectionInView(): StaffSection {
  const order: StaffSection[] = ["counter", "newCustomer", "activity"];
  const root = document.documentElement;
  if (window.innerHeight + window.scrollY >= root.scrollHeight - 2 && window.scrollY > 0) {
    return "activity";
  }
  let current: StaffSection = "counter";
  for (const section of order) {
    const element = document.getElementById(STAFF_SECTION_IDS[section]);
    if (element && element.getBoundingClientRect().top <= window.innerHeight * 0.4) {
      current = section;
    }
  }
  return current;
}

export function StaffShell({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const isPhone = useMediaQuery(PHONE_QUERY);
  const keyboardOpen = useSoftKeyboardOpen(isPhone);
  const [request, setRequest] = useState<StaffSectionRequest>(null);
  const [active, setActive] = useState<StaffSection>("counter");
  const showBottomNav = isPhone && !keyboardOpen;

  const select = useCallback((section: StaffSection) => {
    setActive(section);
    setRequest((previous) => ({ section, tick: (previous?.tick ?? 0) + 1 }));
  }, []);

  // Keep the highlighted destination honest while the person scrolls the Counter by hand.
  useEffect(() => {
    if (!isPhone) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(sectionInView()));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isPhone]);

  const navOffset = useMemo(
    () =>
      showBottomNav ? `calc(${STAFF_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom))` : "0px",
    [showBottomNav],
  );

  // Focus- and scroll-driven scrolling (a focused field, a revealed control) must stop above the bar.
  useEffect(() => {
    const root = document.documentElement;
    root.style.scrollPaddingBottom = navOffset;
    return () => {
      root.style.scrollPaddingBottom = "";
    };
  }, [navOffset]);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{ "--staff-nav-offset": navOffset } as React.CSSProperties}
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3 md:max-w-5xl">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {isPhone ? t("counter.shell.staffLabel") : t("counter.shell.businessLabel")}
            </p>
            <p className="truncate text-base font-bold text-slate-900">{context.displayName}</p>
          </div>
          {isPhone ? null : <LanguageSwitcher />}
        </div>
        {isPhone ? null : (
          <nav
            aria-label={t("counter.shell.navLabel")}
            className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 pb-2 md:max-w-5xl"
          >
            <NavLink
              to={`/business/${context.businessId}/dashboard/counter`}
              end
              className={({ isActive }) =>
                cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none",
                  isActive ? "bg-amber-100 text-amber-950" : "text-slate-700",
                )
              }
            >
              {t("counter.shell.counter")}
            </NavLink>
            <Link
              to="/business"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              <Repeat2 className="h-4 w-4" aria-hidden="true" />
              {t("counter.shell.switchContext")}
            </Link>
          </nav>
        )}
      </header>
      <main className="px-4 pt-4 pb-[calc(var(--staff-nav-offset,0px)+1rem)]">
        <StaffSectionRequestContext.Provider value={request}>
          <Outlet />
        </StaffSectionRequestContext.Provider>
      </main>
      {showBottomNav ? <StaffBottomNav active={active} onSelect={select} /> : null}
    </div>
  );
}

/** Staff landing: the Counter, and nothing administrative. Any other path folds back to the Counter. */
export function StaffRoutes({ context }: { context: BusinessContext }) {
  return (
    <Routes>
      <Route element={<StaffShell context={context} />}>
        <Route path="counter" element={<CounterPage context={context} />} />
        {/* Absolute target: a relative one inside this splat route would re-match itself and loop. */}
        <Route
          path="*"
          element={<Navigate to={`/business/${context.businessId}/dashboard/counter`} replace />}
        />
      </Route>
    </Routes>
  );
}
