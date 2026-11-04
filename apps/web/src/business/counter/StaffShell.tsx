/**
 * Bounded Staff experience (`EA-BL-001-CORR-002-B`, D8): Staff land directly on the Counter and get ONE
 * phone-oriented shell at every viewport size (Founder Preview Pass 2 — "Staff does not need a desktop
 * experience"), centred at a bounded width (`max-w-lg`, 32rem / 512 px) on wide screens.
 *
 * Information architecture (Founder Preview Pass 3): three permanent destinations that are real routes —
 * Counter (transaction), Activity (the member's own submissions) and Profile — in a permanent bottom bar,
 * plus a quick-ACTION button (scan a customer, help a new customer join). The Counter stays MOUNTED
 * (hidden) while Activity or Profile is open, so a transaction in progress is never lost by looking at
 * another place; its camera is closed whenever it is not the visible place. The Founder-rejected
 * bottom-bar decision recorded for the broader Business Dashboard shell does NOT apply here and that shell
 * is untouched.
 *
 * This is UX routing ONLY. It hides the Owner/Manager destinations from Staff so they are not offered
 * controls they cannot use; it grants nothing and denies nothing. Every protected operation is still
 * decided by the server, per call, whatever route is on screen.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";
import { CounterPage } from "./CounterPage";
import { StaffActivityPage } from "./StaffActivityPage";
import { STAFF_BOTTOM_NAV_HEIGHT, StaffBottomNav } from "./StaffBottomNav";
import { StaffProfilePage } from "./StaffProfilePage";
import { StaffActionRequestContext, type StaffActionRequest } from "./staffActions";

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
function useSoftKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!viewport) return;
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
  }, []);
  return open;
}

export function StaffShell({
  context,
  basePath,
}: {
  context: BusinessContext;
  /** Where the Staff places live. Production always uses the Business dashboard path (the default). */
  basePath?: string;
}) {
  const { t } = useTranslation("business");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const base = basePath ?? `/business/${context.businessId}/dashboard`;
  const onCounter = matchPath({ path: `${base}/counter`, end: true }, pathname) !== null;
  const keyboardOpen = useSoftKeyboardOpen();
  const [request, setRequest] = useState<StaffActionRequest>(null);
  const showBottomNav = !keyboardOpen;

  // "Scan customer QR": make the Counter the visible place, then ask it to open its scanner.
  const scan = useCallback(() => {
    if (!onCounter) navigate(`${base}/counter`);
    setRequest((previous) => ({ action: "scan", tick: (previous?.tick ?? 0) + 1 }));
  }, [base, navigate, onCounter]);

  // A new place starts at its top with its heading focused (announced, and the keyboard resumes there).
  const firstPlace = useRef(true);
  useEffect(() => {
    if (firstPlace.current) {
      firstPlace.current = false;
      return;
    }
    window.scrollTo?.(0, 0);
    const heading = Array.from(
      document.querySelectorAll<HTMLElement>("[data-staff-view-heading]"),
    ).find((element) => !element.closest("[hidden]"));
    heading?.focus({ preventScroll: true });
  }, [pathname]);

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
      className="min-h-screen bg-slate-100 text-slate-900"
      style={{ "--staff-nav-offset": navOffset } as React.CSSProperties}
    >
      {/* One phone-oriented column at every viewport size; centred and bounded on wide screens. */}
      <div
        className="mx-auto min-h-screen w-full max-w-lg border-x border-slate-200 bg-slate-50"
        data-testid="staff-app"
      >
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {t("counter.shell.staffLabel")}
              </p>
              <p className="truncate text-base font-bold text-slate-900">{context.displayName}</p>
            </div>
          </div>
        </header>
        <main className="px-4 pt-4 pb-[calc(var(--staff-nav-offset,0px)+1rem)]">
          <StaffActionRequestContext.Provider value={request}>
            {/* Kept mounted while Activity/Profile are open: the transaction in progress survives. */}
            <div hidden={!onCounter}>
              <CounterPage context={context} active={onCounter} />
            </div>
          </StaffActionRequestContext.Provider>
          {onCounter ? null : <Outlet />}
        </main>
      </div>
      {showBottomNav ? <StaffBottomNav basePath={base} onScan={scan} /> : null}
    </div>
  );
}

/** Staff landing: the Counter, and nothing administrative. Any other path folds back to the Counter. */
export function StaffRoutes({ context }: { context: BusinessContext }) {
  return (
    <Routes>
      <Route element={<StaffShell context={context} />}>
        {/* The Counter itself is rendered by the shell (kept mounted); the route only selects it. */}
        <Route path="counter" element={null} />
        <Route path="activity" element={<StaffActivityPage businessId={context.businessId} />} />
        <Route path="profile" element={<StaffProfilePage context={context} />} />
        {/* Absolute target: a relative one inside this splat route would re-match itself and loop. */}
        <Route
          path="*"
          element={<Navigate to={`/business/${context.businessId}/dashboard/counter`} replace />}
        />
      </Route>
    </Routes>
  );
}
