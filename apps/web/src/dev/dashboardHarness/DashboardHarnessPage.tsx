/**
 * `ENG-P3-002-UI-IMP-B-REVIEW` development-only Founder-QA harness (development only, never
 * shipped — see `App.tsx`'s literal `import.meta.env.DEV` gate, the same build-time-eliminated
 * pattern the phone-auth/sign-in-preview harnesses use).
 *
 * Renders the real `BusinessDashboardRoutes` (shell + DASH-01 Home + placeholders) against a
 * fixed, entirely local `BusinessContext` fixture — no Firebase Auth, no emulator, no network
 * call of any kind. Exists solely so real-browser/responsive/visual verification (Tailwind
 * breakpoints, focus management, viewport overflow) can be driven against actual rendered CSS
 * and layout, which jsdom-based component tests cannot exercise. Not a substitute for the real
 * authenticated route — `BusinessDashboardBoundaryPage` (unchanged) remains the only production
 * entry point, still gated by `RequireAuthenticatedUser` and real `getBusinessContext`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { BusinessApiProvider } from "../../business/BusinessApiContext";
import { BusinessDashboardRoutes } from "../../business/dashboard/BusinessDashboardRoutes";
import { businessQueryKeys } from "../../business/hooks/queryKeys";
import type { BusinessContext } from "../../business/api/businessContext";
import type { StaffInvitationSummary, StaffMembershipSummary } from "../../business/api/staffLists";

/**
 * A real Firebase `Auth`/`Functions` instance is never constructed here — this harness never
 * signs in and never calls a callable. `onAuthStateChanged` resolves synchronously to "no user,"
 * so `useAuthenticatedActor` settles on `unauthenticated` and every `enabled`-gated query
 * (e.g. `useBusinessCategoriesQuery`) stays permanently disabled — zero network calls of any
 * kind, matching this file's own no-Firebase guarantee.
 */
const inertAuth = {
  onAuthStateChanged: (callback: (user: null) => void) => {
    callback(null);
    return () => {};
  },
} as unknown as Auth;
const inertFunctions = {} as Functions;

const HARNESS_CONTEXT: BusinessContext = {
  businessId: "harness-biz-1",
  businessCode: "HARNESSCODE1",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

/**
 * `useStaffMembershipsQuery`/`useStaffInvitationsQuery` are `enabled`-gated on a *ready*
 * authenticated actor, which this harness deliberately never produces (see `inertAuth` above) —
 * so, unmodified, the Team route (Package F) would render only its permanent loading state, never
 * real content, making it impossible to visually/responsive-verify against actual rendered CSS.
 * Pre-seeding the query cache under the exact keys those hooks read (`queryKeys.ts`) gives the
 * Team screen real, local, no-network fixture data to render — the query itself is still never
 * enabled/refetched, so this remains zero-network, matching the harness's own guarantee above.
 */
const HARNESS_MEMBERSHIPS: StaffMembershipSummary[] = [
  { membershipId: "harness-mem-owner", role: "owner", status: "active", displayName: "Safi" },
  { membershipId: "harness-mem-2", role: "manager", status: "active", displayName: "Jean-Claude" },
  { membershipId: "harness-mem-3", role: "staff", status: "active" },
];
const HARNESS_INVITATIONS: StaffInvitationSummary[] = [
  {
    invitationId: "harness-inv-1",
    role: "staff",
    status: "invited",
    deliveryType: "email",
    invitedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-08-08T00:00:00.000Z",
    email: "elise.m@example.com",
  },
];

const harnessQueryClient = new QueryClient();
harnessQueryClient.setQueryData(
  businessQueryKeys.staffMemberships(HARNESS_CONTEXT.businessId),
  HARNESS_MEMBERSHIPS,
);
harnessQueryClient.setQueryData(
  businessQueryKeys.staffInvitations(HARNESS_CONTEXT.businessId),
  HARNESS_INVITATIONS,
);

export function DashboardHarnessPage() {
  return (
    <QueryClientProvider client={harnessQueryClient}>
      <BusinessApiProvider platform={{ auth: inertAuth, functions: inertFunctions }}>
        <BusinessDashboardRoutes context={HARNESS_CONTEXT} />
      </BusinessApiProvider>
    </QueryClientProvider>
  );
}
