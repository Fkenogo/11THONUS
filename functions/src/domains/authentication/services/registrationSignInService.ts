/**
 * Registration / sign-in orchestration (AUTH-03, per AUTH-BP §5/§6/§12).
 *
 * The backend orchestration that turns a *verified* `AuthenticatedCredential`
 * into an authenticated outcome — registering a new customer or signing in a
 * returning one — by composing existing, already-merged responsibilities. It
 * **owns no identity state and duplicates none**:
 *
 *   - resolution (new-vs-returning) is the AUTH-02 `resolveAuthenticatedCredential`
 *     consuming the Customer Identity `-09` lookup;
 *   - new-customer creation is the Customer Identity `-01`/`-05`
 *     `createCustomerIdentity` (transactional, idempotent, emits
 *     `CustomerIdentityRegistered`);
 *   - the initial authentication reference is established through the existing
 *     `-08` `linkAuthenticationReferenceForIdentity` path delivered by
 *     AUTH-CORR-001 (materialises the authoritative
 *     `authenticationReferences/{type}:{id}` document, emits
 *     `AuthenticationReferenceLinked`); cross-identity conflict fails closed;
 *   - the session is issued through the existing AUTH-01 `createSessionContext`
 *     responsibility.
 *
 * Event boundary (examined; AUTH-BP §12 governs). §5/§6 describe the flow as
 * "emit `CustomerAuthenticated`", but §12 assigns the fire-and-forget
 * trust/audit `CustomerAuthenticated` emission to **AUTH-08**, and the
 * completed AUTH-01 `authenticationEvents.ts` states emission is AUTH-08, not
 * the flow. Following the explicit §12 responsibility allocation, AUTH-03 does
 * **not** write `CustomerAuthenticated`: it lets the domain operations it calls
 * emit their own already-owned state-change events (`CustomerIdentityRegistered`
 * via `-01`, `AuthenticationReferenceLinked` via `-08`) and issues the session;
 * the `CustomerAuthenticated` trust signal remains AUTH-08's responsibility.
 * There is deliberately no outbox/emit seam on this service.
 *
 * Firebase-adapter (services) sub-layer — composes repositories that take a
 * Firestore handle. No credential material is read, written, logged, or
 * returned (TRD10 §10.6.1); only the provider-neutral reference flows through.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import { createSessionContext, type SessionContext } from "../models/sessionContext";
import {
  accountSuspendedForAuthenticationError,
  authenticationForbiddenError,
} from "../models/authenticationErrors";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionEnvelope,
} from "./credentialResolutionService";
import {
  createCustomerIdentity,
  getCustomerIdentityById,
} from "../../identity/repositories/customerIdentityRepository";
import { linkAuthenticationReferenceForIdentity } from "../../identity/repositories/authenticationReferenceRepository";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";

/** The governed event envelope carried through resolution and creation. */
export type RegistrationSignInEnvelope = CredentialResolutionEnvelope;

/**
 * Request-scoped command inputs. `idempotencyKey` is the single client-supplied
 * key for the whole registration/sign-in request; the two idempotent identity
 * operations (`-01` create, `-08` link) derive distinct keys from it so they
 * never collide on the shared `idempotencyRecords/{key}` document.
 */
export type RegistrationSignInCommand = {
  idempotencyKey: string;
  requestHash: string;
  /** Session issuance instant, and the `createdAt`/`linkedAt` of a registration. */
  issuedAt: Date;
};

export type RegistrationSignInOutcome = {
  mode: "registered" | "signed_in";
  customerIdentityId: string;
  session: SessionContext;
};

/** Injected seams — default to the real, merged implementations. */
export type RegistrationSignInDeps = {
  resolve?: typeof resolveAuthenticatedCredential;
  createIdentity?: typeof createCustomerIdentity;
  linkReference?: typeof linkAuthenticationReferenceForIdentity;
  getIdentityById?: typeof getCustomerIdentityById;
  /** Generates the new internal Customer ID for a registration (CSPRNG-backed). */
  generateCustomerIdentityId?: () => string;
};

/**
 * Gate a returning-user sign-in on the identity's access state (AUTH-BP §6
 * step 2). Only an `active` identity may receive a session; everything else
 * fails closed — `suspended` distinctly (`ACCOUNT_SUSPENDED`), any other
 * non-active state (`locked`, `closed`, `archived`, `dormant`, `registered`)
 * as `AUTH_FORBIDDEN`. Access-state *management* remains the Customer Identity
 * `-06` responsibility; this only reads and enforces it.
 */
function assertMaySignIn(identity: CustomerIdentity): void {
  if (identity.status === "active") {
    return;
  }
  if (identity.status === "suspended") {
    throw accountSuspendedForAuthenticationError(identity.id);
  }
  throw authenticationForbiddenError();
}

/**
 * Orchestrate registration or sign-in for a **verified** credential.
 *
 * Resolves the credential (AUTH-02): a `resolved` outcome is a returning-user
 * sign-in (access-state gated, no identity mutation); an `unregistered`
 * outcome is a new-customer registration (`-01` create + `-08` establish).
 * Either way a `SessionContext` is issued for the owning identity. Any failure
 * — malformed input, cross-identity conflict, infrastructure — propagates
 * unchanged (fail closed).
 */
export async function registerOrSignIn(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: RegistrationSignInEnvelope,
  command: RegistrationSignInCommand,
  deps: RegistrationSignInDeps = {},
): Promise<RegistrationSignInOutcome> {
  const resolve = deps.resolve ?? resolveAuthenticatedCredential;
  const createIdentity = deps.createIdentity ?? createCustomerIdentity;
  const linkReference = deps.linkReference ?? linkAuthenticationReferenceForIdentity;
  const getIdentityById = deps.getIdentityById ?? getCustomerIdentityById;
  const generateCustomerIdentityId = deps.generateCustomerIdentityId ?? randomUUID;

  const resolution = await resolve(db, credential, envelope);

  if (resolution.outcome === "resolved") {
    const identity = await getIdentityById(db, resolution.customerIdentityId);
    assertMaySignIn(identity);
    return {
      mode: "signed_in",
      customerIdentityId: identity.id,
      session: issueSession(identity.id, credential, command.issuedAt),
    };
  }

  // Registration path (new credential): create the identity (embeds the initial
  // reference) then establish the authoritative reference through -08.
  //
  // The two operations each emit their own domain event through the shared
  // outbox, which is keyed by `eventId`. They must therefore carry *distinct*
  // eventIds or the second would overwrite the first (clobbering
  // `CustomerIdentityRegistered`). We derive them deterministically from the
  // request's base eventId so a replay reuses the same outbox document ids
  // (idempotent), while sharing the one `correlationId` that ties the request's
  // events together. The base eventId is left to the resolution step's own
  // `-09` audit event.
  const customerIdentityId = generateCustomerIdentityId();
  const createdBy = customerIdentityId;
  const requestContext = {
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
  };

  await createIdentity(db, {
    ...requestContext,
    eventId: `${envelope.eventId}:identity.create`,
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: credential.referenceId,
      referenceType: credential.referenceType,
      createdAt: command.issuedAt,
      createdBy,
    },
    createdAt: command.issuedAt,
    createdBy,
    idempotencyKey: `${command.idempotencyKey}:identity.create`,
    requestHash: command.requestHash,
  });

  const identity = await linkReference(db, {
    ...requestContext,
    eventId: `${envelope.eventId}:identity.link`,
    customerIdentityId,
    referenceId: credential.referenceId,
    referenceType: credential.referenceType,
    authority: "customer_initiated",
    reason: "customer_request",
    linkedAt: command.issuedAt,
    linkedBy: createdBy,
    idempotencyKey: `${command.idempotencyKey}:identity.link`,
    requestHash: command.requestHash,
  });

  return {
    mode: "registered",
    customerIdentityId: identity.id,
    session: issueSession(identity.id, credential, command.issuedAt),
  };
}

function issueSession(
  customerIdentityId: string,
  credential: AuthenticatedCredential,
  issuedAt: Date,
): SessionContext {
  return createSessionContext({ customerIdentityId, credential, issuedAt });
}
