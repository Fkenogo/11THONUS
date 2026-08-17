/**
 * Business bootstrap endpoint composition (`ENG-P2-002B`, Phase E/F).
 *
 * The single backend entrypoint `functions/src/index.ts`'s `createBusiness`
 * callable exposes — mirrors
 * `functions/src/domains/authentication/services/authenticationEndpointService.ts`'s
 * exact shape (AUTH-03 precedent): verify a raw provider credential through
 * the existing `TokenVerifierPort` (never a new one), resolve it to an
 * *existing* Customer Identity through the existing AUTH-02
 * `resolveAuthenticatedCredential`, and only then hand a server-derived
 * `ownerUserId` to the bootstrap transaction (`../repositories/businessRepository.ts`).
 *
 * Authority boundary (§10.3, §24 FD-2): `ownerUserId` never comes from
 * `request` — `CreateBusinessRequest` structurally has no such field
 * (`models/businessBootstrap.ts`). An unregistered credential, or one that
 * resolves to a Customer Identity that is not `active`/`dormant` (suspended,
 * locked, closed, archived — none of those may bootstrap a Business), fails
 * closed with `invalidCustomerIdentityForOwnerError` (`AUTH_REQUIRED`)
 * *before* the bootstrap transaction is ever invoked — no partial state is
 * possible at this layer because nothing has been written yet.
 *
 * Kept as a plain, dependency-injected function (not the `onCall` wrapper
 * itself), exactly like AUTH-03, so this composition is unit-testable
 * without the Functions runtime or a live Firestore.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { TokenVerifierPort } from "../../authentication/ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionDeps,
} from "../../authentication/services/credentialResolutionService";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import { invalidCustomerIdentityForOwnerError } from "../models/businessErrors";
import type { CreateBusinessRequest, CreateBusinessResult } from "../models/businessBootstrap";
import {
  bootstrapBusiness,
  type BootstrapBusinessParams,
} from "../repositories/businessRepository";

/** Identity statuses eligible to own a newly-bootstrapped Business (§10.3.3). */
const ELIGIBLE_OWNER_IDENTITY_STATUSES = new Set(["active", "dormant"]);

export type CreateBusinessCommand = CreateBusinessRequest & {
  /** The raw provider credential to verify (e.g. a Firebase ID token). Consumed, never stored. */
  rawToken: string;
  referenceType: AuthenticationReferenceType;
  /** Client-supplied idempotency key for the whole bootstrap request. */
  idempotencyKey: string;
};

export type CreateBusinessDeps = {
  verifier: TokenVerifierPort;
  resolveCredential?: typeof resolveAuthenticatedCredential;
  getIdentity?: (db: Firestore, customerIdentityId: string) => Promise<CustomerIdentity>;
  bootstrap?: (
    db: Firestore,
    request: CreateBusinessRequest,
    params: BootstrapBusinessParams,
  ) => Promise<CreateBusinessResult>;
  resolutionDeps?: CredentialResolutionDeps;
  /** Clock seam. */
  now?: () => Date;
  /** Event/correlation/document id generator seam (CSPRNG-backed by default). */
  newId?: () => string;
};

export async function handleCreateBusiness(
  db: Firestore,
  command: CreateBusinessCommand,
  deps: CreateBusinessDeps,
): Promise<CreateBusinessResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const resolveCredential = deps.resolveCredential ?? resolveAuthenticatedCredential;
  const getIdentity = deps.getIdentity ?? getCustomerIdentityById;
  const bootstrap = deps.bootstrap ?? bootstrapBusiness;

  const { rawToken, referenceType, idempotencyKey, ...request } = command;

  // Verify first — an unverified/absent token fails closed inside the
  // verifier, never reaching identity resolution or the bootstrap transaction.
  const credential = await deps.verifier.verify({ rawToken, referenceType });

  const occurredAt = now();
  const actor: EventActor = { actorType: "user", actorId: credential.referenceId };
  const envelope = {
    eventId: newId(),
    correlationId: newId(),
    actor,
    occurredAt: occurredAt.toISOString(),
  };

  const authResult = await resolveCredential(db, credential, envelope, deps.resolutionDeps);
  if (authResult.outcome !== "resolved") {
    // No Customer Identity exists for this credential — bootstrap never
    // creates one (that is registration's concern, not this command's).
    throw invalidCustomerIdentityForOwnerError(credential.referenceId);
  }

  const identity = await getIdentity(db, authResult.customerIdentityId);
  if (!ELIGIBLE_OWNER_IDENTITY_STATUSES.has(identity.status)) {
    throw invalidCustomerIdentityForOwnerError(authResult.customerIdentityId);
  }

  const ownerUserId = authResult.customerIdentityId;

  return bootstrap(db, request, {
    ownerUserId,
    idempotencyKey,
    actor,
    correlationId: envelope.correlationId,
    now: occurredAt,
    newId,
  });
}
