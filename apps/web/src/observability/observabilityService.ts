/**
 * Application-facing observability service (ENG-P1-003-IMP-01, corrected
 * under ENG-P1-003-IMP-01-CR1).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §6.2: the
 * single entry point application code uses for frontend diagnostics —
 * never a `DiagnosticsProvider` directly. It applies sanitization
 * (§9) and correlation context (§4/§7) before delegating, respects the
 * enabled/disabled configuration, and never lets a provider failure
 * propagate into product functionality (Blueprint §11: "observability
 * is additive, never load-bearing").
 *
 * **Provider-boundary invariant (CR1):** no uncontrolled application
 * diagnostic value crosses into a provider without sanitization or an
 * explicit approved allow-list rule. This applies to every channel —
 * exception capture, diagnostic messages, breadcrumb messages,
 * breadcrumb categories, breadcrumb structured data, named structured
 * contexts, user/business/customer context, and correlation metadata —
 * not only the structured `context` argument, which is the gap CR1
 * corrected (the original Stage 1 implementation sanitized `context`
 * but passed the raw exception, the raw message string, and the raw
 * breadcrumb message/category straight through).
 *
 * Correlation metadata is the one channel deliberately passed through
 * unsanitized by design, not by oversight: `correlationId` is a
 * system-generated (`crypto.randomUUID()`) or backend-issued
 * identifier, never user-authored free text, so it is treated as an
 * approved identifier rather than arbitrary content requiring
 * redaction — the same category `actorId`/`businessId`/`customerId`
 * already fall into.
 */

import type { ObservabilityConfig } from "./config";
import { sanitize, sanitizeText } from "./sanitize";
import { sanitizeException } from "./sanitizeException";
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

// The three fields the blueprint (§4, "Business / user") and the
// ObservabilityUserContext type itself approve — nothing else may ever
// reach a provider through setUserContext, regardless of what a caller
// passes at runtime (TypeScript's structural typing does not strip
// excess properties from a variable at the call site, only from an
// object literal — so this is a genuine runtime allow-list, not a
// compile-time-only guarantee).
const APPROVED_USER_CONTEXT_FIELDS = ["actorId", "businessId", "customerId"] as const;

function allowListUserContext(
  context: ObservabilityUserContext | undefined,
): ObservabilityUserContext | undefined {
  if (context === undefined) return undefined;
  const allowed: ObservabilityUserContext = {};
  for (const field of APPROVED_USER_CONTEXT_FIELDS) {
    const value = (context as Record<string, unknown>)[field];
    if (typeof value === "string") {
      allowed[field] = value;
    }
  }
  return allowed;
}

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

  // "Requested enabled" (config.enabled) and "effectively active" are
  // deliberately distinct concepts (CR1 finding): a real provider may
  // not yet be ready even when diagnostics are requested, and the
  // no-op provider (this stage's only provider) is never ready by
  // design (`isEnabled()` always returns `false`). `isActive()` is the
  // single source of truth both `isEnabled()` and the internal gate
  // use, so they can never disagree the way the original
  // implementation's `guarded()` (gated on `config.enabled` alone) and
  // `isEnabled()` (checked both) did.
  function isActive(): boolean {
    return config.enabled && provider.isEnabled();
  }

  function guarded(fn: () => void): void {
    if (!isActive()) return;
    try {
      fn();
    } catch {
      // An observability failure must never propagate into product
      // functionality — see Blueprint §11.
    }
  }

  return {
    captureException(error, context) {
      guarded(() => provider.captureException(sanitizeException(error), sanitizedContext(context)));
    },
    captureMessage(message, context) {
      guarded(() => provider.captureMessage(sanitizeText(message)!, sanitizedContext(context)));
    },
    addBreadcrumb(breadcrumb) {
      guarded(() =>
        provider.addBreadcrumb({
          message: sanitizeText(breadcrumb.message)!,
          category:
            breadcrumb.category !== undefined ? sanitizeText(breadcrumb.category) : undefined,
          timestamp: breadcrumb.timestamp,
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
      guarded(() => provider.setUserContext(allowListUserContext(context)));
    },
    async flush() {
      if (!isActive()) return;
      try {
        await provider.flush();
      } catch {
        // Same additive-never-load-bearing rule applies to flush.
      }
    },
    isEnabled: () => isActive(),
  };
}
