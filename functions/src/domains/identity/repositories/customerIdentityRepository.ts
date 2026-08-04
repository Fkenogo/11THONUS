/**
 * `users` collection repository (ENG-P2-001-05).
 *
 * Creation is transactional and idempotent, reusing the existing
 * `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/
 * `failIdempotencyKey` convention (`shared/idempotency/idempotencyService`)
 * rather than a competing framework, per this task's own instruction.
 * The domain write (`registerCustomerIdentity`) and its resulting outbox
 * entries commit inside one Firestore transaction — if the transaction
 * fails, no partial `users/{id}` document or outbox entry remains.
 *
 * A `transaction.get()` existence check on `users/{id}` runs before the
 * `transaction.set()` as defence-in-depth beneath the idempotency layer:
 * the idempotency key protects a given *request*, while this check
 * protects the *document* even if a caller reused a fresh idempotency
 * key against an already-registered `customerIdentityId`.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { registerCustomerIdentity, type CustomerIdentity } from "../models/customerIdentity";
import type { CreateAuthenticationReferenceParams } from "../models/authenticationReference";
import {
  duplicateCustomerIdentityError,
  unknownCustomerIdentityError,
  IdentityDomainError,
} from "../models/identityErrors";
import { toUserDocument, fromUserDocument } from "./userDocument";

const COLLECTION = "users";

export type CreateCustomerIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  initialAuthenticationReference: CreateAuthenticationReferenceParams;
  createdAt: Date;
  createdBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

export async function createCustomerIdentity(
  db: Firestore,
  params: CreateCustomerIdentityParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.create",
    actorId: params.createdBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityById(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Customer identity creation for "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const ref = db.collection(COLLECTION).doc(params.customerIdentityId || "unknown");

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) {
        throw duplicateCustomerIdentityError(params.customerIdentityId);
      }

      const { identity: newIdentity, events } = registerCustomerIdentity({
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        customerIdentityId: params.customerIdentityId,
        initialAuthenticationReference: params.initialAuthenticationReference,
        createdAt: params.createdAt,
        createdBy: params.createdBy,
      });

      transaction.set(ref, { ...toUserDocument(newIdentity), schemaVersion: 1 });

      for (const event of events) {
        writeOutboxEntry(transaction, db, event);
      }

      return newIdentity;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export async function getCustomerIdentityById(
  db: Firestore,
  customerIdentityId: string,
): Promise<CustomerIdentity> {
  const snapshot = await db.collection(COLLECTION).doc(customerIdentityId).get();
  if (!snapshot.exists) {
    throw unknownCustomerIdentityError(customerIdentityId);
  }

  return fromUserDocument(snapshot.data());
}
