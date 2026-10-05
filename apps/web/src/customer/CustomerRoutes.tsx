/**
 * Nested route table mounted under `/customer/*` (`PRODUCT-ALIGN-002`),
 * mirroring `BusinessDashboardRoutes`'s shell-plus-nested-destinations shape.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { CustomerShell } from "./CustomerShell";
import { CustomerHomePage } from "./CustomerHomePage";
import { CustomerActivityPage } from "./CustomerActivityPage";
import { CustomerCirclesPage } from "./CustomerCirclesPage";
import { CustomerProfilePage } from "./CustomerProfilePage";

export function CustomerRoutes({ auth, functions }: { auth: Auth; functions: Functions }) {
  return (
    <Routes>
      <Route element={<CustomerShell auth={auth} functions={functions} />}>
        <Route index element={<CustomerHomePage auth={auth} functions={functions} />} />
        <Route path="scan" element={<Navigate to="/customer" replace />} />
        <Route path="circles" element={<CustomerCirclesPage auth={auth} functions={functions} />} />
        <Route path="rewards" element={<CustomerCirclesPage auth={auth} functions={functions} />} />
        <Route
          path="activity"
          element={<CustomerActivityPage auth={auth} functions={functions} />}
        />
        <Route path="profile" element={<CustomerProfilePage auth={auth} functions={functions} />} />
        <Route path="account" element={<Navigate to="/customer/profile" replace />} />
      </Route>
    </Routes>
  );
}
