/**
 * Global browser failure capture (ENG-P1-003-IMP-02).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §5: catches
 * uncaught errors and unhandled promise rejections the React error
 * boundary cannot — those occur outside any React render/lifecycle
 * (a stray event handler, a rejected promise nobody awaited).
 *
 * Registered directly in `main.tsx` (not as a React effect), so it is
 * called exactly once per application boot with no `StrictMode`
 * double-invocation risk. The returned function removes both
 * listeners, for tests and any future teardown need.
 */

import type { ObservabilityService } from "./observabilityService";

// Module-level guard (test #7 of the Stage 2 required list, "Listener
// registration is not duplicated") — `main.tsx` calls this exactly
// once in normal operation, but a second call (e.g. accidental
// re-invocation) must not attach a second pair of listeners.
let activeHandlers:
  | {
      handleError: (event: ErrorEvent) => void;
      handleRejection: (event: PromiseRejectionEvent) => void;
    }
  | undefined;

export function registerGlobalErrorHandlers(service: ObservabilityService): () => void {
  if (activeHandlers) {
    return () => undefined;
  }

  function handleError(event: ErrorEvent): void {
    try {
      service.captureException(event.error ?? event.message);
    } catch {
      // Observability must never disrupt the application — see
      // Blueprint §11.
    }
  }

  function handleRejection(event: PromiseRejectionEvent): void {
    try {
      service.captureException(event.reason);
    } catch {
      // Same rule as above.
    }
  }

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  activeHandlers = { handleError, handleRejection };

  return function unregister(): void {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    activeHandlers = undefined;
  };
}
