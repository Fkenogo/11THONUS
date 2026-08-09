/**
 * Client-side idempotency key for the AUTH-03 `authenticate` request (AUTH-04).
 *
 * The AUTH-03 backend uses the client key as a Firestore document id and fails
 * closed on anything that is not a single safe path segment
 * (`assertSafeIdempotencyKey`: `^[A-Za-z0-9._:-]+$`, ≤200 chars, not `.`/`..`).
 * AUTH-04 must therefore generate a key the backend provably accepts, and
 * **reuse the same key across retries of one sign-in attempt** so the backend's
 * request-level replay gate returns the original outcome rather than a divergent
 * one — consuming, never weakening, the corrected AUTH-03 idempotency guarantee.
 *
 * A CSPRNG-backed UUID (`crypto.randomUUID()`) is a single safe segment by
 * construction; this module never widens or reinterprets the backend contract.
 */

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const SAFE_IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]+$/;

/** Mirrors the AUTH-03 backend `assertSafeIdempotencyKey` predicate exactly. */
export function isSafeAuthenticationIdempotencyKey(key: string): boolean {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= MAX_IDEMPOTENCY_KEY_LENGTH &&
    key !== "." &&
    key !== ".." &&
    SAFE_IDEMPOTENCY_KEY.test(key)
  );
}

/**
 * A fresh idempotency key for one sign-in attempt. Hold the returned value and
 * pass the same key to every retry of that attempt (see `authenticateClient`).
 */
export function newAuthenticationIdempotencyKey(): string {
  return crypto.randomUUID();
}
