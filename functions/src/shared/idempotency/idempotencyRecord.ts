/**
 * Idempotency schema (ENG-P1-002).
 *
 * `IdempotencyRecord`, exactly as TRD11 §11.14 defines it. Stored in a
 * dedicated `idempotencyRecords` Firestore collection for this *shared*
 * service — TRD10 §10.30 permits either a dedicated collection or
 * incorporation into authoritative documents "depending on the
 * operation"; a dedicated collection is the only choice available at
 * this domain-agnostic layer, since there is no authoritative document
 * to incorporate into here. Each future domain work package remains free
 * to choose the combined approach for its own specific operations.
 */

import type { Timestamp } from "firebase-admin/firestore";

export type IdempotencyStatus = "processing" | "completed" | "failed";

export type IdempotencyRecord = {
  id: string;
  idempotencyKey: string;
  operationType: string;
  actorId: string;
  businessId?: string;
  requestHash: string;
  status: IdempotencyStatus;
  resultReference?: string;
  responseSnapshot?: unknown;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  expiresAt?: Timestamp;
};
