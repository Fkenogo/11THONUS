/**
 * No-operation diagnostics provider (ENG-P1-003-IMP-01).
 *
 * The only active provider at this stage. Performs no network call,
 * requires no account or secret, and never disrupts application
 * execution — the application is fully operational with this provider
 * alone. A future Sentry adapter is a second implementation of
 * `DiagnosticsProvider`, swapped in without changing any caller.
 */

import type { DiagnosticsProvider } from "./types";

export function createNoopProvider(): DiagnosticsProvider {
  return {
    captureException: () => undefined,
    captureMessage: () => undefined,
    addBreadcrumb: () => undefined,
    setContext: () => undefined,
    clearContext: () => undefined,
    setUserContext: () => undefined,
    flush: async () => undefined,
    isEnabled: () => false,
  };
}
