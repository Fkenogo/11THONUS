/**
 * Authenticated identity-actor resolution (`IDENTITY-PROFILE-A`).
 *
 * The same authority chain `authenticatedBusinessActor.ts` (`ENG-P2-002C`,
 * `business/services/**`) established for deriving a server-trusted
 * `userId` from a raw provider credential — verified token (AUTH-02) →
 * `resolveAuthenticatedCredential` → an existing, eligible Customer
 * Identity. Deliberately duplicated here rather than imported across
 * domain boundaries (`authenticatedBusinessActor.ts`'s own header: "a
 * small, deliberate, disclosed duplication, not a missed reuse
 * opportunity"), since a self-service identity-domain command has no
 * Business context at all.
 *
 * Lives under `repositories/`, not `services/` — the Identity domain's own
 * machine-enforced boundary (`eslint.config.js`) keeps `identity/services/**`
 * framework-independent (mirroring `identityLifecycleService.ts`'s pure
 * orchestration); this module needs `firebase-admin/firestore` (via
 * `getCustomerIdentityById`) and the Firebase-backed token verifier, so it
 * belongs in the one subfolder this domain designates for exactly that:
 * bridging to Firestore/Firebase, per `userDocument.ts`'s own precedent.
 *
 * Answers exactly one question: "which authenticated Customer Identity is
 * making this call?" — never "is it allowed to change what it's asking to
 * change?" (that remains each command's own concern, e.g. `setDisplayName`
 * only ever writes the resolved caller's own record).
 *
 * `resolveAuthenticatedIdentityActorReadOnly` is the non-mutating twin
 * (`AUTH-MFA-003A1`): the identical trust chain — verified token →
 * authentication-reference lookup → eligible identity — but it resolves the
 * reference with the merged `-09` lookup's *non-auditing* `internal_service`
 * purpose, so it persists nothing (no `IdentityLookupAttempted` outbox
 * event). It exists for read-only routing callables whose trust chain must
 * not create unbounded audit writes on every probe, of which
 * `discoverPlatformAdministrator` is the first. The two resolution paths
 * are a small, deliberate, disclosed duplication of the reference-step only —
 * the eligibility gate and error semantics are shared below so a
 * divergence can never slip in silently. Never use the read-only twin for a
 * governed, audit-worthy resolution (sign-in, support, recovery); those must
 * keep the audited `authentication` purpose.
 */

import type { Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { TokenVerifierPort } from "../../authentication/ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../models/authenticationReference";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionDeps,
} from "../../authentication/services/credentialResolutionService";
import { getCustomerIdentityById } from "./customerIdentityRepository";
import type { CustomerIdentity } from "../models/customerIdentity";
import { IdentityDomainError, identityActorNotEligibleError } from "../models/identityErrors";
import {
  lookupCustomerIdentityByAuthenticationReference,
  type IdentityLookupResult,
  type LookupCustomerIdentityByAuthenticationReferenceParams,
} from "./identityLookupRepository";

/** Same eligibility set `authenticatedBusinessActor.ts` uses. */
const ELIGIBLE_ACTOR_IDENTITY_STATUSES = new Set(["active", "dormant"]);

export type ResolveAuthenticatedIdentityActorParams = {
  rawToken: string;
  referenceType: AuthenticationReferenceType;
};

export type ResolveAuthenticatedIdentityActorDeps = {
  verifier: TokenVerifierPort;
  resolveCredential?: typeof resolveAuthenticatedCredential;
  getIdentity?: (db: Firestore, customerIdentityId: string) => Promise<CustomerIdentity>;
  resolutionDeps?: CredentialResolutionDeps;
  newId?: () => string;
};

export type AuthenticatedIdentityActor = {
  userId: string;
};

/**
 * Shared eligibility gate for both resolution paths — returns the
 * `userId` only when the resolved Customer Identity is currently eligible
 * (`active`/`dormant`), otherwise fails closed with
 * `identityActorNotEligibleError` (`AUTH_REQUIRED`). Kept in one place so
 * the read-only twin can never drift from the audited path.
 */
async function toEligibleUserId(
  getIdentity: (db: Firestore, customerIdentityId: string) => Promise<CustomerIdentity>,
  db: Firestore,
  customerIdentityId: string,
): Promise<AuthenticatedIdentityActor> {
  const identity = await getIdentity(db, customerIdentityId);
  if (!ELIGIBLE_ACTOR_IDENTITY_STATUSES.has(identity.status)) {
    throw identityActorNotEligibleError(customerIdentityId);
  }
  return { userId: customerIdentityId };
}

export async function resolveAuthenticatedIdentityActor(
  db: Firestore,
  params: ResolveAuthenticatedIdentityActorParams,
  deps: ResolveAuthenticatedIdentityActorDeps,
): Promise<AuthenticatedIdentityActor> {
  const newId = deps.newId ?? randomUUID;
  const resolveCredential = deps.resolveCredential ?? resolveAuthenticatedCredential;
  const getIdentity = deps.getIdentity ?? getCustomerIdentityById;

  const credential = await deps.verifier.verify({
    rawToken: params.rawToken,
    referenceType: params.referenceType,
  });

  const envelope = {
    eventId: newId(),
    correlationId: newId(),
    actor: { actorType: "user" as const, actorId: credential.referenceId },
    occurredAt: new Date().toISOString(),
  };

  const authResult = await resolveCredential(db, credential, envelope, deps.resolutionDeps);
  if (authResult.outcome !== "resolved") {
    throw identityActorNotEligibleError(credential.referenceId);
  }

  const identity = await toEligibleUserId(getIdentity, db, authResult.customerIdentityId);
  return identity;
}

export type ResolveAuthenticatedIdentityActorReadOnlyDeps = {
  verifier: TokenVerifierPort;
  lookup?: (
    db: Firestore,
    params: LookupCustomerIdentityByAuthenticationReferenceParams,
  ) => Promise<IdentityLookupResult>;
  getIdentity?: (db: Firestore, customerIdentityId: string) => Promise<CustomerIdentity>;
  newId?: () => string;
};

/**
 * `resolveAuthenticatedIdentityActorReadOnly` — the non-mutating twin of
 * `resolveAuthenticatedIdentityActor`, for read-only routing callables
 * (`AUTH-MFA-003A1`). Same authority chain and same fail-closed semantics,
 * but the authentication-reference step runs through the merged `-09`
 * lookup with `purpose: "internal_service"` — the codebase's deliberately
 * non-audited purpose (see `identityLookupRepository.ts`'s consistency
 * model: ordinary internal-service reads emit no `IdentityLookupAttempted`
 * event, "to avoid emitting on every routine scan"). **Structurally cannot
 * write an audit event:** the injected `lookup` port's declared purpose is
 * hardcoded here, so no caller, no copied snippet, and no test can route a
 * governed `authentication` purpose through this path. A discovery-style
 * probe therefore persists nothing in the shared outbox — bounding writes
 * to zero for repeated routing reads, and removing the
 * audit-transaction-failure failure mode entirely. Not-found ("no such
 * identity") fails closed to `identityActorNotEligibleError` (`AUTH_REQUIRED`),
 * mirrored from the audited twin; any other lookup failure (malformed
 * input, infrastructure) propagates unchanged.
 */
export async function resolveAuthenticatedIdentityActorReadOnly(
  db: Firestore,
  params: ResolveAuthenticatedIdentityActorParams,
  deps: ResolveAuthenticatedIdentityActorReadOnlyDeps,
): Promise<AuthenticatedIdentityActor> {
  const newId = deps.newId ?? randomUUID;
  const lookup = deps.lookup ?? lookupCustomerIdentityByAuthenticationReference;
  const getIdentity = deps.getIdentity ?? getCustomerIdentityById;

  const credential = await deps.verifier.verify({
    rawToken: params.rawToken,
    referenceType: params.referenceType,
  });

  const envelope = {
    eventId: newId(),
    correlationId: newId(),
    actor: { actorType: "user" as const, actorId: credential.referenceId },
    occurredAt: new Date().toISOString(),
  };

  let customerIdentityId: string;
  try {
    const result = await lookup(db, {
      ...envelope,
      referenceType: credential.referenceType,
      referenceId: credential.referenceId,
      purpose: "internal_service",
    });
    customerIdentityId = result.customerIdentityId;
  } catch (error) {
    if (error instanceof IdentityDomainError && error.category === "RESOURCE_NOT_FOUND") {
      throw identityActorNotEligibleError(credential.referenceId);
    }
    throw error;
  }

  return toEligibleUserId(getIdentity, db, customerIdentityId);
}
