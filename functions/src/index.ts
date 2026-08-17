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
import {
  handleLinkProvider,
  handleUnlinkProvider,
  type LinkProviderRequest,
  type UnlinkProviderRequest,
} from "./domains/authentication/services/accountLinkingEndpointService";
import {
  handleRecoverIdentity,
  type RecoverIdentityRequest,
} from "./domains/authentication/services/identityRecoveryEndpointService";
import {
  emitAuthenticationRecoveryProofProvided,
  emitCustomerAuthenticated,
} from "./domains/authentication/services/authenticationEventEmitter";
import type { AuthenticationReferenceType } from "./domains/identity/models/authenticationReference";
import { BusinessDomainError } from "./domains/business/models/businessErrors";
import {
  handleCreateBusiness,
  type CreateBusinessCommand,
} from "./domains/business/services/businessBootstrapEndpointService";
import type { CreateBusinessRequest } from "./domains/business/models/businessBootstrap";

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
  if (error instanceof BusinessDomainError) {
    // Never echoes the domain message (which may name the exact idempotency
    // key or field) — a single stable client message per code, same posture
    // as the Authentication/Identity mapping above.
    return new HttpsError(
      CATEGORY_TO_HTTPS[error.category] ?? "internal",
      "business_creation_failed",
    );
  }
  return new HttpsError("internal", "authentication_failed");
}

// The closed callable-boundary allow-list of MVP `referenceType`s accepted at
// the `authenticate`/linking/recovery entrypoints (mirrors AUTH-02's verified-
// provider map and the frontend `AuthProviderId` registry). Per `AUTH-CORR-003`
// the MVP set is Google + Email/Password + optional Phone OTP; still-deferred
// providers are absent and rejected with `invalid-argument` before verification.
export const MVP_REFERENCE_TYPES: ReadonlySet<AuthenticationReferenceType> = new Set([
  "phone_otp",
  "google_sign_in",
  "email",
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
  const db = getFirestore(getAdminApp());
  try {
    const result = await handleAuthenticate(db, parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
    // AUTH-08 (composition boundary): a successful authentication emits the
    // fire-and-forget `CustomerAuthenticated` trust/audit signal through the
    // shared outbox — a durable, awaited write with a deterministic, retry-stable
    // event identity keyed on the request idempotency key. AUTH-03's orchestration
    // is left untouched (it emits no such signal); a rare emit failure propagates
    // as retryable while the idempotent authentication result replays unchanged.
    await emitCustomerAuthenticated(db, {
      customerIdentityId: result.customerIdentityId,
      referenceType: result.session.authReference.referenceType,
      idempotencyKey: parsed.idempotencyKey,
    });
    return result;
  } catch (error) {
    throw toHttpsError(error);
  }
});

function parseReferenceType(value: unknown): AuthenticationReferenceType {
  if (typeof value !== "string" || !MVP_REFERENCE_TYPES.has(value as AuthenticationReferenceType)) {
    throw new HttpsError("invalid-argument", "authentication_failed");
  }
  return value as AuthenticationReferenceType;
}

function parseRawToken(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("unauthenticated", "authentication_failed");
  }
  return value;
}

function parseNonEmptyString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", "authentication_failed");
  }
  return value;
}

function parseLinkProviderRequest(data: unknown): LinkProviderRequest {
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    actingRawToken: parseRawToken(value.actingRawToken),
    actingReferenceType: parseReferenceType(value.actingReferenceType),
    newRawToken: parseRawToken(value.newRawToken),
    newReferenceType: parseReferenceType(value.newReferenceType),
    idempotencyKey: parseNonEmptyString(value.idempotencyKey),
  };
}

function parseUnlinkProviderRequest(data: unknown): UnlinkProviderRequest {
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    actingRawToken: parseRawToken(value.actingRawToken),
    actingReferenceType: parseReferenceType(value.actingReferenceType),
    targetReferenceType: parseReferenceType(value.targetReferenceType),
    targetReferenceId: parseNonEmptyString(value.targetReferenceId),
    idempotencyKey: parseNonEmptyString(value.idempotencyKey),
  };
}

/**
 * `linkAuthenticationProvider` / `unlinkAuthenticationProvider` (AUTH-05) — the
 * account-linking integrations (AUTH-BP §7/§12). Each verifies the acting
 * provider credential (AUTH-02), resolves it to the caller's identity, and links
 * or unlinks an additional provider on that identity through the merged `-08`
 * (transactional, globally-unique, cross-identity-conflict-fail-closed,
 * last-reference-protected). Admin-SDK callables — no client Firestore write
 * path is opened. Never returns credential material.
 */
export const linkAuthenticationProvider = onCall(async (request) => {
  const parsed = parseLinkProviderRequest(request.data);
  try {
    return await handleLinkProvider(getFirestore(getAdminApp()), parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

export const unlinkAuthenticationProvider = onCall(async (request) => {
  const parsed = parseUnlinkProviderRequest(request.data);
  try {
    return await handleUnlinkProvider(getFirestore(getAdminApp()), parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

function parseRecoverIdentityRequest(data: unknown): RecoverIdentityRequest {
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    rawToken: parseRawToken(value.rawToken),
    referenceType: parseReferenceType(value.referenceType),
    idempotencyKey: parseNonEmptyString(value.idempotencyKey),
  };
}

/**
 * `recoverAuthenticatedIdentity` (AUTH-06) — the recovery credential-proof
 * integration (AUTH-BP §8/§12). Verifies the presented provider credential
 * (AUTH-02), resolves it to the OWNING identity, and — proving control of that
 * provider — restores the identity's access through the merged `-07`/`-06`
 * recovery boundary (transactional, proof-reuse-rejecting, recovery-eligible-state
 * enforced). The recovery target is derived from the proof, never client-supplied.
 * Admin-SDK callable — no client Firestore write path is opened. Never returns
 * credential material.
 */
export const recoverAuthenticatedIdentity = onCall(async (request) => {
  const parsed = parseRecoverIdentityRequest(request.data);
  const db = getFirestore(getAdminApp());
  try {
    const result = await handleRecoverIdentity(db, parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
    // AUTH-08 (composition boundary): a successful recovery proof emits the
    // fire-and-forget `AuthenticationRecoveryProofProvided` trust/audit signal
    // through the shared outbox (durable, awaited, deterministic identity). The
    // AUTH-06 orchestration and the `-06`/`-07` `IdentityRecovered` state-change
    // event it already owns are left untouched.
    await emitAuthenticationRecoveryProofProvided(db, {
      customerIdentityId: result.customerIdentityId,
      referenceType: parsed.referenceType,
      proofMethodCategory: result.methodCategory,
      idempotencyKey: parsed.idempotencyKey,
    });
    return result;
  } catch (error) {
    throw toHttpsError(error);
  }
});

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", "business_creation_failed", { field });
  }
  return value;
}

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", "business_creation_failed", { field });
  }
  return value;
}

function parseSupportedLanguages(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  ) {
    throw new HttpsError("invalid-argument", "business_creation_failed", {
      field: "supportedLanguages",
    });
  }
  return value;
}

/**
 * Whitelist parser (Phase F): only the exact `CreateBusinessRequest` fields
 * are read off `data` — any other key the client sends (`ownerUserId`,
 * `membershipId`, `role`, `businessCode`, `branchId`, or anything else) is
 * silently dropped here, never reaching `CreateBusinessRequest`. This is a
 * structural guarantee, not a denylist: an attacker cannot smuggle authority
 * through an unanticipated field name.
 */
function parseCreateBusinessCommand(data: unknown): CreateBusinessCommand {
  const value = (data ?? {}) as Record<string, unknown>;
  const business: CreateBusinessRequest = {
    legalName: parseOptionalString(value.legalName, "legalName"),
    displayName: parseRequiredString(value.displayName, "displayName"),
    primaryCategoryId: parseRequiredString(value.primaryCategoryId, "primaryCategoryId"),
    businessTypeId: parseOptionalString(value.businessTypeId, "businessTypeId"),
    countryCode: parseRequiredString(value.countryCode, "countryCode"),
    currencyCode: parseRequiredString(value.currencyCode, "currencyCode"),
    timezone: parseRequiredString(value.timezone, "timezone"),
    city: parseRequiredString(value.city, "city"),
    address: parseOptionalString(value.address, "address"),
    contactPhone: parseRequiredString(value.contactPhone, "contactPhone"),
    contactEmail: parseOptionalString(value.contactEmail, "contactEmail"),
    logoUrl: parseOptionalString(value.logoUrl, "logoUrl"),
    supportedLanguages: parseSupportedLanguages(value.supportedLanguages),
    subscriptionId: parseOptionalString(value.subscriptionId, "subscriptionId"),
  };

  return {
    ...business,
    rawToken: parseRawToken(value.rawToken),
    referenceType: parseReferenceType(value.referenceType),
    idempotencyKey: parseNonEmptyString(value.idempotencyKey),
  };
}

/**
 * `createBusiness` (ENG-P2-002B) — the sole Business bootstrap integration
 * (Phase E/I/V). Verifies the presented provider credential (AUTH-02),
 * resolves it to an existing, eligible Customer Identity (never registering
 * one), and atomically creates the Business + default Branch + initial Owner
 * membership + businessCode reservation + `BusinessCreated` outbox evidence
 * in one Firestore transaction. `ownerUserId` is derived exclusively from the
 * verified credential — never accepted from the request (Phase F). Admin-SDK
 * callable — no client Firestore write path is opened.
 */
export const createBusiness = onCall(async (request) => {
  const parsed = parseCreateBusinessCommand(request.data);
  const db = getFirestore(getAdminApp());
  try {
    return await handleCreateBusiness(db, parsed, {
      verifier: firebaseAdminTokenVerifier(),
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
