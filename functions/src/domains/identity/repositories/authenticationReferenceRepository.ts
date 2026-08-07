/**
 * Cross-identity authentication-reference uniqueness and link/unlink
 * repository (ENG-P2-001-08).
 *
 * The `-01`/`-05` `users/{id}.authenticationReferences` array is a
 * PROJECTION scoped to one identity — nothing about it prevents the same
 * `referenceId` from being linked to two different identities, since a
 * write to one identity's array never looks at any other identity's
 * document. This module adds the missing AUTHORITATIVE source: one
 * `authenticationReferences/{referenceType}:{referenceId}` document per
 * provider-subject reference, doc-ID-keyed exactly like `loyaltyNumbers/
 * {value}` and `qrIdentityRecords/{qrReference}` — the doc ID itself IS
 * the uniqueness key, checked via `transaction.get()` before any write,
 * making cross-identity uniqueness race-free within one Firestore
 * transaction (TRD12 AIR-001, "One Firebase Authentication UID shall map
 * to one active platform user" — this composite key is a strict superset
 * of AIR-001's own bare-UID requirement, not a competing tenant model).
 *
 * Both the authoritative record and the per-identity projection are
 * updated atomically in the same transaction — the "authoritative record
 * plus transactionally-maintained projection" combination this task's own
 * brief names as an acceptable persistence shape, rather than a second
 * source of truth.
 *
 * Cross-identity conflict resolution (explicit, disclosed policy — the
 * governing sources do not specify a permissive alternative, so this
 * follows the fail-closed default this domain has already used
 * elsewhere): a reference already linked to a DIFFERENT identity, or
 * previously unlinked from a DIFFERENT identity, is refused — this
 * repository never transfers or merges a reference across identities.
 * Only the SAME identity that originally linked a now-unlinked reference
 * may re-link it; that carries no cross-identity risk and is not a
 * merge/transfer decision. On refusal, a privacy-safe
 * `AuthenticationReferenceConflictDetected` event is still committed
 * (durable audit evidence for future manual review), but no
 * identity/authoritative-record mutation occurs — the conflict-detection
 * transaction branch never touches either document, only the outbox.
 */

import type { Firestore, Timestamp } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { stampCreate, stampUpdate } from "../../../shared/metadata/baseMetadata";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  linkAuthenticationReference,
  unlinkAuthenticationReference,
  type CustomerIdentity,
  type LinkAuthenticationReferenceMeta,
} from "../models/customerIdentity";
import type {
  AuthenticationReferenceLinkStatus,
  AuthenticationReferenceType,
} from "../models/authenticationReference";
import type { TransitionAuthority } from "../models/transitionAuthority";
import type { TransitionReason } from "../models/transitionReason";
import { buildAuthenticationReferenceConflictDetectedEvent } from "../events/identityEvents";
import {
  IdentityDomainError,
  authenticationReferenceCommandConflictError,
  authenticationReferenceLinkedToDifferentIdentityError,
  authenticationReferenceNotFoundError,
  staleAuthenticationReferenceStatusError,
  unknownCustomerIdentityError,
} from "../models/identityErrors";
import { toUserDocument, fromUserDocument } from "./userDocument";

const USERS_COLLECTION = "users";
const AUTHENTICATION_REFERENCES_COLLECTION = "authenticationReferences";

function authenticationReferenceDocId(
  referenceType: AuthenticationReferenceType,
  referenceId: string,
): string {
  return `${referenceType}:${referenceId}`;
}

// Field named `status` here, not `linkStatus` as in the domain type
// (`authenticationReference.ts`) and the `users` projection
// (`userDocument.ts`) — cosmetic naming drift for the same concept,
// dispositioned and retained as-is per `ENG-P2-ARCH-CORR-004`, Finding
// F5 (see `authenticationReference.ts`'s own note for the full
// rationale). Not renamed here: `status` is this collection's live,
// persisted Firestore field name.
type AuthenticationReferenceRecordDocument = {
  referenceType: AuthenticationReferenceType;
  referenceId: string;
  customerIdentityId: string;
  status: AuthenticationReferenceLinkStatus;
  linkedAt: Timestamp;
  unlinkedAt: Timestamp | null;
};

function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

export type LinkAuthenticationReferenceForIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  referenceId: string;
  referenceType: AuthenticationReferenceType;
  authority: TransitionAuthority;
  reason: TransitionReason;
  linkedAt: Date;
  linkedBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

type LinkTransactionResult =
  | { kind: "linked"; identity: CustomerIdentity }
  | { kind: "conflict"; owningCustomerIdentityId: string };

export async function linkAuthenticationReferenceForIdentity(
  db: Firestore,
  params: LinkAuthenticationReferenceForIdentityParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.linkAuthenticationReference",
    actorId: params.linkedBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityByIdInternal(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw authenticationReferenceCommandConflictError(params.referenceType, params.referenceId);
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const identityRef = db.collection(USERS_COLLECTION).doc(params.customerIdentityId);
  const authRefRef = db
    .collection(AUTHENTICATION_REFERENCES_COLLECTION)
    .doc(authenticationReferenceDocId(params.referenceType, params.referenceId));

  const meta: LinkAuthenticationReferenceMeta = {
    authority: params.authority,
    reason: params.reason,
  };

  try {
    const result = await db.runTransaction<LinkTransactionResult>(async (transaction) => {
      const [identitySnapshot, authRefSnapshot] = await Promise.all([
        transaction.get(identityRef),
        transaction.get(authRefRef),
      ]);

      if (!identitySnapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }

      const existing = authRefSnapshot.exists
        ? (authRefSnapshot.data() as AuthenticationReferenceRecordDocument)
        : undefined;

      if (existing && existing.customerIdentityId !== params.customerIdentityId) {
        const conflictEvent = buildAuthenticationReferenceConflictDetectedEvent({
          eventId: params.eventId,
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.occurredAt,
          customerIdentityId: params.customerIdentityId,
          referenceType: params.referenceType,
          authority: params.authority,
          reason: params.reason,
        });
        writeOutboxEntry(transaction, db, conflictEvent);
        return { kind: "conflict", owningCustomerIdentityId: existing.customerIdentityId };
      }

      const current = fromUserDocument(identitySnapshot.data());

      const { identity: updated, event } = linkAuthenticationReference(
        current,
        {
          referenceId: params.referenceId,
          referenceType: params.referenceType,
          createdAt: params.linkedAt,
          createdBy: params.linkedBy,
        },
        {
          eventId: params.eventId,
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.occurredAt,
        },
        meta,
      );

      transaction.update(identityRef, {
        authenticationReferences: toUserDocument(updated).authenticationReferences,
        ...stampUpdate(params.linkedBy),
      });

      const authRefRecord: AuthenticationReferenceRecordDocument = {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        customerIdentityId: params.customerIdentityId,
        status: "linked",
        linkedAt: toTimestampLike(params.linkedAt),
        unlinkedAt: null,
      };
      transaction.set(authRefRef, {
        ...authRefRecord,
        schemaVersion: 1,
        ...stampCreate(params.linkedBy),
      });

      writeOutboxEntry(transaction, db, event);

      return { kind: "linked", identity: updated };
    });

    if (result.kind === "conflict") {
      throw authenticationReferenceLinkedToDifferentIdentityError(
        params.referenceType,
        params.referenceId,
        params.customerIdentityId,
        result.owningCustomerIdentityId,
      );
    }

    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `${USERS_COLLECTION}/${result.identity.id}`,
    );
    return result.identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export type UnlinkAuthenticationReferenceForIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  referenceId: string;
  referenceType: AuthenticationReferenceType;
  authority: TransitionAuthority;
  reason: TransitionReason;
  unlinkedAt: Date;
  unlinkedBy: string | null;
  idempotencyKey: string;
  requestHash: string;
  expectedStatus?: AuthenticationReferenceLinkStatus;
};

export async function unlinkAuthenticationReferenceForIdentity(
  db: Firestore,
  params: UnlinkAuthenticationReferenceForIdentityParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.unlinkAuthenticationReference",
    actorId: params.unlinkedBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityByIdInternal(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw authenticationReferenceCommandConflictError(params.referenceType, params.referenceId);
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const identityRef = db.collection(USERS_COLLECTION).doc(params.customerIdentityId);
  const authRefRef = db
    .collection(AUTHENTICATION_REFERENCES_COLLECTION)
    .doc(authenticationReferenceDocId(params.referenceType, params.referenceId));

  const meta: LinkAuthenticationReferenceMeta = {
    authority: params.authority,
    reason: params.reason,
  };

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const [identitySnapshot, authRefSnapshot] = await Promise.all([
        transaction.get(identityRef),
        transaction.get(authRefRef),
      ]);

      if (!identitySnapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }

      const existing = authRefSnapshot.exists
        ? (authRefSnapshot.data() as AuthenticationReferenceRecordDocument)
        : undefined;

      if (!existing || existing.customerIdentityId !== params.customerIdentityId) {
        throw authenticationReferenceNotFoundError(params.referenceId);
      }

      if (params.expectedStatus !== undefined && existing.status !== params.expectedStatus) {
        throw staleAuthenticationReferenceStatusError(
          params.referenceType,
          params.referenceId,
          params.expectedStatus,
          existing.status,
        );
      }

      const current = fromUserDocument(identitySnapshot.data());

      const { identity: updated, event } = unlinkAuthenticationReference(
        current,
        params.referenceId,
        {
          eventId: params.eventId,
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.occurredAt,
        },
        meta,
      );

      transaction.update(identityRef, {
        authenticationReferences: toUserDocument(updated).authenticationReferences,
        ...stampUpdate(params.unlinkedBy),
      });

      transaction.update(authRefRef, {
        status: "unlinked",
        unlinkedAt: toTimestampLike(params.unlinkedAt),
        ...stampUpdate(params.unlinkedBy),
      });

      writeOutboxEntry(transaction, db, event);

      return updated;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${USERS_COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

async function getCustomerIdentityByIdInternal(
  db: Firestore,
  customerIdentityId: string,
): Promise<CustomerIdentity> {
  const snapshot = await db.collection(USERS_COLLECTION).doc(customerIdentityId).get();
  if (!snapshot.exists) {
    throw unknownCustomerIdentityError(customerIdentityId);
  }
  return fromUserDocument(snapshot.data());
}

export type AuthenticationReferenceOwner = {
  customerIdentityId: string;
};

/**
 * Active-only lookup: mirrors `-04`'s `getActiveQrIdentityByReference` —
 * a never-linked reference and a previously-unlinked reference both
 * resolve identically (`undefined`), never distinguished, since the
 * doc-ID-keyed authoritative record's cross-identity ownership is
 * structurally guaranteed unique by `-08`'s own uniqueness invariant.
 */
export async function getActiveAuthenticationReferenceOwner(
  db: Firestore,
  referenceType: AuthenticationReferenceType,
  referenceId: string,
): Promise<AuthenticationReferenceOwner | undefined> {
  const snapshot = await db
    .collection(AUTHENTICATION_REFERENCES_COLLECTION)
    .doc(authenticationReferenceDocId(referenceType, referenceId))
    .get();
  if (!snapshot.exists) {
    return undefined;
  }

  const record = snapshot.data() as AuthenticationReferenceRecordDocument;
  if (record.status !== "linked") {
    return undefined;
  }

  return { customerIdentityId: record.customerIdentityId };
}
