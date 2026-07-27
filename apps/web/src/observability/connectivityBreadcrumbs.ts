/**
 * Connectivity breadcrumbs (ENG-P1-003-IMP-02).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §5: the
 * browser's own `online`/`offline` events (`navigator.onLine`
 * transitions) give later diagnostics useful context — e.g. "the user
 * was offline in the seconds before this exception" — without
 * inventing any new UI or state.
 *
 * Registered directly in `main.tsx`, same rationale as
 * `globalErrorHandlers.ts`: exactly once per boot, no `StrictMode`
 * double-invocation risk.
 */

import type { ObservabilityService } from "./observabilityService";

let activeHandlers: { handleOnline: () => void; handleOffline: () => void } | undefined;

export function registerConnectivityBreadcrumbs(service: ObservabilityService): () => void {
  if (activeHandlers) {
    return () => undefined;
  }

  function handleOnline(): void {
    try {
      service.addBreadcrumb({ category: "connectivity", message: "online" });
    } catch {
      // Observability must never disrupt the application — see
      // Blueprint §11.
    }
  }

  function handleOffline(): void {
    try {
      service.addBreadcrumb({ category: "connectivity", message: "offline" });
    } catch {
      // Same rule as above.
    }
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  activeHandlers = { handleOnline, handleOffline };

  return function unregister(): void {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    activeHandlers = undefined;
  };
}
