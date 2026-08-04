/**
 * `users` collection lifecycle repository (ENG-P2-001-06).
 *
 * Two transactional, idempotent operations against the `-05` persistence
 * foundation: `transitionCustomerIdentityStatus` (the general status
 * state-machine, reusing `-01`'s existing `transitionIdentityStatus`
 * unmodified) and `recoverCustomerIdentityStatus` (the recovery boundary,
 * reusing this task's own `recoverCustomerIdentity`). Both follow the
 * exact idempotency/transaction pattern `-05`'s `customerIdentityRepository.ts`
 * established — no competing framework.
 *
 * `lastTransitionAuthority`/`lastTransitionReason` are written directly
 * onto the `users/{id}` document as plain audit fields — a deliberate
 * choice over trying to retrofit these onto `-01`'s already-merged
 * domain-event payloads (which would be a breaking change to reviewed
 * code). They are not part of `UserDocument`/`CustomerIdentity`'s typed
 * shape; Firestore documents may carry fields beyond a given domain
 * projection, and these two exist purely so "why is this identity
 * currently in this status" is answerable from the document itself
 * without event-stream replay.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { stampUpdate } from "../../../shared/metadata/baseMetadata";
import type { EventActor } from "../../../shared/events/domainEvent";
import { transitionIdentityStatus, type CustomerIdentity } from "../models/customerIdentity";
import type { IdentityStatus } from "../models/identityStatus";
import type { TransitionAuthority } from "../models/transitionAuthority";
import type { TransitionReason } from "../models/transitionReason";
import {
  IdentityDomainError,
  unknownCustomerIdentityError,
  staleIdentityStatusError,
} from "../models/identityErrors";
import { recoverCustomerIdentity } from "../services/identityLifecycleService";
import { fromUserDocument } from "./userDocument";
import { getCustomerIdentityById } from "./customerIdentityRepository";

const COLLECTION = "users";

export type TransitionCustomerIdentityStatusParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  toStatus: IdentityStatus;
  expectedCurrentStatus?: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
  updatedAt: Date;
  updatedBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

export async function transitionCustomerIdentityStatus(
  db: Firestore,
  params: TransitionCustomerIdentityStatusParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.transitionStatus",
    actorId: params.updatedBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityById(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Status transition for customer identity "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const ref = db.collection(COLLECTION).doc(params.customerIdentityId);

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }

      const current = fromUserDocument(snapshot.data());

      if (
        params.expectedCurrentStatus !== undefined &&
        current.status !== params.expectedCurrentStatus
      ) {
        throw staleIdentityStatusError(
          params.customerIdentityId,
          params.expectedCurrentStatus,
          current.status,
        );
      }

      const { identity: updated, event } = transitionIdentityStatus(current, params.toStatus, {
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        updatedAt: params.updatedAt,
        updatedBy: params.updatedBy,
      });

      transaction.update(ref, {
        status: updated.status,
        lastTransitionAuthority: params.authority,
        lastTransitionReason: params.reason,
        ...stampUpdate(params.updatedBy),
      });

      if (event) {
        writeOutboxEntry(transaction, db, event);
      }

      return updated;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export type RecoverCustomerIdentityStatusParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  authority: TransitionAuthority;
  recoveredAt: Date;
  recoveredBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

export async function recoverCustomerIdentityStatus(
  db: Firestore,
  params: RecoverCustomerIdentityStatusParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.recover",
    actorId: params.recoveredBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityById(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Recovery for customer identity "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const ref = db.collection(COLLECTION).doc(params.customerIdentityId);

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }

      const current = fromUserDocument(snapshot.data());

      const { identity: recovered, event } = recoverCustomerIdentity(current, {
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        recoveredAt: params.recoveredAt,
        recoveredBy: params.recoveredBy,
        authority: params.authority,
      });

      transaction.update(ref, {
        status: recovered.status,
        lastTransitionAuthority: params.authority,
        lastTransitionReason: "support_recovery",
        ...stampUpdate(params.recoveredBy),
      });

      writeOutboxEntry(transaction, db, event);

      return recovered;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
