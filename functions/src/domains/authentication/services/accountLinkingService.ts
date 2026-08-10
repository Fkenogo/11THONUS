/**
 * Account-linking orchestration (AUTH-05, per AUTH-BP §7/§12).
 *
 * The authentication-layer orchestration that links or unlinks an *additional*
 * provider on **one** already-authenticated identity. It composes already-merged
 * responsibilities and owns no identity state:
 *
 *   - the *acting* credential (proof the caller controls a provider) is resolved
 *     to its Customer Identity through the AUTH-02 `resolveAuthenticatedCredential`
 *     (consuming the merged `-09` lookup);
 *   - the link / unlink itself is the merged `-08`
 *     `link/unlinkAuthenticationReferenceForIdentity` — transactional, idempotent,
 *     globally-unique, cross-identity-conflict-fail-closed, last-reference-protected,
 *     and the sole emitter of `AuthenticationReferenceLinked`/`Unlinked`/
 *     `ConflictDetected`.
 *
 * What AUTH-05 adds on top of `-08` — the authentication-layer contribution:
 *
 *   - **Same-identity safety (AUTH-BP §7 step 1).** Linking/unlinking is an
 *     identity-protected action. The `customerIdentityId` handed to `-08` is
 *     *always* the identity the acting credential resolves to — never a
 *     client-supplied id — so a caller can only mutate the providers on *their
 *     own* identity. An acting credential that resolves to no identity fails
 *     closed (`AUTH_REQUIRED`) before any mutation.
 *   - **Never merges (AUTH-BP §7 step 3 / `DEC-AUTH-001` D-A3).** A new reference
 *     already owned by a different identity surfaces `-08`'s fail-closed conflict
 *     (which also commits the durable `AuthenticationReferenceConflictDetected`
 *     audit signal for the governed merge process); AUTH-05 does nothing to work
 *     around it.
 *
 * Boundary. AUTH-05 emits no domain events of its own (all emission is `-08`'s);
 * it adds no error category (closed 14-category taxonomy, TRD11 §11.35);
 * `CustomerAuthenticated` remains AUTH-08; session/access-gating remains AUTH-07.
 * Idempotency is consumed directly from `-08` via a deterministic,
 * credential-bound derived key — no second idempotency subsystem.
 *
 * Firebase-adapter (services) sub-layer. No credential material is read, written,
 * logged, or returned (TRD10 §10.6.1); only the provider-neutral reference flows.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import {
  accountSuspendedForAuthenticationError,
  authenticationForbiddenError,
  authenticationRequiredError,
  newProviderPrincipalMismatchError,
} from "../models/authenticationErrors";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionEnvelope,
} from "./credentialResolutionService";
import { assertSafeIdempotencyKey } from "./registrationSignInService";
import {
  linkAuthenticationReferenceForIdentity,
  unlinkAuthenticationReferenceForIdentity,
} from "../../identity/repositories/authenticationReferenceRepository";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";

const LINK_OPERATION = "authentication.link";
const UNLINK_OPERATION = "authentication.unlink";

export type AccountLinkingEnvelope = CredentialResolutionEnvelope;

export type AccountLinkingCommand = {
  /** Client-supplied idempotency key for the whole link/unlink request. */
  idempotencyKey: string;
  /** The `linkedAt` / `unlinkedAt` instant recorded on the reference. */
  requestedAt: Date;
};

/** A provider reference to unlink from the acting identity. */
export type AuthenticationReferenceTarget = {
  referenceType: AuthenticationReferenceType;
  referenceId: string;
};

export type AccountLinkingOutcome = {
  operation: "linked" | "unlinked";
  customerIdentityId: string;
  reference: AuthenticationReferenceTarget;
};

/** Injected seams — default to the real, merged implementations. */
export type AccountLinkingDeps = {
  resolve?: typeof resolveAuthenticatedCredential;
  getIdentityById?: typeof getCustomerIdentityById;
  linkReference?: typeof linkAuthenticationReferenceForIdentity;
  unlinkReference?: typeof unlinkAuthenticationReferenceForIdentity;
};

/**
 * Gate the *acting* identity on its access state before any link/unlink
 * mutation (F1, AUTH-BP §7 step 1). Reuses AUTH-03's returning-user gate
 * verbatim (`registrationSignInService.assertMaySignIn`, AUTH-BP §6 step 2) and
 * its exact closed-taxonomy errors — an inactive identity must no more mutate
 * its own providers than it may receive a session. Only `active` may proceed;
 * `suspended` → `ACCOUNT_SUSPENDED`, any other non-active state →
 * `AUTH_FORBIDDEN` (fail closed). No new state taxonomy and no new error
 * category are introduced; access-state management stays the Customer Identity
 * responsibility (this only reads `identity.status`).
 */
function assertActingIdentityMayMutate(identity: CustomerIdentity): void {
  if (identity.status === "active") {
    return;
  }
  if (identity.status === "suspended") {
    throw accountSuspendedForAuthenticationError(identity.id);
  }
  throw authenticationForbiddenError();
}

/**
 * Resolve the *acting* credential to the identity the mutation must target, and
 * confirm that identity is in an allowed access state.
 *
 * A credential that resolves to no identity is not an authenticated identity
 * holder — linking/unlinking is identity-protected, so fail closed
 * (`AUTH_REQUIRED`) before any `-08` mutation is attempted (AUTH-BP §7 step 1).
 * A credential that *does* resolve is then loaded and access-gated (F1) so a
 * suspended/locked/closed identity cannot mutate its own providers.
 */
async function resolveActingIdentity(
  db: Firestore,
  actingCredential: AuthenticatedCredential,
  envelope: AccountLinkingEnvelope,
  deps: AccountLinkingDeps,
): Promise<CustomerIdentity> {
  const resolve = deps.resolve ?? resolveAuthenticatedCredential;
  const getIdentityById = deps.getIdentityById ?? getCustomerIdentityById;

  const result = await resolve(db, actingCredential, envelope);
  if (result.outcome !== "resolved") {
    throw authenticationRequiredError();
  }

  const identity = await getIdentityById(db, result.customerIdentityId);
  assertActingIdentityMayMutate(identity);
  return identity;
}

/** A deterministic, credential-bound request hash (equal across retries; differs per target). */
function bindRequest(
  operation: string,
  customerIdentityId: string,
  target: AuthenticationReferenceTarget,
): string {
  return `${operation}:${customerIdentityId}:${target.referenceType}:${target.referenceId}`;
}

/**
 * Link a *verified* new provider credential to the acting identity (AUTH-BP §7).
 * The new credential having been verified upstream is the caller's proof of
 * control of that provider; resolution binds the mutation to the acting
 * identity. `-08` enforces global uniqueness and fails closed (never merges) if
 * the reference already belongs to another identity.
 */
export async function linkAuthenticationProvider(
  db: Firestore,
  actingCredential: AuthenticatedCredential,
  newCredential: AuthenticatedCredential,
  envelope: AccountLinkingEnvelope,
  command: AccountLinkingCommand,
  deps: AccountLinkingDeps = {},
): Promise<AccountLinkingOutcome> {
  assertSafeIdempotencyKey(command.idempotencyKey);

  const link = deps.linkReference ?? linkAuthenticationReferenceForIdentity;
  const { id: customerIdentityId } = await resolveActingIdentity(
    db,
    actingCredential,
    envelope,
    deps,
  );

  // F2 defense-in-depth (AUTH-BP §7 / AIR-001, Founder-directed): account
  // linking is a same-Firebase-principal operation. The new provider's verified
  // uid must equal the acting credential's verified uid — a provider verified
  // for a *different* Firebase user is refused here, before any `-08` mutation,
  // so no reference is written and no cross-account attach can occur. Both uids
  // are the server-verified `referenceId` from the AUTH-02 verifier (never
  // client-supplied). This is additional to, not a replacement for, `-08`'s
  // cross-identity ownership check (which still guards a reference already owned
  // by another customer identity).
  if (newCredential.referenceId !== actingCredential.referenceId) {
    throw newProviderPrincipalMismatchError();
  }

  const target: AuthenticationReferenceTarget = {
    referenceType: newCredential.referenceType,
    referenceId: newCredential.referenceId,
  };

  const identity = await link(db, {
    eventId: `${envelope.eventId}:${LINK_OPERATION}`,
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
    customerIdentityId,
    referenceId: target.referenceId,
    referenceType: target.referenceType,
    authority: "customer_initiated",
    reason: "customer_request",
    linkedAt: command.requestedAt,
    linkedBy: customerIdentityId,
    idempotencyKey: `${LINK_OPERATION}:${command.idempotencyKey}`,
    requestHash: bindRequest(LINK_OPERATION, customerIdentityId, target),
  });

  return { operation: "linked", customerIdentityId: identity.id, reference: target };
}

/**
 * Unlink a provider reference from the acting identity (AUTH-BP §7 step 4).
 * `-08` enforces ownership (a reference not owned by the acting identity is an
 * enumeration-resistant not-found) and the history-preserving last-reference
 * invariant (`lastAuthenticationReferenceCannotBeUnlinked`) — both surfaced
 * here unchanged.
 */
export async function unlinkAuthenticationProvider(
  db: Firestore,
  actingCredential: AuthenticatedCredential,
  target: AuthenticationReferenceTarget,
  envelope: AccountLinkingEnvelope,
  command: AccountLinkingCommand,
  deps: AccountLinkingDeps = {},
): Promise<AccountLinkingOutcome> {
  assertSafeIdempotencyKey(command.idempotencyKey);

  const unlink = deps.unlinkReference ?? unlinkAuthenticationReferenceForIdentity;
  const { id: customerIdentityId } = await resolveActingIdentity(
    db,
    actingCredential,
    envelope,
    deps,
  );

  const identity = await unlink(db, {
    eventId: `${envelope.eventId}:${UNLINK_OPERATION}`,
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
    customerIdentityId,
    referenceId: target.referenceId,
    referenceType: target.referenceType,
    authority: "customer_initiated",
    reason: "customer_request",
    unlinkedAt: command.requestedAt,
    unlinkedBy: customerIdentityId,
    idempotencyKey: `${UNLINK_OPERATION}:${command.idempotencyKey}`,
    requestHash: bindRequest(UNLINK_OPERATION, customerIdentityId, target),
  });

  return {
    operation: "unlinked",
    customerIdentityId: identity.id,
    reference: { referenceType: target.referenceType, referenceId: target.referenceId },
  };
}
