/**
 * Credential → identity resolution service (AUTH-02, per AUTH-BP §4).
 *
 * Resolves a *verified* `AuthenticatedCredential` to exactly one existing
 * Customer Identity, or reports that none exists. It **consumes, never
 * modifies** the merged Customer Identity `-09` lookup
 * (`lookupCustomerIdentityByAuthenticationReference`) as a port — the same
 * exact-match, enumeration-resistant, purpose-gated surface every other
 * caller uses — and maps its outcome onto the AUTH-01 `AuthResult` contract:
 *
 *   - found                → `resolvedAuthResult` (sign-in path, AUTH-BP §6)
 *   - not found (RESOURCE_NOT_FOUND) → `unregisteredAuthResult`
 *                            (registration path, AUTH-BP §5)
 *
 * Scope (AUTH-02): resolution only. Identity **access-state** gating
 * (`suspended`/`locked` → `ACCOUNT_SUSPENDED`/`AUTH_FORBIDDEN`) is the
 * returning-user *sign-in orchestration* step (AUTH-BP §6 step 2), owned by
 * AUTH-03 — deliberately not performed here, so a suspended identity still
 * *resolves* to its id; the access decision is layered above.
 *
 * Firebase-adapter (services) sub-layer — the merged repository takes a
 * Firestore handle, permitted here (ESLint boundary exempts
 * `authentication/services/**`). No credential material is read or written;
 * only the provider-neutral reference is looked up.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import { resolvedAuthResult, unregisteredAuthResult, type AuthResult } from "../models/authResult";
import {
  lookupCustomerIdentityByAuthenticationReference,
  type IdentityLookupResult,
  type LookupCustomerIdentityByAuthenticationReferenceParams,
} from "../../identity/repositories/identityLookupRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";

/**
 * The governed event envelope every `-09` lookup requires — carried through
 * so the lookup's own privacy-safe `IdentityLookupAttempted` audit event is
 * correctly attributed and idempotent.
 */
export type CredentialResolutionEnvelope = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

/** The single identity port this service consumes — injected for testability. */
export type IdentityLookupByAuthenticationReference = (
  db: Firestore,
  params: LookupCustomerIdentityByAuthenticationReferenceParams,
) => Promise<IdentityLookupResult>;

export type CredentialResolutionDeps = {
  lookup?: IdentityLookupByAuthenticationReference;
};

/**
 * Resolve a verified credential to an `AuthResult`. Never throws for the
 * ordinary "no such identity" case (that is the registration path); any other
 * failure — malformed input, infrastructure — propagates unchanged (fail
 * closed; the caller never receives a resolved result it should not).
 */
export async function resolveAuthenticatedCredential(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: CredentialResolutionEnvelope,
  deps: CredentialResolutionDeps = {},
): Promise<AuthResult> {
  const lookup = deps.lookup ?? lookupCustomerIdentityByAuthenticationReference;

  try {
    const result = await lookup(db, {
      ...envelope,
      referenceType: credential.referenceType,
      referenceId: credential.referenceId,
      purpose: "authentication",
    });
    return resolvedAuthResult(result.customerIdentityId, credential);
  } catch (error) {
    if (error instanceof IdentityDomainError && error.category === "RESOURCE_NOT_FOUND") {
      // Unknown or unlinked reference — collapsed by `-09` into one
      // enumeration-resistant not-found. This is the registration path.
      return unregisteredAuthResult(credential);
    }
    throw error;
  }
}
