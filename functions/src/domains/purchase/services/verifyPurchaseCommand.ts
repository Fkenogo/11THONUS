/**
 * `verifyPurchase` command (`PLATFORM-BASELINE-006A`, design §§14/16,
 * FD-PVL-002/FD-PVL-003/FD-PVL-004).
 *
 * Customer-authenticated (the callable server-resolves the Customer
 * Identity from the current auth chain; a client-supplied customer id is
 * never trusted). One PostgreSQL transaction, global lock ordering
 * (idempotency → purchase → stream → cycle → reward → appends):
 *
 *  1. reserve/check idempotency (`purchase.verify`);
 *  2. lock Purchase; re-check `waiting_for_customer` + ownership against
 *     the server-resolved identity;
 *  3. (via `admitPurchaseToLoyalty`, WP-COM-05a -- the write sequence below was
 *     extracted unchanged into that internal operation) creation-time version
 *     binding governs (snapshot, never re-resolved to program-current --
 *     FD-PVL-003);
 *  4. transition → `verified` (conditional; race losers fail closed);
 *  5. append the transition event;
 *  6. issue exactly one Verified Unit credit (`quantity` = purchase qty);
 *  7. ensure + lock the allocation stream; resolve/lock the current Cycle
 *     (open it under the stream lock when none exists);
 *  8. allocate up to capacity 10; overflow becomes pending positions
 *     (never a second concurrent active cycle); at exactly 10 create the
 *     minimum Reward entitlement exactly once + flip the Cycle;
 *  9. causal + subject Trust Events (repeatable `loyalty_cycle.allocated`
 *     dedups per source transition);
 *  10. Notification Intents (verified → Business; reward → Customer);
 *  11. outbox events; 12. complete idempotency; COMMIT.
 *
 * WP-COM-05a: the admission gate seam defaults to (and only supports) `off`,
 * which always admits -- behaviour is identical to before the extraction. No
 * Commercial data is read and no Commercial lock is taken on this path.
 *
 * Any failure rolls back everything.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  peekIdempotencyKey,
} from "../../rewardProgram/repositories/idempotencyRepository";
import { purchaseRequestHash } from "./purchaseRequestHash";
import { lockPurchaseRecordById } from "../repositories/purchaseRecordRepository";
import { admitPurchaseToLoyalty } from "./admitPurchaseToLoyalty";
import { decidePurchaseAdmission, resolvePurchaseAdmissionGateMode } from "./purchaseAdmissionGate";
import type { PurchaseAdmissionGateMode } from "./purchaseAdmissionGate";
import type {
  LoyaltyCycleRow,
  PurchaseRecordRow,
  RewardRow,
  VerifiedUnitRow,
} from "../models/purchase";
import {
  purchaseNotFoundError,
  purchaseOwnershipError,
  purchaseStaleStateError,
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
} from "../models/purchaseErrors";

export type VerifyPurchaseRequest = {
  readonly purchaseRecordId: string;
};

export type VerifyPurchaseResult = {
  readonly purchase: PurchaseRecordRow;
  readonly verifiedUnit: VerifiedUnitRow;
  readonly cycle: LoyaltyCycleRow;
  readonly reward: RewardRow | null;
};

export async function verifyPurchase(
  _db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    /** Server-resolved Customer Identity id (current auth chain — never a client claim). */
    readonly customerIdentityId: string;
    readonly request: VerifyPurchaseRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
    /** Internal admission-gate seam (WP-COM-05a); defaults to, and only supports, `off`. */
    readonly admissionGateMode?: PurchaseAdmissionGateMode;
  },
): Promise<VerifyPurchaseResult> {
  const gateMode = resolvePurchaseAdmissionGateMode(params.admissionGateMode);
  const purchaseRecordId = params.request.purchaseRecordId;
  if (!purchaseRecordId || purchaseRecordId.trim().length === 0) {
    throw purchaseValidationError("A Purchase Record id is required.");
  }

  const requestHash = purchaseRequestHash(
    "verify",
    params.customerIdentityId,
    "",
    purchaseRecordId,
    purchaseRecordId,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as VerifyPurchaseResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "purchase.verify",
      actorId: params.customerIdentityId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as VerifyPurchaseResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    const locked = await lockPurchaseRecordById(tx, purchaseRecordId);
    if (!locked) {
      throw purchaseNotFoundError(purchaseRecordId);
    }
    if (locked.customerIdentityId !== params.customerIdentityId) {
      throw purchaseOwnershipError();
    }
    if (locked.status !== "waiting_for_customer") {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    // Gate OFF => always admit (no Commercial read). A hold outcome belongs to WP-COM-05b.
    decidePurchaseAdmission(gateMode);
    const admitted = await admitPurchaseToLoyalty(tx, {
      locked,
      fromStatus: "waiting_for_customer",
      actor: { type: "customer", id: params.customerIdentityId },
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: VerifyPurchaseResult = admitted;
    await completeIdempotencyKeyInTransaction(
      tx,
      params.idempotencyKey,
      admitted.purchase.id,
      result,
    );
    return result;
  });
}
