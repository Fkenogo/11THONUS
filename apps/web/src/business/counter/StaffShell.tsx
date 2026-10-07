/**
 * Bounded Staff experience (`EA-BL-001-CORR-002-B`, D8): Staff land directly on the Counter and get a
 * minimal, mobile-first header — Business name, the Counter, a way to switch Business / Personal
 * context, and the language switch. A top bar, never a participant-style bottom bar (the Business
 * Dashboard shell records that pattern as Founder-rejected).
 *
 * This is UX routing ONLY. It hides the Owner/Manager destinations from Staff so they are not offered
 * controls they cannot use; it grants nothing and denies nothing. Every protected operation is still
 * decided by the server, per call, whatever route is on screen.
 */

import { Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Repeat2 } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { BusinessContext } from "../api/businessContext";
import { CounterPage } from "./CounterPage";

export function StaffShell({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3 md:max-w-5xl">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {t("counter.shell.businessLabel")}
            </p>
            <p className="truncate text-base font-bold text-slate-900">{context.displayName}</p>
          </div>
          <LanguageSwitcher />
        </div>
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
      </header>
      <main className="px-4 py-4">
        <Outlet />
      </main>
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
