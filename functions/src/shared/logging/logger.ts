/**
 * Shared logger (ENG-P1-002).
 *
 * The single supported way to write an `OperationalLog` entry (Logging
 * Conventions §3) — no domain hand-builds this object or calls
 * `console.log`/`console.error` directly. Transport is Cloud Functions'
 * own structured-logging writer (`firebase-functions/logger`), the
 * natural fit for this stack and already a project dependency — the
 * transport choice itself is this work package's own to make, per
 * Logging Conventions §3.
 *
 * Enforces Logging Conventions §6 ("never logged, at any severity") for
 * the two free-text fields the closed `OperationalLog` shape actually
 * has (`result`, `errorCode`): a value shaped like a JWT, a long
 * token/credential, or a numeric OTP is refused rather than written.
 * `OperationalLog` has no other field where arbitrary free text — and so
 * accidental secret content — could enter; every other field is a
 * specific identifier, not a place a caller would paste raw secret data.
 */

import { write } from "firebase-functions/logger";
import type { LogSeverity as CloudLogSeverity } from "firebase-functions/logger";
import type { LogSeverity, OperationalLog } from "./operationalLog";

const SEVERITY_MAP: Record<LogSeverity, CloudLogSeverity> = {
  debug: "DEBUG",
  info: "INFO",
  warning: "WARNING",
  error: "ERROR",
  critical: "CRITICAL",
};

const SENSITIVE_VALUE_PATTERNS: readonly RegExp[] = [
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT-shaped
  /^[A-Za-z0-9+/=_-]{20,}$/, // long token/credential-shaped
  /^\d{6}$/, // OTP-shaped
];

// Pure-letters-and-underscores identifiers — SCREAMING_SNAKE_CASE
// ErrorCategory values (e.g. "IDEMPOTENCY_CONFLICT") and this module's own
// lower_snake_case result labels (e.g. "idempotency_conflict") alike — are
// exempt from the "long token" pattern above, which would otherwise
// false-positive on them purely by length. A real secret essentially never
// takes the exact shape of a clean, underscore-separated word sequence
// with no digits and no base64 punctuation.
const IDENTIFIER_LIKE_PATTERN = /^[A-Za-z]+(?:_[A-Za-z]+)*$/;

const FREE_TEXT_FIELDS = ["result", "errorCode"] as const;

export function assertNoSensitiveContent(entry: OperationalLog): void {
  for (const field of FREE_TEXT_FIELDS) {
    const value = entry[field];
    if (typeof value !== "string" || IDENTIFIER_LIKE_PATTERN.test(value)) {
      continue;
    }
    if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error(
        `Refusing to log field "${field}": value matches a disallowed sensitive-content shape`,
      );
    }
  }
}

export function log(entry: OperationalLog): void {
  assertNoSensitiveContent(entry);

  const { severity, ...rest } = entry;
  write({ severity: SEVERITY_MAP[severity], ...rest });
}
