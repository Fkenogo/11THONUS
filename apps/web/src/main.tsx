import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
// Centralized localization foundation (I18N-001) — initialize the single i18n
// instance once at boot, before anything renders, so `useTranslation` resolves
// synchronously (English default, French supported; TRD13/TRD16 §16.40).
import "./i18n/config";
import App from "./App.tsx";
import { getAppEnv } from "./config/env";
import { initializeFirebasePlatform } from "./infrastructure/firebase";
import {
  ObservabilityErrorBoundary,
  RouteTracker,
  beginWorkflow,
  getObservability,
  registerAuthLifecycle,
  registerConnectivityBreadcrumbs,
  registerGlobalErrorHandlers,
} from "./observability";

// Firebase platform foundation (ENG-P1-001) — initialized once at boot,
// before anything renders. Establishes the shared app/auth/firestore/
// storage/App Check instances domain services reuse — `auth`/`functions`
// are threaded into `App` for the Business onboarding routes (ENG-P3-002B).
const { auth, functions } = initializeFirebasePlatform(getAppEnv());

// Observability foundation (ENG-P1-003-IMP-01/02) — wired directly here,
// not as a React effect, so registration happens exactly once per
// application boot with no `StrictMode` double-invocation risk (see
// `globalErrorHandlers.ts` and `connectivityBreadcrumbs.ts`).
const observability = getObservability();
beginWorkflow();
registerGlobalErrorHandlers(observability);
registerConnectivityBreadcrumbs(observability);
registerAuthLifecycle(auth, observability);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ObservabilityErrorBoundary service={observability}>
          <RouteTracker service={observability} />
          <App auth={auth} functions={functions} />
        </ObservabilityErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
