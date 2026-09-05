import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "./i18n";
import { RequireAuthenticatedUser } from "./authentication/RequireAuthenticatedUser";
import { BusinessApiProvider } from "./business/BusinessApiContext";
import { BusinessResolverPage } from "./business/onboarding/BusinessResolverPage";
import { NewBusinessPage } from "./business/onboarding/NewBusinessPage";
import { BusinessWizardPage } from "./business/onboarding/BusinessWizardPage";
import { BusinessDashboardBoundaryPage } from "./business/dashboard/BusinessDashboardBoundaryPage";
import { DisplayNameProfile } from "./identity/DisplayNameProfile";
import { MfaEnrollmentPage } from "./authentication/mfa/MfaEnrollmentPage";

// Guarded directly on the literal `import.meta.env.DEV` (not via an
// intermediate function call) so Vite's production build statically
// replaces this with `false` and drops the `import()` call entirely from
// the production dependency graph — verified by grepping `dist/` for
// harness markers after a real `pnpm build` (see the EXT-TECH-001-
// TEST-HARNESS implementation report). `isHarnessEnabled` remains the
// single source of truth for the *runtime* gate the harness component
// itself re-checks; this is a separate, build-time exclusion mechanism.
const DevPhoneAuthHarnessRoute = import.meta.env.DEV
  ? lazy(() =>
      import("./dev/phoneAuthHarness/PhoneAuthHarnessPage").then((m) => ({
        default: () => <m.PhoneAuthHarnessPage dev={import.meta.env.DEV} />,
      })),
    )
  : null;

// AUTH-PREVIEW-READINESS-001: the multi-provider sign-in preview's authoritative
// hosted-validation surface is the isolated `sign-in-preview` build
// (`sign-in-preview.html` / `signInPreviewMain.tsx`). This secondary dev-server
// route mounts the same page for convenient local testing, guarded on the literal
// `import.meta.env.DEV` so Vite statically drops it from the production bundle —
// the same build-time exclusion the phone-auth harness route uses.
const DevSignInPreviewRoute = import.meta.env.DEV
  ? lazy(() =>
      import("./dev/signInPreview/SignInPreviewPage").then((m) => ({
        default: () => <m.SignInPreviewPage dev={import.meta.env.DEV} />,
      })),
    )
  : null;

// ENG-P3-002-UI-IMP-B-REVIEW: development-only Founder-QA harness for real-browser/responsive
// verification of the Dashboard shell against a fixed local BusinessContext fixture — no
// Firebase Auth, no network call. Same literal `import.meta.env.DEV` build-time exclusion as the
// two routes above.
const DevDashboardHarnessRoute = import.meta.env.DEV
  ? lazy(() =>
      import("./dev/dashboardHarness/DashboardHarnessPage").then((m) => ({
        default: m.DashboardHarnessPage,
      })),
    )
  : null;

// ENG-P3-002C-PREVIEW-001: preview-only sign-in entry point for the Founder-QA
// business-onboarding hosted preview. Unlike the two routes above, this one is
// NOT gated on `import.meta.env.DEV` (a hosted preview is always a `vite build`,
// never dev mode) — it needs its own explicit, fail-closed gate. Every
// comparison below is a literal `import.meta.env.*` equality (not a function
// call) so Vite's production build statically replaces the whole condition with
// `false` and Rollup drops the `import()` call entirely from the production
// dependency graph — the same build-time exclusion the two routes above rely
// on. This literal condition is what actually governs the gate at build/run
// time; `founderQaPreviewGate.ts`'s `isFounderQaPreviewBuildEnabled` is a
// separately unit-tested reference representation of the identical
// three-comparison logic, not itself called here (a function call at this
// call site would defeat Rollup's static elimination). The two are not
// wired together, so they can drift silently if one changes without the
// other — kept in sync by hand and by review, not by a shared runtime
// reference; independently re-verified byte-for-byte identical, and the
// build itself re-checked with each combination of wrong/missing
// flag/project in `founder-qa-preview` mode (see the ENG-P3-002C-PREVIEW-001
// review report) as the practical drift check.
const FOUNDER_QA_PREVIEW_ENABLED =
  import.meta.env.VITE_ENABLE_DEV_AUTH_PREVIEW === "true" &&
  import.meta.env.MODE === "founder-qa-preview" &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID === "eleventh-on-us-dev";

const FounderQaPreviewSignInRoute = FOUNDER_QA_PREVIEW_ENABLED
  ? lazy(() =>
      import("./dev/founderQaPreview/FounderQaPreviewSignInRoute").then((m) => ({
        default: () => <m.FounderQaPreviewSignInRoute previewBuild={FOUNDER_QA_PREVIEW_ENABLED} />,
      })),
    )
  : null;

function AppShell() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <ShieldCheck className="h-10 w-10 text-[var(--color-primary)]" aria-hidden="true" />
      <h1 className="text-2xl font-medium">11thONUS — Engineering Foundation</h1>
      <p className="text-[var(--color-muted-foreground)]">
        Phase 0 infrastructure scaffold. No product features are implemented yet.
      </p>
    </main>
  );
}

function SignInRequired() {
  const { t } = useTranslation("business");
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <p>{t("access.signInRequired")}</p>
    </main>
  );
}

export type AppProps = { auth: Auth; functions: Functions };

function App({ auth, functions }: AppProps) {
  return (
    <BusinessApiProvider platform={{ auth, functions }}>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route
          path="/business"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <BusinessResolverPage />
            </RequireAuthenticatedUser>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <DisplayNameProfile auth={auth} functions={functions} />
            </RequireAuthenticatedUser>
          }
        />
        <Route
          path="/auth/mfa/enroll"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <MfaEnrollmentPage auth={auth} functions={functions} />
            </RequireAuthenticatedUser>
          }
        />
        <Route
          path="/business/new"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <NewBusinessPage />
            </RequireAuthenticatedUser>
          }
        />
        <Route
          path="/business/:businessId"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <BusinessWizardPage />
            </RequireAuthenticatedUser>
          }
        />
        <Route
          path="/business/:businessId/dashboard/*"
          element={
            <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <SignInRequired />}>
              <BusinessDashboardBoundaryPage />
            </RequireAuthenticatedUser>
          }
        />
        {DevPhoneAuthHarnessRoute && (
          <Route
            path="/dev/phone-auth-harness"
            element={
              <Suspense fallback={null}>
                <DevPhoneAuthHarnessRoute />
              </Suspense>
            }
          />
        )}
        {DevSignInPreviewRoute && (
          <Route
            path="/dev/sign-in-preview"
            element={
              <Suspense fallback={null}>
                <DevSignInPreviewRoute />
              </Suspense>
            }
          />
        )}
        {DevDashboardHarnessRoute && (
          <Route
            path="/dev/dashboard-harness/*"
            element={
              <Suspense fallback={null}>
                <DevDashboardHarnessRoute />
              </Suspense>
            }
          />
        )}
        {FounderQaPreviewSignInRoute && (
          <Route
            path="/dev/founder-qa-sign-in"
            element={
              <Suspense fallback={null}>
                <FounderQaPreviewSignInRoute />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BusinessApiProvider>
  );
}

export default App;
