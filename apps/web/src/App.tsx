import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
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
    </Routes>
  );
}

export default App;
