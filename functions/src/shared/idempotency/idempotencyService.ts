/**
 * Idempotency service (ENG-P1-002, corrected under ENG-P1-002-CR1).
 *
 * Implements TRD11 §11.14's Idempotency Behaviour: same key + same
 * request → return the original successful response or the existing
 * processing state; same key + different request content → reject as a
 * conflict (`IDEMPOTENCY_CONFLICT`, TRD11 §11.35).
 *
 * `evaluateIdempotency` is the pure, status-aware decision logic,
 * unit-testable without Firestore:
 *   - no existing record                       → "new"
 *   - same hash, status "processing"            → "in_progress" (never a
 *     fabricated success — a genuine concurrent duplicate is in flight)
 *   - same hash, status "completed"              → "duplicate" (safe to
 *     replay `responseSnapshot`)
 *   - same hash, status "failed"                 → "new" (a failed attempt
 *     never completed; the key is eligible to be retried rather than
 *     permanently stuck — TRD11 §11.14 does not address this case
 *     explicitly, so this is this work package's own disclosed choice)
 *   - different hash, any status                 → "conflict"
 *
 * `checkAndReserveIdempotencyKey` combines lookup, hash comparison, status
 * interpretation, and reservation inside a single `db.runTransaction`, so
 * only one concurrent caller can ever win the "new"/"failed" branch and
 * reserve the key — Firestore's own transaction protocol automatically
 * retries the losing side, which then observes the winner's write and
 * returns "in_progress"/"duplicate"/"conflict" instead of also reserving.
 * This is the fix for ENG-P1-002-CR1 Correction A: the previous
 * `checkIdempotency` + `reserveIdempotencyKey` pair was two independent
 * Firestore calls with no exclusion between them.
 *
 * `checkIdempotency` remains as a read-only, non-claiming peek (e.g. for a
 * future status-check use) built on the same pure `evaluateIdempotency`.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformErrorResponse } from "../errors/platformError";
import { createPlatformError } from "../errors/platformError";
import { serverTimestamp } from "../metadata/serverTimestamp";
import type { IdempotencyRecord } from "./idempotencyRecord";

const COLLECTION = "idempotencyRecords";

export type IdempotencyCheckResult =
  | { outcome: "new" }
  | { outcome: "in_progress" }
  | { outcome: "duplicate"; record: IdempotencyRecord }
  | { outcome: "conflict"; error: PlatformErrorResponse };

export function evaluateIdempotency(
  existing: IdempotencyRecord | undefined,
  requestHash: string,
  correlationId: string,
): IdempotencyCheckResult {
  if (!existing) {
    return { outcome: "new" };
  }

  if (existing.requestHash !== requestHash) {
    return {
      outcome: "conflict",
      error: createPlatformError(
        "IDEMPOTENCY_CONFLICT",
        "errors.idempotencyConflict",
        correlationId,
      ),
    };
  }

  if (existing.status === "processing") {
    return { outcome: "in_progress" };
  }

  if (existing.status === "failed") {
    return { outcome: "new" };
  }

  return { outcome: "duplicate", record: existing };
}

export async function checkIdempotency(
  db: Firestore,
  idempotencyKey: string,
  requestHash: string,
  correlationId: string,
): Promise<IdempotencyCheckResult> {
  const snapshot = await db.collection(COLLECTION).doc(idempotencyKey).get();
  const existing = snapshot.exists ? (snapshot.data() as IdempotencyRecord) : undefined;

  return evaluateIdempotency(existing, requestHash, correlationId);
}

export type CheckAndReserveIdempotencyKeyParams = {
  idempotencyKey: string;
  operationType: string;
  actorId: string;
  requestHash: string;
  correlationId: string;
  businessId?: string;
};

export type IdempotencyReservationResult =
  | { outcome: "acquired" }
  | { outcome: "in_progress" }
  | { outcome: "duplicate"; record: IdempotencyRecord }
  | { outcome: "conflict"; error: PlatformErrorResponse };

export async function checkAndReserveIdempotencyKey(
  db: Firestore,
  params: CheckAndReserveIdempotencyKeyParams,
): Promise<IdempotencyReservationResult> {
  const ref = db.collection(COLLECTION).doc(params.idempotencyKey);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.exists ? (snapshot.data() as IdempotencyRecord) : undefined;
    const evaluation = evaluateIdempotency(existing, params.requestHash, params.correlationId);

    if (evaluation.outcome !== "new") {
      return evaluation;
    }

    const record: Omit<IdempotencyRecord, "id"> = {
      idempotencyKey: params.idempotencyKey,
      operationType: params.operationType,
      actorId: params.actorId,
      ...(params.businessId ? { businessId: params.businessId } : {}),
      requestHash: params.requestHash,
      status: "processing",
      createdAt: serverTimestamp() as never,
    };
    transaction.set(ref, record);

    return { outcome: "acquired" };
  });
}

export async function completeIdempotencyKey(
  db: Firestore,
  idempotencyKey: string,
  resultReference?: string,
  responseSnapshot?: unknown,
): Promise<void> {
  await db
    .collection(COLLECTION)
    .doc(idempotencyKey)
    .update({
      status: "completed",
      completedAt: serverTimestamp(),
      ...(resultReference !== undefined ? { resultReference } : {}),
      ...(responseSnapshot !== undefined ? { responseSnapshot } : {}),
    });
}

export async function failIdempotencyKey(db: Firestore, idempotencyKey: string): Promise<void> {
  await db.collection(COLLECTION).doc(idempotencyKey).update({
    status: "failed",
    completedAt: serverTimestamp(),
  });
}
