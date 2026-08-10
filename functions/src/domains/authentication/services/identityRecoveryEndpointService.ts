/**
 * Identity-recovery endpoint composition (AUTH-06, per AUTH-BP §8/§12).
 *
 * The backend entrypoint the `functions/src/index.ts` recovery callable exposes.
 * It verifies the recovery provider credential through the AUTH-02
 * `TokenVerifierPort` (proof the caller controls a provider), then hands the
 * verified credential to the AUTH-06 `identityRecoveryService` orchestration and
 * shapes a transport-safe, credential-free result.
 *
 * Kept as plain, dependency-injected functions (not the `onCall` wrapper itself)
 * so the composition is unit-testable without the Functions runtime; `index.ts`
 * supplies the production seams and maps errors to the transport. No raw token is
 * retained or returned (TRD10 §10.6.1).
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { RecoveryProofMethodCategory } from "../../identity/models/recoveryProof";
import type { TokenVerifierPort } from "../ports/tokenVerifierPort";
import {
  recoverAuthenticatedIdentity,
  type IdentityRecoveryCommand,
  type IdentityRecoveryEnvelope,
} from "./identityRecoveryService";

export type RecoverIdentityRequest = {
  /** The provider the caller proves control of (verified, then resolved to the owning identity). */
  rawToken: string;
  referenceType: AuthenticationReferenceType;
  /** Client-supplied idempotency key for the whole recovery request. */
  idempotencyKey: string;
};

export type RecoverIdentityResult = {
  operation: "recovered";
  customerIdentityId: string;
  methodCategory: RecoveryProofMethodCategory;
};

export type IdentityRecoveryEndpointDeps = {
  verifier: TokenVerifierPort;
  recover?: typeof recoverAuthenticatedIdentity;
  /** Clock seam. */
  now?: () => Date;
  /** Event/correlation id generator seam (CSPRNG-backed by default). */
  newId?: () => string;
};

export async function handleRecoverIdentity(
  db: Firestore,
  request: RecoverIdentityRequest,
  deps: IdentityRecoveryEndpointDeps,
): Promise<RecoverIdentityResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const recover = deps.recover ?? recoverAuthenticatedIdentity;

  // Verify the credential up front — an unverified/absent token fails closed
  // inside the verifier and never reaches orchestration.
  const credential = await deps.verifier.verify({
    rawToken: request.rawToken,
    referenceType: request.referenceType,
  });

  const requestedAt = now();
  const actor: EventActor = { actorType: "user", actorId: credential.referenceId };
  const envelope: IdentityRecoveryEnvelope = {
    eventId: newId(),
    correlationId: newId(),
    actor,
    occurredAt: requestedAt.toISOString(),
  };
  const command: IdentityRecoveryCommand = {
    idempotencyKey: request.idempotencyKey,
    requestedAt,
  };

  return recover(db, credential, envelope, command);
}
