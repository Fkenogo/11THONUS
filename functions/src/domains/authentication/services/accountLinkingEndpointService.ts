/**
 * Account-linking endpoint composition (AUTH-05, per AUTH-BP §3/§7/§12).
 *
 * The backend entrypoints the `functions/src/index.ts` link/unlink callables
 * expose. Each verifies the *acting* provider credential through the AUTH-02
 * `TokenVerifierPort` (proof the caller controls the identity being modified),
 * and — for link — verifies the *new* provider credential too (proof the caller
 * controls the provider being added). It then hands the verified credentials to
 * the AUTH-05 `accountLinkingService` orchestration and shapes a transport-safe,
 * credential-free result.
 *
 * Kept as plain, dependency-injected functions (not the `onCall` wrappers
 * themselves) so the composition is unit-testable without the Functions runtime;
 * `index.ts` supplies the production seams and maps errors to the transport.
 * No raw token is retained or returned (TRD10 §10.6.1).
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { TokenVerifierPort } from "../ports/tokenVerifierPort";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import {
  linkAuthenticationProvider,
  unlinkAuthenticationProvider,
  type AccountLinkingEnvelope,
  type AccountLinkingCommand,
} from "./accountLinkingService";

export type LinkProviderRequest = {
  /** The provider the caller is already authenticated with (verified, then resolved to their identity). */
  actingRawToken: string;
  actingReferenceType: AuthenticationReferenceType;
  /** The provider being added (verified as proof of control, then linked). */
  newRawToken: string;
  newReferenceType: AuthenticationReferenceType;
  /** Client-supplied idempotency key for the whole link request. */
  idempotencyKey: string;
};

export type UnlinkProviderRequest = {
  actingRawToken: string;
  actingReferenceType: AuthenticationReferenceType;
  /** The reference to remove from the acting identity (named, not re-verified; ownership enforced by `-08`). */
  targetReferenceType: AuthenticationReferenceType;
  targetReferenceId: string;
  idempotencyKey: string;
};

export type AccountLinkingResult = {
  operation: "linked" | "unlinked";
  customerIdentityId: string;
  reference: { referenceType: AuthenticationReferenceType; referenceId: string };
};

export type AccountLinkingEndpointDeps = {
  verifier: TokenVerifierPort;
  linkProvider?: typeof linkAuthenticationProvider;
  unlinkProvider?: typeof unlinkAuthenticationProvider;
  /** Clock seam. */
  now?: () => Date;
  /** Event/correlation id generator seam (CSPRNG-backed by default). */
  newId?: () => string;
};

function envelopeAndCommand(
  actingCredential: AuthenticatedCredential,
  idempotencyKey: string,
  now: () => Date,
  newId: () => string,
): { envelope: AccountLinkingEnvelope; command: AccountLinkingCommand } {
  const requestedAt = now();
  const actor: EventActor = { actorType: "user", actorId: actingCredential.referenceId };
  return {
    envelope: {
      eventId: newId(),
      correlationId: newId(),
      actor,
      occurredAt: requestedAt.toISOString(),
    },
    command: { idempotencyKey, requestedAt },
  };
}

export async function handleLinkProvider(
  db: Firestore,
  request: LinkProviderRequest,
  deps: AccountLinkingEndpointDeps,
): Promise<AccountLinkingResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const link = deps.linkProvider ?? linkAuthenticationProvider;

  // Verify both credentials up front — an unverified/absent token fails closed
  // inside the verifier and never reaches orchestration.
  const actingCredential = await deps.verifier.verify({
    rawToken: request.actingRawToken,
    referenceType: request.actingReferenceType,
  });
  const newCredential = await deps.verifier.verify({
    rawToken: request.newRawToken,
    referenceType: request.newReferenceType,
  });

  const { envelope, command } = envelopeAndCommand(
    actingCredential,
    request.idempotencyKey,
    now,
    newId,
  );
  const outcome = await link(db, actingCredential, newCredential, envelope, command);
  return outcome;
}

export async function handleUnlinkProvider(
  db: Firestore,
  request: UnlinkProviderRequest,
  deps: AccountLinkingEndpointDeps,
): Promise<AccountLinkingResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const unlink = deps.unlinkProvider ?? unlinkAuthenticationProvider;

  const actingCredential = await deps.verifier.verify({
    rawToken: request.actingRawToken,
    referenceType: request.actingReferenceType,
  });

  const { envelope, command } = envelopeAndCommand(
    actingCredential,
    request.idempotencyKey,
    now,
    newId,
  );
  const outcome = await unlink(
    db,
    actingCredential,
    { referenceType: request.targetReferenceType, referenceId: request.targetReferenceId },
    envelope,
    command,
  );
  return outcome;
}
