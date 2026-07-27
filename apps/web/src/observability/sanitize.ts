/**
 * Diagnostic sanitization boundary (ENG-P1-003-IMP-01, corrected under
 * ENG-P1-003-IMP-01-CR1).
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
 *
 * Two distinct redaction strategies live here, deliberately kept
 * separate (CR1 finding): `sanitize()` performs **key-based structured
 * redaction** (a whole value is dropped because its own key name is
 * sensitive) plus **whole-value pattern redaction** (a string is
 * dropped because the entire value matches a sensitive shape) over a
 * structured object/array. `sanitizeText()` performs **substring
 * value-pattern redaction** over free text — a message, a stack trace,
 * a breadcrumb string — where a sensitive-shaped value may be embedded
 * inside a larger sentence rather than being the whole value. Neither
 * function can perfectly classify arbitrary prose; both are
 * deliberately conservative (favour redacting a false positive over
 * missing a real secret), matching the precedent `logger.ts`'s own
 * guard already set on the backend.
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
  // Added under ENG-P1-003-IMP-03: the Sentry adapter's explicit privacy
  // list names loyalty numbers, QR values, and customer names as data
  // that must never reach a provider. `customername` deliberately does
  // not extend to a bare "name" substring — that would over-redact
  // legitimate non-personal identifiers like `businessName`.
  "loyalty",
  "qrcode",
  "customername",
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

// Substring-oriented (global-flag) — scans free text for an embedded
// sensitive-shaped run rather than requiring the whole string to match,
// unlike `SENSITIVE_VALUE_PATTERNS` above. Order matters: the JWT
// pattern is checked before the generic long-token pattern so a JWT is
// redacted as one unit rather than three overlapping fragments.
const TEXT_SCAN_PATTERNS: ReadonlyArray<{ pattern: RegExp; replace: (match: string) => string }> = [
  {
    pattern: /[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replace: () => REDACTED,
  },
  {
    pattern: /\b(authorization|bearer)\s*[:=]?\s*\S+/gi,
    replace: (match) => `${match.split(/\s*[:=\s]/)[0]}: ${REDACTED}`,
  },
  {
    pattern: /\bcookie\s*[:=]\s*[^;\n]+/gi,
    replace: () => `cookie: ${REDACTED}`,
  },
  {
    // Payment-card-like: 13-19 digits, optionally space/dash-separated.
    pattern: /\b\d(?:[\d -]{11,23}\d)\b/g,
    replace: () => REDACTED,
  },
  {
    // ENG-P1-003-IMP-04: standard email-address shape embedded in free
    // text (e.g. customer-entered text reaching an exception message or
    // breadcrumb) — Stage 4 validation found this was previously
    // protected only when a caller used a structured, email-keyed field
    // (via `sanitize()`'s key-substring check), not when the same value
    // appeared in prose.
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replace: () => REDACTED,
  },
  {
    // ENG-P1-003-IMP-04: phone-number-shaped run embedded in free text —
    // 7+ digits total, optionally grouped with spaces, dashes, dots,
    // parentheses, or a leading '+'. Broader than the payment-card
    // pattern above (13-19 digits only), so shorter local phone formats
    // are also caught. Deliberately conservative, matching this module's
    // existing redact-first philosophy: a version string or similar
    // digit-and-separator run may be redacted as a false positive rather
    // than risk missing a real phone number.
    pattern: /\+?\(?\d[\d\s.\-()]{5,}\d\b/g,
    replace: () => REDACTED,
  },
  {
    // Long token/API-key-shaped run (checked last so an already-redacted
    // marker, shorter than 20 characters, is never re-matched).
    pattern: /\b[A-Za-z0-9+/=_-]{20,}\b/g,
    replace: () => REDACTED,
  },
];

/**
 * Redacts sensitive-shaped substrings embedded within free text (an
 * error message, a stack trace, a breadcrumb string) — see the module
 * doc comment for how this differs from `sanitize()`.
 *
 * Known, disclosed limitation: the long-token pattern can false-positive
 * on non-secret content that happens to be a long alphanumeric run —
 * for example a build-hash chunk filename inside a stack trace. This is
 * an accepted tradeoff (redact-first), not a defect to silently work
 * around by narrowing the pattern, which would risk under-redacting a
 * real secret of the same shape.
 */
export function sanitizeText(text: string | undefined): string | undefined {
  if (text === undefined) return undefined;
  let result = text;
  for (const { pattern, replace } of TEXT_SCAN_PATTERNS) {
    result = result.replace(pattern, replace);
  }
  return result;
}
