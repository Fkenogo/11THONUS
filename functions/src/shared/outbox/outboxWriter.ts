/**
 * Outbox writer (ENG-P1-002).
 *
 * Writes an outbox entry inside the same Firestore transaction as the
 * domain write it accompanies, per TRD11 §11.15 ("Firestore Transaction
 * / Update Purchase Record / Create Outbox Event"). The transaction
 * itself is owned by the caller — a future domain command handler
 * combines its own domain write with this call in one transaction; this
 * shared writer cannot see or control the domain write, only guarantee
 * its own entry is written atomically alongside whatever else the
 * caller's transaction contains.
 */

import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";
import type { DomainEvent } from "../events/domainEvent";
import { serverTimestamp } from "../metadata/serverTimestamp";
import type { OutboxEntry } from "./outboxEntry";

const COLLECTION = "outboxEntries";

/**
 * The single source of truth for an outbox entry's document reference — one
 * entry per event, at the event's own id (the idempotency/dedup key). Shared so
 * a caller doing an idempotent, read-guarded standalone enqueue (e.g. a
 * fire-and-forget signal that is not part of a domain-write transaction) targets
 * the exact same document this writer writes, without re-hardcoding the
 * collection name.
 */
export function outboxEntryRef(db: Firestore, eventId: string): DocumentReference {
  return db.collection(COLLECTION).doc(eventId);
}

export function writeOutboxEntry<T>(
  transaction: Transaction,
  db: Firestore,
  event: DomainEvent<T>,
): void {
  const ref = outboxEntryRef(db, event.eventId);
  const entry: Omit<OutboxEntry<T>, "id"> = {
    event,
    status: "pending",
    retryCount: 0,
    createdAt: serverTimestamp() as never,
  };

  transaction.set(ref, entry);
}
