/**
 * Nested route table mounted under `/customer/*` (`PRODUCT-ALIGN-002`),
 * mirroring `BusinessDashboardRoutes`'s shell-plus-nested-destinations shape.
 */

import { Route, Routes } from "react-router-dom";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { CustomerShell } from "./CustomerShell";
import { CustomerHomePage } from "./CustomerHomePage";
import { CustomerNotAvailablePage } from "./CustomerNotAvailablePage";
import { CustomerActivityPage } from "./CustomerActivityPage";
import { CustomerRewardsPage } from "./CustomerRewardsPage";

export function CustomerRoutes({ auth, functions }: { auth: Auth; functions: Functions }) {
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
        <Route path="rewards" element={<CustomerRewardsPage auth={auth} functions={functions} />} />
        <Route
          path="activity"
          element={<CustomerActivityPage auth={auth} functions={functions} />}
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
