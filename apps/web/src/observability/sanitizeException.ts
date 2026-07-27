/**
 * Exception sanitization (ENG-P1-003-IMP-01-CR1).
 *
 * Correction: `captureException` previously passed the raw thrown value
 * straight to the provider — only the caller-supplied `context` was
 * sanitized. `sanitizeException()` builds a plain, provider-neutral
 * representation instead: `name`/`message`/`stack` go through
 * `sanitizeText()` (free-text substring redaction), custom own
 * properties go through `sanitize()` (structured key/value redaction),
 * and a `cause` chain is walked to a bounded depth. Nothing is blindly
 * stringified — the structure survives; only free text and flagged
 * values are redacted, per the ENG-P1-003-IMP-01-CR1 task's own
 * instruction not to destroy debugging value.
 *
 * The returned shape is intentionally plain (no provider-specific
 * type) — a future Sentry adapter receives this object as its
 * `captureException` `error` argument, not the original thrown value.
 */

import { sanitize, sanitizeText } from "./sanitize";
import type { DiagnosticContext } from "./types";

export type SanitizedException = {
  kind: "error" | "thrown-value";
  name?: string;
  message?: string;
  stack?: string;
  properties?: DiagnosticContext;
  cause?: SanitizedException;
};

const MAX_CAUSE_DEPTH = 3;

const EXCLUDED_OWN_PROPERTIES = new Set(["name", "message", "stack", "cause"]);

export function sanitizeException(error: unknown, depth = 0): SanitizedException {
  if (error instanceof Error) {
    const own = Object.getOwnPropertyNames(error);
    const rest: Record<string, unknown> = {};
    for (const key of own) {
      if (EXCLUDED_OWN_PROPERTIES.has(key)) continue;
      rest[key] = (error as unknown as Record<string, unknown>)[key];
    }

    const cause = (error as Error & { cause?: unknown }).cause;

    return {
      kind: "error",
      name: sanitizeText(error.name),
      message: sanitizeText(error.message),
      stack: sanitizeText(error.stack),
      properties: Object.keys(rest).length > 0 ? (sanitize(rest) as DiagnosticContext) : undefined,
      cause:
        cause !== undefined && depth < MAX_CAUSE_DEPTH
          ? sanitizeException(cause, depth + 1)
          : undefined,
    };
  }

  return {
    kind: "thrown-value",
    properties: { value: sanitize(error) } as DiagnosticContext,
  };
}
