/**
 * Deterministic provider selection (ENG-P1-003-IMP-03).
 *
 * The single decision point between the no-op provider (always safe,
 * always available) and the Sentry adapter. Kept as its own pure
 * function — separate from `index.ts`'s `getObservability()` singleton
 * — specifically so activation logic is unit-testable without touching
 * `import.meta.env` (mirrors why `config.ts`/`observabilityService.ts`
 * are themselves pure functions over explicit inputs).
 *
 * Activation requires all three: diagnostics requested enabled,
 * provider explicitly set to `"sentry"`, and a non-empty DSN. Missing
 * any one of these silently and safely falls back to the no-op
 * provider — never a thrown error, never a degraded-but-active Sentry
 * instance. A construction-time failure inside `createSentryProvider`
 * itself (defensive — that function does not currently throw, but this
 * is the last line of defense) falls back the same way.
 */

import type { ObservabilityConfig } from "./config";
import { createNoopProvider } from "./noopProvider";
import { createSentryProvider } from "./sentryProvider";
import type { DiagnosticsProvider } from "./types";

export function selectProvider(config: ObservabilityConfig): DiagnosticsProvider {
  if (!config.enabled || config.provider !== "sentry" || !config.dsn) {
    return createNoopProvider();
  }

  try {
    return createSentryProvider({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
    });
  } catch {
    return createNoopProvider();
  }
}
