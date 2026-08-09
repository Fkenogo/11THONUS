/**
 * Cloud Functions entry point.
 *
 * No product-domain Cloud Functions exist yet — domain functions are
 * introduced starting Phase 2 (ENG-P2-xxx), per each domain's ownership
 * rules in the Repository and Folder Standard. This file wires the shared
 * platform foundation (ENG-P1-001): global function options (region), the
 * Admin SDK singleton every future domain service reuses, and `ping`,
 * which exists only to prove the Cloud Functions workspace builds, lints,
 * typechecks and deploys through the emulator — it carries no business
 * logic.
 */

import { setGlobalOptions } from "firebase-functions";
import { HttpsError, onCall, onRequest } from "firebase-functions/https";
import { getFirestore } from "firebase-admin/firestore";
import { PLATFORM_REGION } from "./config/region";
import { getAdminApp } from "./infrastructure/firebase/admin";
import type { ErrorCategory } from "./shared/errors/errorCategories";
import { AuthenticationDomainError } from "./domains/authentication/models/authenticationErrors";
import { IdentityDomainError } from "./domains/identity/models/identityErrors";
import { firebaseAdminTokenVerifier } from "./domains/authentication/services/firebaseTokenVerifier";
import {
  handleAuthenticate,
  type AuthenticateRequest,
} from "./domains/authentication/services/authenticationEndpointService";
import type { AuthenticationReferenceType } from "./domains/identity/models/authenticationReference";

setGlobalOptions({ region: PLATFORM_REGION, maxInstances: 10 });

// Initializes the shared Admin SDK app once, at module load, so every
// domain service added in later work packages can call `getAdminApp()`
// and reuse the same instance rather than re-initializing.
getAdminApp();

export const ping = onRequest((_request, response) => {
  response.status(200).json({ status: "ok" });
});

/**
 * Maps the closed 14-category domain taxonomy onto Callable transport codes.
 * Deliberately does **not** echo the domain error message (enumeration
 * resistance, AUTH-BP §11) — a single stable client message per code.
 */
const CATEGORY_TO_HTTPS: Readonly<
  Record<
    ErrorCategory,
    | "unauthenticated"
    | "permission-denied"
    | "not-found"
    | "invalid-argument"
    | "aborted"
    | "unavailable"
    | "internal"
  >
> = {
  AUTH_REQUIRED: "unauthenticated",
  AUTH_FORBIDDEN: "permission-denied",
  ACCOUNT_SUSPENDED: "permission-denied",
  BUSINESS_INACTIVE: "permission-denied",
  SUBSCRIPTION_LIMIT_REACHED: "permission-denied",
  INVALID_STATE_TRANSITION: "aborted",
  PURCHASE_ALREADY_RESPONDED: "aborted",
  REWARD_NOT_AVAILABLE: "not-found",
  REWARD_ALREADY_REDEEMED: "aborted",
  IDEMPOTENCY_CONFLICT: "aborted",
  VALIDATION_FAILED: "invalid-argument",
  RESOURCE_NOT_FOUND: "not-found",
  TEMPORARY_UNAVAILABLE: "unavailable",
  INTEGRATION_FAILED: "internal",
};

function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }
  if (error instanceof AuthenticationDomainError || error instanceof IdentityDomainError) {
    return new HttpsError(CATEGORY_TO_HTTPS[error.category] ?? "internal", "authentication_failed");
  }
  return new HttpsError("internal", "authentication_failed");
}

const MVP_REFERENCE_TYPES: ReadonlySet<AuthenticationReferenceType> = new Set([
  "phone_otp",
  "google_sign_in",
]);

function parseAuthenticateRequest(data: unknown): AuthenticateRequest {
  const value = (data ?? {}) as Record<string, unknown>;
  const { rawToken, referenceType, idempotencyKey } = value;
  if (typeof rawToken !== "string" || rawToken.trim().length === 0) {
    throw new HttpsError("unauthenticated", "authentication_failed");
  }
  if (
    typeof referenceType !== "string" ||
    !MVP_REFERENCE_TYPES.has(referenceType as AuthenticationReferenceType)
  ) {
    throw new HttpsError("invalid-argument", "authentication_failed");
  }
  if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
    throw new HttpsError("invalid-argument", "authentication_failed");
  }
  return {
    rawToken,
    referenceType: referenceType as AuthenticationReferenceType,
    idempotencyKey,
  };
}

/**
 * `authenticate` (AUTH-03) — the sole backend registration/sign-in integration
 * (AUTH-BP §12). Verifies the presented provider credential (AUTH-02) and runs
 * the AUTH-03 orchestration; returns the resolved identity + issued session,
 * never any credential material. Client App Check enforcement and the frontend
 * provider flows are AUTH-04; token verification here already fails closed on
 * an invalid/absent/unsupported credential.
 */
export const authenticate = onCall(async (request) => {
  const parsed = parseAuthenticateRequest(request.data);
  try {
    return await handleAuthenticate(getFirestore(getAdminApp()), parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
