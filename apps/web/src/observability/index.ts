/**
 * Observability composition root (ENG-P1-003-IMP-01).
 *
 * The single entry point future code uses for frontend diagnostics —
 * mirrors `infrastructure/firebase/index.ts`'s composition-root shape.
 * `getObservability()` is the stable integration point the ENG-P1-003
 * Operational Observability Blueprint's later stages (a real error
 * boundary, a Sentry adapter) import directly, with no additional
 * wiring — it is not called from `main.tsx` yet because nothing
 * consumes it this stage (Blueprint §14 step 4 is a separate,
 * not-yet-authorized task).
 */

export type {
  Breadcrumb,
  DiagnosticContext,
  DiagnosticsProvider,
  ObservabilityUserContext,
} from "./types";
export { createNoopProvider } from "./noopProvider";
export { REDACTED, sanitize, sanitizeText } from "./sanitize";
export type { SanitizedException } from "./sanitizeException";
export { sanitizeException } from "./sanitizeException";
export type { ObservabilityConfig, ObservabilityProviderId } from "./config";
export { loadObservabilityConfig } from "./config";
export type { ObservabilityService, ObservabilityServiceDeps } from "./observabilityService";
export { createObservabilityService } from "./observabilityService";
export {
  beginWorkflow,
  clearCorrelationId,
  endWorkflow,
  getCurrentCorrelationId,
  resolveCorrelationId,
  setCorrelationId,
} from "./correlationContext";
export type { CapturedRenderInfo } from "./errorBoundaryIntegration";
export { createRenderErrorHandler } from "./errorBoundaryIntegration";
export { ObservabilityErrorBoundary } from "./ErrorBoundary";
export { registerGlobalErrorHandlers } from "./globalErrorHandlers";
export { registerConnectivityBreadcrumbs } from "./connectivityBreadcrumbs";
export { registerAuthLifecycle } from "./authLifecycle";
export { RouteTracker } from "./RouteTracker";
export { selectProvider } from "./providerSelection";

import { loadObservabilityConfig } from "./config";
import { selectProvider } from "./providerSelection";
import { createObservabilityService, type ObservabilityService } from "./observabilityService";
import { getCurrentCorrelationId } from "./correlationContext";

let cachedService: ObservabilityService | undefined;

/**
 * The application's live observability service, loaded lazily and
 * cached on first access — never at module import time, matching
 * `config/env.ts`'s `getAppEnv()` pattern so importing this module in
 * a test never triggers real env reads.
 *
 * **Provider selection (ENG-P1-003-IMP-03):** delegated entirely to
 * `selectProvider()` — backed by the no-op provider unless diagnostics
 * are explicitly enabled, the provider is explicitly `"sentry"`, and a
 * non-empty DSN is configured (see `providerSelection.ts`). Disabled
 * by default; no environment variable set here activates Sentry.
 */
export function getObservability(): ObservabilityService {
  if (!cachedService) {
    const config = loadObservabilityConfig(import.meta.env, { MODE: import.meta.env.MODE });
    cachedService = createObservabilityService({
      config,
      provider: selectProvider(config),
      getCorrelationId: getCurrentCorrelationId,
    });
  }
  return cachedService;
}
