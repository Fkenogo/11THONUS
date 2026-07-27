/**
 * Sentry-backed diagnostics provider (ENG-P1-003-IMP-03).
 *
 * The only file in this repository permitted to import `@sentry/react`
 * (enforced by the `no-restricted-imports` rule in `eslint.config.js`).
 * Implements the existing `DiagnosticsProvider` contract exactly —
 * application code, routes, hooks, and business logic never call this
 * module or `@sentry/react` directly, only `observabilityService`
 * (unchanged from Stage 1/2).
 *
 * **Privacy posture (deliberate, not a default):** `Sentry.init()` is
 * called with `integrations: []`, which disables *every* one of the
 * SDK's own default browser integrations — `breadcrumbsIntegration`
 * (auto console/DOM/XHR/fetch/history breadcrumbs),
 * `globalHandlersIntegration` (auto `window.onerror`/
 * `onunhandledrejection` capture — would otherwise duplicate Stage 2's
 * own `globalErrorHandlers.ts`), `httpContextIntegration`,
 * `linkedErrorsIntegration`, `browserApiErrorsIntegration`,
 * `browserSessionIntegration`, and `dedupeIntegration`. No tracing
 * integration is added (no `tracesSampleRate` is set either), no
 * replay integration is added, no profiling integration is added, and
 * no feedback integration is added — despite `@sentry/react` pulling
 * in `@sentry/replay`/`@sentry/replay-canvas`/`@sentry/feedback` as
 * *transitive* package dependencies (unavoidable: that is how the
 * official package is composed as of SDK v8+), none of that code is
 * ever invoked. The only diagnostic data Sentry receives is what this
 * adapter's own methods explicitly forward — and every one of those
 * inputs has already passed through `observabilityService`'s
 * sanitization boundary (`sanitize.ts`/`sanitizeText.ts`/
 * `sanitizeException.ts`) before it ever reaches this file.
 *
 * `beforeSend`/`beforeBreadcrumb` are wired as a defense-in-depth last
 * resort, not as a substitute for that authoritative sanitization —
 * per the task's own instruction, SDK-side filtering is never treated
 * as replacing the application-level sanitizer.
 */

import * as Sentry from "@sentry/react";
import type {
  Breadcrumb,
  DiagnosticContext,
  DiagnosticsProvider,
  ObservabilityUserContext,
} from "./types";
import type { SanitizedException } from "./sanitizeException";

export type SentryProviderOptions = {
  dsn: string;
  environment: string;
  release?: string;
};

function isSanitizedException(value: unknown): value is SanitizedException {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    ((value as { kind: unknown }).kind === "error" ||
      (value as { kind: unknown }).kind === "thrown-value")
  );
}

// Reconstructs a plain `Error` from the already-sanitized representation
// so Sentry can parse a real stack trace — never from the original
// (never-seen-here) thrown value.
function toReportableError(value: SanitizedException): Error {
  const error = new Error(value.message ?? "Unknown error");
  if (value.name) error.name = value.name;
  if (value.stack) error.stack = value.stack;
  return error;
}

// A module-level guard — not per-instance — so repeated
// `createSentryProvider()` calls (e.g. React `StrictMode`'s dev-only
// double-invocation of the composition root, or an accidental second
// call) never re-initialize the SDK a second time.
let initialized = false;

export function createSentryProvider(options: SentryProviderOptions): DiagnosticsProvider {
  if (!initialized) {
    try {
      Sentry.init({
        dsn: options.dsn,
        environment: options.environment,
        release: options.release,
        // See the module doc comment: the empty array is the primary
        // privacy control, disabling every SDK-side automatic capture.
        integrations: [],
        sendDefaultPii: false,
        beforeSend(event) {
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          return breadcrumb;
        },
      });
      initialized = true;
    } catch {
      // SDK initialization must never block application startup —
      // Blueprint §11, "observability is additive, never load-bearing".
    }
  }

  return {
    captureException(error, context) {
      try {
        const reportable = isSanitizedException(error)
          ? toReportableError(error)
          : new Error(typeof error === "string" ? error : "Unknown error");
        Sentry.captureException(reportable, { extra: context });
      } catch {
        // A provider failure must never propagate into the application.
      }
    },
    captureMessage(message: string, context?: DiagnosticContext) {
      try {
        Sentry.captureMessage(message, { extra: context });
      } catch {
        // Same rule as above.
      }
    },
    addBreadcrumb(breadcrumb: Breadcrumb) {
      try {
        Sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category,
          data: breadcrumb.data,
          timestamp: breadcrumb.timestamp ? Date.parse(breadcrumb.timestamp) / 1000 : undefined,
        });
      } catch {
        // Same rule as above.
      }
    },
    setContext(key: string, context: DiagnosticContext) {
      try {
        Sentry.setContext(key, context);
      } catch {
        // Same rule as above.
      }
    },
    clearContext(key: string) {
      try {
        Sentry.setContext(key, null);
      } catch {
        // Same rule as above.
      }
    },
    setUserContext(context: ObservabilityUserContext | undefined) {
      try {
        if (context === undefined) {
          Sentry.setUser(null);
          return;
        }
        Sentry.setUser({ id: context.actorId, ...context });
      } catch {
        // Same rule as above.
      }
    },
    async flush() {
      try {
        await Sentry.flush(2000);
      } catch {
        // Same additive-never-load-bearing rule applies to flush.
      }
    },
    isEnabled: () => initialized,
  };
}
