/**
 * `loyaltyNumbers` collection repository (ENG-P2-001-05).
 *
 * Issuance runs the existing pure `issueLoyaltyNumber` domain service
 * (ENG-P2-001-03) unmodified inside a single Firestore transaction, with
 * a transaction-scoped `LoyaltyNumberUniquenessPort` implementation
 * whose `isAlreadyAssigned` reads are `transaction.get()` calls against
 * `loyaltyNumbers/{candidate}` — the doc-ID-as-value pattern makes each
 * check-then-later-write race-free because every read this function
 * performs (the `customerProfiles` projection lookup, the existing
 * assignment lookup, and every collision-retry candidate check) happens
 * before the transaction's one and only `transaction.set()` call, which
 * Firestore transactions require and enforce.
 *
 * Idempotency reuses `checkAndReserveIdempotencyKey` (ENG-P1-002) rather
 * than a competing framework, mirroring `customerIdentityRepository.ts`.
 * On failure, `failIdempotencyKey` resets the key so a corrected retry
 * can re-acquire it — no partial `loyaltyNumbers`/`customerProfiles`
 * write survives a failed transaction.
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
  issueLoyaltyNumber,
  type LoyaltyNumberAssignment,
} from "../services/loyaltyNumberIssuanceService";
import type { LoyaltyNumberCandidateGenerator } from "../services/loyaltyNumberGenerator";
import type { LoyaltyNumberUniquenessPort } from "../services/loyaltyNumberUniquenessPort";
import { LoyaltyNumberDomainError } from "../models/loyaltyNumberErrors";
import { toLoyaltyNumberDocument, fromLoyaltyNumberDocument } from "./loyaltyNumberDocument";

const LOYALTY_NUMBERS_COLLECTION = "loyaltyNumbers";
const CUSTOMER_PROFILES_COLLECTION = "customerProfiles";

function writeIssuanceOutboxEntry(
  transaction: Transaction,
  db: Firestore,
  event: DomainEvent<unknown>,
  eventId: string,
): void {
  writeOutboxEntry(transaction, db, { ...event, eventId });
}

export type IssueLoyaltyNumberForIdentityParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  assignedAt: Date;
  createdBy: string | null;
  generator: LoyaltyNumberCandidateGenerator;
  idempotencyKey: string;
  requestHash: string;
};

export async function issueLoyaltyNumberForIdentity(
  db: Firestore,
  params: IssueLoyaltyNumberForIdentityParams,
): Promise<LoyaltyNumberAssignment> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "loyaltyNumber.issue",
    actorId: params.createdBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    const existing = await getLoyaltyNumberAssignmentForIdentity(db, params.customerIdentityId);
    if (existing) {
      return existing;
    }
  }
  if (reservation.outcome === "in_progress") {
    throw new LoyaltyNumberDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Loyalty number issuance for "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new LoyaltyNumberDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  try {
    const assignment = await db.runTransaction(async (transaction) => {
      const profileRef = db.collection(CUSTOMER_PROFILES_COLLECTION).doc(params.customerIdentityId);
      const profileSnapshot = await transaction.get(profileRef);
      const existingValue = profileSnapshot.exists
        ? (profileSnapshot.data()?.["loyaltyNumber"] as string | undefined)
        : undefined;

      let existingAssignment: LoyaltyNumberAssignment | undefined;
      if (existingValue) {
        const existingRef = db.collection(LOYALTY_NUMBERS_COLLECTION).doc(existingValue);
        const existingSnapshot = await transaction.get(existingRef);
        if (existingSnapshot.exists) {
          existingAssignment = fromLoyaltyNumberDocument(existingSnapshot.data());
        }
      }

      const uniquenessPort: LoyaltyNumberUniquenessPort = {
        isAlreadyAssigned: async (candidate) => {
          const candidateRef = db.collection(LOYALTY_NUMBERS_COLLECTION).doc(candidate);
          const candidateSnapshot = await transaction.get(candidateRef);
          return candidateSnapshot.exists;
        },
      };

      const { assignment: resolved, events } = await issueLoyaltyNumber({
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        customerIdentityId: params.customerIdentityId,
        assignedAt: params.assignedAt,
        existingAssignment,
        generator: params.generator,
        uniquenessPort,
      });

      if (events.length > 0) {
        const newRef = db.collection(LOYALTY_NUMBERS_COLLECTION).doc(resolved.loyaltyNumber);
        transaction.set(newRef, {
          ...toLoyaltyNumberDocument(resolved, params.createdBy),
          schemaVersion: 1,
        });

        if (profileSnapshot.exists) {
          transaction.update(profileRef, {
            loyaltyNumber: resolved.loyaltyNumber,
            ...stampUpdate(params.createdBy),
          });
        } else {
          transaction.set(profileRef, {
            id: params.customerIdentityId,
            schemaVersion: 1,
            status: "active",
            userId: params.customerIdentityId,
            loyaltyNumber: resolved.loyaltyNumber,
            ...stampCreate(params.createdBy),
          });
        }

        // `issueLoyaltyNumber` reuses the same caller-supplied `eventId` for
        // every event it returns in one call (each collision event and the
        // final issued event all carry `params.eventId` verbatim) — but
        // `writeOutboxEntry` keys the outbox document by `event.eventId`, so
        // writing a multi-event batch unchanged would have later events
        // silently overwrite earlier ones in the same transaction. When more
        // than one event is returned, this repository disambiguates the
        // *outbox document id only* with an index suffix; the event's own
        // `eventId` field inside the stored payload is left untouched.
        events.forEach((event, index) => {
          const eventId = events.length > 1 ? `${event.eventId}-${index}` : event.eventId;
          writeIssuanceOutboxEntry(transaction, db, event, eventId);
        });
      }

      return resolved;
    });

    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `${LOYALTY_NUMBERS_COLLECTION}/${assignment.loyaltyNumber}`,
    );
    return assignment;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export async function getLoyaltyNumberAssignmentForIdentity(
  db: Firestore,
  customerIdentityId: string,
): Promise<LoyaltyNumberAssignment | undefined> {
  const profileSnapshot = await db
    .collection(CUSTOMER_PROFILES_COLLECTION)
    .doc(customerIdentityId)
    .get();
  const loyaltyNumber = profileSnapshot.exists
    ? (profileSnapshot.data()?.["loyaltyNumber"] as string | undefined)
    : undefined;
  if (!loyaltyNumber) {
    return undefined;
  }

  const snapshot = await db.collection(LOYALTY_NUMBERS_COLLECTION).doc(loyaltyNumber).get();
  if (!snapshot.exists) {
    return undefined;
  }

  return fromLoyaltyNumberDocument(snapshot.data());
}

/**
 * Reverse direction from `getLoyaltyNumberAssignmentForIdentity` (value →
 * identity, not identity → value) — the read `-09`'s Loyalty Number
 * lookup type needs. A plain doc-ID `.get()`, exactly like `-07`'s own
 * inline Loyalty Number resolution in `identityRecoveryRepository.ts`,
 * now exported here so `-09` reuses it rather than duplicating the same
 * one-line pattern a third time.
 */
export async function getLoyaltyNumberAssignmentByValue(
  db: Firestore,
  loyaltyNumber: string,
): Promise<LoyaltyNumberAssignment | undefined> {
  const snapshot = await db.collection(LOYALTY_NUMBERS_COLLECTION).doc(loyaltyNumber).get();
  if (!snapshot.exists) {
    return undefined;
  }

  return fromLoyaltyNumberDocument(snapshot.data());
}
