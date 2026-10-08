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
 *   ?fixture=paged            — a first Activity page that offers "Load more"
 *
 * Typed Loyalty Numbers with a fixture answer: ABC234 (8 of 10), NEA999 (9 of 10 + 1 awaiting),
 * RWD777 (reward available).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { Navigate, Route, Routes } from "react-router-dom";
import { BusinessApiProvider } from "../../business/BusinessApiContext";
import type { BusinessContext } from "../../business/api/businessContext";
import type {
  CounterLoyaltyContextWire,
  CounterRecentPurchaseWire,
} from "../../business/api/purchaseMutations";
import { StaffActivityPage } from "../../business/counter/StaffActivityPage";
import { StaffProfilePage } from "../../business/counter/StaffProfilePage";
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

const BASE = "/dev/counter-harness";

/** Loyalty fixtures the harness answers for (typed Loyalty Numbers; same answer in every programme). */
const LOYALTY: Record<string, CounterLoyaltyContextWire> = {
  ABC234: {
    verifiedUnits: 8,
    requiredVerifiedUnits: 10,
    rewardStatus: "none",
    awaitingCustomerConfirmationUnits: 0,
  },
  NEA999: {
    verifiedUnits: 9,
    requiredVerifiedUnits: 10,
    rewardStatus: "none",
    awaitingCustomerConfirmationUnits: 1,
  },
  RWD777: {
    verifiedUnits: 10,
    requiredVerifiedUnits: 10,
    rewardStatus: "available",
    awaitingCustomerConfirmationUnits: 0,
  },
};

function buildClient(fixture: string | null): QueryClient {
  const client = new QueryClient();
  const programmes = fixture === "many" ? MANY : SINGLE;
  client.setQueryData(businessQueryKeys.counterProgrammes(CONTEXT.businessId), programmes);
  const purchases = fixture === "empty" ? [] : RECENT;
  client.setQueryData(businessQueryKeys.counterRecent(CONTEXT.businessId, "anonymous"), {
    pages: [{ purchases, nextCursor: fixture === "paged" ? "harness-cursor" : null }],
    pageParams: [undefined],
  });
  for (const programme of programmes) {
    for (const [loyaltyNumber, context] of Object.entries(LOYALTY)) {
      client.setQueryData(
        businessQueryKeys.counterLoyalty(
          CONTEXT.businessId,
          "anonymous",
          programme.id,
          "loyalty_number",
          loyaltyNumber,
        ),
        context,
      );
    }
  }
  return client;
}

export function CounterHarnessPage() {
  const fixture = new URLSearchParams(window.location.search).get("fixture");
  return (
    <QueryClientProvider client={buildClient(fixture)}>
      <BusinessApiProvider platform={{ auth: inertAuth, functions: inertFunctions }}>
        <Routes>
          <Route element={<StaffShell context={CONTEXT} basePath={BASE} />}>
            <Route index element={<Navigate to={`${BASE}/counter`} replace />} />
            <Route path="counter" element={null} />
            <Route
              path="activity"
              element={<StaffActivityPage businessId={CONTEXT.businessId} />}
            />
            <Route path="profile" element={<StaffProfilePage context={CONTEXT} />} />
          </Route>
        </Routes>
      </BusinessApiProvider>
    </QueryClientProvider>
  );
}
