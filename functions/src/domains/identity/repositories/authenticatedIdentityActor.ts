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
import { identityActorNotEligibleError } from "../models/identityErrors";

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

  const identity = await getIdentity(db, authResult.customerIdentityId);
  if (!ELIGIBLE_ACTOR_IDENTITY_STATUSES.has(identity.status)) {
    throw identityActorNotEligibleError(authResult.customerIdentityId);
  }

  return { userId: authResult.customerIdentityId };
}
