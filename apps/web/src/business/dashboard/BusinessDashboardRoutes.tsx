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
import { RewardProgramManagementPage } from "./RewardProgramManagementPage";
import { PurchaseRecordsPage } from "./PurchaseRecordsPage";
import { CustomerRewardsProgressPage } from "./CustomerRewardsProgressPage";
import { CommandCentre } from "./commandCentre/CommandCentre";
import { useAccessibleBusinessesQuery } from "../hooks/businessQueries";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/ui/formPrimitives";

export function BusinessDashboardRoutes({ context }: { context: BusinessContext }) {
  // The viewer's own live role for this Business, from the already-fetched accessible-businesses
  // read. Used for wording and navigation emphasis only — every read/command is authorised
  // server-side regardless of what this resolves to.
  const { t } = useTranslation("business");
  const accessibleQuery = useAccessibleBusinessesQuery();
  const myRole = accessibleQuery.data?.find(
    (business) => business.businessId === context.businessId,
  )?.role;
  const commandCentreRole = myRole === "owner" || myRole === "manager" ? myRole : undefined;

  return (
    <Routes>
      <Route element={<BusinessDashboardShell context={context} role={myRole} />}>
        <Route
          index
          element={
            <DashboardHome context={context}>
              {commandCentreRole ? (
                <CommandCentre context={context} role={commandCentreRole} />
              ) : accessibleQuery.isError ? (
                <div
                  role="alert"
                  className="mb-6 rounded-md border border-[var(--color-border)] p-3 text-sm"
                >
                  <p className="mb-2">{t("dashboard.commandCentre.loadError")}</p>
                  <Button type="button" onClick={() => void accessibleQuery.refetch()}>
                    {t("dashboard.commandCentre.retry")}
                  </Button>
                </div>
              ) : null}
            </DashboardHome>
          }
        />
        <Route path="profile" element={<BusinessProfilePage context={context} />} />
        <Route path="locations" element={<LocationsPage context={context} />} />
        <Route path="team" element={<TeamManagementPage context={context} />} />
        <Route path="terms" element={<DashboardTermsPage context={context} />} />
        <Route path="reward-programs" element={<RewardProgramManagementPage context={context} />} />
        <Route path="purchases" element={<PurchaseRecordsPage context={context} />} />
        <Route
          path="customer-rewards"
          element={<CustomerRewardsProgressPage context={context} />}
        />
      </Route>
    </Routes>
  );
}
