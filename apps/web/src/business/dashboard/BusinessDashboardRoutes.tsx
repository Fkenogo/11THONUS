/**
 * Nested route table mounted under `/business/:businessId/dashboard/*` by
 * `BusinessDashboardBoundaryPage`. Wraps every destination in the shared `BusinessDashboardShell`
 * so future packages add a `<Route>` here without rebuilding the shell. The index route
 * (DASH-01, Package B), `profile`/`locations` (MGMT-02/03, Package C), `team` (MGMT-01, Package F),
 * and `terms` (ACT-01, Package D) are all real content.
 */

import { Route, Routes } from "react-router-dom";
import type { BusinessContext } from "../api/businessContext";
import { BusinessDashboardShell } from "./BusinessDashboardShell";
import { DashboardHome } from "./DashboardHome";
import { BusinessProfilePage } from "./BusinessProfilePage";
import { LocationsPage } from "./LocationsPage";
import { TeamManagementPage } from "./TeamManagementPage";
import { DashboardTermsPage } from "./DashboardTermsPage";

export function BusinessDashboardRoutes({ context }: { context: BusinessContext }) {
  return (
    <Routes>
      <Route element={<BusinessDashboardShell context={context} />}>
        <Route index element={<DashboardHome context={context} />} />
        <Route path="profile" element={<BusinessProfilePage context={context} />} />
        <Route path="locations" element={<LocationsPage context={context} />} />
        <Route path="team" element={<TeamManagementPage context={context} />} />
        <Route path="terms" element={<DashboardTermsPage context={context} />} />
      </Route>
    </Routes>
  );
}
