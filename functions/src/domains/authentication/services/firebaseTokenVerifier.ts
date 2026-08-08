/**
 * Firebase Admin ID-token verification adapter (AUTH-02, per AUTH-BP §3).
 *
 * The Firebase-Admin implementation of the pure `TokenVerifierPort` (AUTH-01):
 * it turns a raw provider credential (a Firebase ID token) into the
 * provider-neutral `AuthenticatedCredential` the rest of Authentication
 * consumes. Per AUTH-BP §3 the credential's `referenceId` is the **Firebase
 * authUid** (`decoded.uid`) — the single stable per-user reference the merged
 * Customer Identity `authenticationReferences/{type}:{id}` collection is keyed
 * against.
 *
 * Firebase-adapter (services) sub-layer — a Firebase SDK import is permitted
 * here (ESLint boundary exempts `authentication/services/**`, mirroring
 * identity's `repositories/**`). The pure `models/`+`ports/` layers stay
 * Firebase-free.
 *
 * Security/privacy (TRD10 §10.6.1): the raw ID token is consumed for
 * verification and **never** retained — `AuthenticatedCredential` carries only
 * a reference and a single non-sensitive provider signal, no token / OTP /
 * phone / email. Failures map onto the closed 14-category taxonomy (TRD11
 * §11.35) as `AuthenticationDomainError`; the raw Firebase error (which can
 * carry token fragments) never escapes this adapter.
 */

import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminApp } from "../../../infrastructure/firebase/admin";
import type { RawProviderCredential, TokenVerifierPort } from "../ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import {
  createAuthenticatedCredential,
  type AuthenticatedCredential,
} from "../models/authenticatedCredential";
import {
  AuthenticationDomainError,
  authenticationForbiddenError,
  authenticationProviderIntegrationError,
  authenticationProviderUnavailableError,
  authenticationRequiredError,
} from "../models/authenticationErrors";

const PROVIDER = "firebase";

/**
 * Closed mapping of a **verified** Firebase `sign_in_provider` to the governed
 * Authentication reference type. The verified provider in the decoded token —
 * never the client-declared `RawProviderCredential.referenceType` — is
 * authoritative for provider provenance (P1 correction). Only the MVP providers
 * are supported (`DEC-AUTH-001` D-A2: Phone OTP + Google); every other verified
 * provider has no entry and fails closed. Email/Apple/passkeys are Deferred, so
 * their Firebase providers are deliberately absent here — additions are a
 * governed provider-registry change, not a silent default.
 */
const VERIFIED_PROVIDER_TO_REFERENCE_TYPE: Readonly<Record<string, AuthenticationReferenceType>> = {
  phone: "phone_otp",
  "google.com": "google_sign_in",
};

/**
 * The single Firebase dependency this adapter needs — the Admin SDK's
 * `verifyIdToken`. Injected so unit tests exercise the adapter's mapping logic
 * at this seam with a test double (no live Firebase; `DEC-AUTH-001` D-A4).
 */
export type FirebaseVerifyIdToken = (
  idToken: string,
  checkRevoked?: boolean,
) => Promise<DecodedIdToken>;

export type FirebaseTokenVerifierOptions = {
  /** Clock seam — the instant stamped on the verified credential. */
  now?: () => Date;
};

/** Firebase auth error codes for which the caller must re-authenticate. */
const AUTH_REQUIRED_CODES = new Set([
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/argument-error",
  "auth/user-not-found",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
]);

/** The Firebase user exists but access is withdrawn. */
const FORBIDDEN_CODES = new Set(["auth/user-disabled"]);

/**
 * Transient / retryable conditions — provider temporarily unavailable. The
 * Firebase Admin SDK surfaces network failures as App-level `app/network-*`
 * codes (P2 correction); the raw socket codes are retained only as a fallback.
 */
const TEMPORARY_CODES = new Set([
  "app/network-error",
  "app/network-timeout",
  "auth/internal-error",
  "auth/network-error",
  "auth/network-timeout",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function mapVerificationFailure(error: unknown): AuthenticationDomainError {
  // A domain error thrown by `createAuthenticatedCredential` (e.g. a malformed
  // decoded token) is already on the taxonomy — surface it unchanged.
  if (error instanceof AuthenticationDomainError) {
    return error;
  }

  const code = errorCode(error);
  if (code !== undefined) {
    if (AUTH_REQUIRED_CODES.has(code)) {
      return authenticationRequiredError();
    }
    if (FORBIDDEN_CODES.has(code)) {
      return authenticationForbiddenError();
    }
    if (TEMPORARY_CODES.has(code)) {
      return authenticationProviderUnavailableError(PROVIDER);
    }
  }
  // Anything else is an unexpected provider integration failure.
  return authenticationProviderIntegrationError(PROVIDER);
}

/**
 * Construct a `TokenVerifierPort` backed by an injected Firebase
 * `verifyIdToken`. Prefer {@link firebaseAdminTokenVerifier} in production
 * wiring; this factory exists so the mapping logic is unit-testable.
 */
export function createFirebaseAdminTokenVerifier(
  verifyIdToken: FirebaseVerifyIdToken,
  options: FirebaseTokenVerifierOptions = {},
): TokenVerifierPort {
  const now = options.now ?? (() => new Date());

  return {
    async verify(raw: RawProviderCredential): Promise<AuthenticatedCredential> {
      if (typeof raw.rawToken !== "string" || raw.rawToken.trim().length === 0) {
        // No credential presented — authentication is required. Fail before
        // reaching Firebase.
        throw authenticationRequiredError();
      }

      let decoded: DecodedIdToken;
      try {
        decoded = await verifyIdToken(raw.rawToken, true);
      } catch (error) {
        throw mapVerificationFailure(error);
      }

      // Provider provenance is bound to the *verified* token, not the client-
      // declared type (P1). Derive the governed reference type from the
      // verified `sign_in_provider`; an unsupported provider, or a declared
      // type the verified token does not prove, fails closed (AUTH_FORBIDDEN) —
      // never trusting the caller's label.
      const verifiedProvider = decoded.firebase?.sign_in_provider;
      const derivedReferenceType =
        typeof verifiedProvider === "string"
          ? VERIFIED_PROVIDER_TO_REFERENCE_TYPE[verifiedProvider]
          : undefined;
      if (derivedReferenceType === undefined || raw.referenceType !== derivedReferenceType) {
        throw authenticationForbiddenError();
      }

      try {
        return createAuthenticatedCredential({
          referenceType: derivedReferenceType,
          referenceId: decoded.uid,
          verifiedAt: now(),
          providerSignals: {
            signInProvider: verifiedProvider,
          },
        });
      } catch (error) {
        throw mapVerificationFailure(error);
      }
    },
  };
}

/**
 * Production wiring: verify against the shared Admin app's Auth service.
 * Firebase Auth remains the token authority (TRD10 §10.6.1); no bespoke
 * token store.
 */
export function firebaseAdminTokenVerifier(
  options: FirebaseTokenVerifierOptions = {},
): TokenVerifierPort {
  const auth = getAuth(getAdminApp());
  return createFirebaseAdminTokenVerifier(
    (idToken, checkRevoked) => auth.verifyIdToken(idToken, checkRevoked),
    options,
  );
}
