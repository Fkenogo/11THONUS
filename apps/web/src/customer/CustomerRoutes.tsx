/**
 * Nested route table mounted under `/customer/*` (`PRODUCT-ALIGN-002`),
 * mirroring `BusinessDashboardRoutes`'s shell-plus-nested-destinations shape.
 */

import { Route, Routes } from "react-router-dom";
import { CustomerShell } from "./CustomerShell";
import { CustomerHomePage } from "./CustomerHomePage";
import { CustomerNotAvailablePage } from "./CustomerNotAvailablePage";

export function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerShell />}>
        <Route index element={<CustomerHomePage />} />
        <Route
          path="scan"
          element={
            <CustomerNotAvailablePage titleKey="scan.title" bodyKey="scan.notYetAvailable" />
          }
        />
        <Route
          path="rewards"
          element={
            <CustomerNotAvailablePage titleKey="rewards.title" bodyKey="rewards.notYetAvailable" />
          }
        />
        <Route
          path="activity"
          element={
            <CustomerNotAvailablePage
              titleKey="activity.title"
              bodyKey="activity.notYetAvailable"
            />
          }
        />
        <Route
          path="account"
          element={
            <CustomerNotAvailablePage titleKey="account.title" bodyKey="account.notYetAvailable" />
          }
        />
      </Route>
    </Routes>
  );
}
