/**
 * AUTH-04 client for the AUTH-03 `authenticate` callable.
 *
 * Turns a *verified* provider sign-in (a Firebase user + its provider
 * `referenceType`) into an authenticated outcome by calling the backend
 * orchestration — it adds no identity behaviour of its own. It:
 *
 *  - reads the raw ID token from the signed-in user, passes it once, and never
 *    stores, logs, or returns it (TRD10 §10.6.1);
 *  - generates **one** backend-safe idempotency key per attempt and **reuses it
 *    across a transient retry**, so the corrected AUTH-03 request-level replay
 *    gate returns the original outcome instead of a divergent one — consuming,
 *    never weakening, that guarantee;
 *  - maps callable transport codes onto a small, enumeration-resistant set of
 *    client codes, never surfacing server messages.
 */

import type { AuthProviderId } from "./providerConfig";
import { newAuthenticationIdempotencyKey } from "./idempotencyKey";

export type AuthenticateOutcome = {
  mode: "registered" | "signed_in";
  customerIdentityId: string;
  session: {
    customerIdentityId: string;
    authReference: { referenceType: AuthProviderId; referenceId: string };
    issuedAt: string;
  };
};

/** The wire payload the AUTH-03 `authenticate` callable expects. */
export type AuthenticatePayload = {
  rawToken: string;
  referenceType: AuthProviderId;
  idempotencyKey: string;
};

/** Stable, enumeration-resistant client-facing error codes. */
export type AuthenticateErrorCode =
  | "auth_required"
  | "auth_forbidden"
  | "not_found"
  | "validation_failed"
  | "conflict"
  | "unavailable"
  | "timeout"
  | "failed";

/**
 * Transient/ambiguous outcomes safe to retry with the *same* idempotency key.
 * `timeout` (deadline-exceeded) is retryable precisely because the backend may
 * have already committed before the response was lost — replaying the same key
 * reproduces that outcome instead of forking a new one (AUTH-03 replay gate).
 */
const RETRYABLE_CODES: ReadonlySet<AuthenticateErrorCode> = new Set(["unavailable", "timeout"]);

export class AuthenticateError extends Error {
  readonly code: AuthenticateErrorCode;

  constructor(code: AuthenticateErrorCode) {
    super(code);
    this.name = "AuthenticateError";
    this.code = code;
  }
}

/** Transport seam — the real adapter wraps `httpsCallable` and throws `AuthenticateError`. */
export type CallAuthenticate = (payload: AuthenticatePayload) => Promise<AuthenticateOutcome>;

export type AuthenticateInput = {
  /** The signed-in Firebase user (its raw ID token is read once and discarded). */
  getIdToken: () => Promise<string>;
  referenceType: AuthProviderId;
};

export type AuthenticateDeps = {
  callAuthenticate: CallAuthenticate;
  /** Idempotency-key seam (CSPRNG-backed by default). */
  newIdempotencyKey?: () => string;
  /** Bounded total attempts (default 2 — one transient retry). */
  maxAttempts?: number;
};

/**
 * Maps the AUTH-03 callable transport codes (`index.ts` `CATEGORY_TO_HTTPS`)
 * onto client codes. `permission-denied` covers both forbidden and suspended by
 * design (the backend does not distinguish them at the boundary), and everything
 * unknown collapses to a single opaque `failed` — no message is ever echoed.
 */
export function mapCallableErrorCode(code: string | undefined): AuthenticateErrorCode {
  switch (code) {
    case "functions/unauthenticated":
      return "auth_required";
    case "functions/permission-denied":
      return "auth_forbidden";
    case "functions/not-found":
      return "not_found";
    case "functions/invalid-argument":
      return "validation_failed";
    case "functions/aborted":
      return "conflict";
    case "functions/unavailable":
      return "unavailable";
    case "functions/deadline-exceeded":
      return "timeout";
    default:
      return "failed";
  }
}

export async function authenticate(
  input: AuthenticateInput,
  deps: AuthenticateDeps,
): Promise<AuthenticateOutcome> {
  const newKey = deps.newIdempotencyKey ?? newAuthenticationIdempotencyKey;
  const maxAttempts = deps.maxAttempts ?? 2;

  // One key for the whole attempt: reused on every retry so a partially-applied
  // first call replays to the same outcome rather than creating a new one.
  const idempotencyKey = newKey();
  const rawToken = await input.getIdToken();
  const payload: AuthenticatePayload = {
    rawToken,
    referenceType: input.referenceType,
    idempotencyKey,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await deps.callAuthenticate(payload);
    } catch (error) {
      lastError = error;
      // Only transient/ambiguous transport failures are retried (same key); a
      // definitive answer (forbidden, not-found, conflict, validation) is
      // surfaced immediately.
      if (!(error instanceof AuthenticateError) || !RETRYABLE_CODES.has(error.code)) {
        throw error;
      }
    }
  }
  throw lastError;
}
