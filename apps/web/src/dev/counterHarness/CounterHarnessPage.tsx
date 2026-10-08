/**
 * `EA-BL-001-CORR-002-B` development-only Counter harness (never shipped — see `App.tsx`'s literal
 * `import.meta.env.DEV` gate, the same build-time-eliminated pattern as the dashboard harness).
 *
 * Renders the REAL `StaffShell` + `CounterPage` against local fixture data pre-seeded under the exact
 * query keys the Counter reads — no Firebase Auth, no emulator, no network. It exists so real-browser
 * checks jsdom cannot make (phone-width layout and overflow at 320px, tap-target sizes, the scanner
 * view with a fake camera device, axe) run against actual rendered CSS. Fixture programmes are
 * already shaped like the whitelist projection; the page itself is unchanged production code.
 *
 *   ?fixture=single (default) — one programme, one item
 *   ?fixture=many             — three programmes, one with many items and long names
 *   ?fixture=empty            — no recent submissions
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { Route, Routes } from "react-router-dom";
import { BusinessApiProvider } from "../../business/BusinessApiContext";
import type { BusinessContext } from "../../business/api/businessContext";
import type { CounterRecentPurchaseWire } from "../../business/api/purchaseMutations";
import { CounterPage } from "../../business/counter/CounterPage";
import { StaffShell } from "../../business/counter/StaffShell";
import type { CounterProgramme } from "../../business/counter/counterProgrammes";
import { businessQueryKeys } from "../../business/hooks/queryKeys";

const inertAuth = {
  onAuthStateChanged: (callback: (user: null) => void) => {
    callback(null);
    return () => {};
  },
} as unknown as Auth;
const inertFunctions = {} as Functions;

const CONTEXT = {
  businessId: "harness-biz-1",
  displayName: "Bella Salon",
} as BusinessContext;

const SINGLE: CounterProgramme[] = [
  {
    id: "rp-1",
    name: "Premium Cut Circle",
    multipleUnitsAllowed: true,
    items: [{ id: "item-1", name: "Haircut" }],
  },
];

const MANY: CounterProgramme[] = [
  {
    id: "rp-1",
    name: "Premium Cut Circle for Returning Clients of the Salon",
    multipleUnitsAllowed: true,
    items: [
      { id: "i1", name: "Haircut" },
      { id: "i2", name: "Braiding with extensions and a very long descriptive item name" },
    ],
  },
  {
    id: "rp-2",
    name: "Family Care Circle",
    multipleUnitsAllowed: false,
    items: Array.from({ length: 8 }, (_, index) => ({
      id: `m${index}`,
      name: `Care item number ${index + 1}`,
    })),
  },
  {
    id: "rp-3",
    name: "Wash 10+1",
    multipleUnitsAllowed: true,
    items: [{ id: "w1", name: "Basic wash" }],
  },
];

const RECENT: CounterRecentPurchaseWire[] = [
  {
    id: "r1",
    recordedAt: "2026-10-07T09:30:00.000Z",
    itemLabel: "Braiding with extensions and a very long descriptive item name",
    quantity: 2,
    status: "waiting_for_customer",
    presentedVia: "loyalty_number",
    customerCodeHint: "234",
  },
  {
    id: "r2",
    recordedAt: "2026-10-07T09:10:00.000Z",
    itemLabel: "Haircut",
    quantity: 5,
    status: "business_review_required",
    presentedVia: "qr_identity",
    customerCodeHint: null,
  },
];

function buildClient(fixture: string | null): QueryClient {
  const client = new QueryClient();
  client.setQueryData(
    businessQueryKeys.counterProgrammes(CONTEXT.businessId),
    fixture === "many" ? MANY : SINGLE,
  );
  client.setQueryData(businessQueryKeys.counterRecent(CONTEXT.businessId, "anonymous"), {
    purchases: fixture === "empty" ? [] : RECENT,
  });
  return client;
}

export function CounterHarnessPage() {
  const fixture = new URLSearchParams(window.location.search).get("fixture");
  return (
    <QueryClientProvider client={buildClient(fixture)}>
      <BusinessApiProvider platform={{ auth: inertAuth, functions: inertFunctions }}>
        <Routes>
          <Route element={<StaffShell context={CONTEXT} />}>
            <Route index element={<CounterPage context={CONTEXT} />} />
          </Route>
        </Routes>
      </BusinessApiProvider>
    </QueryClientProvider>
  );
}
