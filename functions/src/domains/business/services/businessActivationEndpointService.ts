/**
 * Business activation endpoint composition (`PLATFORM-BASELINE-003`,
 * `FD-BUS-ACT-001`).
 *
 * The single backend entrypoint the `activateBusinessAfterVerification`
 * callable exposes — mirrors `businessBootstrapEndpointService.ts`'s exact
 * shape (verify → resolve → delegate): verify a raw provider credential
 * through the existing `TokenVerifierPort` (never a new one), resolve it
 * to the caller's Customer Identity through the existing
 * `resolveAuthenticatedIdentityActor` (never a client-supplied id), derive
 * genuinely-verified second-factor evidence from that same credential via
 * `deriveVerifiedMfaSatisfied`, and hand all three server-derived facts to
 * `activateBusinessAfterVerificationCommand`. Adds no authority of its own.
 *
 * Single verification: the credential is verified once here, then reused
 * for both actor resolution (through an injected pass-through verifier —
 * the resolution chain re-verifies nothing) and MFA derivation, so the
 * administrator id and the MFA evidence provably describe the same
 * verified authentication. Kept as a plain, dependency-injected function
 * (not the `onCall` wrapper itself), exactly like the other endpoint
 * compositions, so it is unit-testable without the Functions runtime.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { TokenVerifierPort } from "../../authentication/ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { AuthenticatedCredential } from "../../authentication/models/authenticatedCredential";
import {
  resolveAuthenticatedIdentityActor,
  type AuthenticatedIdentityActor,
} from "../../identity/repositories/authenticatedIdentityActor";
import { deriveVerifiedMfaSatisfied } from "../../platformAdministration/services/deriveVerifiedMfaSatisfied";
import {
  activateBusinessAfterVerificationCommand,
  type ActivateBusinessAfterVerificationOutcome,
} from "./businessActivationCommand";

export type ActivateBusinessAfterVerificationRequest = {
  /** The raw provider credential to verify (e.g. a Firebase ID token). Consumed, never stored. */
  rawToken: string;
  referenceType: AuthenticationReferenceType;
  businessId: string;
  /** Client-supplied idempotency key for the whole activation request. */
  idempotencyKey: string;
};

export type ActivateBusinessAfterVerificationDeps = {
  verifier: TokenVerifierPort;
  resolveActor?: typeof resolveAuthenticatedIdentityActor;
  activate?: typeof activateBusinessAfterVerificationCommand;
  /** Clock/correlation id generator seams (CSPRNG-backed by default). */
  newId?: () => string;
};

export async function handleActivateBusinessAfterVerification(
  db: Firestore,
  request: ActivateBusinessAfterVerificationRequest,
  deps: ActivateBusinessAfterVerificationDeps,
): Promise<ActivateBusinessAfterVerificationOutcome> {
  const newId = deps.newId ?? randomUUID;
  const resolveActor = deps.resolveActor ?? resolveAuthenticatedIdentityActor;
  const activate = deps.activate ?? activateBusinessAfterVerificationCommand;

  // Verify first — an unverified/absent token fails closed inside the
  // verifier, never reaching actor resolution or the command.
  const credential: AuthenticatedCredential = await deps.verifier.verify({
    rawToken: request.rawToken,
    referenceType: request.referenceType,
  });

  // The already-verified credential flows into actor resolution through a
  // pass-through verifier, so the shared resolution chain (reference
  // lookup, eligibility gate) runs unchanged with zero re-verification —
  // `userId` and the MFA evidence below describe the same authentication.
  const passThroughVerifier: TokenVerifierPort = {
    verify: async () => credential,
  };
  const actor: AuthenticatedIdentityActor = await resolveActor(
    db,
    { rawToken: request.rawToken, referenceType: request.referenceType },
    { verifier: passThroughVerifier },
  );

  return activate(db, {
    adminUserId: actor.userId,
    verifiedMfaSatisfied: deriveVerifiedMfaSatisfied(credential),
    businessId: request.businessId,
    idempotencyKey: request.idempotencyKey,
    // Binds the key to this business AND this resolved administrator: the
    // same key under a different admin (or business) is a fail-closed
    // conflict, never a cross-actor replay.
    requestHash: `business.activateAfterVerification:${request.businessId}:${actor.userId}`,
    correlationId: newId(),
    now: new Date(),
    newId,
  });
}
