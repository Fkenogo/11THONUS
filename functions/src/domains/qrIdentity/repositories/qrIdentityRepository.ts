/**
 * `qrIdentityRecords` collection repository (ENG-P2-001-05).
 *
 * Issuance and regeneration each run the existing pure domain functions
 * (`issueQrIdentity`/`regenerateQrIdentity`, ENG-P2-001-04) unmodified
 * inside a single Firestore transaction. Unlike Loyalty Number, the QR
 * domain service has no built-in collision-retry loop — `DEC-DATA-007`'s
 * QR reference is a high-entropy opaque token (see
 * `RandomQrReferenceGenerator`), so a collision is treated as
 * exceptional and fails closed with `qrRegenerationTransactionConflictError`
 * rather than this persistence layer inventing its own retry policy the
 * domain foundation never specified.
 *
 * Regeneration implements `ENG-P2-ARCH-001` §5's governed semantics
 * (confirmed by the ENG-P2-001-04 Founder review): the old
 * `qrIdentityRecords/{oldRef}` record is marked `invalidated` with
 * `replacedByReference` pointing at the new value and retained for
 * audit — never deleted, never reused — while the new
 * `qrIdentityRecords/{newRef}` record and the `customerProfiles`
 * projection update commit in the same transaction. Customer Identity ID
 * and Loyalty Number are carried through unchanged.
 *
 * Idempotency reuses `checkAndReserveIdempotencyKey` (ENG-P1-002),
 * mirroring `loyaltyNumberRepository.ts`.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { stampCreate, stampUpdate } from "../../../shared/metadata/baseMetadata";
import type { EventActor, DomainEvent } from "../../../shared/events/domainEvent";
import {
  issueQrIdentity,
  regenerateQrIdentity,
  type QrIdentityAssociation,
} from "../services/qrIdentityAssociationService";
import type { QrReferenceGenerator } from "../services/qrReferenceGenerator";
import {
  QrIdentityDomainError,
  invalidatedQrReferenceError,
  unknownQrReferenceError,
  qrRegenerationTransactionConflictError,
} from "../models/qrIdentityErrors";
import {
  toQrIdentityRecordDocument,
  fromQrIdentityRecordDocument,
} from "./qrIdentityRecordDocument";

const QR_IDENTITY_RECORDS_COLLECTION = "qrIdentityRecords";
const CUSTOMER_PROFILES_COLLECTION = "customerProfiles";

function writeIssuanceOutboxEntry(
  transaction: Transaction,
  db: Firestore,
  event: DomainEvent<unknown>,
  eventId: string,
): void {
  writeOutboxEntry(transaction, db, { ...event, eventId });
}

function writeBatchedOutboxEntries(
  transaction: Transaction,
  db: Firestore,
  events: readonly DomainEvent<unknown>[],
): void {
  events.forEach((event, index) => {
    const eventId = events.length > 1 ? `${event.eventId}-${index}` : event.eventId;
    writeIssuanceOutboxEntry(transaction, db, event, eventId);
  });
}

export type IssueQrIdentityForIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  loyaltyNumber: string;
  issuedAt: Date;
  createdBy: string | null;
  generator: QrReferenceGenerator;
  idempotencyKey: string;
  requestHash: string;
};

export async function issueQrIdentityForIdentity(
  db: Firestore,
  params: IssueQrIdentityForIdentityParams,
): Promise<QrIdentityAssociation> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "qrIdentity.issue",
    actorId: params.createdBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    const existing = await getActiveQrIdentityByCustomerIdentityId(db, params.customerIdentityId);
    if (existing) {
      return existing;
    }
  }
  if (reservation.outcome === "in_progress") {
    throw new QrIdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `QR identity issuance for "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new QrIdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  try {
    const association = await db.runTransaction(async (transaction) => {
      const profileRef = db.collection(CUSTOMER_PROFILES_COLLECTION).doc(params.customerIdentityId);
      const profileSnapshot = await transaction.get(profileRef);
      const existingRef = profileSnapshot.exists
        ? (profileSnapshot.data()?.["qrReference"] as string | undefined)
        : undefined;

      let existingAssociation: QrIdentityAssociation | undefined;
      if (existingRef) {
        const existingSnapshot = await transaction.get(
          db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(existingRef),
        );
        if (existingSnapshot.exists) {
          existingAssociation = fromQrIdentityRecordDocument(existingSnapshot.data());
        }
      }

      const candidateReference = params.generator.generateReference();
      const candidateSnapshot = await transaction.get(
        db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(candidateReference),
      );
      if (candidateSnapshot.exists) {
        throw qrRegenerationTransactionConflictError(params.customerIdentityId);
      }

      const { association: resolved, events } = issueQrIdentity({
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        customerIdentityId: params.customerIdentityId,
        loyaltyNumber: params.loyaltyNumber,
        issuedAt: params.issuedAt,
        existingAssociation,
        generator: { generateReference: () => candidateReference },
      });

      const newRef = db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(resolved.qrReference);
      transaction.set(newRef, {
        ...toQrIdentityRecordDocument(resolved, params.createdBy),
        schemaVersion: 1,
      });

      if (profileSnapshot.exists) {
        transaction.update(profileRef, {
          qrReference: resolved.qrReference,
          ...stampUpdate(params.createdBy),
        });
      } else {
        transaction.set(profileRef, {
          id: params.customerIdentityId,
          schemaVersion: 1,
          status: "active",
          userId: params.customerIdentityId,
          qrReference: resolved.qrReference,
          ...stampCreate(params.createdBy),
        });
      }

      writeBatchedOutboxEntries(transaction, db, events);

      return resolved;
    });

    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `${QR_IDENTITY_RECORDS_COLLECTION}/${association.qrReference}`,
    );
    return association;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export type RegenerateQrIdentityForIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  regeneratedAt: Date;
  createdBy: string | null;
  generator: QrReferenceGenerator;
  idempotencyKey: string;
  requestHash: string;
};

export async function regenerateQrIdentityForIdentity(
  db: Firestore,
  params: RegenerateQrIdentityForIdentityParams,
): Promise<QrIdentityAssociation> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "qrIdentity.regenerate",
    actorId: params.createdBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    const existing = await getActiveQrIdentityByCustomerIdentityId(db, params.customerIdentityId);
    if (existing) {
      return existing;
    }
  }
  if (reservation.outcome === "in_progress") {
    throw new QrIdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `QR identity regeneration for "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new QrIdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  try {
    const association = await db.runTransaction(async (transaction) => {
      const profileRef = db.collection(CUSTOMER_PROFILES_COLLECTION).doc(params.customerIdentityId);
      const profileSnapshot = await transaction.get(profileRef);
      const currentRef = profileSnapshot.exists
        ? (profileSnapshot.data()?.["qrReference"] as string | undefined)
        : undefined;

      if (!currentRef) {
        throw unknownQrReferenceError(params.customerIdentityId);
      }

      const currentSnapshot = await transaction.get(
        db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(currentRef),
      );
      if (!currentSnapshot.exists) {
        throw unknownQrReferenceError(currentRef);
      }
      const current = fromQrIdentityRecordDocument(currentSnapshot.data());

      const candidateReference = params.generator.generateReference();
      const candidateSnapshot = await transaction.get(
        db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(candidateReference),
      );
      if (candidateSnapshot.exists) {
        throw qrRegenerationTransactionConflictError(params.customerIdentityId);
      }

      const { invalidated, active, events } = regenerateQrIdentity({
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        current,
        regeneratedAt: params.regeneratedAt,
        generator: { generateReference: () => candidateReference },
      });

      const oldRef = db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(current.qrReference);
      transaction.update(oldRef, {
        status: invalidated.status,
        replacedByReference: active.qrReference,
        ...stampUpdate(params.createdBy),
      });

      const newRef = db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(active.qrReference);
      transaction.set(newRef, {
        ...toQrIdentityRecordDocument(active, params.createdBy),
        schemaVersion: 1,
      });

      transaction.update(profileRef, {
        qrReference: active.qrReference,
        ...stampUpdate(params.createdBy),
      });

      writeBatchedOutboxEntries(transaction, db, events);

      return active;
    });

    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `${QR_IDENTITY_RECORDS_COLLECTION}/${association.qrReference}`,
    );
    return association;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export async function getActiveQrIdentityByCustomerIdentityId(
  db: Firestore,
  customerIdentityId: string,
): Promise<QrIdentityAssociation | undefined> {
  const profileSnapshot = await db
    .collection(CUSTOMER_PROFILES_COLLECTION)
    .doc(customerIdentityId)
    .get();
  const qrReference = profileSnapshot.exists
    ? (profileSnapshot.data()?.["qrReference"] as string | undefined)
    : undefined;
  if (!qrReference) {
    return undefined;
  }

  const snapshot = await db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(qrReference).get();
  if (!snapshot.exists) {
    return undefined;
  }

  return fromQrIdentityRecordDocument(snapshot.data());
}

/** Active-only lookup: invalidated and unknown references both fail closed. */
export async function getActiveQrIdentityByReference(
  db: Firestore,
  qrReference: string,
): Promise<QrIdentityAssociation> {
  const snapshot = await db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(qrReference).get();
  if (!snapshot.exists) {
    throw unknownQrReferenceError(qrReference);
  }

  const association = fromQrIdentityRecordDocument(snapshot.data());
  if (association.status !== "active") {
    throw invalidatedQrReferenceError(qrReference);
  }

  return association;
}

/**
 * Audit/admin path only: returns the record regardless of status (active
 * or invalidated). Never call this to resolve a customer-facing lookup —
 * use `getActiveQrIdentityByReference`, which fails closed.
 */
export async function getQrIdentityRecordForAudit(
  db: Firestore,
  qrReference: string,
): Promise<QrIdentityAssociation | undefined> {
  const snapshot = await db.collection(QR_IDENTITY_RECORDS_COLLECTION).doc(qrReference).get();
  if (!snapshot.exists) {
    return undefined;
  }

  return fromQrIdentityRecordDocument(snapshot.data());
}
