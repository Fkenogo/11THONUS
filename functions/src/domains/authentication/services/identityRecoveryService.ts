/**
 * Identity-recovery credential-proof orchestration (AUTH-06, per AUTH-BP §8/§12).
 *
 * The authentication-layer step of account recovery: it **performs the provider
 * proof** and constructs a *proven* `RecoveryProof`, then hands it to the merged
 * `-07` `identityRecoveryRepository.recoverCustomerIdentityByReference`. It owns
 * no identity state and composes already-merged responsibilities:
 *
 *   - the recovery credential (proof the caller controls a provider) is resolved
 *     to its OWNING Customer Identity through the AUTH-02
 *     `resolveAuthenticatedCredential` (consuming the merged `-09` lookup) — the
 *     same exact-match, enumeration-resistant surface sign-in uses;
 *   - the actual status restoration, proof-reuse rejection, transaction, and
 *     `IdentityRecovered` emission are the merged `-06`/`-07` — AUTH-06 adds no
 *     competing transaction/persistence pattern.
 *
 * What AUTH-06 adds on top of `-07` — the authentication-layer contribution:
 *
 *   - **Target derived from the proof (identity integrity).** The identity that
 *     is recovered is *always* the one the verified recovery credential resolves
 *     to — never a client-supplied id — so a caller can only recover the identity
 *     that actually owns the proven provider. A credential that resolves to no
 *     identity fails closed (`RESOURCE_NOT_FOUND`, enumeration-resistant) before
 *     any recovery is attempted (AUTH-BP §8).
 *   - **Proven-proof construction.** A verified MVP provider credential is mapped
 *     onto the merged `-07` `RecoveryProof` (`phone_otp` → `phone_otp`,
 *     `google_sign_in` → `linked_provider`), `result: "accepted"`,
 *     `authority: "customer_initiated"`, an opaque `proofReference`
 *     **deterministically bound to the verified proof** (supplied by the endpoint
 *     as a one-way digest of the verified token — never the credential/token
 *     itself), and `targetCustomerIdentityId` bound to the resolved identity. The
 *     token-bound reference is what makes `-07`'s proof-reuse protection effective:
 *     replaying the *same* captured proof yields the *same* reference and is
 *     rejected, while a genuinely new authentication (a fresh token) yields a new
 *     reference so a later legitimate recovery still succeeds.
 *
 * Boundary. AUTH-06 does **not** widen the recovery lookup surface (§8 step 1;
 * that stays `-07`/`-09`), does **not** compute risk strength (§8 step 4; ITM),
 * does **not** re-link providers (a separate concern the `-07` report defers),
 * and does **not** gate on the acting access state — recovery is *for* non-active
 * identities and the recovery-eligible-state rule (`suspended`/`locked`) is `-06`'s
 * to enforce. AUTH-06 emits no domain events of its own — `IdentityRecovered` is
 * `-06`/`-07`'s; the fire-and-forget `AuthenticationRecoveryProofProvided` trust
 * signal stays AUTH-08 (per `authenticationEvents.ts`), and `CustomerAuthenticated`
 * stays AUTH-08. It adds no error category (closed 14-category taxonomy,
 * TRD11 §11.35). Idempotency is consumed directly from `-07` via a deterministic,
 * credential-bound derived key — no second idempotency subsystem.
 *
 * Firebase-adapter (services) sub-layer. No credential material is read, written,
 * logged, or returned (TRD10 §10.6.1); only the provider-neutral reference flows.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import {
  authenticationForbiddenError,
  unresolvedCredentialError,
} from "../models/authenticationErrors";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionEnvelope,
} from "./credentialResolutionService";
import { assertSafeIdempotencyKey } from "./registrationSignInService";
import { recoverCustomerIdentityByReference } from "../../identity/repositories/identityRecoveryRepository";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type {
  RecoveryProof,
  RecoveryProofMethodCategory,
} from "../../identity/models/recoveryProof";

const RECOVER_OPERATION = "authentication.recover";

/**
 * Closed mapping of the MVP authentication providers onto the merged `-07`
 * recovery-proof method categories. Only the MVP providers a `TokenVerifierPort`
 * can produce are mapped; a `google_sign_in` proof is control of a
 * previously-linked provider (`linked_provider`), a phone-OTP proof is
 * `phone_otp`, and an email/password proof is control of the email account
 * (`email_verification` — the governed recovery category per `DEC-SEC-001`'s
 * recovery order, added for the now-approved Email/Password provider by
 * `AUTH-CORR-003`). Still-deferred providers (`future_provider`) are
 * intentionally absent and fail closed — the endpoint restricts to the MVP set.
 */
const PROVIDER_TO_RECOVERY_METHOD: Partial<
  Record<AuthenticationReferenceType, RecoveryProofMethodCategory>
> = {
  phone_otp: "phone_otp",
  google_sign_in: "linked_provider",
  email: "email_verification",
};

function recoveryMethodCategoryFor(
  referenceType: AuthenticationReferenceType,
): RecoveryProofMethodCategory {
  const category = PROVIDER_TO_RECOVERY_METHOD[referenceType];
  if (category === undefined) {
    // A provider with no recovery mapping (deferred provider) is refused,
    // fail closed, using the existing closed taxonomy — no new category.
    throw authenticationForbiddenError();
  }
  return category;
}

export type IdentityRecoveryEnvelope = CredentialResolutionEnvelope;

export type IdentityRecoveryCommand = {
  /** Client-supplied idempotency key for the whole recovery request. */
  idempotencyKey: string;
  /** The `recoveredAt` instant recorded on the recovery transition. */
  requestedAt: Date;
  /**
   * The opaque proof reference, **deterministically bound to the verified
   * proof** (the endpoint supplies a one-way digest of the verified token —
   * never the token itself). Binding it to the proof — rather than minting a
   * fresh value per request — is what lets `-07` reject a replay of the same
   * captured proof (the proof-reuse protection would otherwise be defeated by a
   * per-request random value).
   */
  proofReference: string;
};

export type IdentityRecoveryOutcome = {
  operation: "recovered";
  customerIdentityId: string;
  methodCategory: RecoveryProofMethodCategory;
};

/** Injected seams — default to the real, merged implementations. */
export type IdentityRecoveryDeps = {
  resolve?: typeof resolveAuthenticatedCredential;
  recover?: typeof recoverCustomerIdentityByReference;
};

/** A deterministic, credential-bound request hash (equal across retries). */
function bindRequest(customerIdentityId: string, credential: AuthenticatedCredential): string {
  return `${RECOVER_OPERATION}:${customerIdentityId}:${credential.referenceType}:${credential.referenceId}`;
}

/**
 * Recover a customer identity by proving control of one of its providers
 * (AUTH-BP §8). The credential having been verified upstream (endpoint /
 * `TokenVerifierPort`) is the proof of control; resolution binds the recovery to
 * the identity that owns that provider. `-07`/`-06` enforce recovery eligibility,
 * proof reuse, and the transactional status restoration.
 */
export async function recoverAuthenticatedIdentity(
  db: Firestore,
  recoveryCredential: AuthenticatedCredential,
  envelope: IdentityRecoveryEnvelope,
  command: IdentityRecoveryCommand,
  deps: IdentityRecoveryDeps = {},
): Promise<IdentityRecoveryOutcome> {
  assertSafeIdempotencyKey(command.idempotencyKey);

  const resolve = deps.resolve ?? resolveAuthenticatedCredential;
  const recover = deps.recover ?? recoverCustomerIdentityByReference;

  // Provider proof → recovery method category (fails closed for a deferred provider).
  const methodCategory = recoveryMethodCategoryFor(recoveryCredential.referenceType);

  // Derive the recovery target from the proof: the identity that owns the proven
  // provider. A credential resolving to no identity cannot recover anything —
  // fail closed (enumeration-resistant) before any `-07` mutation is attempted.
  const resolved = await resolve(db, recoveryCredential, envelope);
  if (resolved.outcome !== "resolved") {
    throw unresolvedCredentialError();
  }
  const customerIdentityId = resolved.customerIdentityId;

  const recoveryProof: RecoveryProof = {
    result: "accepted",
    methodCategory,
    proofReference: command.proofReference,
    authority: "customer_initiated",
    completedAt: recoveryCredential.verifiedAt,
    targetCustomerIdentityId: customerIdentityId,
  };

  const identity = await recover(db, {
    eventId: `${envelope.eventId}:${RECOVER_OPERATION}`,
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
    targetReference: { type: "customer_identity_id", value: customerIdentityId },
    recoveryProof,
    recoveredAt: command.requestedAt,
    recoveredBy: customerIdentityId,
    idempotencyKey: `${RECOVER_OPERATION}:${command.idempotencyKey}`,
    requestHash: bindRequest(customerIdentityId, recoveryCredential),
  });

  return { operation: "recovered", customerIdentityId: identity.id, methodCategory };
}
