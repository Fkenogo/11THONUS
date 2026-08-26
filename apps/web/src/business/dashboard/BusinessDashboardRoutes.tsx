/**
 * Nested route table mounted under `/business/:businessId/dashboard/*` by
 * `BusinessDashboardBoundaryPage`. Wraps every destination in the shared `BusinessDashboardShell`
 * so future packages (C/D/F) add a `<Route>` here without rebuilding the shell. Only the index
 * route (DASH-01) is real Package B content; every other destination is a restrained
 * `DashboardComingSoon` placeholder until its own package is authorized.
 */

import { Route, Routes } from "react-router-dom";
import type { BusinessContext } from "../api/businessContext";
import { BusinessDashboardShell } from "./BusinessDashboardShell";
import { DashboardHome } from "./DashboardHome";
import { DashboardComingSoon } from "./DashboardComingSoon";

export function BusinessDashboardRoutes({ context }: { context: BusinessContext }) {
  return (
    <Routes>
      <Route element={<BusinessDashboardShell context={context} />}>
        <Route index element={<DashboardHome context={context} />} />
        <Route
          path="profile"
          element={<DashboardComingSoon section="profile" businessId={context.businessId} />}
        />
        <Route
          path="locations"
          element={<DashboardComingSoon section="locations" businessId={context.businessId} />}
        />
        <Route
          path="team"
          element={<DashboardComingSoon section="team" businessId={context.businessId} />}
        />
        <Route
          path="terms"
          element={<DashboardComingSoon section="terms" businessId={context.businessId} />}
        />
      </Route>
    </Routes>
  );
}
