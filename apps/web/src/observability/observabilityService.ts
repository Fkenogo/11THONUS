/**
 * Application-facing observability service (ENG-P1-003-IMP-01).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §6.2: the
 * single entry point application code uses for frontend diagnostics —
 * never a `DiagnosticsProvider` directly. It applies sanitization
 * (§9) and correlation context (§4/§7) before delegating, respects the
 * enabled/disabled configuration, and never lets a provider failure
 * propagate into product functionality (Blueprint §11: "observability
 * is additive, never load-bearing").
 */

import type { ObservabilityConfig } from "./config";
import { sanitize } from "./sanitize";
import type {
  Breadcrumb,
  DiagnosticContext,
  DiagnosticsProvider,
  ObservabilityUserContext,
} from "./types";

export type ObservabilityService = {
  captureException(error: unknown, context?: DiagnosticContext): void;
  captureMessage(message: string, context?: DiagnosticContext): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setContext(key: string, context: DiagnosticContext): void;
  clearContext(key: string): void;
  setUserContext(context: ObservabilityUserContext | undefined): void;
  flush(): Promise<void>;
  isEnabled(): boolean;
};

export type ObservabilityServiceDeps = {
  config: ObservabilityConfig;
  provider: DiagnosticsProvider;
  /** Returns the active workflow's correlation ID, if one exists (§4/§7). */
  getCorrelationId?: () => string | undefined;
};

export function createObservabilityService(deps: ObservabilityServiceDeps): ObservabilityService {
  const { config, provider } = deps;

  function withCorrelation(context: DiagnosticContext | undefined): DiagnosticContext | undefined {
    const correlationId = deps.getCorrelationId?.();
    if (!correlationId) return context;
    return { ...(context ?? {}), correlationId };
  }

  function sanitizedContext(context: DiagnosticContext | undefined): DiagnosticContext | undefined {
    const withCorrelationId = withCorrelation(context);
    if (withCorrelationId === undefined) return undefined;
    return sanitize(withCorrelationId) as DiagnosticContext;
  }

  function guarded(fn: () => void): void {
    if (!config.enabled) return;
    try {
      fn();
    } catch {
      // An observability failure must never propagate into product
      // functionality — see Blueprint §11.
    }
  }

  return {
    captureException(error, context) {
      guarded(() => provider.captureException(error, sanitizedContext(context)));
    },
    captureMessage(message, context) {
      guarded(() => provider.captureMessage(message, sanitizedContext(context)));
    },
    addBreadcrumb(breadcrumb) {
      guarded(() =>
        provider.addBreadcrumb({
          ...breadcrumb,
          data: breadcrumb.data ? (sanitize(breadcrumb.data) as DiagnosticContext) : undefined,
        }),
      );
    },
    setContext(key, context) {
      guarded(() => provider.setContext(key, sanitize(context) as DiagnosticContext));
    },
    clearContext(key) {
      guarded(() => provider.clearContext(key));
    },
    setUserContext(context) {
      guarded(() => provider.setUserContext(context));
    },
    async flush() {
      if (!config.enabled) return;
      try {
        await provider.flush();
      } catch {
        // Same additive-never-load-bearing rule applies to flush.
      }
    },
    isEnabled: () => config.enabled && provider.isEnabled(),
  };
}
