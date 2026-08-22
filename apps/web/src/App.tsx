import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { RequireAuthenticatedUser } from "./authentication/RequireAuthenticatedUser";
import { BusinessApiProvider } from "./business/BusinessApiContext";
import { BusinessResolverPage } from "./business/onboarding/BusinessResolverPage";
import { NewBusinessPage } from "./business/onboarding/NewBusinessPage";
import { BusinessWizardPage } from "./business/onboarding/BusinessWizardPage";

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
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <p>Please sign in to continue.</p>
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
      </Routes>
    </BusinessApiProvider>
  );
}

export default App;
