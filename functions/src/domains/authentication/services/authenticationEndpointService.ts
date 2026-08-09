/**
 * Authentication endpoint composition (AUTH-03, per AUTH-BP §3/§5/§6/§12).
 *
 * The single backend entrypoint the `functions/src/index.ts` callable exposes:
 * it verifies a raw provider credential through the AUTH-02 `TokenVerifierPort`
 * (Firebase Admin ID-token verification, `checkRevoked`) and hands the
 * resulting **verified** `AuthenticatedCredential` to the AUTH-03
 * `registerOrSignIn` orchestration. It adds no identity behaviour of its own —
 * it only builds the governed event envelope and request-scoped command, and
 * shapes a transport-safe, credential-free result.
 *
 * Kept as a plain, dependency-injected function (not the `onCall` wrapper
 * itself) so the composition is unit-testable without the Functions runtime;
 * `index.ts` supplies the production seams and maps errors to the transport.
 * No raw token is retained or returned (TRD10 §10.6.1).
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { TokenVerifierPort } from "../ports/tokenVerifierPort";
import { registerOrSignIn } from "./registrationSignInService";

export type AuthenticateRequest = {
  /** The raw provider credential to verify (e.g. a Firebase ID token). Consumed, never stored. */
  rawToken: string;
  referenceType: AuthenticationReferenceType;
  /** Client-supplied idempotency key for the whole registration/sign-in request. */
  idempotencyKey: string;
};

export type AuthenticateResult = {
  mode: "registered" | "signed_in";
  customerIdentityId: string;
  session: {
    customerIdentityId: string;
    authReference: { referenceType: AuthenticationReferenceType; referenceId: string };
    issuedAt: string;
  };
};

export type AuthenticateDeps = {
  verifier: TokenVerifierPort;
  orchestrate?: typeof registerOrSignIn;
  /** Clock seam. */
  now?: () => Date;
  /** Event/correlation id generator seam (CSPRNG-backed by default). */
  newId?: () => string;
};

export async function handleAuthenticate(
  db: Firestore,
  request: AuthenticateRequest,
  deps: AuthenticateDeps,
): Promise<AuthenticateResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const orchestrate = deps.orchestrate ?? registerOrSignIn;

  // Verify first — an unverified/absent token fails closed inside the verifier
  // (AUTH_REQUIRED / AUTH_FORBIDDEN / …), never reaching orchestration.
  const credential = await deps.verifier.verify({
    rawToken: request.rawToken,
    referenceType: request.referenceType,
  });

  const issuedAt = now();
  const actor: EventActor = { actorType: "user", actorId: credential.referenceId };
  const envelope = {
    eventId: newId(),
    correlationId: newId(),
    actor,
    occurredAt: issuedAt.toISOString(),
  };
  const command = {
    idempotencyKey: request.idempotencyKey,
    // Binds the idempotency key to this exact credential: a reused key with a
    // different credential is a fail-closed idempotency conflict, not a silent
    // cross-credential replay. Carries only references, no token material.
    requestHash: `authenticate:${credential.referenceType}:${credential.referenceId}`,
    issuedAt,
  };

  const outcome = await orchestrate(db, credential, envelope, command);

  return {
    mode: outcome.mode,
    customerIdentityId: outcome.customerIdentityId,
    session: {
      customerIdentityId: outcome.session.customerIdentityId,
      authReference: outcome.session.authReference,
      issuedAt: outcome.session.issuedAt.toISOString(),
    },
  };
}
