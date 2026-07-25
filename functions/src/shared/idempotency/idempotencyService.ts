/**
 * Idempotency service (ENG-P1-002).
 *
 * Implements TRD11 §11.14's Idempotency Behaviour: same key + same
 * request → return the original successful response or the existing
 * processing state; same key + different request content → reject as a
 * conflict (`IDEMPOTENCY_CONFLICT`, TRD11 §11.35).
 *
 * `evaluateIdempotency` is the pure decision logic, unit-testable without
 * Firestore. `checkIdempotency`/`reserveIdempotencyKey`/
 * `completeIdempotencyKey`/`failIdempotencyKey` are thin Firestore I/O
 * wrappers around it, covered by the emulator integration tests
 * (`idempotencyService.emulator.test.ts`) — a live Firestore round trip
 * cannot be meaningfully unit-tested without either the emulator or a
 * hand-rolled fake, and the emulator is the real dependency every other
 * environment (staging, production) actually uses.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformErrorResponse } from "../errors/platformError";
import { createPlatformError } from "../errors/platformError";
import { serverTimestamp } from "../metadata/serverTimestamp";
import type { IdempotencyRecord } from "./idempotencyRecord";

const COLLECTION = "idempotencyRecords";

export type IdempotencyCheckResult =
  | { outcome: "new" }
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

export type ReserveIdempotencyKeyParams = {
  idempotencyKey: string;
  operationType: string;
  actorId: string;
  requestHash: string;
  businessId?: string;
};

export async function reserveIdempotencyKey(
  db: Firestore,
  params: ReserveIdempotencyKeyParams,
): Promise<void> {
  const record: Omit<IdempotencyRecord, "id"> = {
    idempotencyKey: params.idempotencyKey,
    operationType: params.operationType,
    actorId: params.actorId,
    ...(params.businessId ? { businessId: params.businessId } : {}),
    requestHash: params.requestHash,
    status: "processing",
    createdAt: serverTimestamp() as never,
  };

  await db.collection(COLLECTION).doc(params.idempotencyKey).set(record);
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
