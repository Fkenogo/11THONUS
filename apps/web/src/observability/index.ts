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
  clearCorrelationId,
  getCurrentCorrelationId,
  resolveCorrelationId,
  setCorrelationId,
} from "./correlationContext";
export type { CapturedRenderInfo } from "./errorBoundaryIntegration";
export { createRenderErrorHandler } from "./errorBoundaryIntegration";

import { loadObservabilityConfig } from "./config";
import { createNoopProvider } from "./noopProvider";
import { createObservabilityService, type ObservabilityService } from "./observabilityService";
import { getCurrentCorrelationId } from "./correlationContext";

let cachedService: ObservabilityService | undefined;

/**
 * The application's live observability service, loaded lazily and
 * cached on first access — never at module import time, matching
 * `config/env.ts`'s `getAppEnv()` pattern so importing this module in
 * a test never triggers real env reads. Always backed by the no-op
 * provider at this stage.
 */
export function getObservability(): ObservabilityService {
  if (!cachedService) {
    const config = loadObservabilityConfig(import.meta.env, { MODE: import.meta.env.MODE });
    cachedService = createObservabilityService({
      config,
      provider: createNoopProvider(),
      getCorrelationId: getCurrentCorrelationId,
    });
  }
  return cachedService;
}
