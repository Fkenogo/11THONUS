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

import { randomUUID } from "node:crypto";
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
import {
  resolveAuthenticatedBusinessActor,
  type ResolveAuthenticatedBusinessActorParams,
} from "./domains/business/services/authenticatedBusinessActor";
import {
  updateBusinessProfileCommand,
  type BusinessProfilePatch,
} from "./domains/business/services/businessProfileCommand";
import {
  updateBusinessBranchProfileCommand,
  type BusinessBranchProfilePatch,
} from "./domains/business/services/businessBranchProfileCommand";
import {
  submitBusinessForVerificationCommand,
  closeBusinessCommand,
} from "./domains/business/services/businessLifecycleCommand";
import { AuthorizeAndExecuteError } from "./domains/permissions/service/authorizeAndExecute";
import { PermissionDomainError } from "./domains/permissions/models/permissionErrors";
import { CommerceKnowledgeDomainError } from "./domains/commerceKnowledge/models/commerceKnowledgeErrors";
import {
  getOwnedBusinesses as getOwnedBusinessesRead,
  getBusinessContext as getBusinessContextRead,
} from "./domains/business/services/businessReadService";
import {
  listBusinessCategories as listBusinessCategoriesRead,
  listBusinessTypesForCategory as listBusinessTypesForCategoryRead,
} from "./domains/commerceKnowledge/services/commerceKnowledgeReadService";
import {
  createStaffInvitation as createStaffInvitationCommand,
  type CreateStaffInvitationRequest,
} from "./domains/permissions/service/createStaffInvitationService";
import {
  revokeStaffInvitation as revokeStaffInvitationCommand,
  type RevokeStaffInvitationRequest,
} from "./domains/permissions/service/revokeStaffInvitationService";
import {
  listStaffInvitationsForBusiness,
  listStaffMembershipsForBusiness,
} from "./domains/permissions/service/staffTransportReadService";
import { acceptBusinessTermsCommand } from "./domains/business/services/acceptBusinessTermsCommand";

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
  if (error instanceof AuthorizeAndExecuteError) {
    // The one `ENG-P2-004` boundary error class — thrown only for an
    // idempotency-key *conflict* (a same-key, materially different retry);
    // the ordinary "denied" outcome is a normal return value, not this.
    return new HttpsError(
      CATEGORY_TO_HTTPS[error.category as ErrorCategory] ?? "internal",
      "business_command_failed",
    );
  }
  if (error instanceof PermissionDomainError) {
    // Never echoes the domain message (Phase W) — a single stable client
    // message per code, same posture as every other domain mapping above.
    return new HttpsError(CATEGORY_TO_HTTPS[error.category] ?? "internal", "staff_command_failed");
  }
  if (error instanceof CommerceKnowledgeDomainError) {
    return new HttpsError(
      CATEGORY_TO_HTTPS[error.category] ?? "internal",
      "commerce_knowledge_read_failed",
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
/** Exported only for the mass-assignment regression test in `index.test.ts`. */
export function parseCreateBusinessCommand(data: unknown): CreateBusinessCommand {
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

function parseActorRequest(
  value: Record<string, unknown>,
): ResolveAuthenticatedBusinessActorParams {
  return {
    rawToken: parseRawToken(value.rawToken),
    referenceType: parseReferenceType(value.referenceType),
  };
}

function parseBusinessId(value: unknown): string {
  return parseNonEmptyString(value);
}

/**
 * Whitelist parser (`ENG-P2-002C`, Phase M): only these exact
 * `BusinessProfilePatch` fields are read off `data`. Any other key the
 * client sends (`id`, `businessCode`, `ownerUserId`, `status`, `createdAt`,
 * `schemaVersion`, `subscriptionId`, or anything else) is silently dropped
 * here, never reaching `updateBusinessProfile` — the same structural
 * guarantee `parseCreateBusinessCommand` established for bootstrap. Every
 * field is genuinely optional (a partial update) and, where present,
 * `undefined` is accepted to clear an optional field — validated to be a
 * string when a value is actually supplied.
 *
 * `subscriptionId` deliberately does NOT appear in this whitelist
 * (controlled-resume review, Phase J): no subscription/billing governance
 * exists yet (`ENG-P2-003` not started, not authorized by this package),
 * so accepting client-supplied `subscriptionId` here would let any Owner
 * set an arbitrary, ungoverned value on their own Business through this
 * ordinary profile-update permission — a mass-assignment-adjacent gap the
 * paused pre-pause version of this parser had (it accepted the field),
 * corrected during reconciliation rather than carried forward unexamined.
 */
/** Exported only for the mass-assignment regression test in `index.test.ts`. */
export function parseBusinessProfilePatch(value: Record<string, unknown>): BusinessProfilePatch {
  const patch: BusinessProfilePatch = {};
  const optionalStringField = (key: keyof BusinessProfilePatch, field: string) => {
    if (!(key in value)) return;
    const raw = value[key];
    if (raw === null) {
      (patch as Record<string, unknown>)[key] = undefined;
      return;
    }
    if (typeof raw !== "string") {
      throw new HttpsError("invalid-argument", "business_command_failed", { field });
    }
    (patch as Record<string, unknown>)[key] = raw;
  };

  optionalStringField("legalName", "legalName");
  optionalStringField("displayName", "displayName");
  optionalStringField("primaryCategoryId", "primaryCategoryId");
  optionalStringField("businessTypeId", "businessTypeId");
  optionalStringField("countryCode", "countryCode");
  optionalStringField("currencyCode", "currencyCode");
  optionalStringField("timezone", "timezone");
  optionalStringField("city", "city");
  optionalStringField("address", "address");
  optionalStringField("contactPhone", "contactPhone");
  optionalStringField("contactEmail", "contactEmail");
  optionalStringField("logoUrl", "logoUrl");

  if ("supportedLanguages" in value) {
    const raw = value.supportedLanguages;
    if (
      !Array.isArray(raw) ||
      !raw.every((entry) => typeof entry === "string" && entry.trim().length > 0)
    ) {
      throw new HttpsError("invalid-argument", "business_command_failed", {
        field: "supportedLanguages",
      });
    }
    patch.supportedLanguages = raw;
  }

  return patch;
}

/** Exported only for the mass-assignment regression test in `index.test.ts`. */
export function parseBusinessBranchProfilePatch(
  value: Record<string, unknown>,
): BusinessBranchProfilePatch {
  const patch: BusinessBranchProfilePatch = {};
  const optionalStringField = (key: keyof BusinessBranchProfilePatch, field: string) => {
    if (!(key in value)) return;
    const raw = value[key];
    if (raw === null) {
      (patch as Record<string, unknown>)[key] = undefined;
      return;
    }
    if (typeof raw !== "string") {
      throw new HttpsError("invalid-argument", "business_command_failed", { field });
    }
    (patch as Record<string, unknown>)[key] = raw;
  };

  optionalStringField("displayName", "displayName");
  optionalStringField("countryCode", "countryCode");
  optionalStringField("city", "city");
  optionalStringField("address", "address");

  return patch;
}

/**
 * `updateBusinessProfile` (`ENG-P2-002C`) — Owner-authorized Business
 * profile update. Resolves the caller through the same authenticated-owner
 * chain bootstrap uses (never a client-supplied `userId`), then defers the
 * entire authorization decision to `ENG-P2-004`'s `authorizeAndExecute`
 * boundary — no local role/owner check here. Returns the boundary's own
 * `{outcome, decision?, result?}` contract unchanged; a denied/duplicate/
 * in-progress outcome is a normal response, not an exception.
 */
export const updateBusinessProfile = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    const patch = parseBusinessProfilePatch(value);
    return await updateBusinessProfileCommand(db, {
      userId,
      businessId,
      patch,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      requestHash: `business.updateProfile:${businessId}:${JSON.stringify(patch)}`,
      correlationId: randomUUID(),
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `updateBusinessBranchProfile` (`ENG-P2-002C`) — Owner-authorized default
 * Branch profile update. Tenant isolation (Phase N) is enforced inside the
 * command itself, not here.
 */
export const updateBusinessBranchProfile = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    const branchId = parseNonEmptyString(value.branchId);
    const patch = parseBusinessBranchProfilePatch(value);
    return await updateBusinessBranchProfileCommand(db, {
      userId,
      businessId,
      branchId,
      patch,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      requestHash: `businessBranch.updateProfile:${businessId}:${branchId}:${JSON.stringify(patch)}`,
      correlationId: randomUUID(),
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `submitBusinessForVerification` (`ENG-P2-002C`) — the sole `draft →
 * pending_verification` integration (Phase H/I). No target-status
 * parameter exists on the request — the transition is fixed server-side.
 * Renamed from an earlier `advanceBusinessLifecycle` working name to
 * match the Founder-approved `business.submitForVerification` permission
 * id (FD-CORR-3, `ENG-P2-004-CORR-001`) — never deployed under the old
 * name, so this is a same-package rename, not a breaking API change.
 */
export const submitBusinessForVerification = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    return await submitBusinessForVerificationCommand(db, {
      userId,
      businessId,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      requestHash: `business.submitForVerification:${businessId}`,
      correlationId: randomUUID(),
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `closeBusiness` (`ENG-P2-002C`) — the sole Owner-initiated half of §6's
 * "any → closed" row (Phase H/J/K). Administrator-initiated closure and
 * owner self-suspension are both out of scope (Phase J/K) — this command
 * never accepts a target status other than `closed`.
 */
export const closeBusiness = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    return await closeBusinessCommand(db, {
      userId,
      businessId,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      requestHash: `business.close:${businessId}`,
      correlationId: randomUUID(),
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ---------------------------------------------------------------------------
// `ENG-P3-002A` — Business Onboarding Backend Read, Transport & Terms
// Foundation. Every callable below follows the exact same authenticated-
// caller → whitelist-parse → domain-service pattern the callables above
// already established; no new transport convention is introduced.
// ---------------------------------------------------------------------------

/**
 * `getOwnedBusinesses` (`ENG-P3-002A`, design §9) — the resume-detection
 * read. Server-derived exclusively from the authenticated caller's own
 * `ownerUserId` — the request carries no Business-selecting field at all,
 * so there is nothing for a caller to mass-assign.
 */
export const getOwnedBusinesses = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    return await getOwnedBusinessesRead(db, userId);
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `getBusinessContext` (`ENG-P3-002A`, design §9/§14/§37.7) — the bounded
 * onboarding-hydration read (Business + default Branch + Terms-acceptance
 * projection). `businessId` is caller-supplied per existing transport
 * convention (§10), but authority over it is always re-derived server-side
 * (`resolveAuthorizedBusinessForRead`) — the id alone never grants access.
 */
export const getBusinessContext = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    return await getBusinessContextRead(db, userId, businessId);
  } catch (error) {
    throw toHttpsError(error);
  }
});

function parseOptionalLanguageCode(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", "commerce_knowledge_read_failed", {
      field: "languageCode",
    });
  }
  return value;
}

/**
 * `listBusinessCategories` (`ENG-P3-002A`, design §13/§14/Phase H) —
 * requires authentication (`ED-P3-002-3`) but is not Business-scoped;
 * every currently-`active` `business_category` node is returned uniformly
 * to any authenticated caller — no per-caller filtering is meaningful for
 * platform-global, non-tenant data.
 */
export const listBusinessCategories = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    return await listBusinessCategoriesRead(db, parseOptionalLanguageCode(value.languageCode));
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `listBusinessTypesForCategory` (`ENG-P3-002A`, design §13/§14/Phase I).
 * `categoryId` is independently re-validated server-side (existing,
 * `active`, actually a `business_category`) — never trusted merely because
 * a caller supplied it.
 */
export const listBusinessTypesForCategory = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const categoryId = parseNonEmptyString(value.categoryId);
    return await listBusinessTypesForCategoryRead(
      db,
      categoryId,
      parseOptionalLanguageCode(value.languageCode),
    );
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * Whitelist parser (Phase X): only these exact `CreateStaffInvitationRequest`
 * fields are read off `data` — a caller cannot smuggle `invitedBy`,
 * `status`, `id`, or any other authority-bearing field through an
 * unanticipated key, mirroring `parseCreateBusinessCommand`'s established
 * structural guarantee.
 */
export function parseCreateStaffInvitationRequest(
  value: Record<string, unknown>,
): CreateStaffInvitationRequest {
  const businessId = parseBusinessId(value.businessId);
  const role = parseNonEmptyString(value.role);
  const deliveryTargetRaw = (value.deliveryTarget ?? {}) as Record<string, unknown>;
  const deliveryType = parseNonEmptyString(deliveryTargetRaw.type);
  const deliveryValue = parseNonEmptyString(deliveryTargetRaw.value);
  return {
    businessId,
    role,
    deliveryTarget: { type: deliveryType, value: deliveryValue },
  };
}

/**
 * `createStaffInvitation` (`ENG-P3-002A`, design §11, Phase L) — transport
 * exposure only; the already-complete `ENG-P2-003B` INVITE command remains
 * sole authority (`staff.manage`-gated via `authorizeAndExecute`). This
 * callable owns request parsing, the authentication boundary, transport-
 * level error mapping, and dependency wiring only — no domain logic is
 * duplicated here.
 */
export const createStaffInvitation = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const parsedRequest = parseCreateStaffInvitationRequest(value);
    return await createStaffInvitationCommand(db, parsedRequest, {
      actorUserId: userId,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      correlationId: randomUUID(),
      actor: { actorType: "user", actorId: userId },
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

export function parseRevokeStaffInvitationRequest(
  value: Record<string, unknown>,
): RevokeStaffInvitationRequest {
  return {
    businessId: parseBusinessId(value.businessId),
    invitationId: parseNonEmptyString(value.invitationId),
  };
}

/** `revokeStaffInvitation` (`ENG-P3-002A`, design §11, Phase L) — same transport-only exposure pattern as `createStaffInvitation` above. */
export const revokeStaffInvitation = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const parsedRequest = parseRevokeStaffInvitationRequest(value);
    return await revokeStaffInvitationCommand(db, parsedRequest, {
      actorUserId: userId,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      correlationId: randomUUID(),
      actor: { actorType: "user", actorId: userId },
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * `listStaffInvitations` (`ENG-P3-002A`, design §39, Phase K/N) —
 * Business-scoped, bounded (no pagination). `statusFilter`, when supplied,
 * is passed through as a plain string to the repository's own equality
 * filter — no client authority beyond narrowing their own already-
 * authorized read.
 */
export const listStaffInvitations = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    const statusFilter =
      value.statusFilter === undefined ? undefined : parseNonEmptyString(value.statusFilter);
    return await listStaffInvitationsForBusiness(db, userId, businessId, statusFilter);
  } catch (error) {
    throw toHttpsError(error);
  }
});

/** `listStaffMemberships` (`ENG-P3-002A`, design §39, Phase K/N) — Business-scoped, bounded. */
export const listStaffMemberships = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const businessId = parseBusinessId(value.businessId);
    return await listStaffMembershipsForBusiness(db, userId, businessId);
  } catch (error) {
    throw toHttpsError(error);
  }
});

/**
 * Whitelist parser (Phase X, security-critical): only `businessId`,
 * optional `languageCode`, optional `collectionMethod` are read off `data`
 * — `acceptingCustomerIdentityId`, `termsVersion`, and `acceptedAt` are
 * structurally absent from this parser's output type, so a caller cannot
 * express them even by supplying an extra field. The accepting identity
 * and the accepted Terms version are always server-resolved
 * (`acceptBusinessTermsCommand.ts`, design §37.5/§37.8).
 */
export function parseAcceptBusinessTermsRequest(value: Record<string, unknown>): {
  businessId: string;
  languageCode?: string;
  collectionMethod?: string;
} {
  return {
    businessId: parseBusinessId(value.businessId),
    languageCode: parseOptionalLanguageCode(value.languageCode),
    collectionMethod:
      value.collectionMethod === undefined
        ? undefined
        : parseNonEmptyString(value.collectionMethod),
  };
}

/**
 * `acceptBusinessTerms` (`ENG-P3-002A`, design §37.6/§37.8/§Phase T) — the
 * security-critical Terms-acceptance transport. Server sequence: resolve
 * the authenticated principal → derive the accepting Customer Identity
 * (`userId`, never a request field) → `acceptBusinessTermsCommand`
 * re-derives Owner authority over `businessId`, reads the current
 * server-authoritative Terms version, and writes/reuses the immutable
 * acceptance record inside one transaction. No lifecycle transition
 * occurs here.
 */
export const acceptBusinessTerms = onCall(async (request) => {
  const value = (request.data ?? {}) as Record<string, unknown>;
  const db = getFirestore(getAdminApp());
  try {
    const { userId } = await resolveAuthenticatedBusinessActor(db, parseActorRequest(value), {
      verifier: firebaseAdminTokenVerifier(),
    });
    const parsedRequest = parseAcceptBusinessTermsRequest(value);
    return await acceptBusinessTermsCommand(db, {
      userId,
      businessId: parsedRequest.businessId,
      languageCode: parsedRequest.languageCode,
      collectionMethod: parsedRequest.collectionMethod,
      idempotencyKey: parseNonEmptyString(value.idempotencyKey),
      correlationId: randomUUID(),
      now: new Date(),
      newId: randomUUID,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
