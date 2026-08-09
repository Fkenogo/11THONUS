/**
 * Registration / sign-in orchestration (AUTH-03, per AUTH-BP §5/§6/§12).
 *
 * The backend orchestration that turns a *verified* `AuthenticatedCredential`
 * into an authenticated outcome — registering a new customer or signing in a
 * returning one — by composing already-merged responsibilities. It owns no
 * identity state and duplicates none:
 *
 *   - resolution (new-vs-returning) is the AUTH-02 `resolveAuthenticatedCredential`
 *     consuming the Customer Identity `-09` lookup;
 *   - new-customer creation is the Customer Identity `-01`/`-05`
 *     `createCustomerIdentity` (transactional, idempotent, emits
 *     `CustomerIdentityRegistered`);
 *   - the initial authentication reference is established through the existing
 *     `-08` `linkAuthenticationReferenceForIdentity` path delivered by
 *     AUTH-CORR-001 (materialises the authoritative reference, emits
 *     `AuthenticationReferenceLinked`); cross-identity conflict fails closed;
 *   - the session is issued through the existing AUTH-01 `createSessionContext`.
 *
 * Durability / idempotency (correction of the four post-implementation review
 * findings, using only the shared idempotency facility — no new subsystem, no
 * `-01`/`-08`/`-09`/idempotency change):
 *
 *   - **Request-level replay (client key).** The whole command is wrapped in a
 *     `checkAndReserveIdempotencyKey` gate keyed by the client idempotency key,
 *     `requestHash` bound to the credential. A `duplicate` replays the stored
 *     `responseSnapshot` — a same-key retry reproduces the *original* outcome
 *     (a completed registration replays as `registered`, never silently a new
 *     `signed_in`); a same-key/different-credential reuse is a fail-closed
 *     `conflict`; a concurrent same-key attempt is `in_progress`.
 *   - **Per-credential registration (concurrency + resume).** The `-01`/`-08`
 *     operations are keyed by the *credential*
 *     (`authentication.register:{type}:{refId}:identity.{create|link}`), so two
 *     concurrent registrations for the same reference serialise on one
 *     reservation — the loser observes `in_progress` and fails closed *before*
 *     creating anything (no orphan identity). The internal Customer ID is
 *     recovered from the durable create record on retry (peek → `resultReference`),
 *     so a partial-failure retry resumes on the *same* identity instead of
 *     regenerating one.
 *
 * Event boundary (examined; AUTH-BP §12 governs). AUTH-03 does **not** write
 * `CustomerAuthenticated`: `-01`/`-08` emit their own state-change events and
 * AUTH-03 issues the session; the `CustomerAuthenticated` trust signal remains
 * AUTH-08's responsibility. There is deliberately no outbox/emit seam here.
 *
 * Firebase-adapter (services) sub-layer. No credential material is read,
 * written, logged, or returned (TRD10 §10.6.1); only the provider-neutral
 * reference flows through.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import { createSessionContext, type SessionContext } from "../models/sessionContext";
import {
  accountSuspendedForAuthenticationError,
  authenticationCommandConflictError,
  authenticationForbiddenError,
  authenticationProviderUnavailableError,
  invalidAuthenticatedCredentialError,
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
import {
  checkAndReserveIdempotencyKey,
  checkIdempotency,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";

const USERS_COLLECTION = "users";
const AUTHENTICATE_OPERATION = "authentication.authenticate";
const CREATE_OPERATION = "identity.create";
const LINK_OPERATION = "identity.linkAuthenticationReference";

/** Bounds the client key well under Firestore's document-id ceiling. */
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

/**
 * A safe single Firestore path segment: one or more of unreserved URL /
 * document-id characters. Excludes `/` (path traversal), whitespace, and every
 * ASCII control character without needing a control-character regex.
 */
const SAFE_IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]+$/;

export type RegistrationSignInEnvelope = CredentialResolutionEnvelope;

export type RegistrationSignInCommand = {
  /** Client-supplied idempotency key for the whole registration/sign-in request. */
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
  generateCustomerIdentityId?: () => string;
  reserveIdempotencyKey?: typeof checkAndReserveIdempotencyKey;
  completeIdempotencyKey?: typeof completeIdempotencyKey;
  failIdempotencyKey?: typeof failIdempotencyKey;
  peekIdempotencyKey?: typeof checkIdempotency;
};

/** The cached command result replayed on a same-key retry. */
type ReplaySnapshot = {
  mode: "registered" | "signed_in";
  issuedAt: string;
};

/**
 * A client idempotency key becomes a Firestore document id (`idempotencyRecords/{key}`
 * and the derived registration keys). Reject anything that is not a single safe
 * path segment *before* it reaches Firestore, with the existing `VALIDATION_FAILED`
 * taxonomy — never an internal Firestore/path error (finding P2-4).
 */
export function assertSafeIdempotencyKey(idempotencyKey: string): void {
  const invalid =
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
    idempotencyKey === "." ||
    idempotencyKey === ".." ||
    !SAFE_IDEMPOTENCY_KEY.test(idempotencyKey);
  if (invalid) {
    throw invalidAuthenticatedCredentialError("idempotencyKey", String(idempotencyKey));
  }
}

/** Stable, credential-bound request hash (equal across retries; differs per credential). */
function credentialBinding(credential: AuthenticatedCredential, scope: string): string {
  return `${scope}:${credential.referenceType}:${credential.referenceId}`;
}

/**
 * Gate a returning-user sign-in on the identity's access state (AUTH-BP §6
 * step 2). Only `active` may receive a session; `suspended` → `ACCOUNT_SUSPENDED`,
 * any other non-active state → `AUTH_FORBIDDEN` (fail closed). Access-state
 * management remains the Customer Identity `-06` responsibility.
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

function issueSession(
  customerIdentityId: string,
  credential: AuthenticatedCredential,
  issuedAt: Date,
): SessionContext {
  return createSessionContext({ customerIdentityId, credential, issuedAt });
}

function usersIdFromReference(resultReference: string | undefined): string | undefined {
  if (typeof resultReference !== "string") {
    return undefined;
  }
  const [collection, id] = resultReference.split("/");
  return collection === USERS_COLLECTION && id ? id : undefined;
}

/**
 * Orchestrate registration or sign-in for a **verified** credential, wrapped in
 * a request-level idempotency gate so a same-key retry reproduces the original
 * outcome. Any failure propagates unchanged (fail closed) after releasing the
 * key for retry.
 */
export async function registerOrSignIn(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: RegistrationSignInEnvelope,
  command: RegistrationSignInCommand,
  deps: RegistrationSignInDeps = {},
): Promise<RegistrationSignInOutcome> {
  assertSafeIdempotencyKey(command.idempotencyKey);

  const reserve = deps.reserveIdempotencyKey ?? checkAndReserveIdempotencyKey;
  const complete = deps.completeIdempotencyKey ?? completeIdempotencyKey;
  const fail = deps.failIdempotencyKey ?? failIdempotencyKey;

  const commandKey = `${AUTHENTICATE_OPERATION}:${command.idempotencyKey}`;
  const reservation = await reserve(db, {
    idempotencyKey: commandKey,
    operationType: AUTHENTICATE_OPERATION,
    actorId: credential.referenceId,
    requestHash: credentialBinding(credential, "authenticate"),
    correlationId: envelope.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return replayOutcome(reservation.record, credential, command);
  }
  if (reservation.outcome === "in_progress" || reservation.outcome === "conflict") {
    // Concurrent same-key attempt, or the key reused with a different
    // credential — both fail closed (finding P2-3, and the credential binding).
    throw authenticationCommandConflictError(AUTHENTICATE_OPERATION);
  }

  try {
    const outcome = await resolveAndRegisterOrSignIn(db, credential, envelope, command, deps);
    const snapshot: ReplaySnapshot = {
      mode: outcome.mode,
      issuedAt: command.issuedAt.toISOString(),
    };
    await complete(db, commandKey, `${USERS_COLLECTION}/${outcome.customerIdentityId}`, snapshot);
    return outcome;
  } catch (error) {
    await fail(db, commandKey);
    throw error;
  }
}

/** Rebuild the original outcome from the cached idempotency record (same-key replay). */
function replayOutcome(
  record: { resultReference?: string; responseSnapshot?: unknown },
  credential: AuthenticatedCredential,
  command: RegistrationSignInCommand,
): RegistrationSignInOutcome {
  const id = usersIdFromReference(record.resultReference);
  const snapshot = record.responseSnapshot as ReplaySnapshot | undefined;
  if (id === undefined || snapshot === undefined || snapshot.mode === undefined) {
    // Anomalous completed record with no usable body — never fabricate a
    // result; surface a retryable error (mirrors the shared dispatcher).
    throw authenticationProviderUnavailableError("authentication");
  }
  const issuedAt = new Date(snapshot.issuedAt);
  return {
    mode: snapshot.mode,
    customerIdentityId: id,
    session: issueSession(
      id,
      credential,
      Number.isNaN(issuedAt.getTime()) ? command.issuedAt : issuedAt,
    ),
  };
}

/** The resolve → sign-in / register decision, run once per acquired request key. */
async function resolveAndRegisterOrSignIn(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: RegistrationSignInEnvelope,
  command: RegistrationSignInCommand,
  deps: RegistrationSignInDeps,
): Promise<RegistrationSignInOutcome> {
  const resolve = deps.resolve ?? resolveAuthenticatedCredential;
  const getIdentityById = deps.getIdentityById ?? getCustomerIdentityById;

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

  return register(db, credential, envelope, command, deps);
}

/**
 * Registration path (new credential): create the identity (`-01`, embeds the
 * initial reference) then establish the authoritative reference (`-08`). Both
 * operations are keyed by the *credential* so concurrent registrations for the
 * same reference serialise (loser fails closed, no orphan), and the identity id
 * is recovered from the durable create record on retry (stable resume).
 */
async function register(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: RegistrationSignInEnvelope,
  command: RegistrationSignInCommand,
  deps: RegistrationSignInDeps,
): Promise<RegistrationSignInOutcome> {
  const createIdentity = deps.createIdentity ?? createCustomerIdentity;
  const linkReference = deps.linkReference ?? linkAuthenticationReferenceForIdentity;
  const peek = deps.peekIdempotencyKey ?? checkIdempotency;
  const generateCustomerIdentityId = deps.generateCustomerIdentityId ?? randomUUID;

  const regBase = `authentication.register:${credential.referenceType}:${credential.referenceId}`;
  const createKey = `${regBase}:${CREATE_OPERATION}`;
  const linkKey = `${regBase}:${LINK_OPERATION}`;
  const createHash = credentialBinding(credential, "register.create");
  const linkHash = credentialBinding(credential, "register.link");

  // Recover the id from the durable create record on a resume; otherwise mint a
  // fresh one. Concurrency is enforced by `createCustomerIdentity`'s own atomic
  // reservation on `createKey` below — a benign peek race is harmless because
  // only the reservation winner ever persists a `users` document.
  const peeked = await peek(db, createKey, createHash, envelope.correlationId);
  const recoveredId =
    peeked.outcome === "duplicate"
      ? usersIdFromReference(peeked.record.resultReference)
      : undefined;
  const customerIdentityId = recoveredId ?? generateCustomerIdentityId();
  const createdBy = customerIdentityId;
  const requestContext = {
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
  };

  await createIdentity(db, {
    ...requestContext,
    eventId: `${envelope.eventId}:${CREATE_OPERATION}`,
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: credential.referenceId,
      referenceType: credential.referenceType,
      createdAt: command.issuedAt,
      createdBy,
    },
    createdAt: command.issuedAt,
    createdBy,
    idempotencyKey: createKey,
    requestHash: createHash,
  });

  const identity = await linkReference(db, {
    ...requestContext,
    eventId: `${envelope.eventId}:${LINK_OPERATION}`,
    customerIdentityId,
    referenceId: credential.referenceId,
    referenceType: credential.referenceType,
    authority: "customer_initiated",
    reason: "customer_request",
    linkedAt: command.issuedAt,
    linkedBy: createdBy,
    idempotencyKey: linkKey,
    requestHash: linkHash,
  });

  return {
    mode: "registered",
    customerIdentityId: identity.id,
    session: issueSession(identity.id, credential, command.issuedAt),
  };
}
