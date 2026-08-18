/**
 * Authenticated business-actor resolution (`ENG-P2-002C`).
 *
 * The same authority chain `businessBootstrapEndpointService.ts` (`ENG-P2-002B`)
 * established for deriving a server-trusted `userId` from a raw provider
 * credential — verified token (AUTH-02) → `resolveAuthenticatedCredential`
 * → an existing, eligible Customer Identity. Reimplemented independently
 * here rather than importing/refactoring 002B's file, since that file is
 * merged/closed and this task's own instruction is not to modify 002A/002B
 * without a genuine defect (Phase W) — this is a small, deliberate,
 * disclosed duplication, not a missed reuse opportunity.
 *
 * Unlike bootstrap, this resolution does **not** itself decide whether the
 * resulting `userId` may perform any particular action on any particular
 * Business — that is entirely `ENG-P2-004`'s `authorizeAndExecute`
 * evaluator's job (Phase G: no local role/owner/permission check here).
 * This module answers exactly one question: "which authenticated Customer
 * Identity is making this call?" — never "is it allowed to?".
 */

import type { Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { TokenVerifierPort } from "../../authentication/ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionDeps,
} from "../../authentication/services/credentialResolutionService";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import { invalidCustomerIdentityForOwnerError } from "../models/businessErrors";

/** Same eligibility set `businessBootstrapEndpointService.ts` uses (§10.3.3). */
const ELIGIBLE_ACTOR_IDENTITY_STATUSES = new Set(["active", "dormant"]);

export type ResolveAuthenticatedBusinessActorParams = {
  rawToken: string;
  referenceType: AuthenticationReferenceType;
};

export type ResolveAuthenticatedBusinessActorDeps = {
  verifier: TokenVerifierPort;
  resolveCredential?: typeof resolveAuthenticatedCredential;
  getIdentity?: (db: Firestore, customerIdentityId: string) => Promise<CustomerIdentity>;
  resolutionDeps?: CredentialResolutionDeps;
  newId?: () => string;
};

export type AuthenticatedBusinessActor = {
  userId: string;
};

export async function resolveAuthenticatedBusinessActor(
  db: Firestore,
  params: ResolveAuthenticatedBusinessActorParams,
  deps: ResolveAuthenticatedBusinessActorDeps,
): Promise<AuthenticatedBusinessActor> {
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
    throw invalidCustomerIdentityForOwnerError(credential.referenceId);
  }

  const identity = await getIdentity(db, authResult.customerIdentityId);
  if (!ELIGIBLE_ACTOR_IDENTITY_STATUSES.has(identity.status)) {
    throw invalidCustomerIdentityForOwnerError(authResult.customerIdentityId);
  }

  return { userId: authResult.customerIdentityId };
}
