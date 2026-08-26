/**
 * Nested route table mounted under `/business/:businessId/dashboard/*` by
 * `BusinessDashboardBoundaryPage`. Wraps every destination in the shared `BusinessDashboardShell`
 * so future packages (D/F) add a `<Route>` here without rebuilding the shell. The index route
 * (DASH-01, Package B) and `profile`/`locations` (MGMT-02/03, Package C) are real content; `team`
 * and `terms` remain a restrained `DashboardComingSoon` placeholder until their own packages are
 * authorized.
 */

import { Route, Routes } from "react-router-dom";
import type { BusinessContext } from "../api/businessContext";
import { BusinessDashboardShell } from "./BusinessDashboardShell";
import { DashboardHome } from "./DashboardHome";
import { DashboardComingSoon } from "./DashboardComingSoon";
import { BusinessProfilePage } from "./BusinessProfilePage";
import { LocationsPage } from "./LocationsPage";

export function BusinessDashboardRoutes({ context }: { context: BusinessContext }) {
  return (
    <Routes>
      <Route element={<BusinessDashboardShell context={context} />}>
        <Route index element={<DashboardHome context={context} />} />
        <Route path="profile" element={<BusinessProfilePage context={context} />} />
        <Route path="locations" element={<LocationsPage context={context} />} />
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
