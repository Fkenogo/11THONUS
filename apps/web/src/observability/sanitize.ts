/**
 * Diagnostic sanitization boundary (ENG-P1-003-IMP-01).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §9: a closed
 * list of values that must never reach a diagnostics provider —
 * passwords, tokens, authorization headers, cookies, session secrets,
 * API keys, payment-card data, and personal data beyond the approved
 * opaque identifiers (`actorId`/`businessId`/`customerId`). Applied
 * before any provider call, on both the value's own shape and its
 * key's name, recursively and boundedly.
 *
 * This is not a general-purpose data-loss-prevention engine — it is
 * scoped exactly to this closed list, per the ENG-P1-003-IMP-01 task's
 * own instruction not to overbuild it.
 */

export const REDACTED = "[REDACTED]";

const MAX_DEPTH = 12;

// Substring match against a lowercased, non-alphanumeric-stripped key —
// deliberately broad (favours over-redaction over under-redaction), per
// the same conservative precedent the backend logger's own guard sets.
const SENSITIVE_KEY_SUBSTRINGS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "session",
  "apikey",
  "secret",
  "cardnumber",
  "cvv",
  "cvc",
  "email",
  "phone",
  "address",
  "firstname",
  "lastname",
  "fullname",
  "dateofbirth",
  "nationalid",
  "ssn",
] as const;

// Mirrors functions/src/shared/logging/logger.ts's own conservative
// value-shape guard (independently implemented — this module cannot
// import from the `functions/` workspace package).
const SENSITIVE_VALUE_PATTERNS: readonly RegExp[] = [
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT-shaped
  /^[A-Za-z0-9+/=_-]{20,}$/, // long token/credential-shaped
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_SUBSTRINGS.some((pattern) => normalized.includes(pattern));
}

function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitize(value: unknown): unknown {
  return sanitizeInternal(value, 0, new WeakSet());
}

function sanitizeInternal(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== "object") {
    return isSensitiveValue(value) ? REDACTED : value;
  }

  if (depth >= MAX_DEPTH || seen.has(value as object)) {
    return REDACTED;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInternal(item, depth + 1, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = sanitizeInternal(entryValue, depth + 1, seen);
  }
  return result;
}
