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
import type { BusinessContext } from "../../business/api/businessContext";

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

const harnessQueryClient = new QueryClient();

export function DashboardHarnessPage() {
  return (
    <QueryClientProvider client={harnessQueryClient}>
      <BusinessApiProvider platform={{ auth: inertAuth, functions: inertFunctions }}>
        <BusinessDashboardRoutes context={HARNESS_CONTEXT} />
      </BusinessApiProvider>
    </QueryClientProvider>
  );
}
